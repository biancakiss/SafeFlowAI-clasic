from __future__ import annotations

import argparse
import json
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sms_features import SmsPatternFeatures
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix, f1_score, precision_score,
                             recall_score)
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import ComplementNB
from sklearn.pipeline import Pipeline, FeatureUnion

DEFAULT_CSV_PATH = PROJECT_ROOT / "data" / "processed" / "messages" / "uci_messages_cleaned.csv"
DEFAULT_AUGMENTATION_PATH = PROJECT_ROOT / "data" / "processed" / "messages" / "sms_training_augmentation.csv"
DEFAULT_ARTIFACT_DIR = PROJECT_ROOT / "ml" / "artifacts" / "sms_spam"

def load_sms_csv(path: str | Path) -> pd.DataFrame:
    raw = pd.read_csv(path, encoding="utf-8")
    aliases = {
        "v1": "target",
        "v2": "message",
        "label": "target",
        "body": "message",
    }
    raw = raw.rename(columns=aliases)
    missing = {"target", "message"} - set(raw.columns)
    if missing:
        raise ValueError(
            "CSV must contain target/message, v1/v2, or label/body columns; "
            f"missing {sorted(missing)}"
        )
    df = raw[["target", "message"]].dropna().copy()
    df["message"] = df["message"].astype(str).str.strip()
    df["target"] = df["target"].astype(str).str.strip().str.lower()
    df = df[df["message"].ne("")]
    df["target"] = df["target"].replace({"0": "ham", "1": "spam", "legitimate": "ham"})
    if not set(df["target"]).issubset({"ham", "spam"}):
        raise ValueError("Labels must be legitimate/spam, ham/spam, or 0/1")
    return df.drop_duplicates(subset=["message", "target"]).reset_index(drop=True)

def make_pipeline(classifier: object | None = None) -> Pipeline:
    features = FeatureUnion([
        ("word", TfidfVectorizer(lowercase=True, ngram_range=(1, 2), min_df=1, sublinear_tf=True, max_features=100000)),
        ("char", TfidfVectorizer(analyzer="char", ngram_range=(3, 5), min_df=1, sublinear_tf=True, max_features=100000)),
        ("patterns", SmsPatternFeatures()),
        ])
    if classifier is None:
        classifier = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)
    return Pipeline([
        ("features", features),
        ("classifier", classifier),
    ])


def candidate_pipelines() -> dict[str, Pipeline]:
    return {
        "logistic_regression": make_pipeline(
            LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)
        ),
        "sgd_log_loss": make_pipeline(
            SGDClassifier(loss="log_loss", class_weight="balanced", max_iter=2000, tol=1e-4, random_state=42)
        ),
        "complement_naive_bayes": make_pipeline(ComplementNB(alpha=0.5)),
    }


def predictions_at_threshold(probabilities: np.ndarray, threshold: float) -> np.ndarray:
    return np.where(probabilities >= threshold, "spam", "ham")


def choose_threshold(y_true: pd.Series, probabilities: np.ndarray) -> tuple[float, dict[str, float]]:
    candidates: list[tuple[float, float, float, float, float]] = []
    for threshold in np.arange(0.15, 0.701, 0.025):
        predictions = predictions_at_threshold(probabilities, float(threshold))
        candidates.append(
            (
                float(f1_score(y_true, predictions, pos_label="spam")),
                float(accuracy_score(y_true, predictions)),
                float(precision_score(y_true, predictions, pos_label="spam", zero_division=0)),
                float(recall_score(y_true, predictions, pos_label="spam")),
                float(threshold),
            )
        )
    f1, accuracy, precision, recall, threshold = max(candidates)
    return threshold, {
        "accuracy": accuracy,
        "precision_spam": precision,
        "recall_spam": recall,
        "f1_spam": f1,
    }


def train(
    csv: str | Path = DEFAULT_CSV_PATH,
    artifact_dir: str | Path = DEFAULT_ARTIFACT_DIR,
    augmentation_csv: str | Path | None = DEFAULT_AUGMENTATION_PATH,
) -> dict:
    df = load_sms_csv(csv)
    train_validation, test = train_test_split(
        df, test_size=0.15, random_state=42, stratify=df["target"]
    )
    training, validation = train_test_split(
        train_validation,
        test_size=0.1764705882,
        random_state=42,
        stratify=train_validation["target"],
    )

    augmentation_rows = 0
    if augmentation_csv is not None:
        augmentation = load_sms_csv(augmentation_csv)
        overlap = set(augmentation["message"]) & set(df["message"])
        if overlap:
            raise ValueError("Training augmentation contains messages from the source corpus")
        augmentation_rows = len(augmentation)
        candidate_training = pd.concat([training, augmentation], ignore_index=True)
    else:
        candidate_training = training

    candidate_results: dict[str, dict[str, float]] = {}
    fitted_candidates: dict[str, Pipeline] = {}
    for name, candidate in candidate_pipelines().items():
        candidate.fit(candidate_training["message"], candidate_training["target"])
        spam_index = list(candidate.classes_).index("spam")
        validation_probabilities = candidate.predict_proba(validation["message"])[:, spam_index]
        threshold, validation_metrics = choose_threshold(validation["target"], validation_probabilities)
        candidate_results[name] = {"threshold": threshold, **validation_metrics}
        fitted_candidates[name] = candidate

    selected_name = max(
        candidate_results,
        key=lambda name: (
            candidate_results[name]["f1_spam"],
            candidate_results[name]["accuracy"],
        ),
    )
    threshold = candidate_results[selected_name]["threshold"]
    final_training = pd.concat([train_validation, augmentation], ignore_index=True) if augmentation_csv is not None else train_validation
    pipeline = candidate_pipelines()[selected_name]
    pipeline.fit(final_training["message"], final_training["target"])

    x_test, y_test = test["message"], test["target"]
    spam_index = list(pipeline.classes_).index("spam")
    probabilities = pipeline.predict_proba(x_test)[:, spam_index]
    predictions = predictions_at_threshold(probabilities, threshold)
    metrics = {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision_spam": float(precision_score(y_test, predictions, pos_label="spam")),
        "recall_spam": float(recall_score(y_test, predictions, pos_label="spam")),
        "f1_spam": float(f1_score(y_test, predictions, pos_label="spam")),
        "confusion_matrix_labels_ham_spam": confusion_matrix(y_test, predictions, labels=["ham", "spam"]).tolist(),
        "classification_report": classification_report(y_test, predictions, output_dict=True),
        "probability_examples": [float(x) for x in probabilities[:5]],
    }
    out = Path(artifact_dir)
    out.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, out / "sms_spam_pipeline.joblib", compress=3)
    metadata = {
        "model_version": "sms-tfidf-patterns-v2",
        "selected_classifier": selected_name,
        "positive_label": "spam",
        "threshold": threshold,
        "classes": list(pipeline.classes_),
        "n_rows": int(len(df)),
        "augmentation_rows": augmentation_rows,
        "split_rows": {
            "training": int(len(training)),
            "validation": int(len(validation)),
            "test": int(len(test)),
        },
        "class_counts": {str(k): int(v) for k, v in df["target"].value_counts().items()},
        "candidate_validation_results": candidate_results,
        "metrics": metrics,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "python": platform.python_version(),
        "scikit_learn": sklearn.__version__,
    }
    (out / "sms_spam_metadata.json").write_text(
        json.dumps(metadata, indent=2, default=float), encoding="utf-8"
    )
    print(json.dumps({k: v for k, v in metrics.items() if k != "classification_report"}, indent=2))
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV_PATH)
    parser.add_argument("--artifact-dir", type=Path, default=DEFAULT_ARTIFACT_DIR)
    parser.add_argument("--augmentation-csv", type=Path, default=DEFAULT_AUGMENTATION_PATH)
    parser.add_argument("--no-augmentation", action="store_true")
    args = parser.parse_args()
    train(
        args.csv,
        args.artifact_dir,
        None if args.no_augmentation else args.augmentation_csv,
    )
