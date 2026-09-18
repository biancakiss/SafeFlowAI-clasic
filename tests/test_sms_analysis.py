import unittest

from backend.app.risk_engine.sms_analysis import (
    analyze_sms,
)


class TestSmsAnalysis(unittest.TestCase):
    def test_legitimate_sms_has_low_risk(self):
        result = analyze_sms(
            "Hey, I will call you after work."
        )

        self.assertEqual(
            result["ml_result"]["prediction"],
            "legitimate",
        )
        self.assertEqual(
            result["risk_result"]["rule_score"],
            0,
        )
        self.assertEqual(
            result["risk_result"]["risk_level"],
            "LOW",
        )
        self.assertEqual(
            result["risk_result"]["triggered_rules"],
            [],
        )

    def test_suspicious_sms_has_high_risk(self):
        result = analyze_sms(
            "URGENT! Verify your account now and send "
            "your password at https://bit.ly/security"
        )

        self.assertEqual(
            result["ml_result"]["prediction"],
            "spam",
        )
        self.assertEqual(
            result["risk_result"]["rule_score"],
            100,
        )
        self.assertEqual(
            result["risk_result"]["risk_level"],
            "HIGH",
        )

    def test_model_spam_with_one_contextual_signal(self):
        result = analyze_sms(
            "Congratulations! You won a free prize. "
            "Click here now."
        )

        self.assertEqual(
            result["ml_result"]["prediction"],
            "spam",
        )
        self.assertEqual(
            result["risk_result"]["rule_score"],
            45,
        )
        self.assertEqual(
            result["risk_result"]["risk_level"],
            "MEDIUM",
        )

        rule_names = {
            rule["rule_name"]
            for rule in result["risk_result"][
                "triggered_rules"
            ]
        }

        self.assertEqual(
            rule_names,
            {
                "ml_predicted_spam",
                "spam_with_suspicious_pattern",
            },
        )

    def test_every_triggered_rule_has_explanation(self):
        result = analyze_sms(
            "URGENT! Verify your account now and send "
            "your password at https://bit.ly/security"
        )

        for rule in result["risk_result"][
            "triggered_rules"
        ]:
            self.assertTrue(rule["rule_name"])
            self.assertIsInstance(
                rule["points"],
                int,
            )
            self.assertTrue(rule["reason"])


if __name__ == "__main__":
    unittest.main()