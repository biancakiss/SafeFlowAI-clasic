from pathlib import Path
import sys

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split


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


INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "urls"
    / "corrected_preprocessed_urls.csv"
)

MODEL_PATH = (
    PROJECT_ROOT
    / "ml"
    / "artifacts"
    / "url_model.joblib"
)

URL_COLUMN = "url"
TARGET_COLUMN = "status"

FEATURE_COLUMNS = [
    "url_length",
    "num_digits",
    "digit_ratio",
    "special_char_ratio",
    "num_hyphens",
    "num_underscores",
    "num_slashes",
    "num_dots",
    "num_question_marks",
    "num_equals",
    "num_at_symbols",
    "num_percent",
    "num_hashes",
    "num_ampersands",
    "num_subdomains",
    "is_https",
    "has_suspicious_word",
]


def main() -> None:
    if not INPUT_PATH.exists():
        raise FileNotFoundError(
            f"Input file does not exist: {INPUT_PATH}"
        )

    df = pd.read_csv(
        INPUT_PATH,
        encoding="utf-8"
    )

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
    )

    required_columns = (
        [URL_COLUMN, TARGET_COLUMN]
        + FEATURE_COLUMNS
    )

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing columns: {missing_columns}"
        )

    df[URL_COLUMN] = (
        df[URL_COLUMN]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    df = df[
        df[URL_COLUMN] != ""
    ].copy()

    df = df.drop_duplicates(
        subset=[URL_COLUMN]
    ).copy()

    df[TARGET_COLUMN] = pd.to_numeric(
        df[TARGET_COLUMN],
        errors="coerce"
    )

    df = df.dropna(
        subset=[TARGET_COLUMN]
    ).copy()

    df[TARGET_COLUMN] = (
        df[TARGET_COLUMN]
        .astype(int)
    )

    if not set(
        df[TARGET_COLUMN].unique()
    ).issubset({0, 1}):
        raise ValueError(
            "The status column must contain only 0 and 1."
        )

    X = df[FEATURE_COLUMNS].copy()

    X["has_suspicious_word"] = (
        X["has_suspicious_word"]
        .astype(int)
    )

    X = X.apply(
        pd.to_numeric,
        errors="coerce"
    )

    X = X.fillna(0)

    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y
        )
    )

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    )

    print("Training Random Forest model...")

    model.fit(
        X_train,
        y_train
    )

    predictions = model.predict(
        X_test
    )

    print("\nModel evaluation:")
    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                "legitimate",
                "malicious"
            ],
            zero_division=0
        )
    )

    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    artifact = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "url_column": URL_COLUMN,
        "target_column": TARGET_COLUMN,
        "label_mapping": {
            0: "legitimate",
            1: "malicious",
        },
    }

    joblib.dump(
        artifact,
        MODEL_PATH
    )

    print(
        f"Model saved to: {MODEL_PATH}"
    )


if __name__ == "__main__":
    main()