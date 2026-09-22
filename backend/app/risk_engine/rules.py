from typing import Any
from .explanations import build_rule_explanation

DEFAULT_RISK_RULES: list[dict[str, Any]] = [
    {
        "rule_name": "new_beneficiary",
        "feature": "is_new_beneficiary",
        "operator": "equals",
        "expected_value": 1,
        "points": 15,
        "reason": "The beneficiary has not been used before.",
    },
    {
        "rule_name": "unusually_large_amount",
        "feature": "is_unusually_large",
        "operator": "equals",
        "expected_value": 1,
        "points": 20,
        "reason": "The transaction amount is unusually large.",
    },
    {
        "rule_name": "many_recent_transactions",
        "feature": "recent_transaction_count",
        "operator": "greater_than_or_equal",
        "expected_value": 3,
        "points": 25,
        "reason": "The user made many transactions in a short period.",
    },
    {
        "rule_name": "unusual_country",
        "feature": "is_unusual_country",
        "operator": "equals",
        "expected_value": 1,
        "points": 15,
        "reason": "The beneficiary country is unusual for this user.",
    },
    {
        "rule_name": "risky_payment_channel",
        "feature": "is_risky_payment_channel",
        "operator": "equals",
        "expected_value": 1,
        "points": 10,
        "reason": "The payment channel is associated with increased risk.",
    },
    {
    "rule_name": "ml_predicted_fraud",
    "feature": "ml_predicted_fraud",
    "operator": "equals",
    "expected_value": 1,
    "points": 30,
    "reason": "The ML model classified the transaction as fraud.",
    },
]


def condition_matches(
    actual_value: Any,
    operator: str,
    expected_value: Any,
) -> bool:
    """Check whether a feature satisfies a rule condition."""
    if operator == "equals":
        return actual_value == expected_value

    if operator == "greater_than_or_equal":
        return actual_value >= expected_value

    if operator == "greater_than":
        return actual_value > expected_value

    if operator == "less_than_or_equal":
        return actual_value <= expected_value

    if operator == "less_than":
        return actual_value < expected_value

    raise ValueError(f"Unsupported rule operator: {operator}")


def evaluate_risk_rules(
    features: dict[str, Any],
    rules: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Return all rules triggered by the provided transaction features."""
    configured_rules = rules or DEFAULT_RISK_RULES
    triggered_rules = []

    for rule in configured_rules:
        feature_name = rule["feature"]
        actual_value = features.get(feature_name)

        if actual_value is None:
            continue

        if condition_matches(
            actual_value=actual_value,
            operator=rule["operator"],
            expected_value=rule["expected_value"],
        ):
            triggered_rules.append(
                 build_rule_explanation(
                    rule_name=rule["rule_name"],
                    points=rule["points"],
                    reason=rule["reason"],
                 )
            )

    return triggered_rules
