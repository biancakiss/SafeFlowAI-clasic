import unittest

from backend.app.risk_engine.url_features import (
    build_url_features,
)
from backend.app.risk_engine.url_scoring import (
    calculate_url_risk,
)
from backend.app.services.url_model_service import (
    predict_url,
)


class TestUrlRiskEngine(unittest.TestCase):

    def analyze_url(
        self,
        url: str,
        prediction: str,
    ):
        features = build_url_features(url)

        risk_result = calculate_url_risk(
            prediction=prediction,
            features=features,
        )

        return features, risk_result

    def test_real_model_adapter_contract(self):
        result = predict_url(
            "https://www.example.com"
        )

        self.assertIn(
            result["prediction"],
            {"legitimate", "malicious"},
        )

        self.assertIn(
            "model_score",
            result,
        )

        self.assertGreaterEqual(
            result["model_score"],
            0.0,
        )

        self.assertLessEqual(
            result["model_score"],
            1.0,
        )

        self.assertEqual(
            result["model_version"],
            "url-model-v1",
        )

    def test_legitimate_prediction_has_no_ml_points(self):
        features, risk_result = self.analyze_url(
            "https://www.example.com",
            prediction="legitimate",
        )

        self.assertFalse(
            features["uses_http"]
        )

        self.assertEqual(
            risk_result["risk_score"],
            0,
        )

        self.assertEqual(
            risk_result["risk_level"],
            "LOW",
        )

        self.assertEqual(
            risk_result["triggered_rules"],
            [],
        )

    def test_malicious_shortened_url_with_verify(self):
        features, risk_result = self.analyze_url(
            "https://bit.ly/verify",
            prediction="malicious",
        )

        self.assertTrue(
            features["uses_url_shortener"]
        )

        self.assertTrue(
            features["contains_suspicious_keyword"]
        )

        self.assertEqual(
            risk_result["risk_score"],
            95,
        )

        self.assertEqual(
            risk_result["risk_level"],
            "HIGH",
        )

    def test_malicious_ip_http_url_reaches_score_limit(self):
        features, risk_result = self.analyze_url(
            "http://192.168.1.10/login",
            prediction="malicious",
        )

        self.assertTrue(
            features["uses_http"]
        )

        self.assertTrue(
            features["uses_ip_address"]
        )

        self.assertTrue(
            features["contains_suspicious_keyword"]
        )

        self.assertEqual(
            risk_result["risk_score"],
            100,
        )

        self.assertEqual(
            risk_result["risk_level"],
            "HIGH",
        )

    def test_malicious_punycode_url_is_high_risk(self):
        features, risk_result = self.analyze_url(
            "https://xn--pple-43d.com/login",
            prediction="malicious",
        )

        self.assertTrue(
            features["uses_punycode"]
        )

        self.assertTrue(
            features["contains_suspicious_keyword"]
        )

        self.assertEqual(
            risk_result["risk_score"],
            95,
        )

        self.assertEqual(
            risk_result["risk_level"],
            "HIGH",
        )

    def test_malicious_url_with_many_subdomains(self):
        features, risk_result = self.analyze_url(
            (
                "https://login.account.verify."
                "secure.example.com"
            ),
            prediction="malicious",
        )

        self.assertTrue(
            features["has_many_subdomains"]
        )

        self.assertTrue(
            features["contains_suspicious_keyword"]
        )

        self.assertEqual(
            risk_result["risk_score"],
            90,
        )

        self.assertEqual(
            risk_result["risk_level"],
            "HIGH",
        )


if __name__ == "__main__":
    unittest.main()