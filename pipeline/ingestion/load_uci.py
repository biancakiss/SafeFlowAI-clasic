from pathlib import Path

import pandas as pd

INPUT_PATH = Path(
    "data/raw/messages/uci_sms/SMSSpamCollection.tsv"
)

OUTPUT_PATH = Path(
     "data/processed/messages/uci_messages_loaded.csv"
)

ERROR_PATH = Path(
    "data/rejected/uci_messages_rejected.csv"
)

def load_uci_data() -> pd.DataFrame:
    """
    This function is meant to read the UCI SMS data set
    """

    df = pd.read_csv(
        INPUT_PATH,
        sep="\t",
        header=None,
        names=["label", "body"],
        encoding= "utf-8"
    )

    return df

def validate_uci_data(df: pd.DataFrame) -> None:
    """
    THis function is meant to verify is the dataframe has the required structure
    """

    required_columns = {"label", "body"}

    missing_columns = (
            required_columns - set(df.columns)
        )

    if missing_columns:
        raise ValueError("These columns are missing: {missing_columns}")

    if df.empty:
        raise ValueError("The dataset is empty!")

    allowed_labels = {"ham", "spam"}

    invalid_labels = set(df["label"].dropna()) - allowed_labels

    if invalid_labels:
        raise ValueError(
            f"There are unknown labels: {invalid_labels}"
        )

def add_uci_metadata(
    df: pd.DataFrame
) -> pd.DataFrame:
    """
    This function adds information that helps us identify the source.
    """

    df = df.copy()

    df.insert(
        0,
        "message_id",
        range(1, len(df) + 1)
    )

    df["source"] = "UCI"
    df["message_type"] = "sms"

    df["label"] = df["label"].replace({
        "ham": "legitimate",
        "spam": "spam"
    })

    return df[
        [
            "message_id",
            "source",
            "message_type",
            "label",
            "body"
        ]
    ]

def save_data(df: pd.DataFrame) -> None:
    """
    This function saves data in a CSV file.
    """

    OUTPUT_PATH.parent.mkdir(
        parents = True,
        exist_ok= True
    )

    df.to_csv(
        OUTPUT_PATH,
        index= False,
        encoding="utf-8"
    )

def main() -> None:
    print("Dataset Download starts here...")

    df=load_uci_data()

    print(f"ROws read: {len(df)}")

    validate_uci_data(df)

    df = add_uci_metadata(df)

    save_data(df)

    print(
        f"Dataset saved at: {OUTPUT_PATH}"
    )

    print("\n Class distribution:")
    print(df["label"].value_counts())



if __name__ == "__main__":
        main()