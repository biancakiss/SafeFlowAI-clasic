from __future__ import annotations

import argparse
import json
import platform
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC = ["amount", "hour", "is_new_beneficiary", "is_international", "velocity_24h", "account_age_days"]
CATEGORICAL = ["currency", "payment_channel", "beneficiary_country"]
FEATURES = NUMERIC + CATEGORICAL
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ARTIFACT_DIR = PROJECT_ROOT / "ml" / "artifacts" / "transactions"


def make_dataset(n: int = 2500, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    channels = np.array(["card", "bank_transfer", "international_transfer", "crypto_wallet", "cash_withdrawal"])
    countries = np.array(["AU", "GB", "US", "DE", "SG", "NG", "RU"])
    channel = rng.choice(channels, n, p=[.45, .30, .10, .08, .07])
    country = rng.choice(countries, n, p=[.40, .18, .16, .10, .08, .05, .03])
    amount = np.round(np.exp(rng.normal(5.0, 1.0, n)), 2)
    hour = rng.integers(0, 24, n)
    new_beneficiary = rng.binomial(1, .22, n)
    velocity = rng.poisson(2.5, n) + 1
    account_age = rng.integers(5, 2600, n)
    international = ((country != "AU") | (channel == "international_transfer")).astype(int)
    logit = (
        -4.2 + 0.00032 * amount + 1.5 * new_beneficiary + 0.34 * velocity
        + 1.35 * (hour <= 5) + 1.4 * international + 1.1 * (channel == "crypto_wallet")
        + 0.9 * (country == "NG") + 0.6 * (country == "RU")
        - 0.00035 * account_age
    )
    fraud = rng.binomial(1, 1 / (1 + np.exp(-logit)))
    return pd.DataFrame({
        "amount": amount, "hour": hour, "is_new_beneficiary": new_beneficiary,
        "is_international": international, "velocity_24h": velocity,
        "account_age_days": account_age, "currency": "AUD",
        "payment_channel": channel, "beneficiary_country": country, "is_fraud": fraud,
    })


def pipeline(model: object) -> Pipeline:
    prep = ColumnTransformer([
        ("numeric", StandardScaler(), NUMERIC),
        ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
    ])
    return Pipeline([("preprocessor", prep), ("classifier", model)])


def train(artifact_dir: str | Path = DEFAULT_ARTIFACT_DIR) -> dict:
    df = make_dataset()
    train_df, test_df = train_test_split(df, test_size=.2, random_state=42, stratify=df["is_fraud"])
    candidates = {
        "logistic_regression": pipeline(LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)),
        "random_forest": pipeline(RandomForestClassifier(n_estimators=250, min_samples_leaf=3, class_weight="balanced", random_state=42, n_jobs=-1)),
    }
    results = {}
    for name, model in candidates.items():
        model.fit(train_df[FEATURES], train_df["is_fraud"])
        proba = model.predict_proba(test_df[FEATURES])[:, 1]
        pred = (proba >= .5).astype(int)
        results[name] = {"f1": float(f1_score(test_df["is_fraud"], pred)), "accuracy": float(accuracy_score(test_df["is_fraud"], pred))}
    selected = max(results, key=lambda name: (results[name]["f1"], results[name]["accuracy"]))
    model = candidates[selected]
    proba = model.predict_proba(test_df[FEATURES])[:, 1]
    pred = (proba >= .5).astype(int)
    metrics = {
        "accuracy": float(accuracy_score(test_df["is_fraud"], pred)),
        "precision_fraud": float(precision_score(test_df["is_fraud"], pred, zero_division=0)),
        "recall_fraud": float(recall_score(test_df["is_fraud"], pred, zero_division=0)),
        "f1_fraud": float(f1_score(test_df["is_fraud"], pred, zero_division=0)),
        "confusion_matrix_labels_legitimate_fraud": confusion_matrix(test_df["is_fraud"], pred, labels=[0, 1]).tolist(),
        "classification_report": classification_report(test_df["is_fraud"], pred, output_dict=True, zero_division=0),
    }
    out = Path(artifact_dir)
    out.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, out / "fraud_payment_pipeline.joblib", compress=3)
    metadata = {
        "model_version": "payment-fraud-tabular-v1", "selected_classifier": selected,
        "positive_label": "fraud", "threshold": .5, "features": FEATURES,
        "rows": len(df), "class_counts": {str(k): int(v) for k, v in df["is_fraud"].value_counts().items()},
        "test_rows": len(test_df), "candidate_results": results, "metrics": metrics,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "python": platform.python_version(), "scikit_learn": sklearn.__version__,
    }
    (out / "fraud_payment_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in metrics.items() if k != "classification_report"}, indent=2))
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact-dir", type=Path, default=DEFAULT_ARTIFACT_DIR)
    train(parser.parse_args().artifact_dir)
