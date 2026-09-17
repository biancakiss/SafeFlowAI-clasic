from pathlib import Path
from email import policy
from email.parser import BytesParser

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "messages"
    / "spamassassin"
)

OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "messages"
    / "spamassassin_emails_loaded.csv"
)

ERROR_PATH = (
    PROJECT_ROOT
    / "data"
    / "rejected"
    / "spamassassin_errors.csv"
)

def get_label(file_path: Path) -> str:
    """
    Determines the label based on parent folder.
    """

    folder_names ={
        part.lower()
        for part in file_path.parts
    }

    legitimate_folders = {
        "easy_ham",
        "hard_ham"
    }

    spam_folders = {
        "spam",
        "spam_2"
    }

    if folder_names.intersection(legitimate_folders):
        return "legitimate"

    if folder_names.intersection(spam_folders):
        return "spam"

    return "unknown"

def extract_body(message) -> str:
    """
    This function extracts the text body from an email.
    """

    if message.is_multipart():
        text_parts=[]

        for part in message.walk():
            if (
                part.get_content_type() == "text/plain"
                and part.get_content_disposition()
                != "attachment"
            ):
                try:
                    content = part.get_content()

                    if isinstance(content, bytes):
                        charset = (
                            part.get_content_charset()
                            or "utf-8"
                        )

                        content = content.decode(
                            charset,
                            errors="replace"
                        )

                    if content:
                        text_parts.append(str(content))

                except Exception:
                    continue

        return "\n".join(text_parts)

    try:
        content = message.get_content()

        if isinstance(content, bytes):
            charset = (
                message.get_content_charset()
                or "utf-8"
            )

            content = content.decode(
                charset,
                errors="replace"
            )

        return str(content)

    except Exception:
        return ""

def parse_email(file_path: Path) -> dict:
    """
    Parses one email file
    """

    with file_path.open("rb") as file:
        message = BytesParser(
            policy= policy.default
        ).parse(file)

    return {
        "file_name": file_path.name,
        "source_folder": file_path.parent.name,
        "sender": message.get("From", ""),
        "receiver": message.get("To", ""),
        "subject": message.get("Subject", ""),
        "date": message.get("Date", ""),
        "body": extract_body(message),
        "label": get_label(file_path),
        "source": "SpamAssassin",
        "message_type": "email"
    }


def save_results(
        records: list[dict],
        errors: list[dict]
) -> None:
    """
    Saves successful results and parsing errors.
    """

    OUTPUT_PATH.parent.mkdir(
        parents= True,
        exist_ok= True
    )

    ERROR_PATH.parent.mkdir(
            parents= True,
            exist_ok= True
    )

    emails_df = pd.DataFrame(records)
    errors_df = pd.DataFrame(errors)

    emails_df.insert(
        0,
        "message_id",
        range(1, len(emails_df) +1)
    )

    emails_df.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8"
    )

    errors_df.to_csv(
        ERROR_PATH,
        index=False,
        encoding="utf-8"
    )


def main() -> None:
    print(
        "SpamAssassin parsing starts here..."
    )

    if not INPUT_PATH.exists():
        raise FileNotFoundError(
            f"Folder does not exist: {INPUT_PATH}"
        )

    records = []
    errors = []

    files = [
        file_path
        for file_path in INPUT_PATH.rglob("*")
        if file_path.is_file()
    ]

    print(f"Files found: {len(files)}")

    for file_path in files:
        label = get_label(file_path)

        if label == "unknown":
            continue

        try:
            record = parse_email(file_path)
            records.append(record)

        except Exception as error:
            errors.append({
                "file_name": str(file_path),
                "error": str(error)
            })

    save_results(records, errors)

    print(
        f"Emails successfully parsed: {len(records)}"
    )

    print(
        f"Parsing errors: {len(errors)}"
    )

    print(
        f"Output saved at: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
