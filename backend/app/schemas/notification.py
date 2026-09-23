from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    transaction_db_id: int | None
    transaction_id: str | None = None
    title: str
    message: str
    is_read: bool
    created_at: datetime


class ActionRequiredNotificationResponse(BaseModel):
    key: str
    transaction_db_id: int
    transaction_id: str
    title: str
    message: str
    risk_score: int | None = None
    risk_level: str | None = None
    created_at: datetime


class MarkAllNotificationsReadResponse(BaseModel):
    updated: int
