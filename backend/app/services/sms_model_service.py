from functools import lru_cache
from typing import Any

from notebooks.SMS.predict import (
    SmsClassifier,
)

from ..risk_engine.content_features import (
    build_content_features,
)
from .message_cleaner import clean_text


@lru_cache(maxsize=1)
def load_sms_model() -> SmsClassifier:
    """
    Load SMS classifier once and reuse it.
    """
    return SmsClassifier()


def predict_sms(body: str) -> dict[str, Any]:
    """
    Adapt SMS classifier to the risk engine contract.
    """
    cleaned_body = clean_text(body)

    if not cleaned_body:
        raise ValueError(
            "SMS does not contain usable text"
        )

    classifier = load_sms_model()
    model_result = classifier.predict(
        cleaned_body
    )

    predicted_class = (
        "spam"
        if model_result["label"] == "spam"
        else "legitimate"
    )

    content_features = build_content_features(
        subject="",
        body=cleaned_body,
    )

    return {
        "predicted_class": predicted_class,
        "spam_probability": model_result[
            "spam_probability"
        ],
        "model_score": model_result[
            "spam_probability"
        ],
        "score_type": "probability",
        "model_version": model_result[
            "model_version"
        ],
        "preprocessing_version": (
            "message-text-v1"
        ),
        "content_features": content_features,
        "cleaned_text": cleaned_body,
    }