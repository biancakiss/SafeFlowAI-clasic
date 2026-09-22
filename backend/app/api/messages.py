from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.analysis import AnalysisResponse
from app.schemas.message import (
    MessageRequest,
    MessageResponse,
)
from app.services.message_service import (
    analyze_message,
    get_user_message_details,
    get_user_messages,
)

router = APIRouter(
    prefix="/api/v1/messages",
    tags=["Messages"],
)


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_201_CREATED,
)
def analyze_message_endpoint(
    data: MessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return analyze_message(
        db,
        data=data,
        user_id=current_user.id,
    )

@router.get(
    "/",
    response_model=list[MessageResponse],
)
def get_messages_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return get_user_messages(
        db,
        user_id=current_user.id,
    )


@router.get(
    "/{message_id}",
    response_model=MessageResponse,
)
def get_message_details_endpoint(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return get_user_message_details(
        db,
        user_id=current_user.id,
        message_id=message_id,
    )