import json
import unittest
from pathlib import Path

from pipeline.features.transaction_features import (
    build_transaction_features,
)


class TestTransactionFeatures(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        data_path = Path("data/mock/transactions.json")
        transactions = json.loads(data_path.read_text())
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