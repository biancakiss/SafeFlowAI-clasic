import unittest

from backend.app.risk_engine.content_scoring import (
    calculate_content_risk,
)


class TestContentScoring(unittest.TestCase):
    def test_legitimate_content_has_low_risk(self):
        ml_result = {
            "prediction": "legitimate",
            "spam_score": -0.8,
            "score_type": "decision_margin",
        }

        content_features = {
            "contains_link": True,
            "contains_suspicious_link": False,
            "requests_sensitive_data": True,
            "uses_urgent_language": True,
            "contains_suspicious_pattern": True,
        }

        result = calculate_content_risk(
            ml_result,
            content_features,
        )

        self.assertEqual(result["rule_score"], 0)
        self.assertEqual(result["risk_level"], "LOW")
        self.assertEqual(result["triggered_rules"], [])

    def test_spam_content_has_medium_risk(self):
        ml_result = {
            "prediction": "spam",
            "spam_score": 1.44,
            "score_type": "decision_margin",
        }

        content_features = {
            "contains_link": False,
            "contains_suspicious_link": False,
            "requests_sensitive_data": False,
            "uses_urgent_language": False,
            "contains_suspicious_pattern": False,
        }

        result = calculate_content_risk(
            ml_result,
            content_features,
        )

        self.assertEqual(result["rule_score"], 30)
        self.assertEqual(result["risk_level"], "MEDIUM")
        self.assertEqual(
            result["triggered_rules"][0]["rule_name"],
            "ml_predicted_spam",
        )

    def test_spam_with_multiple_signals_has_high_risk(self):
        ml_result = {
            "prediction": "spam",
            "spam_score": 1.44,
            "score_type": "decision_margin",
        }

        content_features = {
            "contains_link": True,
            "contains_suspicious_link": True,
            "requests_sensitive_data": True,
            "uses_urgent_language": True,
            "contains_suspicious_pattern": True,
        }

        result = calculate_content_risk(
            ml_result,
            content_features,
        )

        self.assertEqual(result["rule_score"], 100)
        self.assertEqual(result["risk_level"], "HIGH")
        self.assertEqual(len(result["triggered_rules"]), 5)

    def test_unknown_prediction_has_low_risk(self):
        ml_result = {
            "prediction": "unknown",
            "spam_score": 0.0,
            "score_type": "decision_margin",
        }

        content_features = {
            "contains_link": True,
            "contains_suspicious_link": True,
            "requests_sensitive_data": True,
            "uses_urgent_language": True,
            "contains_suspicious_pattern": True,
        }

        result = calculate_content_risk(
            ml_result,
            content_features,
        )

        self.assertEqual(result["rule_score"], 0)
        self.assertEqual(result["risk_level"], "LOW")
        self.assertEqual(result["triggered_rules"], [])


if __name__ == "__main__":
    unittest.main()