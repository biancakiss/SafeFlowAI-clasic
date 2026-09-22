from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd

from train import FEATURES, DEFAULT_ARTIFACT_DIR


class FraudPaymentClassifier:
    def __init__(self, artifact_dir: str | Path = DEFAULT_ARTIFACT_DIR):
        root = Path(artifact_dir)
        self.pipeline = joblib.load(root / "fraud_payment_pipeline.joblib")
        self.metadata = json.loads((root / "fraud_payment_metadata.json").read_text(encoding="utf-8"))
        self.threshold = float(self.metadata.get("threshold", .5))

    def predict(self, transaction: dict) -> dict:
        missing = [feature for feature in FEATURES if feature not in transaction]
        if missing:
            raise ValueError(f"Missing transaction fields: {', '.join(missing)}")
        row = pd.DataFrame([{feature: transaction[feature] for feature in FEATURES}])
        probability = float(self.pipeline.predict_proba(row)[0, 1])
        return {
            "label": "fraud" if probability >= self.threshold else "legitimate",
            "fraud_probability": round(probability, 6),
            "model_version": self.metadata.get("model_version", "unknown"),
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("transaction_json", help="JSON object containing the model features")
    parser.add_argument("--artifact-dir", type=Path, default=DEFAULT_ARTIFACT_DIR)
    args = parser.parse_args()
    print(json.dumps(FraudPaymentClassifier(args.artifact_dir).predict(json.loads(args.transaction_json)), indent=2))
