from typing import Literal, Any
from datetime import datetime

from pydantic import BaseModel, Field, field_validator, ConfigDict


class MessageRequest(BaseModel):
    message_type: Literal["sms", "email"]

    body: str = Field(
        ...,
        min_length=1,
        description="The message body",
    )

    sender: str | None = Field(
        default=None,
        max_length=255,
    )

    receiver: str | None = Field(
        default=None,
        max_length=255,
    )

    subject: str | None = Field(
        default=None,
        max_length=500,
    )

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Message body cannot be empty"
            )

        return value

class MessageResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    message_type: Literal["email", "sms"]
    sender: str
    receiver: str
    subject: str | None
    body: str
    created_at: datetime

    analysis_id: int | None = None
    predicted_class: str | None = None
    model_score: float | None = None
    risk_score: int | None = None
    risk_level: str | None = None
    triggered_rules: list[dict[str, Any]] = Field(
        default_factory=list
    )