import re
from urllib.parse import urlparse


SHORTENER_DOMAINS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "is.gd",
}

SUSPICIOUS_KEYWORDS = {
    "login",
    "verify",
    "secure",
    "account",
    "password",
    "update",
    "confirm",
    "wallet",
    "payment",
}


def build_url_features(url: str) -> dict:
    parsed_url = urlparse(url)

    hostname = (
        parsed_url.hostname or ""
    ).lower()

    path_and_query = (
        f"{parsed_url.path} "
        f"{parsed_url.query}"
    ).lower()

    uses_http = parsed_url.scheme == "http"

    uses_ip_address = bool(
        re.fullmatch(
            r"\d{1,3}(\.\d{1,3}){3}",
            hostname,
        )
    )

    uses_punycode = (
        "xn--" in hostname
    )

    uses_url_shortener = (
        hostname in SHORTENER_DOMAINS
    )

    contains_suspicious_keyword = any(
        keyword in path_and_query
        or keyword in hostname
        for keyword in SUSPICIOUS_KEYWORDS
    )

    has_at_symbol = "@" in url

    subdomain_count = max(
        len(hostname.split(".")) - 2,
        0,
    )

    has_many_subdomains = (
        subdomain_count >= 3
    )

    return {
        "uses_http": uses_http,
        "uses_ip_address": uses_ip_address,
        "uses_punycode": uses_punycode,
        "uses_url_shortener": (
            uses_url_shortener
        ),
        "contains_suspicious_keyword": (
            contains_suspicious_keyword
        ),
        "has_at_symbol": has_at_symbol,
        "has_many_subdomains": (
            has_many_subdomains
        ),
    }