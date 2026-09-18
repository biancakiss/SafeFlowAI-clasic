from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    transaction_db_id: int | None
    title: str
    message: str
    is_read: bool
    created_at: datetime