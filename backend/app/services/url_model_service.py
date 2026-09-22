from typing import Any


def predict_url(url: str) -> dict[str, Any]:
    """
    Temporary URL model adapter.
    It will be replaced when the real model is available.
    """

    return {
        "prediction": "safe",
        "model_score": None,
        "model_version": (
            "temporary-url-model-v1"
        ),
    }