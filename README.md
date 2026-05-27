# 🛡️ Adaptive Honeypot Security System for Banking Infrastructure

> A cybersecurity research prototype that silently deceives attackers instead of blocking them — combining a 7-layer ML authentication pipeline with a fully functional fake HDFC NetBanking portal.

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3.2-F7931E?logo=scikit-learn&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📌 Overview

Traditional banking security blocks attackers and **reveals detection** — letting them adapt and return. This system takes a fundamentally different approach: **deception**.

When a bot or attacker is detected at the login page, instead of showing a 403 error, the system silently redirects them into a **visually identical fake HDFC NetBanking portal** — while real users seamlessly reach the genuine dashboard. Every action the attacker takes inside the honeypot is logged, classified, and fed back to improve the ML models.

```
Legitimate User  →  7-Layer Auth Pipeline  →  Real HDFC Dashboard ✅
Attacker / Bot   →  7-Layer Auth Pipeline  →  Honeypot Portal 🪤 (attacker never knows)
```

---

## 🎯 Key Features

- **7-Layer Authentication Pipeline** — CAPTCHA → IP Velocity → BCrypt Credential Verification → ML Classification → Behavioural Baseline Drift → Impossible Travel Detection → OTP
- **21-Feature Behavioural Biometric Classifier** — Random Forest trained on typing speed, mouse dynamics, keystroke variance, scroll depth, copy-paste detection, and more
- **Deceptive OTP** — Attackers receive OTP prompts too; any 6-digit code is accepted, routing them deeper into the honeypot without revealing detection
- **High-Fidelity Honeypot Portal** — 5 fully functional fake pages (Accounts, Transactions, Fund Transfer, Beneficiaries, Settings) with deterministic fake data seeded from session ID
- **ML Model 2 Inside Honeypot** — Gradient Boosting classifies attacker behaviour into 5 attack types; Isolation Forest flags novel unknown attacks
- **Real-Time Security Dashboard** — Dark-theme analytics dashboard with 6 live Recharts visualisations auto-refreshing every 15 seconds
- **Per-User Behavioural Baselines** — Detects account takeover even with valid stolen credentials by tracking typing rhythm drift

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 SPA (Frontend)                  │
│   Login Page │ OTP Page │ Bank Dashboard │ Honeypot Portal  │
│              │ Security Analytics Dashboard                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────────┐
│                FastAPI Backend (Python 3.13)                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              7-Layer Login Pipeline                  │   │
│  │  CAPTCHA → IP Velocity → BCrypt → ML Model 1        │   │
│  │  → Baseline Drift → Impossible Travel → OTP         │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│          ┌──────────▼──────────┐                           │
│          │  NORMAL (Real Bank) │  ATTACKER (Honeypot)      │
│          └─────────────────────┘                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQLAlchemy ORM
┌──────────────────────────▼──────────────────────────────────┐
│                    SQLite Database                           │
│  real_users │ attack_sessions │ honeypot_sessions           │
│  behavioral_baselines │ otp_store │ ip_velocity             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 ML Model Performance

| Attack Category | % of Real Attacks | Detection Rate | Primary Layer |
|---|---|---|---|
| Brute Force Bot | 25–30% | **95–98%** | IP Velocity + ML |
| Credential Stuffing | 45–50% | **88–92%** | ML (copy-paste, no variance) |
| Automated Script | 10–15% | **85–90%** | ML (reading_time < 0.5s) |
| Manual Attacker | 3–5% | **60–70%** | Baseline Drift |
| Account Takeover | 5–8% | **55–65%** | Baseline Drift + OTP |

**Model 1:** Random Forest — 150 trees, 21 features, 5-fold CV accuracy ~92%  
**Model 2:** Gradient Boosting + Isolation Forest — 5 attack categories + novel detection

---

## 🧠 The 21 Behavioural Biometric Features

| # | Feature | What it catches |
|---|---|---|
| 1–3 | `typing_speed`, `backspace_count`, `keystroke_interval` | Speed bots (1200+ cpm vs human 40–80) |
| 4–6 | `mouse_movement_speed`, `cursor_path_length`, `mouse_click_frequency` | API-level attacks (zero mouse movement) |
| 7–9 | `session_duration`, `login_time`, `unusual_login_time` | Automated campaigns at 3 AM |
| 10–15 | `failed_login_attempts`, `ip_address_risk`, `vpn_detected`, `geo_location_change`, `device_change`, `browser_fingerprint_risk` | Proxy/VPN credential stuffers |
| 16 ⭐ | `keystroke_variance` | **Slow bots** mimicking human timing |
| 17 ⭐ | `scroll_depth` | Scripts that never scroll the page |
| 18 ⭐ | `copy_paste_detected` | Credential stuffing tools auto-filling fields |
| 19 ⭐ | `reading_time` | Instant-submit bots (< 0.5s) |
| 20 ⭐ | `hesitation_count` | Bots with no cognitive pauses |
| 21 ⭐ | `mouse_path_curvature` | Straight-line bot paths vs natural human curves |

*⭐ = v2 new features designed to close the most critical detection gaps*

---

## 🚀 Quick Start

### Prerequisites
- Python 3.13
- Node.js 18+
- Git

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/adityakeshavv/honeypot-v2.git
cd honeypot-v2/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Setup database, seed users, train ML models, insert demo sessions
python setup.py

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
# Open a new terminal
cd honeypot-v2/frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

Open **http://localhost:5173** — the HDFC NetBanking login page will load.

---

## 🧪 Demo Mode

The login page includes a **Research Mode** panel with two demo buttons:

| Button | What it does |
|---|---|
| 🤖 Simulate Bot Attack | Injects `BOT_FEATURES` (typing=1200, mouse=0, vpn=True) → triggers ATTACKER verdict at >90% confidence |
| 👤 Simulate Normal User | Injects `HUMAN_FEATURES` for `rajesh.kumar` → triggers NORMAL verdict → real dashboard |

**Test credentials (real users):**

| Username | Password |
|---|---|
| rajesh.kumar | Rajesh@2024 |
| priya.sharma | Priya#5678 |
| amit.verma | Amit$9012 |

---

## 🗂️ Project Structure

```
honeypot-v2/
├── backend/
│   ├── app/
│   │   ├── core/          # BCrypt, OTP utils, config
│   │   ├── ml/            # ML model training & inference
│   │   ├── models/        # SQLAlchemy ORM models
│   │   └── routes/        # FastAPI route handlers
│   │       ├── login.py   # 7-layer auth pipeline
│   │       ├── bank.py    # Real user dashboard API
│   │       ├── honeypot.py# Honeypot portal API
│   │       └── dashboard.py# Security analytics API
│   ├── setup.py           # DB seed + ML model training
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/         # LoginPage, OTPPage, BankDashboard,
        │                  # HoneypotPortal, SecurityDashboard
        ├── components/    # Captcha component
        └── hooks/         # useTelemetry (21-feature collector)
```

---

## 🔒 Security Design

- **Passwords** — BCrypt with cost factor 12; permanently discarded after verification, never stored raw
- **Usernames** — SHA-256 hashed with salt before any persistence
- **OTP** — Cryptographically random 6-digit codes via Python `secrets` module; 5-minute TTL; single-use
- **Deception Integrity** — Honeypot fund transfer endpoint has zero dependency on any real payment API
- **Identical Responses** — `/api/login` returns structurally identical JSON for NORMAL and ATTACKER verdicts; only the `destination` field differs (processed client-side, never visible in UI)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.13, FastAPI, Uvicorn |
| ML | scikit-learn (Random Forest, Gradient Boosting, Isolation Forest) |
| Database | SQLite via SQLAlchemy ORM |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Auth | BCrypt, Python `secrets` (OTP) |
| Dev Tools | Git, VS Code, Postman |

---

## 📊 Security Dashboard

The analytics dashboard (`/security`) provides:
- **Attack Timeline** — 24-hour line chart showing attack frequency
- **Attack Type Distribution** — Pie chart from ML Model 2 classifications
- **Confidence Distribution** — Bar chart of ML Model 1 probability scores
- **Trigger Breakdown** — Which detection layer caught each attacker
- **Sessions Audit Table** — Full forensic trail per session
- **v2 Features Reference** — Signal interpretation guide for analysts

Auto-refreshes every **15 seconds**.

---

## 📄 Report

Full academic project report (40+ pages) including system architecture, UML diagrams, SRS documentation, ML model specifications, and test cases is available in the `/docs` folder.

**Submitted at:** KIIT University, School of Computer Engineering, March 2026  
**Guide:** Prof. Dr. Abhishek Ray, Dean of Industry Engagements

---
## 👥 Contributors

### Aditya Keshav
Backend architecture, behavioural feature engineering, 21-feature ML input design, Random Forest attack detection logic, BCrypt integration, database seeding, human-vs-bot behavioural analysis

[![LinkedIn](https://img.shields.io/badge/LinkedIn-aditya--keshavv-0077B5?logo=linkedin)](https://linkedin.com/in/aditya-keshavv/)
[![GitHub](https://img.shields.io/badge/GitHub-adityakeshavv-181717?logo=github)](https://github.com/adityakeshavv/)

---

### Anmol Kumar
Core solution architecture, Detect-Deceive-Learn workflow design, 7-layer authentication pipeline planning, system integration architecture, cybersecurity workflow modelling

[![LinkedIn](https://img.shields.io/badge/LinkedIn-anmol--kumar-0077B5?logo=linkedin)](https://linkedin.com/in/anmolkumar1909/)
[![GitHub](https://img.shields.io/badge/GitHub-anmolkumar-181717?logo=github)](https://github.com/Anmol1909/)

---

### Tanya Swain
Problem statement formulation, project workflow planning, cybersecurity threat analysis, research-oriented project structuring, introductory framework and documentation design

[![LinkedIn](https://img.shields.io/badge/LinkedIn-tanya--swain-0077B5?logo=linkedin)](https://linkedin.com/in/tanya-swain-157789346/)
[![GitHub](https://img.shields.io/badge/GitHub-tanyaswain-181717?logo=github)](https://github.com/tanyaswainn/)

---

### Snehashish Sahu
Machine learning workflow analysis, ML Model 1 & ML Model 2 research, drift detection logic, anomaly detection concepts, data flow diagram (DFD) modelling

[![LinkedIn](https://img.shields.io/badge/LinkedIn-snehashish--sahu-0077B5?logo=linkedin)](https://linkedin.com/in/snehashish-sahu-7b2a13348/)
[![GitHub](https://img.shields.io/badge/GitHub-snehashishsahu-181717?logo=github)](https://github.com/Snehashish-Sahu/)

---

### Soumya Kumar Sinha
Security analytics dashboard, attack detection performance analysis, cybersecurity reporting, dashboard visualisation concepts, use case modelling, future scope planning, conclusion framework

[![LinkedIn](https://img.shields.io/badge/LinkedIn-soumya--sinha-0077B5?logo=linkedin)](https://linkedin.com/in/soumya-kumar-sinha-0091ab254/)
[![GitHub](https://img.shields.io/badge/GitHub-SoumyaSinha2603-181717?logo=github)](https://github.com/SoumyaSinha2603/)

---

### Tanmay Mishra
Deception architecture, honeypot workflow design, CAPTCHA & OTP authentication logic, SQLite schema planning, database structure design, honeypot-vs-real-dashboard comparison analysis

[![LinkedIn](https://img.shields.io/badge/LinkedIn-tanmay--mishra-0077B5?logo=linkedin)](https://linkedin.com/in/tanmay-mishra-539707221/)
[![GitHub](https://img.shields.io/badge/GitHub-tanmaymishra-181717?logo=github)](https://github.com/tanmaymishrab0c9/)

---

## ⚠️ Disclaimer

This project is a **cybersecurity research prototype** built for academic purposes at KIIT University. The HDFC NetBanking interface is replicated solely for research demonstration and is not affiliated with or endorsed by HDFC Bank. No real financial transactions are processed. The honeypot contains zero real banking data or payment infrastructure.
