import unittest

from backend.app.risk_engine.email_analysis import (
    analyze_email,
)


class TestEmailAnalysis(unittest.TestCase):
    def test_email_analysis_returns_expected_sections(self):
        result = analyze_email(
            "Project meeting",
            "Can we review the project tomorrow?",
        )

        self.assertIn("ml_result", result)
        self.assertIn("content_features", result)
        self.assertIn("risk_result", result)

    def test_email_analysis_returns_expected_ml_fields(self):
        result = analyze_email(
            "Project meeting",
            "Can we review the project tomorrow?",
        )

        ml_result = result["ml_result"]

        self.assertIn("prediction", ml_result)
        self.assertIn("spam_score", ml_result)
        self.assertIn("score_type", ml_result)

    def test_email_analysis_returns_all_content_features(self):
        result = analyze_email(
            "Project meeting",
            "Can we review the project tomorrow?",
        )

        features = result["content_features"]

        expected_features = {
            "contains_link",
            "contains_suspicious_link",
            "requests_sensitive_data",
            "uses_urgent_language",
            "contains_suspicious_pattern",
        }

        self.assertEqual(
            set(features.keys()),
            expected_features,
        )

    def test_suspicious_email_has_contextual_risk(self):
        result = analyze_email(
            "URGENT: Verify your account now",
            (
                "Your account will be suspended today. "
                "Click https://example.com and confirm "
                "your password and credit card number immediately."
            ),
        )

        self.assertEqual(
            result["ml_result"]["prediction"],
            "spam",
        )

        self.assertEqual(
            result["risk_result"]["risk_level"],
            "HIGH",
        )

        self.assertGreaterEqual(
            result["risk_result"]["rule_score"],
            60,
        )

        self.assertGreater(
            len(result["risk_result"]["triggered_rules"]),
            1,
        )

    def test_every_triggered_rule_has_explanation(self):
        result = analyze_email(
            "URGENT: Verify your account now",
            (
                "Your account will be suspended today. "
                "Click https://example.com and confirm "
                "your password immediately."
            ),
        )

        for rule in result["risk_result"]["triggered_rules"]:
            self.assertIn("rule_name", rule)
            self.assertIn("points", rule)
            self.assertIn("reason", rule)
            self.assertTrue(rule["reason"])


if __name__ == "__main__":
    unittest.main()