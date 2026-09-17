from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.repositories.dashboard_repository import (
    get_dashboard_summary,
    get_risk_activity,
    get_risk_distribution,
    get_recent_analyses,
)
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    RiskActivityItem,
    RiskActivityResponse,
    RiskDistributionResponse,
    RecentAnalysisResponse,
)

def get_summary(
    db: Session,
) -> DashboardSummaryResponse:
    summary = get_dashboard_summary(db)

    return DashboardSummaryResponse(
        **summary
    )

def get_activity(
    db: Session,
    *,
    days: int,
) -> RiskActivityResponse:
    rows = get_risk_activity(
        db,
        days=days,
    )

    today = datetime.now(timezone.utc).date()
    first_day = today - timedelta(days=days - 1)

    rows_by_date = {
        row.date: row
        for row in rows
    }

    activity = []

    for day_number in range(days):
        current_date = (
            first_day
            + timedelta(days=day_number)
        )

        row = rows_by_date.get(current_date)

        activity.append(
            RiskActivityItem(
                date=current_date,
                analyzed=(
                    row.analyzed
                    if row
                    else 0
                ),
                high_risk=(
                    row.high_risk
                    if row
                    else 0
                ),
            )
        )

    return RiskActivityResponse(
        days=days,
        data=activity,
    )


def get_distribution(
    db: Session,
) -> RiskDistributionResponse:
    distribution = get_risk_distribution(db)

    low_risk = distribution["LOW"]
    medium_risk = distribution["MEDIUM"]
    high_risk = distribution["HIGH"]

    total = (
        low_risk
        + medium_risk
        + high_risk
    )

    if total > 0:
        low_percentage = round(
            low_risk / total * 100,
            2,
        )
        medium_percentage = round(
            medium_risk / total * 100,
            2,
        )
        high_percentage = round(
            high_risk / total * 100,
            2,
        )
    else:
        low_percentage = 0.0
        medium_percentage = 0.0
        high_percentage = 0.0

    return RiskDistributionResponse(
        total=total,
        low_risk=low_risk,
        medium_risk=medium_risk,
        high_risk=high_risk,
        low_risk_percentage=low_percentage,
        medium_risk_percentage=medium_percentage,
        high_risk_percentage=high_percentage,
    )

def get_recent(
    db: Session,
    *,
    limit: int,
) -> list[RecentAnalysisResponse]:
    rows = get_recent_analyses(
        db,
        limit=limit,
    )

    return [
        RecentAnalysisResponse(
            transaction_id=transaction.transaction_id,
            beneficiary_name=(
                transaction.beneficiary_name
            ),
            beneficiary_country=(
                transaction.beneficiary_country
            ),
            amount=transaction.amount,
            currency=transaction.currency,
            risk_level=analysis.risk_level,
            risk_score=analysis.risk_score,
            status=transaction.status,
            created_at=analysis.created_at,
        )
        for transaction, analysis in rows
    ]