from typing import Any


def build_rule_explanation(
    rule_name: str,
    points: int,
    reason: str,
) -> dict[str, Any]:
    """Build a consistent explanation for a triggered risk rule."""
    return {
        "rule_name": rule_name,
        "points": points,
        "reason": reason,
    }