from pathlib import Path
import json

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


INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "urls"
    / "corrected_preprocessed_urls.csv"
)


ARTIFACTS_DIRECTORY = (
    PROJECT_ROOT
    / "ml"
    / "artifacts"
)


MODEL_PATH = (
    ARTIFACTS_DIRECTORY
    / "url_model.joblib"
)


METADATA_PATH = (
    ARTIFACTS_DIRECTORY
    / "metadata.json"
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


def load_dataset() -> pd.DataFrame:
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

    return df


def clean_dataset(
    df: pd.DataFrame,
) -> pd.DataFrame:
    df = df.copy()

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

    unique_labels = set(
        df[TARGET_COLUMN].unique()
    )

    if not unique_labels.issubset({0, 1}):
        raise ValueError(
            "The status column must contain only 0 and 1."
        )

    return df


def prepare_features(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.Series]:
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

    return X, y


def save_artifacts(
    model: RandomForestClassifier,
    report: dict,
) -> None:
    ARTIFACTS_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True
    )

    artifact = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "url_column": URL_COLUMN,
        "target_column": TARGET_COLUMN,
        "label_mapping": {
            "0": "legitimate",
            "1": "malicious",
        },
    }

    joblib.dump(
        artifact,
        MODEL_PATH
    )

    metadata = {
        "model_name": "RandomForestClassifier",
        "model_type": "malicious_url_detection",
        "model_file": MODEL_PATH.name,
        "input_file": INPUT_PATH.name,
        "url_column": URL_COLUMN,
        "target_column": TARGET_COLUMN,
        "feature_columns": FEATURE_COLUMNS,
        "label_mapping": {
            "0": "legitimate",
            "1": "malicious",
        },
        "training_parameters": {
            "n_estimators": 100,
            "random_state": 42,
            "class_weight": "balanced",
        },
        "metrics": {
            "accuracy": report["accuracy"],
            "legitimate_precision": report[
                "legitimate"
            ]["precision"],
            "legitimate_recall": report[
                "legitimate"
            ]["recall"],
            "legitimate_f1_score": report[
                "legitimate"
            ]["f1-score"],
            "malicious_precision": report[
                "malicious"
            ]["precision"],
            "malicious_recall": report[
                "malicious"
            ]["recall"],
            "malicious_f1_score": report[
                "malicious"
            ]["f1-score"],
        },
    }

    with open(
        METADATA_PATH,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            metadata,
            file,
            indent=4
        )

    print(
        f"Model saved to: {MODEL_PATH}"
    )

    print(
        f"Metadata saved to: {METADATA_PATH}"
    )


def main() -> None:
    print("Loading URL dataset...")

    df = load_dataset()

    print(
        f"Initial dataset size: {len(df)}"
    )

    df = clean_dataset(df)

    print(
        f"Dataset size after cleaning: {len(df)}"
    )

    X, y = prepare_features(df)

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

    report = classification_report(
        y_test,
        predictions,
        target_names=[
            "legitimate",
            "malicious"
        ],
        output_dict=True,
        zero_division=0
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

    save_artifacts(
        model=model,
        report=report
    )

    print(
        "\nTraining completed successfully."
    )


if __name__ == "__main__":
    main()