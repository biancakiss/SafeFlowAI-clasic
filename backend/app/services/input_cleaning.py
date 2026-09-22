import re
import unicodedata

from bs4 import BeautifulSoup


ALLOWED_MESSAGE_TYPES = {
    "sms",
    "email"
}


def clean_text(text: str | None) -> str:
    """
    Cleans one user-provided text field.
    """

    if text is None:
        return ""

    text = str(text)

    text = unicodedata.normalize(
        "NFKC",
        text
    )

    text = BeautifulSoup(
        text,
        "html.parser"
    ).get_text(" ")

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.lower().strip()


def clean_user_message(
    data: dict
) -> dict:
    """
    Validates and normalizes one SMS or email
    received from the frontend.
    """

    message_type = data.get(
        "message_type"
    )

    if message_type not in ALLOWED_MESSAGE_TYPES:
        raise ValueError(
            "message_type must be 'sms' or 'email'"
        )

    body = clean_text(
        data.get("body")
    )

    if not body:
        raise ValueError(
            "The message body cannot be empty."
        )

    subject = clean_text(
        data.get("subject")
    )

    sender = str(
        data.get("sender") or ""
    ).strip()

    receiver = str(
        data.get("receiver") or ""
    ).strip()

    text = f"{subject} {body}".strip()

    return {
        "message_type": message_type,
        "subject": subject,
        "body": body,
        "sender": sender,
        "receiver": receiver,
        "text": text
    }