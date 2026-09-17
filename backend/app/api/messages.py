from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.analysis import AnalysisResponse
from app.schemas.message import MessageRequest
from app.services.message_service import analyze_message


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