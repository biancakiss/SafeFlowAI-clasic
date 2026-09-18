from typing import Any

from ..services.sms_model_service import (
    predict_sms,
)
from .content_scoring import (
    calculate_content_risk,
)


def analyze_sms(
    body: str,
) -> dict[str, Any]:
    prediction = predict_sms(body)

    ml_result = {
        "prediction": prediction[
            "predicted_class"
        ],
        "spam_probability": prediction[
            "spam_probability"
        ],
        "model_score": prediction[
            "model_score"
        ],
        "score_type": prediction[
            "score_type"
        ],
        "model_version": prediction[
            "model_version"
        ],
    }

    content_features = prediction[
        "content_features"
    ]

    risk_result = calculate_content_risk(
        ml_result=ml_result,
        content_features=content_features,
    )

    return {
        "ml_result": ml_result,
        "content_features": content_features,
        "risk_result": risk_result,
        "cleaned_text": prediction.get(
            "cleaned_text"
        ),
    }