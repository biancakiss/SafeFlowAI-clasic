from typing import Any

from ..risk_engine.url_features import build_url_features


MODEL_VERSION = "temporary-url-model-v1"


def predict_url(url: str) -> dict[str, Any]:
    """
    Temporary rule-based URL model adapter.

    This adapter follows the same output contract that the real
    machine-learning model will use later.
    """

    features = build_url_features(url)

    strong_suspicious_signals = [
        features["uses_ip_address"],
        features["uses_url_shortener"],
        features["uses_punycode"],
        features["contains_suspicious_keyword"],
    ]

    suspicious_signal_count = sum(
        int(signal)
        for signal in strong_suspicious_signals
    )

    is_suspicious = suspicious_signal_count > 0

    if is_suspicious:
        model_score = min(
            0.99,
            0.75 + 0.05 * (suspicious_signal_count - 1),
        )
        prediction = "suspicious"
    else:
        model_score = 0.05
        prediction = "safe"

    return {
        "prediction": prediction,
        "model_score": round(model_score, 6),
        "model_version": MODEL_VERSION,
    }