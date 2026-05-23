"""
Core utilities for HDFC Honeypot v2.
Fixed: uses bcrypt directly instead of passlib (Python 3.13 compatible)
"""
import hashlib, random, string, uuid, bcrypt
from datetime import datetime, timedelta

SALT = "hdfc_honeypot_v2_salt_2025"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def mask_username(username: str) -> str:
    return hashlib.sha256(
        f"{SALT}{username.lower().strip()}".encode()
    ).hexdigest()[:32]


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def is_otp_valid(created_at: datetime, minutes: int = 5) -> bool:
    return datetime.utcnow() - created_at < timedelta(minutes=minutes)


def new_session_id() -> str:
    return str(uuid.uuid4())


def check_ip_velocity(db, ip: str, window_minutes: int = 10, max_attempts: int = 10) -> bool:
    from app.models.database import IPVelocity
    cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
    count = db.query(IPVelocity).filter(
        IPVelocity.ip_address == ip,
        IPVelocity.attempt_time >= cutoff
    ).count()
    return count < max_attempts


def log_ip_attempt(db, ip: str, username: str, success: bool):
    from app.models.database import IPVelocity
    record = IPVelocity(ip_address=ip, username=username, success=success)
    db.add(record)
    db.commit()


def check_impossible_travel(db, username: str, current_ip: str) -> bool:
    from app.models.database import BehavioralBaseline
    baseline = db.query(BehavioralBaseline).filter(
        BehavioralBaseline.username == username
    ).first()
    if not baseline or not baseline.last_login_ip:
        return False
    last_ip = baseline.last_login_ip
    last_prefix = ".".join(last_ip.split(".")[:2])
    curr_prefix = ".".join(current_ip.split(".")[:2])
    return last_prefix != curr_prefix and last_ip != "127.0.0.1"


def compute_drift(baseline, features: dict) -> float:
    if not baseline or baseline.login_count < 3:
        return 0.0

    def pct_diff(baseline_val, current_val):
        if baseline_val == 0:
            return 0.0
        return abs(current_val - baseline_val) / max(baseline_val, 1)

    checks = [
        min(pct_diff(baseline.avg_typing_speed,       features.get("typing_speed", 0)), 1.0),
        min(pct_diff(baseline.avg_keystroke_interval, features.get("keystroke_interval", 0)), 1.0),
        min(pct_diff(baseline.avg_session_duration,   features.get("session_duration", 0)) * 0.5, 1.0),
        min(pct_diff(baseline.avg_mouse_speed,        features.get("mouse_movement_speed", 0)) * 0.7, 1.0),
    ]
    return round(sum(checks) / len(checks), 3)


def update_baseline(db, username: str, features: dict, device_fp: str, ip: str):
    from app.models.database import BehavioralBaseline
    b = db.query(BehavioralBaseline).filter(
        BehavioralBaseline.username == username
    ).first()
    if not b:
        b = BehavioralBaseline(username=username, login_count=0)
        db.add(b)

    n = b.login_count

    def ra(old, new):
        old = old if old is not None else 0.0
        new = new if new is not None else 0.0
        return round((old * n + new) / (n + 1), 2)

    b.avg_typing_speed       = ra(b.avg_typing_speed,       features.get("typing_speed", b.avg_typing_speed))
    b.avg_keystroke_interval = ra(b.avg_keystroke_interval, features.get("keystroke_interval", b.avg_keystroke_interval))
    b.avg_keystroke_variance = ra(b.avg_keystroke_variance, features.get("keystroke_variance", b.avg_keystroke_variance))
    b.avg_backspace_count    = ra(b.avg_backspace_count,    features.get("backspace_count", b.avg_backspace_count))
    b.avg_session_duration   = ra(b.avg_session_duration,   features.get("session_duration", b.avg_session_duration))
    b.avg_mouse_speed        = ra(b.avg_mouse_speed,        features.get("mouse_movement_speed", b.avg_mouse_speed))
    b.avg_cursor_path        = ra(b.avg_cursor_path,        features.get("cursor_path_length", b.avg_cursor_path))
    b.avg_reading_time       = ra(b.avg_reading_time,       features.get("reading_time", b.avg_reading_time))
    b.login_count            = n + 1
    b.last_device_fp         = device_fp
    b.last_login_ip          = ip
    b.last_updated           = datetime.utcnow()
    db.commit()


MERCHANTS = [
    "Swiggy", "Zomato", "Amazon Pay", "BigBasket", "Flipkart",
    "Netflix", "Spotify", "Myntra", "IRCTC", "BookMyShow",
    "PhonePe", "Paytm", "Ola", "Uber", "Nykaa",
]


def fake_account(session_id: str) -> dict:
    rng = random.Random(session_id)
    bal = round(rng.uniform(12000, 750000), 2)
    return {
        "account_number":    "99" + str(rng.randint(10**9, 10**10 - 1)),
        "account_type":      "Savings Account",
        "balance":           bal,
        "available_balance": round(bal - rng.uniform(0, 2000), 2),
        "ifsc":              "HDFC0001234",
        "branch":            "Koramangala, Bengaluru",
    }


def fake_transactions(session_id: str, count: int = 20) -> list:
    rng = random.Random(session_id + "_txn")
    txns = []
    for i in range(count):
        days_ago = rng.randint(0, 90)
        dt = datetime.now() - timedelta(days=days_ago, hours=rng.randint(0, 23))
        is_cr = rng.random() > 0.55
        txns.append({
            "date":        dt.strftime("%d %b %Y"),
            "time":        dt.strftime("%I:%M %p"),
            "description": rng.choice(MERCHANTS),
            "type":        rng.choice(["UPI", "NEFT", "IMPS", "Debit Card"]),
            "txn_type":    "CR" if is_cr else "DR",
            "amount":      round(rng.uniform(50, 15000), 2),
            "utr":         "UTR" + "".join(rng.choices(string.digits, k=13)),
        })
    return sorted(txns, key=lambda x: x["date"], reverse=True)


def fake_beneficiaries(session_id: str) -> list:
    rng = random.Random(session_id + "_bene")
    names = ["Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Reddy"]
    banks = ["SBI", "ICICI", "Axis Bank", "Kotak", "HDFC"]
    return [
        {
            "name":           rng.choice(names),
            "account_number": "XXXX" + str(rng.randint(1000, 9999)),
            "bank":           rng.choice(banks),
            "ifsc":           "SBIN000" + str(rng.randint(1000, 9999)),
        }
        for _ in range(rng.randint(2, 4))
    ]


def fake_transfer_response(destination: str, amount: float) -> dict:
    utr = "HDFC" + "".join(random.choices(string.digits, k=12))
    return {
        "status":      "SUCCESS",
        "utr_number":  utr,
        "amount":      amount,
        "destination": destination,
        "timestamp":   datetime.now().strftime("%d %b %Y %I:%M %p"),
        "message":     "Transaction successful",
    }
