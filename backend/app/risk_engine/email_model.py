from functools import lru_cache
from pathlib import Path
import re
import unicodedata

import joblib


PROJECT_ROOT = Path(__file__).resolve().parents[3]

MODEL_PATH = (
    PROJECT_ROOT
    / "ml"
    / "artifacts"
    / "email_spam"
    / "pipeline.joblib"
)

MODEL_VERSION = "email-spam-model-v1"


def normalize_text(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        unicodedata.normalize(
            "NFKC",
            value,
        ),
    ).strip()


def build_email_text(
    subject: str,
    body: str,
) -> str:
    if not isinstance(subject, str):
        raise TypeError(
            "Subject must be a string."
        )

    if not isinstance(body, str):
        raise TypeError(
            "Body must be a string."
        )

    text = (
        f"{normalize_text(subject)} "
        f"{normalize_text(body)}"
    ).strip()

    if not text:
        raise ValueError(
            "Email subject or body cannot be empty."
        )

    return text


@lru_cache(maxsize=1)
def load_email_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Email model not found: {MODEL_PATH}"
        )

    return joblib.load(MODEL_PATH)


def predict_email(
    subject: str,
    body: str,
) -> dict:
    model = load_email_model()

    text = build_email_text(
        subject,
        body,
    )

    predicted_label = int(
        model.predict([text])[0]
    )

    decision_margin = float(
        model.decision_function([text])[0]
    )

    predicted_class = (
        "spam"
        if predicted_label == 1
        else "legitimate"
    )

    return {
        "prediction": predicted_class,

        "spam_score": decision_margin,

        "model_score": decision_margin,

        "score_type": "decision_margin",

        "model_version": MODEL_VERSION,

        "preprocessing_version": (
            "email-text-v1"
        ),

        "cleaned_text": text,
    }