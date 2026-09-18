import unittest

from backend.app.services.sms_model_service import (
    predict_sms,
)


class TestSmsModelService(unittest.TestCase):
    def test_empty_sms_is_rejected(self):
        with self.assertRaises(ValueError):
            predict_sms("   ")

    def test_normal_sms_returns_real_model_contract(self):
        result = predict_sms(
            "Hey, I will call you after work."
        )

        self.assertEqual(
            result["predicted_class"],
            "legitimate",
        )
        self.assertEqual(
            result["score_type"],
            "probability",
        )
        self.assertIsInstance(
            result["spam_probability"],
            float,
        )
        self.assertEqual(
            result["model_version"],
            "sms-tfidf-patterns-v2",
        )

    def test_suspicious_sms_is_classified_as_spam(self):
        result = predict_sms(
            "Congratulations! You won a free prize. "
            "Click here now."
        )

        self.assertEqual(
            result["predicted_class"],
            "spam",
        )
        self.assertGreaterEqual(
            result["spam_probability"],
            0.5,
        )
        self.assertEqual(
            result["model_version"],
            "sms-tfidf-patterns-v2",
        )

    def test_content_features_are_extracted(self):
        result = predict_sms(
            "URGENT! Verify your account and send "
            "your password."
        )

        features = result["content_features"]

        self.assertIn(
            "contains_link",
            features,
        )
        self.assertIn(
            "requests_sensitive_data",
            features,
        )
        self.assertIn(
            "uses_urgent_language",
            features,
        )
        self.assertIn(
            "contains_suspicious_pattern",
            features,
        )


if __name__ == "__main__":
    unittest.main()