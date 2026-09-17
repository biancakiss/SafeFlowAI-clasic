import unittest

from backend.app.risk_engine.content_rules import (
    evaluate_content_rules,
)


class TestContentRules(unittest.TestCase):
    def test_all_contextual_rules_are_triggered(self):
        ml_result = {
            "prediction": "spam",
            "spam_score": 1.4,
            "score_type": "decision_margin",
        }

        content_features = {
            "contains_link": True,
            "contains_suspicious_link": True,
            "requests_sensitive_data": True,
            "uses_urgent_language": True,
            "contains_suspicious_pattern": True,
        }

        result = evaluate_content_rules(
            ml_result=ml_result,
            content_features=content_features,
        )

        self.assertEqual(len(result), 5)

        rule_names = {
            rule["rule_name"]
            for rule in result
        }

        self.assertEqual(
            rule_names,
            {
                "ml_predicted_spam",
                "spam_with_suspicious_link",
                "spam_with_sensitive_request",
                "spam_with_urgent_language",
                "spam_with_suspicious_pattern",
            },
        )

        self.assertEqual(
            sum(rule["points"] for rule in result),
            100,
        )

    def test_legitimate_content_does_not_trigger_rules(self):
        ml_result = {
            "prediction": "legitimate",
            "spam_score": -0.8,
            "score_type": "decision_margin",
        }

        content_features = {
            "contains_link": True,
            "contains_suspicious_link": True,
            "requests_sensitive_data": True,
            "uses_urgent_language": True,
            "contains_suspicious_pattern": True,
        }

        result = evaluate_content_rules(
            ml_result=ml_result,
            content_features=content_features,
        )

        self.assertEqual(result, [])

    def test_spam_with_normal_link_does_not_trigger_suspicious_link_rule(self):
        ml_result = {
            "prediction": "spam",
            "spam_score": 1.2,
            "score_type": "decision_margin",
        }

        content_features = {
            "contains_link": True,
            "contains_suspicious_link": False,
            "requests_sensitive_data": False,
            "uses_urgent_language": False,
            "contains_suspicious_pattern": False,
        }

        result = evaluate_content_rules(
            ml_result=ml_result,
            content_features=content_features,
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(
            result[0]["rule_name"],
            "ml_predicted_spam",
        )
        self.assertEqual(result[0]["points"], 30)

    def test_each_triggered_rule_has_explanation(self):
        ml_result = {
            "prediction": "spam",
        }

        content_features = {
            "contains_link": False,
            "contains_suspicious_link": False,
            "requests_sensitive_data": True,
            "uses_urgent_language": False,
            "contains_suspicious_pattern": False,
        }

        result = evaluate_content_rules(
            ml_result=ml_result,
            content_features=content_features,
        )

        rule_names = {
            rule["rule_name"]
            for rule in result
        }

        self.assertEqual(
            rule_names,
            {
                "ml_predicted_spam",
                "spam_with_sensitive_request",
            },
        )

        for rule in result:
            self.assertIn("rule_name", rule)
            self.assertIn("points", rule)
            self.assertIn("reason", rule)
            self.assertTrue(rule["reason"])


if __name__ == "__main__":
    unittest.main()