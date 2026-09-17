import unittest

from backend.app.risk_engine.content_features import (
    build_content_features,
)


class TestContentFeatures(unittest.TestCase):
    def test_clean_content_has_no_suspicious_features(self):
        result = build_content_features(
            subject="Project meeting",
            body="Can we review the project tomorrow?",
        )

        self.assertEqual(
            result,
            {
                "contains_link": False,
                "contains_suspicious_link": False,
                "requests_sensitive_data": False,
                "uses_urgent_language": False,
                "contains_suspicious_pattern": False,
            },
        )

    def test_normal_link_is_not_suspicious(self):
        result = build_content_features(
            subject="Useful documentation",
            body="You can read more at https://example.com.",
        )

        self.assertEqual(result["contains_link"], True)
        self.assertEqual(
            result["contains_suspicious_link"],
            False,
        )

    def test_suspicious_content_activates_content_features(self):
        result = build_content_features(
            subject="URGENT: Verify your account now",
            body=(
                "Your account will be suspended today. "
                "Click https://example.com and confirm your password "
                "immediately."
            ),
        )

        self.assertEqual(
            result,
            {
                "contains_link": True,
                "contains_suspicious_link": False,
                "requests_sensitive_data": True,
                "uses_urgent_language": True,
                "contains_suspicious_pattern": True,
            },
        )

    def test_suspicious_link_is_detected(self):
        result = build_content_features(
            subject="Verify your account",
            body="Click https://bit.ly/verify-account now.",
        )

        self.assertEqual(result["contains_link"], True)
        self.assertEqual(
            result["contains_suspicious_link"],
            True,
        )

    def test_empty_content_is_rejected(self):
        with self.assertRaises(ValueError):
            build_content_features(
                subject="",
                body="",
            )


if __name__ == "__main__":
    unittest.main()