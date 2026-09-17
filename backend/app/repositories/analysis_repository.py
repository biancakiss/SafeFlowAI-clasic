from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.analysis import Analysis


def create_analysis(
    db: Session,
    *,
    user_id: int,
    message_id: int | None,
    analysis_type: str,
    predicted_class: str | None,
    model_score: float | None,
    risk_score: int,
    risk_level: str,
    features: dict,
    triggered_rules: list,
    model_version: str | None,
    transaction_db_id: int | None = None,
) -> Analysis:
    analysis = Analysis(
        user_id=user_id,
        message_id=message_id,
        analysis_type=analysis_type,
        predicted_class=predicted_class,
        model_score=model_score,
        risk_score=risk_score,
        risk_level=risk_level,
        features=features,
        triggered_rules=triggered_rules,
        model_version=model_version,
        transaction_db_id=transaction_db_id,
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis

def get_user_analyses(
    db: Session,
    *,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Analysis]:
    statement = (
        select(Analysis)
        .where(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = db.execute(statement)

    return list(result.scalars().all())

def get_latest_transaction_analysis(
    db: Session,
    transaction_db_id: int,
    user_id: int,
):
    statement = (
        select(Analysis)
        .where(
            Analysis.transaction_db_id == transaction_db_id,
            Analysis.user_id == user_id,
            Analysis.analysis_type == "transaction",
        )
        .order_by(Analysis.created_at.desc())
    )

    return db.scalars(statement).first()