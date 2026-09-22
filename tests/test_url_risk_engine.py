import json
import unittest
from pathlib import Path

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

    @classmethod
    def setUpClass(cls):
        data_path = Path("data/mock/urls.json")
        cls.urls = json.loads(
            data_path.read_text(encoding="utf-8")
        )

    def get_url_case(self, name):
        return next(
            item
            for item in self.urls
            if item["name"] == name
        )

    def analyze_url(self, url):
        model_result = predict_url(url)
        features = build_url_features(url)
        risk_result = calculate_url_risk(
            prediction=model_result["prediction"],
            features=features,
        )

        return model_result, features, risk_result

    def test_safe_url_returns_low_risk(self):
        case = self.get_url_case("Safe URL")

        model_result, features, risk_result = (
            self.analyze_url(case["url"])
        )

        self.assertEqual(
            model_result["prediction"],
            "safe",
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

    def test_shortened_url_with_verify_returns_95_high(self):
        case = self.get_url_case(
            "Suspicious shortened URL"
        )

        model_result, features, risk_result = (
            self.analyze_url(case["url"])
        )

        self.assertEqual(
            model_result["prediction"],
            "suspicious",
        )
        self.assertEqual(
            model_result["model_version"],
            "temporary-url-model-v1",
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

    def test_ip_http_url_reaches_score_limit(self):
        case = self.get_url_case(
            "Suspicious URL with IP and HTTP"
        )

        model_result, features, risk_result = (
            self.analyze_url(case["url"])
        )

        self.assertEqual(
            model_result["prediction"],
            "suspicious",
        )
        self.assertTrue(
            features["uses_http"]
        )
        self.assertTrue(
            features["uses_ip_address"]
        )
        self.assertEqual(
            risk_result["risk_score"],
            100,
        )
        self.assertEqual(
            risk_result["risk_level"],
            "HIGH",
        )

    def test_punycode_url_is_high_risk(self):
        case = self.get_url_case(
            "Suspicious punycode URL"
        )

        model_result, features, risk_result = (
            self.analyze_url(case["url"])
        )

        self.assertEqual(
            model_result["prediction"],
            "suspicious",
        )
        self.assertTrue(
            features["uses_punycode"]
        )
        self.assertEqual(
            risk_result["risk_score"],
            95,
        )
        self.assertEqual(
            risk_result["risk_level"],
            "HIGH",
        )

    def test_many_subdomains_are_detected(self):
        case = self.get_url_case(
            "Suspicious URL with many subdomains"
        )

        model_result, features, risk_result = (
            self.analyze_url(case["url"])
        )

        self.assertEqual(
            model_result["prediction"],
            "suspicious",
        )
        self.assertTrue(
            features["has_many_subdomains"]
        )
        self.assertEqual(
            risk_result["risk_score"],
            90,
        )
        self.assertEqual(
            risk_result["risk_level"],
            "HIGH",
        )

    def test_all_mock_urls_match_expected_prediction(self):
        for case in self.urls:
            model_result = predict_url(case["url"])

            self.assertEqual(
                model_result["prediction"],
                case["expected_prediction"],
                msg=case["name"],
            )


if __name__ == "__main__":
    unittest.main()