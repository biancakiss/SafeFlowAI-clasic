from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.url import (
    UrlAnalysisRequest,
    UrlAnalysisResponse,
)
from app.services.url_service import (
    analyze_url,
    get_url_details,
    get_urls_for_user,
)


router = APIRouter(
    prefix="/api/v1/urls",
    tags=["URLs"],
)


@router.post(
    "/analyze",
    response_model=UrlAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
)
def analyze_url_endpoint(
    data: UrlAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return analyze_url(
        db,
        data=data,
        user_id=current_user.id,
    )


@router.get(
    "/",
    response_model=list[UrlAnalysisResponse],
)
def get_urls_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return get_urls_for_user(
        db,
        user_id=current_user.id,
    )


@router.get(
    "/{url_id}",
    response_model=UrlAnalysisResponse,
)
def get_url_details_endpoint(
    url_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return get_url_details(
        db,
        user_id=current_user.id,
        url_id=url_id,
    )