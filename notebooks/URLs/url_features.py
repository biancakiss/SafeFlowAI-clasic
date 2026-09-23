from __future__ import annotations

import re
from urllib.parse import urlparse

import pandas as pd


SUSPICIOUS_WORDS = {
    "login",
    "signin",
    "verify",
    "verification",
    "account",
    "update",
    "secure",
    "confirm",
    "bank",
    "paypal",
    "password",
    "unlock",
    "bonus",
    "free",
    "support",
}


def extract_feature_row(url: str) -> dict:
    url = str(url).strip()

    parsed_url = urlparse(
        url if "://" in url else f"http://{url}"
    )

    hostname = parsed_url.hostname or ""

    url_length = len(url)

    special_characters = re.findall(
        r"[^a-zA-Z0-9]",
        url
    )

    suspicious_word_count = sum(
        word in url.lower()
        for word in SUSPICIOUS_WORDS
    )

    num_subdomains = max(
        hostname.count(".") - 1,
        0
    )

    if url_length > 0:
        digit_ratio = (
            sum(character.isdigit() for character in url)
            / url_length
        )

        special_char_ratio = (
            len(special_characters)
            / url_length
        )
    else:
        digit_ratio = 0.0
        special_char_ratio = 0.0

    return {
        "url_length": url_length,
        "num_digits": sum(
            character.isdigit()
            for character in url
        ),
        "digit_ratio": digit_ratio,
        "special_char_ratio": special_char_ratio,
        "num_hyphens": url.count("-"),
        "num_underscores": url.count("_"),
        "num_slashes": url.count("/"),
        "num_dots": url.count("."),
        "num_question_marks": url.count("?"),
        "num_equals": url.count("="),
        "num_at_symbols": url.count("@"),
        "num_percent": url.count("%"),
        "num_hashes": url.count("#"),
        "num_ampersands": url.count("&"),
        "num_subdomains": num_subdomains,
        "is_https": int(
            parsed_url.scheme.lower() == "https"
        ),
        "has_suspicious_word": int(
            suspicious_word_count > 0
        ),
    }


def extract_features(
    urls: pd.Series
) -> pd.DataFrame:
    return pd.DataFrame(
        [
            extract_feature_row(url)
            for url in urls
        ]
    )