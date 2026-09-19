import re

from .email_model import build_email_text


URL_PATTERN = re.compile(
    r"(https?://\S+|www\.\S+)",
    re.IGNORECASE,
)

SUSPICIOUS_LINK_PATTERN = re.compile(
    r"(https?://(?:\d{1,3}\.){3}\d+"
    r"|https?://(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl)/"
    r"|https?://\S*(login|verify|secure|account|password)\S*)",
    re.IGNORECASE,
)

SENSITIVE_DATA_PATTERN = re.compile(
    r"\b(password|passcode|verification code|one[- ]time code|"
    r"credit card|bank account|card number|account details)\b",
    re.IGNORECASE,
)

URGENCY_PATTERN = re.compile(
    r"\b(urgent|immediately|act now|final notice|expires today|"
    r"last chance|within 24 hours|suspended)\b",
    re.IGNORECASE,
)

SUSPICIOUS_PATTERN = re.compile(
    r"\b(claim your prize|verify your account|click here|"
    r"you have won|refund available|free cash|congratulations)\b",
    re.IGNORECASE,
)


def build_content_features(subject: str, body: str) -> dict:
    text = build_email_text(subject, body)

    return {
        "contains_link": bool(URL_PATTERN.search(text)),
        "contains_suspicious_link": bool(
            SUSPICIOUS_LINK_PATTERN.search(text)
        ),
        "requests_sensitive_data": bool(
            SENSITIVE_DATA_PATTERN.search(text)
        ),
        "uses_urgent_language": bool(
            URGENCY_PATTERN.search(text)
        ),
        "contains_suspicious_pattern": bool(
            SUSPICIOUS_PATTERN.search(text)
        ),
    }