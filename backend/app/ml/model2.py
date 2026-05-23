"""ML Model 2 — Attacker behavior classifier (unchanged from v1)."""
import pickle, numpy as np
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "model2_v2.pkl"

FEATURES = [
    "page_count", "transfer_attempts", "avg_time_per_page",
    "click_frequency", "typing_speed", "session_duration",
    "automation_score", "beneficiary_adds",
]

ATTACK_TYPES = [
    "brute_force_bot", "credential_stuffing", "automated_script",
    "manual_attacker", "reconnaissance",
]


def train():
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler

    rng = np.random.RandomState(99)
    n = 300

    profiles = {
        "brute_force_bot":    ([1, 8, 0.2, 80, 900, 0.5, 0.98, 0],  [0.5, 3, 0.1, 20, 200, 0.3, 0.05, 0]),
        "credential_stuffing":([1, 0, 0.3, 5,  800, 1.0, 0.95, 0],  [0.5, 0, 0.2, 3,  200, 0.5, 0.05, 0]),
        "automated_script":   ([5, 2, 0.5, 10, 700, 8.0, 0.90, 1],  [1,   1, 0.2, 5,  150, 2.0, 0.05, 0.5]),
        "manual_attacker":    ([4, 3, 8.0, 3,  55,  60,  0.10, 2],  [1,   1, 3.0, 1,  15,  20,  0.08, 1]),
        "reconnaissance":     ([7, 0, 5.0, 2,  50,  120, 0.15, 0],  [2,   0, 2.0, 1,  15,  40,  0.10, 0]),
    }

    X_list, y_list = [], []
    for label, (means, stds) in profiles.items():
        idx = ATTACK_TYPES.index(label)
        samples = np.column_stack([
            np.maximum(0, rng.normal(m, s, n)) for m, s in zip(means, stds)
        ])
        X_list.append(samples)
        y_list.extend([idx] * n)

    X = np.vstack(X_list)
    y = np.array(y_list)
    shuffle = rng.permutation(len(X))
    X, y = X[shuffle], y[shuffle]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    clf = GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=99)
    clf.fit(X_scaled, y)

    iso = IsolationForest(contamination=0.08, random_state=99)
    iso.fit(X_scaled)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"clf": clf, "iso": iso, "scaler": scaler}, f)

    print(f"✅ Model 2 trained → {MODEL_PATH}")


def load():
    if not MODEL_PATH.exists():
        train()
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


def predict(features: dict) -> dict:
    d = load()
    clf, iso, scaler = d["clf"], d["iso"], d["scaler"]
    vec = np.array([[features.get(f, 0.0) for f in FEATURES]])
    vec_s = scaler.transform(vec)
    probs = clf.predict_proba(vec_s)[0]
    idx = int(np.argmax(probs))
    iso_score = float(iso.score_samples(vec_s)[0])
    return {
        "attack_type":       ATTACK_TYPES[idx],
        "attack_confidence": round(float(probs[idx]), 4),
        "isolation_score":   round(iso_score, 4),
        "is_novel":          iso_score < -0.15,
    }
