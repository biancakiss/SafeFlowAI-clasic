from pathlib import Path
import re
import unicodedata

import joblib


PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "ml/artifacts/email_spam/pipeline.joblib"


def normalize_text(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        unicodedata.normalize("NFKC", value),
    ).strip()


def build_email_text(subject: str, body: str) -> str:
    if not isinstance(subject, str) or not isinstance(body, str):
        raise TypeError("Subject and body must be strings.")

    text = f"{normalize_text(subject)} {normalize_text(body)}"

    if not text.strip():
        raise ValueError("Email subject or body cannot be empty.")

    return text


def predict_email(subject: str, body: str) -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Email model not found: {MODEL_PATH}")

    model = joblib.load(MODEL_PATH)
    text = build_email_text(subject, body)

    predicted_label = int(model.predict([text])[0])
    decision_margin = float(model.decision_function([text])[0])

    return {
        "prediction": "spam" if predicted_label == 1 else "legitimate",
        "spam_score": decision_margin,
        "score_type": "decision_margin",
    }