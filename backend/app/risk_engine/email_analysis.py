from typing import Any

from .content_features import build_content_features
from .content_scoring import calculate_content_risk
from .email_model import predict_email


def analyze_email(
    subject: str | None,
    body: str,
) -> dict[str, Any]:
    """
    Runs the email model and calculates the contextual risk.
    """

    ml_prediction = predict_email(
        subject=subject,
        body=body,
    )

    content_features = build_content_features(
        subject=subject or "",
        body=body,
    )

    ml_result = {
        "prediction": ml_prediction["prediction"],
        "spam_score": ml_prediction["spam_score"],
        "score_type": ml_prediction["score_type"],
    }

    risk_result = calculate_content_risk(
        ml_result=ml_result,
        content_features=content_features,
    )

    return {
        "ml_result": ml_result,
        "content_features": content_features,
        "risk_result": risk_result,
    }