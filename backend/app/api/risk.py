from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.analysis import AnalysisResponse
from app.schemas.risk import RiskFeaturesRequest
from app.services.risk_service import analyze_features


router = APIRouter(
    prefix="/api/v1/risk",
    tags=["Risk Analysis"],
)


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
)
def analyze_risk(
    data: RiskFeaturesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analyze_features(
        db=db,
        data=data,
        user_id=current_user.id,
    )