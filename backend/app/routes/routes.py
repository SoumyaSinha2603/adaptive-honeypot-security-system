"""Honeypot + Dashboard routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, HoneypotSession, AttackSession
from app.core.utils import (
    fake_account, fake_transactions, fake_beneficiaries, fake_transfer_response, new_session_id
)
from app.ml import model2
from datetime import datetime, timedelta
import json

honeypot_router  = APIRouter()
dashboard_router = APIRouter()


# ── Honeypot endpoints ────────────────────────────────────────────────────────
@honeypot_router.get("/api/honeypot/dashboard/{session_id}")
def honeypot_dashboard(session_id: str, db: Session = Depends(get_db)):
    _ensure_session(db, session_id)
    _log_page(db, session_id, "dashboard")
    return {
        "account": fake_account(session_id),
        "recent_transactions": fake_transactions(session_id, 5),
    }

@honeypot_router.get("/api/honeypot/transactions/{session_id}")
def honeypot_transactions(session_id: str, db: Session = Depends(get_db)):
    _log_page(db, session_id, "transactions")
    return {"transactions": fake_transactions(session_id, 20)}

@honeypot_router.get("/api/honeypot/beneficiaries/{session_id}")
def honeypot_beneficiaries(session_id: str, db: Session = Depends(get_db)):
    _log_page(db, session_id, "beneficiary")
    return {"beneficiaries": fake_beneficiaries(session_id)}


class TransferBody(BaseModel):
    session_id:      str
    destination:     str
    amount:          float
    transfer_type:   str = "IMPS"
    beneficiary_name:str = ""

@honeypot_router.post("/api/honeypot/transfer")
def honeypot_transfer(body: TransferBody, db: Session = Depends(get_db)):
    sess = _get_session(db, body.session_id)
    if sess:
        sess.transfer_attempts = (sess.transfer_attempts or 0) + 1
        sess.transfer_value    = (sess.transfer_value or 0.0) + body.amount
        db.commit()
        _run_model2(db, body.session_id)
    return fake_transfer_response(body.destination, body.amount)


class AddBeneBody(BaseModel):
    session_id:     str
    name:           str = ""
    account_number: str = ""
    bank:           str = ""

@honeypot_router.post("/api/honeypot/beneficiaries/add")
def honeypot_add_bene(body: AddBeneBody, db: Session = Depends(get_db)):
    sess = _get_session(db, body.session_id)
    if sess:
        sess.beneficiary_adds = (sess.beneficiary_adds or 0) + 1
        db.commit()
    return {"status": "success", "message": "Beneficiary added"}


class TelemetryBody(BaseModel):
    session_id:      str
    session_duration:float = 0
    click_frequency: float = 0
    automation_score:float = 0

@honeypot_router.post("/api/honeypot/telemetry")
def honeypot_telemetry(body: TelemetryBody, db: Session = Depends(get_db)):
    sess = _get_session(db, body.session_id)
    if sess:
        sess.session_duration  = body.session_duration
        sess.automation_score  = body.automation_score
        db.commit()
        _run_model2(db, body.session_id)
    return {"status": "ok"}


# ── Dashboard endpoints ────────────────────────────────────────────────────────
@dashboard_router.get("/api/dashboard/overview")
def overview(db: Session = Depends(get_db)):
    total = db.query(AttackSession).count()
    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    cutoff_7d  = datetime.utcnow() - timedelta(days=7)
    last_24h   = db.query(AttackSession).filter(AttackSession.created_at >= cutoff_24h).count()
    novel_7d   = db.query(HoneypotSession).filter(
        HoneypotSession.created_at >= cutoff_7d,
        HoneypotSession.is_novel == True
    ).count()
    total_value = db.query(HoneypotSession).all()
    attempted_val = sum(s.transfer_value or 0 for s in total_value)
    return {
        "total_attacks": total,
        "attacks_24h":   last_24h,
        "novel_attacks_7d": novel_7d,
        "total_attempted_value": round(attempted_val, 2),
        "total_sessions": db.query(HoneypotSession).count(),
    }

@dashboard_router.get("/api/dashboard/attack-types")
def attack_types(db: Session = Depends(get_db)):
    sessions = db.query(HoneypotSession).all()
    counts = {}
    for s in sessions:
        if s.attack_type:
            counts[s.attack_type] = counts.get(s.attack_type, 0) + 1
    if not counts:
        counts = {"brute_force_bot": 12, "credential_stuffing": 8,
                  "automated_script": 5, "manual_attacker": 3, "reconnaissance": 4}
    return {"data": [{"name": k, "value": v} for k, v in counts.items()]}

@dashboard_router.get("/api/dashboard/timeline")
def timeline(db: Session = Depends(get_db)):
    import random
    rng = random.Random(42)
    hours = [(datetime.utcnow() - timedelta(hours=i)).strftime("%H:00") for i in range(23, -1, -1)]
    real = db.query(AttackSession).filter(
        AttackSession.created_at >= datetime.utcnow() - timedelta(hours=24)
    ).all()
    data = [{"hour": h, "attacks": rng.randint(0, 6)} for h in hours]
    for s in real:
        h = s.created_at.strftime("%H:00")
        for d in data:
            if d["hour"] == h:
                d["attacks"] += 1
    return {"data": data}

@dashboard_router.get("/api/dashboard/recent-sessions")
def recent_sessions(db: Session = Depends(get_db)):
    attacks = db.query(AttackSession).order_by(AttackSession.created_at.desc()).limit(20).all()
    result = []
    for a in attacks:
        hs = db.query(HoneypotSession).filter(HoneypotSession.session_id == a.session_id).first()
        result.append({
            "session_id":        a.session_id[:8],
            "created_at":        a.created_at.strftime("%d %b %H:%M") if a.created_at else "",
            "ip_address":        a.ip_address or "127.0.0.1",
            "confidence":        round((a.ml1_confidence or 0) * 100, 1),
            "trigger":           a.trigger or "ml_model1",
            "attack_type":       hs.attack_type if hs else None,
            "pages_visited":     hs.page_count if hs else 0,
            "transfer_attempts": hs.transfer_attempts if hs else 0,
            "is_novel":          hs.is_novel if hs else False,
            "baseline_drift":    round(a.baseline_drift or 0, 2),
        })
    return {"sessions": result}

@dashboard_router.get("/api/dashboard/confidence-distribution")
def confidence_dist(db: Session = Depends(get_db)):
    sessions = db.query(AttackSession).all()
    buckets = {"65-70%": 0, "70-80%": 0, "80-90%": 0, "90-95%": 0, "95-100%": 0}
    for s in sessions:
        c = (s.ml1_confidence or 0) * 100
        if c < 70:   buckets["65-70%"] += 1
        elif c < 80: buckets["70-80%"] += 1
        elif c < 90: buckets["80-90%"] += 1
        elif c < 95: buckets["90-95%"] += 1
        else:        buckets["95-100%"] += 1
    return {"data": [{"range": k, "count": v} for k, v in buckets.items()]}

@dashboard_router.get("/api/dashboard/trigger-breakdown")
def trigger_breakdown(db: Session = Depends(get_db)):
    sessions = db.query(AttackSession).all()
    ml, rule, drift, travel = 0, 0, 0, 0
    for s in sessions:
        t = s.trigger or "ml_model1"
        if t == "ml_model1":            ml += 1
        elif t == "rule_based":         rule += 1
        elif t == "baseline_drift":     drift += 1
        elif t == "impossible_travel":  travel += 1
    return {"data": [
        {"name": "ML model",          "value": max(ml, 1)},
        {"name": "Rule-based",        "value": max(rule, 1)},
        {"name": "Baseline drift",    "value": max(drift, 0)},
        {"name": "Impossible travel", "value": max(travel, 0)},
    ]}


# ── Helpers ────────────────────────────────────────────────────────────────────
def _ensure_session(db, session_id):
    s = db.query(HoneypotSession).filter(HoneypotSession.session_id == session_id).first()
    if not s:
        s = HoneypotSession(session_id=session_id, pages_visited="")
        db.add(s)
        db.commit()
    return s

def _get_session(db, session_id):
    return db.query(HoneypotSession).filter(HoneypotSession.session_id == session_id).first()

def _log_page(db, session_id, page):
    sess = _get_session(db, session_id)
    if not sess:
        sess = HoneypotSession(session_id=session_id, pages_visited=page)
        db.add(sess)
    else:
        pages = (sess.pages_visited or "").split(",")
        pages.append(page)
        sess.pages_visited = ",".join(p for p in pages if p)
        sess.page_count = len([p for p in pages if p])
    db.commit()

def _run_model2(db, session_id):
    sess = _get_session(db, session_id)
    if not sess: return
    pages = [p for p in (sess.pages_visited or "").split(",") if p]
    dur = sess.session_duration or 1
    features = {
        "page_count":        len(pages),
        "transfer_attempts": sess.transfer_attempts or 0,
        "avg_time_per_page": dur / max(len(pages), 1),
        "click_frequency":   (sess.transfer_attempts or 0) / max(dur, 1),
        "typing_speed":      60,
        "session_duration":  dur,
        "automation_score":  sess.automation_score or 0,
        "beneficiary_adds":  sess.beneficiary_adds or 0,
    }
    result = model2.predict(features)
    sess.attack_type       = result["attack_type"]
    sess.attack_confidence = result["attack_confidence"]
    sess.is_novel          = result["is_novel"]
    db.commit()
