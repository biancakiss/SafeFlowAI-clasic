from math import exp
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

MODEL_VERSION = "email-spam-284d7de725b7"


@lru_cache(maxsize=1)
def load_email_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Email model not found: {MODEL_PATH}"
        )

    return joblib.load(MODEL_PATH)


def prepare_email_text(
    subject: str | None,
    body: str,
) -> str:
    text = f"{subject or ''} {body}"

    text = unicodedata.normalize(
        "NFKC",
        text,
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def predict_email(
    subject: str | None,
    body: str,
) -> dict:
    model = load_email_model()

    text = prepare_email_text(
        subject,
        body,
    )

    if not text:
        raise ValueError(
            "Email does not contain usable text"
        )

    predicted_value = model.predict([text])[0]

    decision_margin = float(
        model.decision_function([text])[0]
    )

    if str(predicted_value) in {
        "1",
        "spam",
    }:
        predicted_class = "spam"
    else:
        predicted_class = "legitimate"

    # Transformare tehnica intr-un scor 0-100.
    # Nu este o probabilitate calibrata.
    bounded_margin = max(
        -20,
        min(20, decision_margin),
    )

    spam_score = 1 / (
        1 + exp(-bounded_margin)
    )

    risk_score = round(
        spam_score * 100
    )

    return {
        "predicted_class": predicted_class,
        "decision_margin": decision_margin,
        "risk_score": risk_score,
        "model_version": MODEL_VERSION,
        "preprocessing_version": "email-text-v1",
    }