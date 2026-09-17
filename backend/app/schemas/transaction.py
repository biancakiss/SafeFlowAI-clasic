from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


TransactionStatus = Literal[
    "approved",
    "in_review",
    "blocked",
]


class TransactionRequest(BaseModel):
    amount: Decimal = Field(
        ...,
        gt=0,
    )

    currency: str = Field(
        ...,
        min_length=3,
        max_length=10,
    )

    beneficiary_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    beneficiary_country: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    payment_channel: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    created_at: datetime

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator(
        "beneficiary_name",
        "beneficiary_country",
        "payment_channel",
    )
    @classmethod
    def validate_text_fields(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "This field cannot be empty"
            )

        return value


class TransactionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    transaction_id: str
    amount: Decimal
    currency: str
    beneficiary_id: str
    beneficiary_name: str
    beneficiary_country: str
    payment_channel: str
    description: str | None
    status: TransactionStatus
    created_at: datetime


class TransactionDetailResponse(BaseModel):
    id: int
    user_id: int
    transaction_id: str
    amount: Decimal
    currency: str
    beneficiary_id: str
    beneficiary_name: str
    beneficiary_country: str
    payment_channel: str
    description: str | None
    status: TransactionStatus
    created_at: datetime

    analysis_id: int | None = None
    risk_score: int | None = None
    risk_level: str | None = None

    triggered_rules: list[dict[str, Any]] = Field(
        default_factory=list
    )

    recommended_action: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )

class TransactionStatusUpdateRequest(BaseModel):
    status: TransactionStatus