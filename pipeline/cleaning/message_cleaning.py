from pathlib import Path
import re

import pandas as pd
from bs4 import BeautifulSoup


PROJECT_ROOT = Path(__file__).resolve().parents[2]

UCI_INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "messages"
    / "uci_messages_loaded.csv"
)

SPAMASSASSIN_INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "messages"
    / "spamassassin_emails_loaded.csv"
)

UCI_OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "messages"
    / "uci_messages_cleaned.csv"
)

SPAMASSASSIN_OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "messages"
    / "spamassassin_emails_cleaned.csv"
)


def clean_text(text: str | None) -> str:
    """
    Cleans a text message or email content.
    """

    if not text:
        return ""

    text = BeautifulSoup(
        str(text),
        "html.parser",
    ).get_text(" ")

    text = text.lower()
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def clean_uci_dataset() -> pd.DataFrame:
    """
    Loads and cleans the UCI SMS dataset.
    """

    df_uci = pd.read_csv(UCI_INPUT_PATH)

    df_uci["body"] = (
        df_uci["body"]
        .fillna("")
        .apply(clean_text)
    )

    df_uci = df_uci[
        df_uci["body"] != ""
    ].copy()

    df_uci = df_uci.drop_duplicates(
        subset=["body"]
    )

    df_uci["text"] = df_uci["body"]

    df_uci.to_csv(
        UCI_OUTPUT_PATH,
        index=False,
        encoding="utf-8",
    )

    return df_uci


def clean_spamassassin_dataset() -> pd.DataFrame:
    """
    Loads and cleans the SpamAssassin email dataset.
    """

    df_spamassassin = pd.read_csv(
        SPAMASSASSIN_INPUT_PATH
    )

    df_spamassassin["sender"] = (
        df_spamassassin["sender"]
        .fillna("unknown")
    )

    df_spamassassin["receiver"] = (
        df_spamassassin["receiver"]
        .fillna("unknown")
    )

    df_spamassassin["subject"] = (
        df_spamassassin["subject"]
        .fillna("")
        .apply(clean_text)
    )

    df_spamassassin["body"] = (
        df_spamassassin["body"]
        .fillna("")
        .apply(clean_text)
    )

    df_spamassassin["text"] = (
        df_spamassassin["subject"]
        + " "
        + df_spamassassin["body"]
    ).str.strip()

    df_spamassassin = df_spamassassin[
        df_spamassassin["text"] != ""
    ].copy()

    df_spamassassin = df_spamassassin.drop_duplicates(
        subset=["text"]
    )

    df_spamassassin.to_csv(
        SPAMASSASSIN_OUTPUT_PATH,
        index=False,
        encoding="utf-8",
    )

    return df_spamassassin


def main() -> None:
    """
    Cleans both message datasets and saves the results.
    """

    print("Message cleaning started.")

    if not UCI_INPUT_PATH.exists():
        raise FileNotFoundError(
            f"UCI input file not found: {UCI_INPUT_PATH}"
        )

    if not SPAMASSASSIN_INPUT_PATH.exists():
        raise FileNotFoundError(
            "SpamAssassin input file not found: "
            f"{SPAMASSASSIN_INPUT_PATH}"
        )

    df_uci = clean_uci_dataset()
    df_spamassassin = clean_spamassassin_dataset()

    print(
        f"UCI messages after cleaning: {len(df_uci)}"
    )

    print(
        "SpamAssassin emails after cleaning: "
        f"{len(df_spamassassin)}"
    )

    print(
        f"UCI output saved at: {UCI_OUTPUT_PATH}"
    )

    print(
        "SpamAssassin output saved at: "
        f"{SPAMASSASSIN_OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()