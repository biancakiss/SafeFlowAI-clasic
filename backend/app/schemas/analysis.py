from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

AnalysisType = Literal[
    "email",
    "sms",
    "transaction",
]

status: Literal[
    "approved",
    "in_review",
    "blocked",
] | None = None

class AnalysisResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    analysis_id: int
    message_id: int | None
    transaction_id: str | None = None
    recommended_action: str | None = None
    user_id: int
    analysis_type: AnalysisType
    predicted_class: str | None
    model_score: float | None
    risk_score: int
    risk_level: str
    status: Literal[
        "approved",
        "in_review",
        "blocked",
    ] | None = None
    triggered_rules: list[dict[str, Any]]
    features: dict[str, Any]
    model_version: str | None
    created_at: datetime | None


class AnalysisHistoryResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    message_id: int | None
    user_id: int
    analysis_type: AnalysisType
    predicted_class: str | None
    model_score: float | None
    risk_score: int
    risk_level: str
    triggered_rules: list[dict[str, Any]]
    features: dict[str, Any]
    model_version: str | None
    created_at: datetime | None