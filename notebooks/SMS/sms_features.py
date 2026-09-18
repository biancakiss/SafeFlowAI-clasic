from __future__ import annotations

import re
from collections.abc import Iterable

import numpy as np
from scipy.sparse import csr_matrix
from sklearn.base import BaseEstimator, TransformerMixin


URL_RE = re.compile(r"(?:https?://|www\.)\S+", re.IGNORECASE)
PHONE_RE = re.compile(r"(?<!\d)(?:\+?\d[\d ()-]{7,}\d)(?!\d)")
CURRENCY_RE = re.compile(r"(?:[$€£]\s?\d|\b\d+(?:[.,]\d+)?\s?(?:eur|usd|gbp|lei)\b)", re.IGNORECASE)
PERCENT_RE = re.compile(r"\b\d+(?:[.,]\d+)?\s?(?:%|percent)\b", re.IGNORECASE)

KEYWORD_GROUPS = (
    ("urgent", "immediately", "final notice", "act now", "today only", "before midnight"),
    ("reply", "text", "call now", "click", "claim", "apply now"),
    ("verify", "confirm your pin", "password", "bank details", "card information", "account locked"),
    ("free", "winner", "won", "prize", "gift card", "cash reward", "selected"),
    ("bitcoin", "crypto", "investment", "loan", "debt", "inheritance"),
    ("delivery fee", "redelivery", "unpaid toll", "refund", "suspended", "unlock"),
)


class SmsPatternFeatures(BaseEstimator, TransformerMixin):
    """Extract small, bounded indicators that complement sparse text features."""

    def fit(self, messages: Iterable[str], y: object = None) -> "SmsPatternFeatures":
        return self

    def transform(self, messages: Iterable[str]) -> csr_matrix:
        rows: list[list[float]] = []
        for value in messages:
            text = str(value)
            lower = text.lower()
            letters = [character for character in text if character.isalpha()]
            rows.append(
                [
                    float(bool(URL_RE.search(text))),
                    min(len(URL_RE.findall(text)), 3) / 3,
                    float(bool(PHONE_RE.search(text))),
                    float(bool(CURRENCY_RE.search(text))),
                    float(bool(PERCENT_RE.search(text))),
                    min(text.count("!"), 5) / 5,
                    min(sum(character.isdigit() for character in text), 20) / 20,
                    (sum(character.isupper() for character in letters) / len(letters)) if letters else 0.0,
                    *(float(any(keyword in lower for keyword in group)) for group in KEYWORD_GROUPS),
                ]
            )
        return csr_matrix(np.asarray(rows, dtype=np.float64))
