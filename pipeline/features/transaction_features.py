from datetime import datetime, timedelta
from typing import Any


RECENT_TRANSACTION_WINDOW_MINUTES = 60
LARGE_AMOUNT_THRESHOLD = 1000

RISKY_PAYMENT_CHANNELS = {
    "international_transfer",
    "crypto_wallet",
    "cash_transfer",
}


def parse_datetime(value: str) -> datetime:
    """Convert an ISO timestamp into a datetime object."""
    return datetime.fromisoformat(value)


def get_user_history(
    transactions: list[dict[str, Any]],
    current_transaction: dict[str, Any],
) -> list[dict[str, Any]]:
    """Return transactions belonging to the same user and occurring earlier."""
    current_time = parse_datetime(current_transaction["created_at"])
    current_user_id = current_transaction["user_id"]

    return [
        transaction
        for transaction in transactions
        if transaction["user_id"] == current_user_id
        and parse_datetime(transaction["created_at"]) < current_time
    ]


def calculate_recent_transaction_count(
    history: list[dict[str, Any]],
    current_transaction: dict[str, Any],
) -> int:
    """Count previous transactions made by the same user in the recent time window."""
    current_time = parse_datetime(current_transaction["created_at"])
    window_start = current_time - timedelta(
        minutes=RECENT_TRANSACTION_WINDOW_MINUTES
    )

    return sum(
        1
        for transaction in history
        if parse_datetime(transaction["created_at"]) >= window_start
    )


def detect_new_beneficiary(
    history: list[dict[str, Any]],
    current_transaction: dict[str, Any],
) -> int:
    """Return 1 if the beneficiary has not been used before by the user."""
    previous_beneficiaries = {
        transaction["beneficiary_id"]
        for transaction in history
    }

    return int(
        current_transaction["beneficiary_id"] not in previous_beneficiaries
    )


def detect_unusually_large_amount(
    history: list[dict[str, Any]],
    current_transaction: dict[str, Any],
) -> int:
    """Return 1 if the amount is unusually large."""
    current_amount = float(current_transaction["amount"])

    if current_amount >= LARGE_AMOUNT_THRESHOLD:
        return 1

    if not history:
        return 0

    previous_amounts = [
        float(transaction["amount"])
        for transaction in history
    ]

    average_previous_amount = sum(previous_amounts) / len(previous_amounts)

    return int(current_amount > average_previous_amount * 2)


def detect_unusual_country(
    history: list[dict[str, Any]],
    current_transaction: dict[str, Any],
) -> int:
    """Return 1 if the country was not previously used by the user."""
    if not history:
        return 0

    previous_countries = {
        transaction["beneficiary_country"]
        for transaction in history
    }

    return int(
        current_transaction["beneficiary_country"]
        not in previous_countries
    )


def detect_risky_payment_channel(
    current_transaction: dict[str, Any],
) -> int:
    """Return 1 if the payment channel is considered risky."""
    return int(
        current_transaction["payment_channel"]
        in RISKY_PAYMENT_CHANNELS
    )


def build_transaction_features(
    transactions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Build risk-related features for every transaction."""
    enriched_transactions = []

    for transaction in transactions:
        history = get_user_history(transactions, transaction)

        enriched_transaction = {
            **transaction,
            "recent_transaction_count": (
                calculate_recent_transaction_count(
                    history,
                    transaction,
                )
            ),
            "is_new_beneficiary": detect_new_beneficiary(
                history,
                transaction,
            ),
            "is_unusually_large": detect_unusually_large_amount(
                history,
                transaction,
            ),
            "is_unusual_country": detect_unusual_country(
                history,
                transaction,
            ),
            "is_risky_payment_channel": detect_risky_payment_channel(
                transaction,
            ),
        }

        enriched_transactions.append(enriched_transaction)

    return enriched_transactions