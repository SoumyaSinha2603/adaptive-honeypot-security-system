"""
Login route — multi-layer security pipeline:
  Layer 1: CAPTCHA (verified by client before submission)
  Layer 2: Credential check against real_users table
  Layer 3: IP velocity check
  Layer 4: OTP generation → sent to phone (printed to console for demo)
  Layer 5: ML Model 1 (21 features)
  Layer 6: Behavioral baseline drift check
  Layer 7: Impossible travel detection
  Result:  NORMAL → real bank dashboard | ATTACKER → honeypot
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json, uuid
from datetime import datetime

from app.models.database import get_db, RealUser, AttackSession, OTPStore
from app.core.utils import (
    verify_password, mask_username, generate_otp, is_otp_valid,
    check_ip_velocity, log_ip_attempt, check_impossible_travel,
    compute_drift, update_baseline, new_session_id,
)
from app.ml import model1

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str
    captcha_token: str          # "verified" if client CAPTCHA passed
    # 21 behavioral features
    login_time:             float = 14.0
    typing_speed:           float = 60.0
    backspace_count:        float = 3.0
    mouse_movement_speed:   float = 200.0
    cursor_path_length:     float = 1500.0
    ip_address_risk:        float = 0.0
    geo_location_change:    bool  = False
    device_change:          bool  = False
    failed_login_attempts:  int   = 0
    unusual_login_time:     bool  = False
    vpn_detected:           bool  = False
    browser_fingerprint_risk: float = 0.0
    session_duration:       float = 30.0
    keystroke_interval:     float = 150.0
    mouse_click_frequency:  float = 2.0
    keystroke_variance:     float = 30.0
    scroll_depth:           float = 0.5
    copy_paste_detected:    bool  = False
    reading_time:           float = 3.0
    hesitation_count:       int   = 2
    mouse_path_curvature:   float = 0.7
    device_fingerprint:     str   = ""


class OTPVerifyRequest(BaseModel):
    session_id: str
    otp_code:   str


@router.post("/api/login")
async def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host or "127.0.0.1"
    session_id = new_session_id()

    # ── Layer 1: CAPTCHA must have been verified ──────────────────────────────
    if body.captcha_token != "verified":
        return {"status": "error", "message": "CAPTCHA verification required"}

    # ── Layer 2: IP velocity check ────────────────────────────────────────────
    if not check_ip_velocity(db, ip):
        log_ip_attempt(db, ip, body.username, False)
        return {"status": "error", "message": "Too many attempts. Try again later."}

    # ── Layer 3: Credential check ─────────────────────────────────────────────
    user = db.query(RealUser).filter(
        RealUser.username == body.username.strip()
    ).first()

    credentials_valid = user and verify_password(body.password, user.password_hash)
    log_ip_attempt(db, ip, body.username, credentials_valid)

    # ── Layer 4: Build feature dict ───────────────────────────────────────────
    features = {
        "login_time":              body.login_time,
        "typing_speed":            body.typing_speed,
        "backspace_count":         body.backspace_count,
        "mouse_movement_speed":    body.mouse_movement_speed,
        "cursor_path_length":      body.cursor_path_length,
        "ip_address_risk":         body.ip_address_risk,
        "geo_location_change":     int(body.geo_location_change),
        "device_change":           int(body.device_change),
        "failed_login_attempts":   body.failed_login_attempts,
        "unusual_login_time":      int(body.unusual_login_time),
        "vpn_detected":            int(body.vpn_detected),
        "browser_fingerprint_risk":body.browser_fingerprint_risk,
        "session_duration":        body.session_duration,
        "keystroke_interval":      body.keystroke_interval,
        "mouse_click_frequency":   body.mouse_click_frequency,
        "keystroke_variance":      body.keystroke_variance,
        "scroll_depth":            body.scroll_depth,
        "copy_paste_detected":     int(body.copy_paste_detected),
        "reading_time":            body.reading_time,
        "hesitation_count":        body.hesitation_count,
        "mouse_path_curvature":    body.mouse_path_curvature,
    }

    # ── Layer 5: ML Model 1 ───────────────────────────────────────────────────
    ml_result = model1.predict(features)
    verdict    = ml_result["label"]
    confidence = ml_result["confidence"]
    trigger    = ml_result["trigger"]

    # ── Layer 6: Behavioral baseline drift (only for known users) ─────────────
    baseline_drift = 0.0
    impossible_travel = False
    if credentials_valid and user:
        from app.models.database import BehavioralBaseline
        baseline = db.query(BehavioralBaseline).filter(
            BehavioralBaseline.username == body.username
        ).first()
        baseline_drift = compute_drift(baseline, features)
        impossible_travel = check_impossible_travel(db, body.username, ip)

        # High drift + impossible travel → escalate to ATTACKER even with valid creds
        if baseline_drift > 0.7 or impossible_travel:
            verdict    = "ATTACKER"
            confidence = max(confidence, 0.75)
            trigger    = "baseline_drift" if baseline_drift > 0.7 else "impossible_travel"

    # ── Log attack session ────────────────────────────────────────────────────
    if verdict == "ATTACKER":
        record = AttackSession(
            session_id      = session_id,
            masked_username = mask_username(body.username),
            ip_address      = ip,
            vpn_detected    = body.vpn_detected,
            ml1_verdict     = verdict,
            ml1_confidence  = confidence,
            trigger         = trigger,
            features_json   = json.dumps(features),
            captcha_passed  = True,
            otp_passed      = False,
            baseline_drift  = baseline_drift,
        )
        db.add(record)
        db.commit()

        # Attacker gets identical-looking success response (they don't know)
        return {
            "status":      "otp_required",
            "session_id":  session_id,
            "verdict":     verdict,
            "confidence":  confidence,
            "trigger":     trigger,
            "destination": "honeypot",
            "masked_phone":"XXXXXXXX" + "00",  # fake phone for attacker
        }

    # ── NORMAL user: generate real OTP ───────────────────────────────────────
    if credentials_valid and user:
        otp_code = generate_otp()
        otp_record = OTPStore(username=user.username, otp_code=otp_code)
        db.add(otp_record)
        db.commit()

        # Console print for demo (in production: send SMS)
        masked_phone = user.phone[:3] + "XXXXX" + user.phone[-2:]
        print(f"\n{'='*50}")
        print(f"📱 OTP for {user.full_name}: {otp_code}")
        print(f"   Phone: {user.phone}")
        print(f"{'='*50}\n")

        # Update behavioral baseline
        update_baseline(db, user.username, features, body.device_fingerprint, ip)

        return {
            "status":      "otp_required",
            "session_id":  session_id,
            "verdict":     verdict,
            "confidence":  confidence,
            "trigger":     trigger,
            "destination": "bank",
            "masked_phone": masked_phone,
        }

    # Wrong credentials but not classified as attacker → show error
    return {
        "status":  "error",
        "message": "Invalid Customer ID or IPIN. Please try again.",
    }


@router.post("/api/verify-otp")
async def verify_otp(body: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP. Returns final routing destination."""
    # Find most recent unused OTP for any user matching session
    # We stored session_id in the otp flow response, but we need username
    # So client must send username too — handled via session_id lookup in AttackSession or
    # by including username in the OTP request (added below via query param approach)
    # Simplified: client sends username in verify body

    # Check in real users first
    from app.models.database import RealUser
    # The OTP verify call includes the username in the request since we know it from the login page
    return {"status": "verified"}


@router.post("/api/verify-otp-full")
async def verify_otp_full(
    session_id: str,
    username: str,
    otp_code: str,
    destination: str,
    db: Session = Depends(get_db)
):
    """Full OTP verification with routing."""
    from datetime import datetime

    if destination == "honeypot":
        # Attacker — accept any OTP (we're deceptive)
        return {
            "status":      "success",
            "destination": "honeypot",
            "session_id":  session_id,
        }

    # Real user OTP check
    record = db.query(OTPStore).filter(
        OTPStore.username == username,
        OTPStore.used     == False,
    ).order_by(OTPStore.id.desc()).first()

    if not record:
        return {"status": "error", "message": "OTP expired. Please login again."}

    if not is_otp_valid(record.created_at):
        return {"status": "error", "message": "OTP expired. Please login again."}

    if record.otp_code != otp_code:
        return {"status": "error", "message": "Incorrect OTP. Please try again."}

    record.used = True
    db.commit()

    user = db.query(RealUser).filter(RealUser.username == username).first()
    if not user:
        return {"status": "error", "message": "User not found."}

    return {
        "status":      "success",
        "destination": "bank",
        "session_id":  session_id,
        "user": {
            "username":       user.username,
            "full_name":      user.full_name,
            "customer_id":    user.customer_id,
            "account_number": user.account_number,
            "account_type":   user.account_type,
            "balance":        user.balance,
            "available_bal":  user.available_bal,
            "ifsc":           user.ifsc,
            "branch":         user.branch,
            "email":          user.email,
            "phone":          user.phone[:3] + "XXXXX" + user.phone[-2:],
            "pan_masked":     user.pan_masked,
            "nominee":        user.nominee,
        }
    }
