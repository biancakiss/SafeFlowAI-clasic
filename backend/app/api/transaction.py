from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User

from app.repositories.analysis_repository import (
    get_latest_transaction_analysis,
)

from app.repositories.transaction_repository import (
    get_user_transaction_by_external_id,
    get_user_transactions,
    update_transaction_status,
)

from app.schemas.analysis import AnalysisResponse

from app.schemas.transaction import (
    TransactionStatusUpdateRequest,
    TransactionDetailResponse,
    TransactionRequest,
    TransactionResponse,
)

from app.services.transaction_service import (
    analyze_transaction,
)


router = APIRouter(
    prefix="/api/v1/transactions",
    tags=["Transactions"],
)


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_201_CREATED,
)
def analyze_transaction_endpoint(
    data: TransactionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analyze_transaction(
        db,
        data=data,
        user_id=current_user.id,
    )

@router.get(
    "/",
    response_model=list[TransactionResponse],
)
def get_transactions(
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
    current_user: User = Depends(get_current_user),
):
    return get_user_transactions(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{transaction_id}",
    response_model=TransactionDetailResponse,
)
def get_transaction_details(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = get_user_transaction_by_external_id(
        db,
        user_id=current_user.id,
        transaction_id=transaction_id,
    )

    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    analysis = get_latest_transaction_analysis(
        db,
        transaction_db_id=transaction.id,
        user_id=current_user.id,
    )

    return {
        "id": transaction.id,
        "user_id": transaction.user_id,
        "transaction_id": transaction.transaction_id,
        "amount": transaction.amount,
        "currency": transaction.currency,
        "beneficiary_id": transaction.beneficiary_id,
        "beneficiary_name": transaction.beneficiary_name,
        "beneficiary_country": transaction.beneficiary_country,
        "payment_channel": transaction.payment_channel,
        "description": transaction.description,
        "status": transaction.status,
        "created_at": transaction.created_at,
        "analysis_id": analysis.id if analysis else None,
        "risk_score": analysis.risk_score if analysis else None,
        "risk_level": analysis.risk_level if analysis else None,
        "triggered_rules": (
            analysis.triggered_rules
            if analysis
            else []
        ),
        "recommended_action": (
            "BLOCK"
            if analysis and analysis.risk_level == "HIGH"
            else "REVIEW"
            if analysis and analysis.risk_level == "MEDIUM"
            else "APPROVE"
            if analysis
            else None
        ),
    }

@router.patch(
    "/{transaction_id}/status",
    response_model=TransactionResponse,
)
def update_transaction_status_endpoint(
    transaction_id: str,
    data: TransactionStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = get_user_transaction_by_external_id(
        db,
        user_id=current_user.id,
        transaction_id=transaction_id,
    )

    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    updated_transaction = update_transaction_status(
        db,
        transaction=transaction,
        status=data.status,
    )

    return updated_transaction