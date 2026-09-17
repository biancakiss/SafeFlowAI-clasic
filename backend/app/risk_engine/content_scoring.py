from backend.app.risk_engine.content_rules import (
    evaluate_content_rules,
)


def determine_content_risk_level(score: int) -> str:
    if score >= 60:
        return "HIGH"

    if score >= 30:
        return "MEDIUM"

    return "LOW"


def calculate_content_risk(
    ml_result: dict,
    content_features: dict,
) -> dict:
    triggered_rules = evaluate_content_rules(
        ml_result=ml_result,
        content_features=content_features,
    )

    rule_score = sum(
        rule["points"]
        for rule in triggered_rules
    )

    rule_score = min(rule_score, 100)

    return {
        "rule_score": rule_score,
        "risk_level": determine_content_risk_level(rule_score),
        "triggered_rules": triggered_rules,
    }