from typing import Any

from .url_features import (
    build_url_features,
)


def determine_url_risk_level(
    risk_score: int,
) -> str:
    if risk_score >= 60:
        return "HIGH"

    if risk_score >= 30:
        return "MEDIUM"

    return "LOW"


def calculate_url_risk(
    *,
    prediction: str,
    features: dict[str, Any],
) -> dict[str, Any]:
    triggered_rules : list[dict[str, Any]] = []
    risk_score = 0

    normalized_prediction = str(
        prediction
    ).strip().lower()

    suspicious_predictions = {
        "suspicious",
        "malicious",
        "phishing",
        "fraud",
        "true",
        "1",
    }

    if normalized_prediction in suspicious_predictions:
        risk_score += 70

        triggered_rules.append(
            {
                "rule_name": "ml_predicted_suspicious",
                "points": 70,
                "reason": (
                    "The URL model classified "
                    "the URL as malicious."
                ),
            }
        )
    url_rules = [
        {
            "name": "http_connection",
            "feature": "uses_http",
            "points": 10,
            "reason": (
                "The URL does not use HTTPS."
            ),
        },
        {
            "name": "ip_address_host",
            "feature": "uses_ip_address",
            "points": 15,
            "reason": (
                "The URL uses an IP address "
                "instead of a domain name."
            ),
        },
        {
            "name": "punycode_domain",
            "feature": "uses_punycode",
            "points": 15,
            "reason": (
                "The domain uses punycode, "
                "which can hide lookalike domains."
            ),
        },
        {
            "name": "url_shortener",
            "feature": "uses_url_shortener",
            "points": 15,
            "reason": (
                "The URL uses a URL-shortening service."
            ),
        },
        {
            "name": "suspicious_keyword",
            "feature": (
                "contains_suspicious_keyword"
            ),
            "points": 10,
            "reason": (
                "The URL contains suspicious "
                "security-related keywords."
            ),
        },
        {
            "name": "at_symbol_in_url",
            "feature": "has_at_symbol",
            "points": 15,
            "reason": (
                "The URL contains an @ symbol."
            ),
        },
        {
            "name": "many_subdomains",
            "feature": "has_many_subdomains",
            "points": 10,
            "reason": (
                "The URL contains an unusually "
                "large number of subdomains."
            ),
        },
        {
            "name": "brand_impersonation",
            "feature": "looks_like_brand_impersonation",
            "points": 25,
            "reason": (
                "The domain appears to imitate "
                "a known company or institution."
            ),
        },
        {
            "name": "long_url",
            "feature": "has_long_url",
            "points": 10,
            "reason": "The URL is unusually long.",
        },
        {
            "name": "many_hyphens",
            "feature": "has_many_hyphens",
            "points": 10,
            "reason": (
                "The domain contains an unusual "
                "number of hyphens."
            ),
        },
        {
            "name": "encoded_url",
            "feature": "contains_encoded_characters",
            "points": 10,
            "reason": (
                "The URL contains encoded characters "
                "that may hide its destination."
            ),
        },
    ]

    for rule in url_rules:
        if features.get(rule["feature"]):
            risk_score += rule["points"]

            triggered_rules.append(
                {
                    "rule_name": rule["name"],
                    "points": rule["points"],
                    "reason": rule["reason"],
                }
            )

    risk_score = min(risk_score, 100)

    return {
        "risk_score": risk_score,
        "risk_level": determine_url_risk_level(
            risk_score
        ),
        "triggered_rules": triggered_rules,
    }