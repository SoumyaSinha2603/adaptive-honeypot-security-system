"""
HDFC Honeypot v2 — One-time setup script.
Run: python setup.py
Creates DB, seeds 5 real users, trains ML models, seeds demo attack sessions.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.models.database import create_tables, SessionLocal, RealUser, AttackSession, HoneypotSession
from app.core.utils import hash_password, new_session_id
from datetime import datetime, timedelta
import random, json, uuid

print("=" * 60)
print("  HDFC Honeypot v2 — Setup")
print("=" * 60)

# ── Database ───────────────────────────────────────────────────────────────────
print("\n📦 Creating database tables...")
create_tables()
print("✅ Database ready")

db = SessionLocal()

# ── 5 Real users ───────────────────────────────────────────────────────────────
print("\n👥 Seeding 5 real bank users...")

USERS = [
    {
        "username":      "rajesh.kumar",
        "password":      "Rajesh@2024",
        "full_name":     "Rajesh Kumar",
        "email":         "rajesh.kumar@gmail.com",
        "phone":         "9876543210",
        "account_number":"10234567890",
        "customer_id":   "HDFC001234",
        "account_type":  "Savings Account",
        "balance":       285400.50,
        "available_bal": 283200.00,
        "pan_masked":    "ABCPK1234D",
        "nominee":       "Sunita Kumar",
        "branch":        "Koramangala, Bengaluru",
    },
    {
        "username":      "priya.sharma",
        "password":      "Priya#5678",
        "full_name":     "Priya Sharma",
        "email":         "priya.sharma@outlook.com",
        "phone":         "9123456780",
        "account_number":"20345678901",
        "customer_id":   "HDFC002345",
        "account_type":  "Premium Savings Account",
        "balance":       542100.75,
        "available_bal": 540000.00,
        "pan_masked":    "DEFPS5678G",
        "nominee":       "Arjun Sharma",
        "branch":        "Bandra West, Mumbai",
    },
    {
        "username":      "amit.verma",
        "password":      "Amit$9012",
        "full_name":     "Amit Verma",
        "email":         "amit.verma@yahoo.com",
        "phone":         "8765432109",
        "account_number":"30456789012",
        "customer_id":   "HDFC003456",
        "account_type":  "Savings Account",
        "balance":       98750.25,
        "available_bal": 97500.00,
        "pan_masked":    "GHIAV9012J",
        "nominee":       "Meena Verma",
        "branch":        "Connaught Place, New Delhi",
    },
    {
        "username":      "sneha.reddy",
        "password":      "Sneha!3456",
        "full_name":     "Sneha Reddy",
        "email":         "sneha.reddy@gmail.com",
        "phone":         "7654321098",
        "account_number":"40567890123",
        "customer_id":   "HDFC004567",
        "account_type":  "Women's Savings Account",
        "balance":       175300.00,
        "available_bal": 174000.00,
        "pan_masked":    "JKLSR3456M",
        "nominee":       "Ravi Reddy",
        "branch":        "Jubilee Hills, Hyderabad",
    },
    {
        "username":      "vikram.singh",
        "password":      "Vikram*7890",
        "full_name":     "Vikram Singh",
        "email":         "vikram.singh@proton.me",
        "phone":         "6543210987",
        "account_number":"50678901234",
        "customer_id":   "HDFC005678",
        "account_type":  "Salary Account",
        "balance":       423600.80,
        "available_bal": 421000.00,
        "pan_masked":    "MNPVS7890Q",
        "nominee":       "Kavya Singh",
        "branch":        "Anna Salai, Chennai",
    },
]

for u in USERS:
    existing = db.query(RealUser).filter(RealUser.username == u["username"]).first()
    if not existing:
        user = RealUser(
            username       = u["username"],
            password_hash  = hash_password(u["password"]),
            full_name      = u["full_name"],
            email          = u["email"],
            phone          = u["phone"],
            account_number = u["account_number"],
            customer_id    = u["customer_id"],
            account_type   = u["account_type"],
            balance        = u["balance"],
            available_bal  = u["available_bal"],
            pan_masked     = u["pan_masked"],
            nominee        = u["nominee"],
            branch         = u["branch"],
        )
        db.add(user)
        print(f"  ✅ {u['full_name']} — {u['username']} / {u['password']}")
    else:
        print(f"  ⚡ {u['full_name']} already exists")

db.commit()

# ── Train ML models ────────────────────────────────────────────────────────────
print("\n🤖 Training ML Model 1 (21 features)...")
from app.ml import model1
model1.train()

print("\n🤖 Training ML Model 2 (behavior classifier)...")
from app.ml import model2
model2.train()

# ── Seed demo attack sessions ──────────────────────────────────────────────────
print("\n🎭 Seeding demo attack sessions...")
rng = random.Random(42)

ATTACK_TYPES = ["brute_force_bot", "credential_stuffing", "automated_script",
                "manual_attacker", "reconnaissance"]

for i in range(30):
    sid = str(uuid.uuid4())
    hours_ago = rng.randint(0, 72)
    created = datetime.utcnow() - timedelta(hours=hours_ago)
    confidence = rng.uniform(0.65, 0.99)
    triggers = ["ml_model1"] * 6 + ["rule_based"] * 3 + ["baseline_drift"]
    trigger = rng.choice(triggers)

    atk = AttackSession(
        session_id      = sid,
        created_at      = created,
        masked_username = "demo_hash_" + str(i),
        ip_address      = f"{rng.randint(1,255)}.{rng.randint(1,255)}.{rng.randint(1,255)}.{rng.randint(1,255)}",
        vpn_detected    = rng.random() > 0.4,
        ml1_verdict     = "ATTACKER",
        ml1_confidence  = round(confidence, 4),
        trigger         = trigger,
        features_json   = json.dumps({"typing_speed": rng.randint(200, 1000)}),
        captcha_passed  = True,
        otp_passed      = False,
        baseline_drift  = round(rng.uniform(0, 0.9), 2),
    )
    db.add(atk)

    pages = rng.sample(["dashboard","transactions","transfer","beneficiary","settings"],
                       rng.randint(1, 4))
    hs = HoneypotSession(
        session_id        = sid,
        created_at        = created,
        pages_visited     = ",".join(pages),
        page_count        = len(pages),
        transfer_attempts = rng.randint(0, 5),
        transfer_value    = round(rng.uniform(0, 250000), 2),
        beneficiary_adds  = rng.randint(0, 3),
        session_duration  = round(rng.uniform(1, 300), 1),
        automation_score  = round(rng.uniform(0.4, 0.99), 2),
        attack_type       = rng.choice(ATTACK_TYPES),
        attack_confidence = round(rng.uniform(0.6, 0.99), 4),
        is_novel          = rng.random() > 0.85,
    )
    db.add(hs)

db.commit()
db.close()

print("\n" + "=" * 60)
print("  ✅ Setup complete!")
print("=" * 60)
print("\nCredentials for the 5 real users:")
print("-" * 40)
for u in USERS:
    print(f"  {u['username']:20} | {u['password']:15} | Phone: {u['phone']}")
print("-" * 40)
print("\nStart backend:  uvicorn app.main:app --reload --port 8000")
print("Start frontend: cd ../frontend && npm run dev")
print("Open:           http://localhost:5173\n")
