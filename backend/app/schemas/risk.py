from pydantic import BaseModel, Field


class RiskFeaturesRequest(BaseModel):
    is_new_beneficiary: int = Field(ge=0, le=1)
    is_unusually_large: int = Field(ge=0, le=1)
    recent_transaction_count: int = Field(ge=0)
    is_unusual_country: int = Field(ge=0, le=1)
    is_risky_payment_channel: int = Field(ge=0, le=1)