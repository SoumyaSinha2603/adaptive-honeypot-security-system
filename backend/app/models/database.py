"""
Database models for HDFC Honeypot v2.
Tables:
  real_users         — 5 legitimate bank customers with hashed passwords
  attack_sessions    — every login attempt classified as ATTACKER
  honeypot_sessions  — attacker behavior inside honeypot
  behavioral_baselines — per-user typing/mouse profile for drift detection
  otp_store          — active OTPs (TTL 5 minutes)
  ip_velocity        — IP attempt tracking for velocity controls
"""

from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from pathlib import Path

DB_DIR = Path(__file__).parent.parent.parent / "database"
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "honeypot_v2.db"

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Real bank users ────────────────────────────────────────────────────────────
class RealUser(Base):
    __tablename__ = "real_users"
    id              = Column(Integer, primary_key=True)
    username        = Column(String(64), unique=True, nullable=False)
    password_hash   = Column(String(128), nullable=False)
    full_name       = Column(String(128), nullable=False)
    email           = Column(String(128), unique=True, nullable=False)
    phone           = Column(String(15), nullable=False)          # for OTP
    account_number  = Column(String(20), unique=True, nullable=False)
    account_type    = Column(String(32), default="Savings Account")
    balance         = Column(Float, default=0.0)
    available_bal   = Column(Float, default=0.0)
    ifsc            = Column(String(16), default="HDFC0001234")
    branch          = Column(String(64), default="Koramangala, Bengaluru")
    customer_id     = Column(String(12), unique=True, nullable=False)
    pan_masked      = Column(String(12))
    nominee         = Column(String(64))
    created_at      = Column(DateTime, default=datetime.utcnow)


# ── Attack sessions (gateway decision log) ─────────────────────────────────────
class AttackSession(Base):
    __tablename__ = "attack_sessions"
    session_id      = Column(String(36), primary_key=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    masked_username = Column(String(64))
    ip_address      = Column(String(45))
    vpn_detected    = Column(Boolean, default=False)
    ml1_verdict     = Column(String(16))
    ml1_confidence  = Column(Float)
    trigger         = Column(String(32))
    features_json   = Column(Text)
    captcha_passed  = Column(Boolean, default=False)
    otp_passed      = Column(Boolean, default=False)
    baseline_drift  = Column(Float, default=0.0)


# ── Honeypot sessions (attacker behavior) ──────────────────────────────────────
class HoneypotSession(Base):
    __tablename__ = "honeypot_sessions"
    id                = Column(Integer, primary_key=True, autoincrement=True)
    session_id        = Column(String(36))
    created_at        = Column(DateTime, default=datetime.utcnow)
    pages_visited     = Column(Text)
    page_count        = Column(Integer, default=0)
    transfer_attempts = Column(Integer, default=0)
    transfer_value    = Column(Float, default=0.0)
    beneficiary_adds  = Column(Integer, default=0)
    session_duration  = Column(Float, default=0.0)
    automation_score  = Column(Float, default=0.0)
    attack_type       = Column(String(32))
    attack_confidence = Column(Float, default=0.0)
    is_novel          = Column(Boolean, default=False)


# ── Behavioral baseline per user ───────────────────────────────────────────────
class BehavioralBaseline(Base):
    __tablename__ = "behavioral_baselines"
    id                    = Column(Integer, primary_key=True, autoincrement=True)
    username              = Column(String(64), nullable=False)
    login_count           = Column(Integer, default=0)
    avg_typing_speed      = Column(Float, default=0.0)
    avg_keystroke_interval= Column(Float, default=0.0)
    avg_keystroke_variance= Column(Float, default=0.0)
    avg_backspace_count   = Column(Float, default=0.0)
    avg_session_duration  = Column(Float, default=0.0)
    avg_mouse_speed       = Column(Float, default=0.0)
    avg_cursor_path       = Column(Float, default=0.0)
    avg_reading_time      = Column(Float, default=0.0)
    avg_hesitation_count  = Column(Float, default=0.0)
    last_device_fp        = Column(String(128))
    last_login_ip         = Column(String(45))
    last_login_geo        = Column(String(64))
    last_updated          = Column(DateTime, default=datetime.utcnow)


# ── OTP store (TTL via created_at + 5 min check in code) ──────────────────────
class OTPStore(Base):
    __tablename__ = "otp_store"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    username   = Column(String(64), nullable=False)
    otp_code   = Column(String(6), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    used       = Column(Boolean, default=False)


# ── IP velocity tracking ───────────────────────────────────────────────────────
class IPVelocity(Base):
    __tablename__ = "ip_velocity"
    id           = Column(Integer, primary_key=True, autoincrement=True)
    ip_address   = Column(String(45), nullable=False)
    attempt_time = Column(DateTime, default=datetime.utcnow)
    username     = Column(String(64))
    success      = Column(Boolean, default=False)


def create_tables():
    Base.metadata.create_all(bind=engine)
