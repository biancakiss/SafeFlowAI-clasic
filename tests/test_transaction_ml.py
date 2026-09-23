import unittest

from backend.app.risk_engine.scoring import calculate_risk
from backend.app.services.transaction_model_service import (
    predict_transaction,
)


class TestTransactionMlIntegration(unittest.TestCase):

    def test_transaction_model_returns_prediction(self):
        features = {
            "amount": 4500.0,
            "hour": 2,
            "is_new_beneficiary": 1,
            "is_international": 1,
            "velocity_24h": 3,
            "account_age_days": 300,
            "currency": "AUD",
            "payment_channel": "international_transfer",
            "beneficiary_country": "NG",
        }

        result = predict_transaction(features)

        self.assertIn(
            result["predicted_class"],
            ["fraud", "legitimate"],
        )
        self.assertGreaterEqual(
            result["model_score"],
            0,
        )
        self.assertLessEqual(
            result["model_score"],
            1,
        )
        self.assertTrue(result["model_version"])

    def test_fraud_prediction_triggers_risk_rule(self):
        result = calculate_risk(
            features={
                "is_new_beneficiary": 0,
            },
            model_result={
                "predicted_class": "fraud",
                "model_score": 0.9,
                "model_version": "payment-fraud-tabular-v1",
            },
        )

        self.assertEqual(result["rule_score"], 30)
        self.assertEqual(result["risk_level"], "MEDIUM")
        self.assertEqual(
            result["triggered_rules"][0]["rule_name"],
            "ml_predicted_fraud",
        )


if __name__ == "__main__":
    unittest.main()