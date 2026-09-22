import unittest

from pipeline.features.transaction_features import (
    build_transaction_features,
)


class TestTransactionFeatures(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        transactions = [
            {
                "transaction_id": "TX-001",
                "user_id": "USER-001",
                "amount": 120,
                "currency": "AUD",
                "beneficiary_id": "BEN-001",
                "beneficiary_country": "AU",
                "payment_channel": "card",
                "created_at": "2026-09-09T09:00:00",
            },
            {
                "transaction_id": "TX-002",
                "user_id": "USER-001",
                "amount": 150,
                "currency": "AUD",
                "beneficiary_id": "BEN-001",
                "beneficiary_country": "AU",
                "payment_channel": "card",
                "created_at": "2026-09-09T09:15:00",
            },
            {
                "transaction_id": "TX-003",
                "user_id": "USER-001",
                "amount": 90,
                "currency": "AUD",
                "beneficiary_id": "BEN-001",
                "beneficiary_country": "AU",
                "payment_channel": "card",
                "created_at": "2026-09-09T09:30:00",
            },
            {
                "transaction_id": "TX-004",
                "user_id": "USER-001",
                "amount": 4500,
                "currency": "AUD",
                "beneficiary_id": "BEN-099",
                "beneficiary_country": "NG",
                "payment_channel": "international_transfer",
                "created_at": "2026-09-09T10:00:00",
            },
            {
                "transaction_id": "TX-005",
                "user_id": "USER-002",
                "amount": 200,
                "currency": "AUD",
                "beneficiary_id": "BEN-010",
                "beneficiary_country": "AU",
                "payment_channel": "bank_transfer",
                "created_at": "2026-09-09T10:00:00",
            },
            {
                "transaction_id": "TX-006",
                "user_id": "USER-002",
                "amount": 240,
                "currency": "AUD",
                "beneficiary_id": "BEN-010",
                "beneficiary_country": "AU",
                "payment_channel": "bank_transfer",
                "created_at": "2026-09-09T10:20:00",
            },
            {
                "transaction_id": "TX-007",
                "user_id": "USER-003",
                "amount": 3200,
                "currency": "AUD",
                "beneficiary_id": "BEN-020",
                "beneficiary_country": "AU",
                "payment_channel": "crypto_wallet",
                "created_at": "2026-09-09T02:15:00",
            },
        ]

        cls.features = build_transaction_features(transactions)

    def get_transaction(self, transaction_id):
        return next(
            transaction
            for transaction in self.features
            if transaction["transaction_id"] == transaction_id
        )

    def test_large_risky_transaction_features(self):
        transaction = self.get_transaction("TX-004")

        self.assertEqual(
            transaction["recent_transaction_count"],
            3,
        )
        self.assertEqual(
            transaction["is_new_beneficiary"],
            1,
        )
        self.assertEqual(
            transaction["is_unusually_large"],
            1,
        )
        self.assertEqual(
            transaction["is_unusual_country"],
            1,
        )
        self.assertEqual(
            transaction["is_risky_payment_channel"],
            1,
        )

    def test_normal_transaction_features(self):
        transaction = self.get_transaction("TX-002")

        self.assertEqual(
            transaction["is_new_beneficiary"],
            0,
        )
        self.assertEqual(
            transaction["is_unusually_large"],
            0,
        )
        self.assertEqual(
            transaction["is_unusual_country"],
            0,
        )
        self.assertEqual(
            transaction["is_risky_payment_channel"],
            0,
        )

    def test_all_transactions_receive_features(self):
        self.assertEqual(len(self.features), 7)

        for transaction in self.features:
            self.assertIn(
                "recent_transaction_count",
                transaction,
            )
            self.assertIn(
                "is_new_beneficiary",
                transaction,
            )
            self.assertIn(
                "is_unusually_large",
                transaction,
            )
            self.assertIn(
                "is_unusual_country",
                transaction,
            )
            self.assertIn(
                "is_risky_payment_channel",
                transaction,
            )


if __name__ == "__main__":
    unittest.main()