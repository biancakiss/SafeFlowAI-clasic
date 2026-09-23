from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.analysis_repository import (
    create_analysis,
)
from app.repositories.transaction_repository import (
    create_transaction,
    get_user_transactions,
)
from app.risk_engine.scoring import calculate_risk
from app.schemas.analysis import AnalysisResponse
from app.schemas.transaction import TransactionRequest
from app.services.notification_observer import (
    TransactionStatusNotificationObserver,
)


RECENT_TRANSACTION_WINDOW_MINUTES = 60


def build_transaction_features(
    previous_transactions: list[Transaction],
    current_transaction: TransactionRequest,
    user_id: int,
    beneficiary_id: str,
) -> dict:
    current_time = current_transaction.created_at

    user_history = [
        transaction
        for transaction in previous_transactions
        if transaction.user_id == user_id
        and transaction.created_at
        and transaction.created_at < current_time
    ]

    window_start = (
        current_time
        - timedelta(
            minutes=RECENT_TRANSACTION_WINDOW_MINUTES
        )
    )

    recent_transaction_count = sum(
        1
        for transaction in user_history
        if transaction.created_at >= window_start
    )

    previous_beneficiaries = {
        transaction.beneficiary_id
        for transaction in user_history
    }

    is_new_beneficiary = int(
        beneficiary_id
        not in previous_beneficiaries
    )

    current_amount = float(
        current_transaction.amount
    )

    if current_amount >= 1000:
        is_unusually_large = 1
    elif not user_history:
        is_unusually_large = 0
    else:
        previous_amounts = [
            float(transaction.amount)
            for transaction in user_history
        ]

        average_amount = (
            sum(previous_amounts)
            / len(previous_amounts)
        )

        is_unusually_large = int(
            current_amount > average_amount * 2
        )

    previous_countries = {
        transaction.beneficiary_country
        for transaction in user_history
    }

    if not user_history:
        is_unusual_country = 0
    else:
        is_unusual_country = int(
            current_transaction.beneficiary_country
            not in previous_countries
        )

    risky_channels = {
        "international_transfer",
        "crypto_wallet",
        "cash_transfer",
    }

    is_risky_payment_channel = int(
        current_transaction.payment_channel
        in risky_channels
    )

    return {
        "is_new_beneficiary": is_new_beneficiary,
        "is_unusually_large": is_unusually_large,
        "recent_transaction_count": (
            recent_transaction_count
        ),
        "is_unusual_country": is_unusual_country,
        "is_risky_payment_channel": (
            is_risky_payment_channel
        ),
    }

def get_transaction_status(
    risk_level: str,
) -> str:
    return "in_review"

def get_recommended_action(
    risk_level: str,
) -> str:
    risk_level = risk_level.upper()

    if risk_level == "LOW":
        return "APPROVE"

    return "REVIEW"

def analyze_transaction(
    db: Session,
    *,
    data: TransactionRequest,
    user_id: int,
) -> AnalysisResponse:
    previous_transactions = get_user_transactions(
        db,
        user_id=user_id,
        limit=1000,
    )

    transaction_id = (
        f"TX-{uuid4().hex[:10].upper()}"
    )

    beneficiary_id = (
        data.beneficiary_name
        .strip()
        .lower()
    )

    features = build_transaction_features(
        previous_transactions,
        data,
        user_id,
        beneficiary_id,
    )

    risk_result = calculate_risk(features)

    risk_score = int(
        risk_result.get(
            "risk_score",
            risk_result.get("rule_score", 0),
        )
    )

    risk_level = risk_result.get(
        "risk_level",
        "LOW",
    )

    recommended_action = get_recommended_action(
        risk_level
    )

    triggered_rules = risk_result.get(
        "triggered_rules",
        [],
    )

    status = get_transaction_status(
        risk_level
    )

    transaction = create_transaction(
        db,
        user_id=user_id,
        transaction_id=transaction_id,
        amount=data.amount,
        currency=data.currency,
        beneficiary_id=beneficiary_id,
        beneficiary_name=data.beneficiary_name,
        beneficiary_country=(
            data.beneficiary_country
        ),
        payment_channel=data.payment_channel,
        description=data.description,
        created_at=data.created_at,
        status=status,
    )

    analysis = create_analysis(
        db,
        user_id=user_id,
        message_id=None,
        analysis_type="transaction",
        predicted_class=None,
        model_score=None,
        risk_score=risk_score,
        risk_level=risk_level,
        features=features,
        triggered_rules=triggered_rules,
        model_version="transaction-rules-v1",
        transaction_db_id=transaction.id,
    )

    TransactionStatusNotificationObserver(db).on_transaction_analyzed(
        transaction=transaction,
        risk_level=analysis.risk_level,
        risk_score=analysis.risk_score,
    )

    return AnalysisResponse(
        analysis_id=analysis.id,
        message_id=None,
        transaction_id=transaction.transaction_id,
        user_id=analysis.user_id,
        analysis_type="transaction",
        predicted_class=None,
        model_score=None,
        risk_score=analysis.risk_score,
        risk_level=analysis.risk_level,
        status=transaction.status,
        recommended_action=recommended_action,
        triggered_rules=analysis.triggered_rules,
        features=analysis.features,
        model_version=analysis.model_version,
        created_at=analysis.created_at,
    )
