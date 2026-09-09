import unittest

from backend.app.risk_engine.scoring import calculate_risk


class TestRiskEngine(unittest.TestCase):

    def test_high_risk_transaction(self):
        features = {
            "is_new_beneficiary": 1,
            "is_unusually_large": 1,
            "recent_transaction_count": 3,
            "is_unusual_country": 1,
            "is_risky_payment_channel": 1,
        }

        result = calculate_risk(features)

        self.assertEqual(result["rule_score"], 85)
        self.assertEqual(result["risk_level"], "HIGH")
        self.assertEqual(len(result["triggered_rules"]), 5)

    def test_medium_risk_transaction(self):
        features = {
            "is_new_beneficiary": 1,
            "is_unusually_large": 1,
            "recent_transaction_count": 0,
            "is_unusual_country": 0,
            "is_risky_payment_channel": 0,
        }

        result = calculate_risk(features)

        self.assertEqual(result["rule_score"], 35)
        self.assertEqual(result["risk_level"], "MEDIUM")
        self.assertEqual(len(result["triggered_rules"]), 2)

    def test_low_risk_transaction(self):
        features = {
            "is_new_beneficiary": 0,
            "is_unusually_large": 0,
            "recent_transaction_count": 0,
            "is_unusual_country": 0,
            "is_risky_payment_channel": 0,
        }

        result = calculate_risk(features)

        self.assertEqual(result["rule_score"], 0)
        self.assertEqual(result["risk_level"], "LOW")
        self.assertEqual(len(result["triggered_rules"]), 0)

    def test_each_triggered_rule_contains_reason(self):
        features = {
            "is_new_beneficiary": 1,
            "is_unusually_large": 0,
            "recent_transaction_count": 0,
            "is_unusual_country": 0,
            "is_risky_payment_channel": 0,
        }

        result = calculate_risk(features)

        rule = result["triggered_rules"][0]

        self.assertIn("rule_name", rule)
        self.assertIn("points", rule)
        self.assertIn("reason", rule)

    def test_score_is_capped_at_100(self):
        custom_rules = [
            {
                "rule_name": "rule_one",
                "feature": "feature_one",
                "operator": "equals",
                "expected_value": 1,
                "points": 80,
                "reason": "First test rule.",
            },
            {
                "rule_name": "rule_two",
                "feature": "feature_two",
                "operator": "equals",
                "expected_value": 1,
                "points": 50,
                "reason": "Second test rule.",
            },
        ]

        features = {
            "feature_one": 1,
            "feature_two": 1,
        }

        result = calculate_risk(
            features=features,
            rules=custom_rules,
        )

        self.assertEqual(result["rule_score"], 100)
        self.assertEqual(result["risk_level"], "HIGH")


if __name__ == "__main__":
    unittest.main()