from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    RiskActivityResponse,
    RiskDistributionResponse,
    RecentAnalysisResponse,
)
from app.services.dashboard_service import (
    get_summary,
    get_activity,
    get_distribution,
    get_recent,
)

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"],
)

@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def get_dashboard_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_summary(db)

@router.get(
    "/risk-activity",
    response_model=RiskActivityResponse,
)
def get_risk_activity_endpoint(
    days: int = Query(
        default=7,
        ge=1,
        le=30,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_activity(
        db,
        days=days,
    )


@router.get(
    "/risk-distribution",
    response_model=RiskDistributionResponse,
)
def get_risk_distribution_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_distribution(db)

@router.get(
    "/recent-analyses",
    response_model=list[RecentAnalysisResponse],
)
def get_recent_analyses_endpoint(
    limit: int = Query(
        default=4,
        ge=1,
        le=4,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_recent(
        db,
        limit=limit,
    )