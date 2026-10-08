from datetime import timedelta
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.user import User
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
from app.services.transaction_model_service import (
    predict_transaction,
)


RECENT_TRANSACTION_WINDOW_MINUTES = 60


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

    if risk_level == "HIGH":
        return "BLOCK"

    return "REVIEW"


def _get_previous_transactions(
    db: Session,
    *,
    user_id: int,
) -> list[Transaction]:
    return get_user_transactions(
        db,
        user_id=user_id,
        limit=1000,
    )


def _calculate_history_features(
    previous_transactions: list[Transaction],
    *,
    data: TransactionRequest,
    user_id: int,
) -> dict:
    current_time = data.created_at

    user_history = [
        transaction
        for transaction in previous_transactions
        if (
            transaction.user_id == user_id
            and transaction.created_at is not None
            and transaction.created_at < current_time
        )
    ]

    beneficiary_id = (
        data.beneficiary_name
        .strip()
        .lower()
    )

    previous_beneficiaries = {
        (
            transaction.beneficiary_id
            or transaction.beneficiary_name
            .strip()
            .lower()
        )
        for transaction in user_history
    }

    is_new_beneficiary = int(
        beneficiary_id not in previous_beneficiaries
    )

    velocity_start = (
        current_time - timedelta(hours=24)
    )

    velocity_24h = sum(
        1
        for transaction in user_history
        if transaction.created_at >= velocity_start
    )

    recent_window_start = (
        current_time
        - timedelta(
            minutes=RECENT_TRANSACTION_WINDOW_MINUTES
        )
    )

    recent_transaction_count = sum(
        1
        for transaction in user_history
        if transaction.created_at >= recent_window_start
    )

    

    current_amount = float(data.amount)

    if not user_history:
        is_unusually_large = int(
            current_amount >= 5000
        )
    else:
        previous_amounts = [
            float(transaction.amount)
            for transaction in user_history
        ]

        average_amount = (
            sum(previous_amounts)
            / len(previous_amounts)
        )

        max_previous_amount = max(
            previous_amounts
        )

    is_unusually_large = int(
        current_amount > max(
            average_amount * 3,
            max_previous_amount * 1.5,
            5000,
        )
    )

    previous_countries = {
        transaction.beneficiary_country
        for transaction in user_history
    }

    is_unusual_country = int(
        bool(user_history)
        and data.beneficiary_country
        not in previous_countries
    )

    risky_channels = {
        "international_transfer",
        "crypto_wallet",
        "cash_transfer",
    }

    is_risky_payment_channel = int(
        data.payment_channel in risky_channels
    )

    return {
        "is_new_beneficiary": is_new_beneficiary,
        "velocity_24h": velocity_24h,
        "recent_transaction_count": (
            recent_transaction_count
        ),
        "is_unusually_large": is_unusually_large,
        "is_unusual_country": is_unusual_country,
        "is_risky_payment_channel": (
            is_risky_payment_channel
        ),
    }


def build_transaction_features(
    db: Session,
    *,
    data: TransactionRequest,
    user_id: int,
    previous_transactions: list[Transaction],
) -> dict:
    """
    Construiește exact feature-urile cerute
    de modelul ML.
    """

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    history_features = (
        _calculate_history_features(
            previous_transactions,
            data=data,
            user_id=user_id,
        )
    )

    account_age_days = max(
        0,
        (
            data.created_at
            - user.created_at
        ).days,
    )

    is_international = int(
        data.beneficiary_country.upper()
        != "AU"
        or data.payment_channel
        == "international_transfer"
    )

    return {
        "amount": float(data.amount),
        "hour": data.created_at.hour,
        "is_new_beneficiary": (
            history_features[
                "is_new_beneficiary"
            ]
        ),
        "is_international": is_international,
        "velocity_24h": (
            history_features[
                "velocity_24h"
            ]
        ),
        "account_age_days": account_age_days,
        "currency": data.currency,
        "payment_channel": data.payment_channel,
        "beneficiary_country": (
            data.beneficiary_country
        ),
    }


def analyze_transaction(
    db: Session,
    *,
    data: TransactionRequest,
    user_id: int,
) -> AnalysisResponse:
    previous_transactions = (
        _get_previous_transactions(
            db,
            user_id=user_id,
        )
    )

    model_features = build_transaction_features(
        db,
        data=data,
        user_id=user_id,
        previous_transactions=previous_transactions,
    )

    rule_features = _calculate_history_features(
        previous_transactions,
        data=data,
        user_id=user_id,
    )

    model_result = predict_transaction(
        model_features
    )

    risk_result = calculate_risk(
        features=rule_features,
        model_result=model_result,
    )

    risk_score = int(
        risk_result.get(
            "risk_score",
            risk_result.get(
                "rule_score",
                0,
            ),
        )
    )

    risk_level = risk_result.get(
        "risk_level",
        "LOW",
    )

    triggered_rules = risk_result.get(
        "triggered_rules",
        [],
    )

    recommended_action = (
        get_recommended_action(
            risk_level
        )
    )

    transaction_status = (
        get_transaction_status(
            risk_level
        )
    )

    transaction_id = (
        f"TX-{uuid4().hex[:10].upper()}"
    )

    beneficiary_id = (
        data.beneficiary_name
        .strip()
        .lower()
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
        status=transaction_status,
    )

    saved_features = {
        **model_features,
        **rule_features,
    }

    analysis = create_analysis(
        db,
        user_id=user_id,
        transaction_db_id=transaction.id,
        message_id=None,
        analysis_type="transaction",
        predicted_class=model_result[
            "predicted_class"
        ],
        model_score=model_result[
            "model_score"
        ],
        risk_score=risk_score,
        risk_level=risk_level,
        features=saved_features,
        triggered_rules=triggered_rules,
        model_version=model_result[
            "model_version"
        ],
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
        analysis_type=analysis.analysis_type,
        predicted_class=analysis.predicted_class,
        model_score=analysis.model_score,
        risk_score=analysis.risk_score,
        risk_level=analysis.risk_level,
        status=transaction.status,
        recommended_action=recommended_action,
        triggered_rules=analysis.triggered_rules,
        features=analysis.features,
        model_version=analysis.model_version,
        created_at=analysis.created_at,
    )
