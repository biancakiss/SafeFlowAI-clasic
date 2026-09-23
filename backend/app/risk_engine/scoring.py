from typing import Any

from .rules import DEFAULT_RISK_RULES, evaluate_risk_rules


MAX_RISK_SCORE = 100


def determine_risk_level(rule_score: int) -> str:
    """Convert the rule score into a risk level."""
    if rule_score < 30:
        return "LOW"

    if rule_score < 60:
        return "MEDIUM"

    return "HIGH"


def calculate_risk(
    features: dict[str, Any],
    rules: list[dict[str, Any]] | None = None,
    model_result: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Calculate explainable risk using rules and optional ML output."""

    configured_rules = (
        DEFAULT_RISK_RULES
        if rules is None
        else rules
    )

    scoring_features = dict(features)

    if model_result is not None:
        scoring_features["ml_predicted_fraud"] = int(
            model_result.get("predicted_class") == "fraud"
        )

    triggered_rules = evaluate_risk_rules(
        features=scoring_features,
        rules=configured_rules,
    )

    raw_score = sum(
        rule["points"]
        for rule in triggered_rules
    )

    rule_score = min(raw_score, MAX_RISK_SCORE)

    return {
        "rule_score": rule_score,
        "risk_level": determine_risk_level(rule_score),
        "triggered_rules": triggered_rules,
    }