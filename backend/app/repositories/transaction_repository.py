from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def create_transaction(
    db: Session,
    *,
    user_id: int,
    transaction_id: str,
    amount: Decimal,
    currency: str,
    beneficiary_id: str,
    beneficiary_name: str,
    beneficiary_country: str,
    payment_channel: str,
    description: str | None,
    created_at: datetime,
    status: str = "in_review",
) -> Transaction:
    transaction = Transaction(
        user_id=user_id,
        transaction_id=transaction_id,
        amount=amount,
        currency=currency,
        beneficiary_id=beneficiary_id,
        beneficiary_name=beneficiary_name,
        beneficiary_country=beneficiary_country,
        payment_channel=payment_channel,
        description=description,
        created_at=created_at,
        status=status,
    )

    db.add(transaction)
    db.flush()
    db.refresh(transaction)

    return transaction


def get_user_transactions(
    db: Session,
    *,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Transaction]:
    statement = (
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = db.execute(statement)

    return list(result.scalars().all())


def get_user_transaction_by_id(
    db: Session,
    *,
    transaction_db_id: int,
    user_id: int,
) -> Transaction | None:
    statement = (
        select(Transaction)
        .where(
            Transaction.id == transaction_db_id,
            Transaction.user_id == user_id,
        )
    )

    result = db.execute(statement)

    return result.scalar_one_or_none()


def update_transaction_status(
    db: Session,
    *,
    transaction: Transaction,
    status: str,
) -> Transaction:
    transaction.status = status

    db.commit()
    db.refresh(transaction)

    return transaction


def get_user_transaction_by_external_id(
    db: Session,
    user_id: int,
    transaction_id: str,
)-> Transaction | None:
    statement = select(Transaction).where(
        Transaction.user_id == user_id,
        Transaction.transaction_id == transaction_id,
    )

    return db.scalars(statement).first()