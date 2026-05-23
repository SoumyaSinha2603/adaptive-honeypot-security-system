from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.login import router as login_router
from app.routes.bank import router as bank_router
from app.routes.routes import honeypot_router, dashboard_router

app = FastAPI(title="HDFC Honeypot v2")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(login_router)
app.include_router(bank_router)
app.include_router(honeypot_router)
app.include_router(dashboard_router)
