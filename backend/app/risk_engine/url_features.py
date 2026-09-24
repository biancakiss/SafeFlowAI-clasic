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
    "billing",
    "suspended",
    "unlock",
    "authentication",
}

KNOWN_BRANDS = {
    "paypal",
    "microsoft",
    "google",
    "apple",
    "amazon",
    "netflix",
    "bcr",
    "ing",
    "bt",
    "anaf",
}

TRUSTED_BRAND_DOMAINS = {
    "paypal.com",
    "microsoft.com",
    "google.com",
    "apple.com",
    "amazon.com",
    "netflix.com",
    "bcr.ro",
    "ing.ro",
    "btrl.ro",
    "anaf.ro",
}



def build_url_features(
    url: str,
) -> dict[str, bool]:
    parsed_url = urlparse(url)

    hostname = (
        parsed_url.hostname or ""
    ).lower()

    path_and_query = (
        f"{parsed_url.path} "
        f"{parsed_url.query}"
    ).lower()

    uses_http = (
        parsed_url.scheme.lower() == "http"
    )

    uses_ip_address = bool(
        re.fullmatch(
            r"\d{1,3}(?:\.\d{1,3}){3}",
            hostname,
        )
    )

    uses_punycode = "xn--" in hostname

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

    hostname_parts = [
        part
        for part in hostname.split(".")
        if part
    ]

    registered_domain = ""

    if len(hostname_parts) >= 2:
        registered_domain = (
            f"{hostname_parts[-2]}."
            f"{hostname_parts[-1]}"
        )

    brand_is_used_legitimately = (
        registered_domain in TRUSTED_BRAND_DOMAINS
    )

    looks_like_brand_impersonation = (
        not brand_is_used_legitimately
        and any(
            brand in hostname
            for brand in KNOWN_BRANDS
        )
    )

    has_long_url = len(url) >= 100

    has_many_hyphens = (
        hostname.count("-") >= 2
    )

    contains_encoded_characters = bool(
        re.search(
            r"%[0-9a-fA-F]{2}",
            url,
        )
    )

    return {
        "uses_http": uses_http,
        "uses_ip_address": uses_ip_address,
        "uses_punycode": uses_punycode,
        "uses_url_shortener": uses_url_shortener,
        "contains_suspicious_keyword": (
            contains_suspicious_keyword
        ),
        "has_at_symbol": has_at_symbol,
        "has_many_subdomains": (
            has_many_subdomains
        ),
        "looks_like_brand_impersonation": (
            looks_like_brand_impersonation
        ),
        "has_long_url": has_long_url,
        "has_many_hyphens": has_many_hyphens,
        "contains_encoded_characters": (
            contains_encoded_characters
        ),
    }