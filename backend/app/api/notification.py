from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.analysis import Analysis
from app.models.notification import Notification
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.notification import (
    ActionRequiredNotificationResponse,
    MarkAllNotificationsReadResponse,
    NotificationResponse,
)


router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["Notifications"],
)


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_notifications(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )

@router.get(
    "/unread",
    response_model=list[NotificationResponse],
)
def get_unread_notifications(
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .order_by(
            Notification.created_at.desc()
        )
        .limit(limit)
        .all()
    )


@router.get(
    "/action-required",
    response_model=list[ActionRequiredNotificationResponse],
)
def get_action_required_notifications(
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    latest_analysis = (
        db.query(
            Analysis.transaction_db_id.label("transaction_db_id"),
            func.max(Analysis.id).label("analysis_id"),
        )
        .filter(
            Analysis.user_id == current_user.id,
            Analysis.analysis_type == "transaction",
        )
        .group_by(Analysis.transaction_db_id)
        .subquery()
    )

    rows = (
        db.query(Transaction, Analysis)
        .outerjoin(
            latest_analysis,
            latest_analysis.c.transaction_db_id == Transaction.id,
        )
        .outerjoin(
            Analysis,
            Analysis.id == latest_analysis.c.analysis_id,
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.status == "in_review",
        )
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .all()
    )

    reminders = []

    for transaction, analysis in rows:
        is_high_risk = analysis is not None and analysis.risk_level == "HIGH"

        reminders.append(
            ActionRequiredNotificationResponse(
                key=f"transaction-review:{transaction.id}",
                transaction_db_id=transaction.id,
                transaction_id=transaction.transaction_id,
                title=(
                    "High-risk payment requires review"
                    if is_high_risk
                    else "Payment awaiting review"
                ),
                message=(
                    f"Payment {transaction.transaction_id} to "
                    f"{transaction.beneficiary_name} is waiting for an "
                    "analyst decision."
                ),
                risk_score=analysis.risk_score if analysis else None,
                risk_level=analysis.risk_level if analysis else None,
                created_at=transaction.created_at,
            )
        )

    return reminders


@router.patch(
    "/read-all",
    response_model=MarkAllNotificationsReadResponse,
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .update(
            {Notification.is_read: True},
            synchronize_session="fetch",
        )
    )

    db.commit()

    return MarkAllNotificationsReadResponse(updated=updated)

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification
