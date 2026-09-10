from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.repositories.analysis_repository import create_analysis
from app.risk_engine.scoring import calculate_risk
from app.schemas.risk import RiskFeaturesRequest


def analyze_features(
    db: Session,
    data: RiskFeaturesRequest,
    user_id: int,
) -> dict:
    features = data.model_dump()

    risk_result = calculate_risk(features)

    analysis = Analysis(
        user_id=user_id,
        analysis_type="transaction",
        predicted_class=None,
        risk_score=risk_result["rule_score"],
        risk_level=risk_result["risk_level"],
        triggered_rules=risk_result["triggered_rules"],
        features=features,
        model_version="mock-rules-v1",
    )

    saved_analysis = create_analysis(db, analysis)

    return {
        "analysis_id": saved_analysis.id,
        "user_id": saved_analysis.user_id,
        "analysis_type": saved_analysis.analysis_type,
        "predicted_class": saved_analysis.predicted_class,
        "risk_score": saved_analysis.risk_score,
        "risk_level": saved_analysis.risk_level,
        "triggered_rules": saved_analysis.triggered_rules,
        "features": saved_analysis.features,
        "model_version": saved_analysis.model_version,
        "created_at": saved_analysis.created_at,
    }