from decimal import Decimal
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, case, func, select
from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.transaction import Transaction


def get_dashboard_summary(
    db: Session,
) -> dict:
    payments_analyzed = db.scalar(
        select(func.count(Transaction.id))
    ) or 0

    high_risk_payments = db.scalar(
        select(func.count(Analysis.id)).where(
            Analysis.analysis_type == "transaction",
            Analysis.risk_level == "HIGH",
        )
    ) or 0

    potential_loss_prevented = db.scalar(
        select(
            func.coalesce(
                func.sum(Transaction.amount),
                Decimal("0.00"),
            )
        )
        .join(
            Analysis,
            Analysis.transaction_db_id == Transaction.id,
        )
        .where(
            Transaction.status == "blocked",
            Analysis.analysis_type == "transaction",
        )
    ) or Decimal("0.00")

    approved_payments = db.scalar(
        select(func.count(Transaction.id)).where(
            Transaction.status == "approved"
        )
    ) or 0

    if payments_analyzed > 0:
        safe_payment_rate = round(
            approved_payments
            / payments_analyzed
            * 100,
            2,
        )
    else:
        safe_payment_rate = 0.0

    return {
        "payments_analyzed": payments_analyzed,
        "high_risk_payments": high_risk_payments,
        "potential_loss_prevented": potential_loss_prevented,
        "safe_payment_rate": safe_payment_rate,
    }

def get_risk_activity(
    db: Session,
    *,
    days: int,
) -> list:
    start_date = (
        datetime.now(timezone.utc)
        - timedelta(days=days - 1)
    )

    transaction_analysis_join = and_(
        Analysis.transaction_db_id == Transaction.id,
        Analysis.analysis_type == "transaction",
    )

    day_column = func.date(
        Transaction.created_at
    )

    statement = (
        select(
            day_column.label("date"),
            func.count(Transaction.id).label("analyzed"),
            func.count(
                case(
                    (
                        Analysis.risk_level == "HIGH",
                        1,
                    )
                )
            ).label("high_risk"),
        )
        .outerjoin(
            Analysis,
            transaction_analysis_join,
        )
        .where(
            Transaction.created_at >= start_date
        )
        .group_by(day_column)
        .order_by(day_column)
    )

    rows = db.execute(statement).all()

    return rows


def get_risk_distribution(
    db: Session,
) -> dict[str, int]:
    statement = (
        select(
            Analysis.risk_level,
            func.count(Analysis.id),
        )
        .where(
            Analysis.analysis_type == "transaction"
        )
        .group_by(Analysis.risk_level)
    )

    rows = db.execute(statement).all()

    distribution = {
        "LOW": 0,
        "MEDIUM": 0,
        "HIGH": 0,
    }

    for risk_level, count in rows:
        if risk_level in distribution:
            distribution[risk_level] = count

    return distribution

def get_recent_analyses(
    db: Session,
    *,
    limit: int,
) -> list:
    statement = (
        select(Transaction, Analysis)
        .join(
            Analysis,
            Analysis.transaction_db_id
            == Transaction.id,
        )
        .where(
            Analysis.analysis_type == "transaction"
        )
        .order_by(
            Analysis.created_at.desc()
        )
        .limit(limit)
    )

    rows = db.execute(statement).all()

    return rows