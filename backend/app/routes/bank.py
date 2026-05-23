"""Real bank dashboard API — serves data for authenticated legitimate users."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db, RealUser
import random, string
from datetime import datetime, timedelta

router = APIRouter()

MERCHANTS = [
    "Swiggy", "Zomato", "Amazon Pay", "BigBasket", "Flipkart",
    "Netflix", "Spotify", "Myntra", "IRCTC", "BookMyShow",
    "PhonePe", "Paytm", "Ola", "Uber", "Nykaa", "DMart",
    "Jio Recharge", "BSNL", "Airtel", "CRED",
]

def gen_transactions(username: str, count=20):
    rng = random.Random(username + "_real_txn")
    txns = []
    running_bal = None
    for i in range(count):
        days_ago = rng.randint(0, 90)
        dt = datetime.now() - timedelta(days=days_ago, hours=rng.randint(0, 23))
        is_cr = rng.random() > 0.55
        amount = round(rng.uniform(50, 25000), 2)
        txns.append({
            "date":        dt.strftime("%d %b %Y"),
            "time":        dt.strftime("%I:%M %p"),
            "description": rng.choice(MERCHANTS),
            "type":        rng.choice(["UPI", "NEFT", "IMPS", "Debit Card", "RTGS"]),
            "txn_type":    "CR" if is_cr else "DR",
            "amount":      amount,
            "utr":         "HDFC" + "".join(rng.choices(string.digits, k=12)),
        })
    return sorted(txns, key=lambda x: x["date"], reverse=True)


def gen_beneficiaries(username: str):
    rng = random.Random(username + "_real_bene")
    names  = ["Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Reddy", "Vikram Singh"]
    banks  = ["SBI", "ICICI", "Axis Bank", "Kotak", "PNB"]
    return [
        {
            "name":           rng.choice(names),
            "account_number": "XXXX" + str(rng.randint(1000, 9999)),
            "bank":           rng.choice(banks),
            "ifsc":           "SBIN000" + str(rng.randint(1000, 9999)),
            "upi":            f"{rng.choice(names).replace(' ','').lower()}@upi",
        }
        for _ in range(3)
    ]


@router.get("/api/bank/overview/{username}")
def bank_overview(username: str, db: Session = Depends(get_db)):
    user = db.query(RealUser).filter(RealUser.username == username).first()
    if not user:
        return {"error": "User not found"}
    return {
        "full_name":      user.full_name,
        "customer_id":    user.customer_id,
        "account_number": user.account_number,
        "account_type":   user.account_type,
        "balance":        user.balance,
        "available_bal":  user.available_bal,
        "ifsc":           user.ifsc,
        "branch":         user.branch,
        "email":          user.email,
        "pan_masked":     user.pan_masked,
        "nominee":        user.nominee,
        "recent_transactions": gen_transactions(username, 5),
    }


@router.get("/api/bank/transactions/{username}")
def bank_transactions(username: str):
    return {"transactions": gen_transactions(username, 20)}


@router.get("/api/bank/beneficiaries/{username}")
def bank_beneficiaries(username: str):
    return {"beneficiaries": gen_beneficiaries(username)}


@router.post("/api/bank/transfer")
def bank_transfer(username: str, destination: str, amount: float, transfer_type: str = "IMPS"):
    import random, string
    utr = "HDFC" + "".join(random.choices(string.digits, k=12))
    return {
        "status":    "SUCCESS",
        "utr":       utr,
        "amount":    amount,
        "timestamp": datetime.now().strftime("%d %b %Y %I:%M %p"),
        "message":   "Transfer processed successfully",
    }
