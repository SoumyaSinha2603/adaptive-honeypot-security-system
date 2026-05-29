"""
ML Model 1 — Upgraded to 21 features.
New features added:
  16. keystroke_variance    — std dev of keystroke intervals (0 = bot)
  17. scroll_depth          — how far user scrolled (0 = bot)
  18. copy_paste_detected   — programmatic field fill detected
  19. reading_time          — seconds before first interaction
  20. hesitation_count      — pauses > 500ms mid-typing
  21. mouse_path_curvature  — 0=straight line (bot), 1=natural curve
"""

import os, pickle, numpy as np
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "model1_v2.pkl"

FEATURES = [
    "login_time", "typing_speed", "backspace_count",
    "mouse_movement_speed", "cursor_path_length",
    "ip_address_risk", "geo_location_change", "device_change",
    "failed_login_attempts", "unusual_login_time", "vpn_detected",
    "browser_fingerprint_risk", "session_duration",
    "keystroke_interval", "mouse_click_frequency",
    # NEW features (16-21)
    "keystroke_variance", "scroll_depth", "copy_paste_detected",
    "reading_time", "hesitation_count", "mouse_path_curvature",
]


def train():
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline

    rng = np.random.RandomState(42)
    n_normal, n_attack = 4000, 1200

    # ── Normal user data ──────────────────────────────────────────────────────
    normal = np.column_stack([
        rng.uniform(8, 22, n_normal),                                          # login_time
        rng.normal(60, 15, n_normal),                                          # typing_speed
        rng.poisson(3, n_normal),                                              # backspace_count
        rng.normal(200, 50, n_normal),                                         # mouse_movement_speed
        rng.normal(1500, 400, n_normal),                                       # cursor_path_length
        rng.beta(1, 9, n_normal),                                              # ip_address_risk
        rng.binomial(1, 0.05, n_normal),                                       # geo_location_change
        rng.binomial(1, 0.03, n_normal),                                       # device_change
        rng.poisson(0.2, n_normal),                                            # failed_login_attempts
        rng.binomial(1, 0.08, n_normal),                                       # unusual_login_time
        rng.binomial(1, 0.10, n_normal),                                       # vpn_detected
        rng.beta(1, 9, n_normal),                                              # browser_fingerprint_risk
        rng.normal(45, 20, n_normal),                                          # session_duration
        rng.normal(150, 40, n_normal),                                         # keystroke_interval
        rng.normal(2, 0.8, n_normal),                                          # mouse_click_frequency
        rng.normal(35, 12, n_normal),                                          # keystroke_variance (natural)
        rng.normal(0.6, 0.2, n_normal),                                        # scroll_depth
        np.zeros(n_normal),                                                    # copy_paste_detected (humans type)
        rng.normal(4, 1.5, n_normal),                                          # reading_time (seconds)
        rng.poisson(2, n_normal),                                              # hesitation_count
        rng.normal(0.7, 0.15, n_normal),                                       # mouse_path_curvature (curved)
    ])

    # ── Attacker data ─────────────────────────────────────────────────────────
    attack = np.column_stack([
        rng.uniform(0, 24, n_attack),
        np.where(rng.rand(n_attack) > 0.5,
        rng.uniform(500, 1200, n_attack),
        rng.uniform(1, 10, n_attack)),
        rng.poisson(0.1, n_attack),
        np.zeros(n_attack),
        rng.uniform(0, 50, n_attack),
        rng.beta(6, 2, n_attack),
        rng.binomial(1, 0.7, n_attack),
        rng.binomial(1, 0.6, n_attack),
        rng.poisson(8, n_attack),
        rng.binomial(1, 0.5, n_attack),
        rng.binomial(1, 0.8, n_attack),
        rng.beta(7, 2, n_attack),
        rng.uniform(0.1, 5, n_attack),
        rng.uniform(0, 5, n_attack),
        rng.uniform(0, 0.5, n_attack),
        rng.uniform(0, 3, n_attack),                                           # keystroke_variance (near zero)
        np.zeros(n_attack),                                                    # scroll_depth (bots don't scroll)
        rng.binomial(1, 0.85, n_attack),                                       # copy_paste_detected
        rng.uniform(0, 0.5, n_attack),                                         # reading_time (instant)
        np.zeros(n_attack),                                                    # hesitation_count (bots never hesitate)
        rng.uniform(0, 0.1, n_attack),                                         # mouse_path_curvature (straight)
    ])

    X = np.vstack([normal, attack])
    y = np.array([0] * n_normal + [1] * n_attack)

    idx = rng.permutation(len(X))
    X, y = X[idx], y[idx]

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", RandomForestClassifier(
            n_estimators=150, max_depth=12,
            class_weight="balanced", random_state=42, n_jobs=-1
        )),
    ])
    pipeline.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"pipeline": pipeline, "features": FEATURES}, f)

    print(f"✅ Model 1 (21 features) trained → {MODEL_PATH}")
    return pipeline


def load():
    if not MODEL_PATH.exists():
        return train()
    with open(MODEL_PATH, "rb") as f:
        d = pickle.load(f)
    return d["pipeline"]


def predict(features: dict) -> dict:
    pipeline = load()
    vector = np.array([[features.get(f, 0.0) for f in FEATURES]])
    prob = float(pipeline.predict_proba(vector)[0][1])

    # Rule-based override (catches the most obvious cases instantly)
    rule_triggered = False
    if (features.get("failed_login_attempts", 0) >= 5
            and features.get("vpn_detected", False)
            and features.get("device_change", False)):
        prob = 0.99
        rule_triggered = True

    # Copy-paste alone is very strong
    if features.get("copy_paste_detected", 0) and features.get("mouse_movement_speed", 0) == 0:
        prob = max(prob, 0.90)

    # Zero variance + zero mouse = definite bot
    if features.get("keystroke_variance", 99) < 2 and features.get("mouse_movement_speed", 0) == 0:
        prob = max(prob, 0.92)

    return {
        "label":   "ATTACKER" if prob >= 0.65 else "NORMAL",
        "confidence": round(prob, 4),
        "trigger": "rule_based" if rule_triggered else "ml_model1",
    }
