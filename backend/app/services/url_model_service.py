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

MODEL_PATH = (
    PROJECT_ROOT
    / "ml"
    / "artifacts"
    / "url_scam"
    / "url_model.joblib"
)

URL_FEATURES_PATH = (
    PROJECT_ROOT
    / "notebooks"
    / "URLs"
)

sys.path.insert(
    0,
    str(URL_FEATURES_PATH),
)

from url_features import extract_features


_model_artifact: dict[str, Any] | None = None


def load_url_model() -> dict[str, Any]:
    global _model_artifact

    if _model_artifact is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"URL model not found: {MODEL_PATH}"
            )

        loaded_artifact = joblib.load(MODEL_PATH)

        if isinstance(loaded_artifact, dict):
            _model_artifact = loaded_artifact
        else:
            _model_artifact = {
                "model": loaded_artifact,
                "feature_columns": [],
            }

    return _model_artifact


def predict_url(url: str) -> dict[str, Any]:
    artifact = load_url_model()

    model = artifact["model"]
    feature_columns = artifact.get(
        "feature_columns",
        [],
    )

    extracted_features = extract_features([url])

    if isinstance(
        extracted_features,
        pd.DataFrame,
    ):
        features = extracted_features.copy()
    else:
        features = pd.DataFrame(
            extracted_features
        )

    if feature_columns:
        for column in feature_columns:
            if column not in features.columns:
                features[column] = 0

        features = features[
            feature_columns
        ]

    features = features.apply(
        pd.to_numeric,
        errors="coerce",
    ).fillna(0)

    prediction_value = model.predict(
        features
    )[0]

    malicious_probability = None

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(
            features
        )[0]

        classes = list(model.classes_)

        if 1 in classes:
            malicious_index = classes.index(1)
            malicious_probability = float(
                probabilities[malicious_index]
            )

    if int(prediction_value) == 1:
        prediction = "malicious"
    else:
        prediction = "safe"

    return {
        "prediction": prediction,
        "model_score": malicious_probability,
        "model_version": "url-random-forest-v1",
    }