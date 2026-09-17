from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.analysis_repository import (
    get_user_analyses,
)
from app.schemas.analysis import AnalysisHistoryResponse


router = APIRouter(
    prefix="/api/v1/analyses",
    tags=["Analyses"],
)


@router.get(
    "",
    response_model=list[AnalysisHistoryResponse],
)
def get_my_analyses(
    skip: int = Query(
        default=0,
        ge=0,
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return get_user_analyses(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )