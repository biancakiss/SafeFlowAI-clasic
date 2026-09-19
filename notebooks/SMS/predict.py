from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SMS_DIR = Path(__file__).resolve().parent
for import_path in (SMS_DIR, PROJECT_ROOT):
    if str(import_path) not in sys.path:
        sys.path.insert(0, str(import_path))

import joblib

DEFAULT_ARTIFACT_DIR = PROJECT_ROOT / "ml" / "artifacts" / "sms_spam"


class SmsClassifier:
    def __init__(self, artifact_dir: str | Path = DEFAULT_ARTIFACT_DIR):
        root = Path(artifact_dir)
        self.pipeline = joblib.load(root / "sms_spam_pipeline.joblib")
        self.metadata = json.loads(
            (root / "sms_spam_metadata.json").read_text(encoding="utf-8")
        )
        self.threshold = float(self.metadata.get("threshold", 0.5))
        self.version = self.metadata.get("model_version","unknown")

    def predict(self, message: str) -> dict:
        if not isinstance(message, str) or not message.strip():
            raise ValueError("Message must not be empty")
        spam_index = list(self.pipeline.classes_).index("spam")
        spam_probability = float(self.pipeline.predict_proba([message])[0, spam_index])
        return {
            "label": "spam" if spam_probability >= self.threshold else "ham",
            "spam_probability": round(spam_probability, 6),
            "model_version": self.version,
        }


# Backward-compatible name for existing imports.
SMSClassifier = SmsClassifier
