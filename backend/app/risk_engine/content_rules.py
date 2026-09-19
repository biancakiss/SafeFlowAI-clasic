from .rules import evaluate_risk_rules


CONTENT_RISK_RULES = [
    {
        "rule_name": "ml_predicted_spam",
        "feature": "ml_predicted_spam",
        "operator": "equals",
        "expected_value": True,
        "points": 30,
        "reason": "The ML model classified the content as spam.",
    },
    {
        "rule_name": "spam_with_suspicious_link",
        "feature": "spam_with_suspicious_link",
        "operator": "equals",
        "expected_value": True,
        "points": 20,
        "reason": "The content was classified as spam and contains a suspicious link.",
    },
    {
        "rule_name": "spam_with_sensitive_request",
        "feature": "spam_with_sensitive_request",
        "operator": "equals",
        "expected_value": True,
        "points": 25,
        "reason": "The content was classified as spam and requests sensitive information.",
    },
    {
        "rule_name": "spam_with_urgent_language",
        "feature": "spam_with_urgent_language",
        "operator": "equals",
        "expected_value": True,
        "points": 10,
        "reason": "The content was classified as spam and uses urgent or threatening language.",
    },
    {
        "rule_name": "spam_with_suspicious_pattern",
        "feature": "spam_with_suspicious_pattern",
        "operator": "equals",
        "expected_value": True,
        "points": 15,
        "reason": "The content was classified as spam and contains a suspicious scam-related pattern.",
    },
]


def evaluate_content_rules(
    ml_result: dict,
    content_features: dict,
) -> list[dict]:
    is_spam = ml_result.get("prediction") == "spam"

    rule_input = {
        "ml_predicted_spam": is_spam,
        "spam_with_suspicious_link": (
            is_spam
            and content_features.get("contains_suspicious_link", False)
        ),
        "spam_with_sensitive_request": (
            is_spam
            and content_features.get("requests_sensitive_data", False)
        ),
        "spam_with_urgent_language": (
            is_spam
            and content_features.get("uses_urgent_language", False)
        ),
        "spam_with_suspicious_pattern": (
            is_spam
            and content_features.get(
                "contains_suspicious_pattern",
                False,
            )
        ),
    }

    return evaluate_risk_rules(
        features=rule_input,
        rules=CONTENT_RISK_RULES,
    )