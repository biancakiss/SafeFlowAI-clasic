from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
SMS_DIR = PROJECT_ROOT / "notebooks" / "SMS"
for import_path in (SMS_DIR, PROJECT_ROOT):
    if str(import_path) not in sys.path:
        sys.path.insert(0, str(import_path))

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix


DATASET_PATH = Path(__file__).with_name("synthetic_sms.csv")
ARTIFACT_DIR = PROJECT_ROOT / "ml" / "artifacts" / "sms_spam"
TRAINING_DATA_PATH = (
    PROJECT_ROOT / "data" / "processed" / "messages" / "uci_messages_cleaned.csv"
)
AUGMENTATION_DATA_PATH = (
    PROJECT_ROOT / "data" / "processed" / "messages" / "sms_training_augmentation.csv"
)


def main() -> None:
    evaluation = pd.read_csv(DATASET_PATH)
    training = pd.read_csv(TRAINING_DATA_PATH)
    augmentation = pd.read_csv(AUGMENTATION_DATA_PATH)
    pipeline = joblib.load(ARTIFACT_DIR / "sms_spam_pipeline.joblib")
    metadata = json.loads(
        (ARTIFACT_DIR / "sms_spam_metadata.json").read_text(encoding="utf-8")
    )

    expected = evaluation["label"].replace({"legitimate": "ham"})
    spam_index = list(pipeline.classes_).index("spam")
    probabilities = pipeline.predict_proba(evaluation["body"])[:, spam_index]
    threshold = float(metadata.get("threshold", 0.5))
    predicted = pd.Series(
        ["spam" if probability >= threshold else "ham" for probability in probabilities],
        index=evaluation.index,
    )

    training_messages = set(training["body"]) | set(augmentation["body"])
    overlap = len(set(evaluation["body"]) & training_messages)
    print(f"Model: {metadata.get('model_version', 'unknown')}")
    print(f"Threshold: {threshold}")
    print(f"Rows: {len(evaluation)}")
    print(f"Exact message overlap with all training data: {overlap}")
    print("Confusion matrix (rows=true, columns=predicted; order=ham, spam):")
    print(confusion_matrix(expected, predicted, labels=["ham", "spam"]))
    print(classification_report(expected, predicted, digits=4))

    errors = evaluation.loc[expected.ne(predicted), ["message_id", "label", "body"]].copy()
    errors["predicted"] = predicted[expected.ne(predicted)]
    errors["spam_probability"] = probabilities[expected.ne(predicted)].round(6)
    print("Misclassifications:")
    print(errors.to_string(index=False))


if __name__ == "__main__":
    main()
