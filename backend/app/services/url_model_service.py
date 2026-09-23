from pathlib import Path
import sys
from typing import Any

import joblib
import pandas as pd


PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parents[3]
)

URL_FEATURES_PATH = (
    PROJECT_ROOT
    / "notebooks"
    / "URLs"
)

if str(URL_FEATURES_PATH) not in sys.path:
    sys.path.insert(
        0,
        str(URL_FEATURES_PATH),
    )

from url_features import extract_features


MODEL_PATH = (
    PROJECT_ROOT
    / "ml"
    / "artifacts"
    / "url_scam"
    / "url_model.joblib"
)

MODEL_VERSION = "url-model-v1"

_model_artifact: dict[str, Any] | None = None


def _load_model_artifact() -> dict[str, Any]:
    global _model_artifact

    if _model_artifact is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"URL model file does not exist: {MODEL_PATH}"
            )

        _model_artifact = joblib.load(MODEL_PATH)

    return _model_artifact


def predict_url(url: str) -> dict[str, Any]:
    artifact = _load_model_artifact()

    model = artifact["model"]
    feature_columns = artifact["feature_columns"]

    url_features = extract_features(
        pd.Series([url])
    )

    url_features = url_features[
        feature_columns
    ]

    prediction_value = int(
        model.predict(url_features)[0]
    )

    malicious_probability = None

    if hasattr(model, "predict_proba"):
        malicious_probability = float(
            model.predict_proba(
                url_features
            )[0][1]
        )

    prediction = (
        "malicious"
        if prediction_value == 1
        else "legitimate"
    )

    return {
        "prediction": prediction,
        "model_score": malicious_probability,
        "model_version": MODEL_VERSION,
    }