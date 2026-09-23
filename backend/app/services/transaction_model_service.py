from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = PROJECT_ROOT / "ml" / "artifacts" / "transactions"


class TransactionModelService:
    def __init__(self, artifact_dir: str | Path = ARTIFACT_DIR):
        artifact_path = Path(artifact_dir)

        self.pipeline = joblib.load(
            artifact_path / "fraud_payment_pipeline.joblib"
        )

        # Avoid spawning worker processes during inference on Windows.
        # The serialized RandomForest is trained with n_jobs=-1, which can
        # raise WinError 5 when the API is running under Uvicorn reload.
        if hasattr(self.pipeline, "set_params"):
            self.pipeline.set_params(classifier__n_jobs=1)

        self.metadata = json.loads(
            (artifact_path / "fraud_payment_metadata.json").read_text(
                encoding="utf-8"
            )
        )

        self.features = self.metadata["features"]
        self.threshold = float(
            self.metadata.get("threshold", 0.5)
        )

    def predict(
        self,
        transaction_features: dict[str, Any],
    ) -> dict[str, Any]:
        missing_features = [
            feature
            for feature in self.features
            if feature not in transaction_features
        ]

        if missing_features:
            raise ValueError(
                "Missing transaction model features: "
                + ", ".join(missing_features)
            )

        row = pd.DataFrame(
            [
                {
                    feature: transaction_features[feature]
                    for feature in self.features
                }
            ]
        )

        fraud_probability = float(
            self.pipeline.predict_proba(row)[0, 1]
        )

        return {
            "predicted_class": (
                "fraud"
                if fraud_probability >= self.threshold
                else "legitimate"
            ),
            "model_score": round(fraud_probability, 6),
            "model_version": self.metadata.get(
                "model_version",
                "unknown",
            ),
        }


_transaction_model_service = TransactionModelService()


def predict_transaction(
    transaction_features: dict[str, Any],
) -> dict[str, Any]:
    return _transaction_model_service.predict(
        transaction_features
    )
