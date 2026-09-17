from typing import Literal

from pydantic import BaseModel, Field, field_validator


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