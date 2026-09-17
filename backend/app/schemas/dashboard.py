from datetime import date
from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    payments_analyzed: int
    high_risk_payments: int
    potential_loss_prevented: Decimal
    safe_payment_rate: float


class RiskActivityItem(BaseModel):
    date: date
    analyzed: int
    high_risk: int


class RiskActivityResponse(BaseModel):
    days: int
    data: list[RiskActivityItem]


class RiskDistributionResponse(BaseModel):
    total: int
    low_risk: int
    medium_risk: int
    high_risk: int
    low_risk_percentage: float
    medium_risk_percentage: float
    high_risk_percentage: float

class RecentAnalysisResponse(BaseModel):
    transaction_id: str
    beneficiary_name: str
    beneficiary_country: str
    amount: Decimal
    currency: str
    risk_level: Literal[
        "LOW",
        "MEDIUM",
        "HIGH",
    ]
    risk_score: int
    status: Literal[
        "approved",
        "in_review",
        "blocked",
    ]
    created_at: datetime