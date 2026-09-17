import re

from bs4 import BeautifulSoup


def clean_text(text: str | None) -> str:
    if not text:
        return ""

    text = BeautifulSoup(
        str(text),
        "html.parser",
    ).get_text(" ")

    text = text.lower()
    text = re.sub(r"\s+", " ", text)

    return text.strip()