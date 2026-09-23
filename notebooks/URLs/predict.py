from pathlib import Path
import sys

import joblib
import pandas as pd


PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parents[2]
)

sys.path.insert(
    0,
    str(
        PROJECT_ROOT
        / "notebooks"
        / "URLs"
    )
)

from url_features import extract_features


MODEL_PATH = (
    PROJECT_ROOT
    / "ml"
    / "artifacts"
    / "url_model.joblib"
)


def predict_url(url: str) -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file does not exist: {MODEL_PATH}"
        )

    artifact = joblib.load(
        MODEL_PATH
    )

    model = artifact["model"]
    feature_columns = artifact[
        "feature_columns"
    ]

    url_features = extract_features(
        pd.Series([url])
    )

    url_features = url_features[
        feature_columns
    ]

    prediction = int(
        model.predict(url_features)[0]
    )

    malicious_probability = None

    if hasattr(model, "predict_proba"):
        malicious_probability = float(
            model.predict_proba(
                url_features
            )[0][1]
        )

    label = (
        "malicious"
        if prediction == 1
        else "legitimate"
    )

    return {
        "url": url,
        "label": label,
        "is_malicious": bool(prediction),
        "malicious_probability": malicious_probability,
    }


if __name__ == "__main__":
    input_url = input(
        "Enter URL to analyze: "
    ).strip()

    result = predict_url(
        input_url
    )

    print("\nPrediction result:")
    print(result)