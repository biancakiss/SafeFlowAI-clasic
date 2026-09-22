from datetime import datetime
from typing import Any, Literal

from pydantic import (
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    Field,
)


class UrlAnalysisRequest(BaseModel):
    url: AnyHttpUrl


class UrlAnalysisResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    analysis_id: int
    user_id: int
    url: str

    predicted_class: Literal[
        "safe",
        "suspicious",
    ]

    model_score: float | None = None
    risk_score: int

    risk_level: Literal[
        "LOW",
        "MEDIUM",
        "HIGH",
    ]

    triggered_rules: list[dict[str, Any]] = Field(
        default_factory=list
    )

    features: dict[str, Any] = Field(
        default_factory=dict
    )

    model_version: str | None = None
    created_at: datetime