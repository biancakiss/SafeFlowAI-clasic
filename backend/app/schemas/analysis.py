from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AnalysisResponse(BaseModel):
    analysis_id: int
    user_id: int
    analysis_type: str
    predicted_class: str | None
    risk_score: int
    risk_level: str
    triggered_rules: list[dict[str, Any]]
    features: dict[str, Any]
    model_version: str | None
    created_at: datetime