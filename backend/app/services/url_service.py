from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.url import Url
from app.repositories.analysis_repository import create_analysis
from app.repositories.url_repository import (
    create_url,
)
from app.risk_engine.url_features import build_url_features
from app.risk_engine.url_scoring import calculate_url_risk
from app.schemas.url import (
    UrlAnalysisRequest,
    UrlAnalysisResponse,
)
from app.services.url_model_service import predict_url


def build_url_response(
    url_record: Url,
    analysis: Analysis,
) -> UrlAnalysisResponse:
    return UrlAnalysisResponse(
        id=url_record.id,
        analysis_id=analysis.id,
        user_id=url_record.user_id,
        url=url_record.url,
        predicted_class=analysis.predicted_class,
        model_score=analysis.model_score,
        risk_score=analysis.risk_score,
        risk_level=analysis.risk_level,
        triggered_rules=analysis.triggered_rules or [],
        features=analysis.features or {},
        model_version=analysis.model_version,
        created_at=analysis.created_at,
    )


def analyze_url(
    db: Session,
    *,
    data: UrlAnalysisRequest,
    user_id: int,
) -> UrlAnalysisResponse:
    normalized_url = str(data.url)

    model_result = predict_url(normalized_url)

    prediction = model_result["prediction"]

    features = build_url_features(
        normalized_url
    )

    risk_result = calculate_url_risk(
        prediction=prediction,
        features=features,
    )

    url_record = create_url(
        db,
        user_id=user_id,
        url=normalized_url,
    )

    analysis = create_analysis(
        db,
        user_id=user_id,
        message_id=None,
        transaction_db_id=None,
        url_db_id=url_record.id,
        analysis_type="url",
        predicted_class=prediction,
        model_score=model_result.get(
            "model_score"
        ),
        risk_score=risk_result["risk_score"],
        risk_level=risk_result["risk_level"],
        features=features,
        triggered_rules=risk_result[
            "triggered_rules"
        ],
        model_version=model_result.get(
            "model_version"
        ),
    )

    return build_url_response(
        url_record,
        analysis,
    )


def get_urls_for_user(
    db: Session,
    *,
    user_id: int,
) -> list[UrlAnalysisResponse]:
    results = (
        db.query(Url, Analysis)
        .join(
            Analysis,
            Analysis.url_db_id == Url.id,
        )
        .filter(Url.user_id == user_id)
        .order_by(Url.created_at.desc())
        .all()
    )

    return [
        build_url_response(
            url_record,
            analysis,
        )
        for url_record, analysis in results
    ]


def get_url_details(
    db: Session,
    *,
    user_id: int,
    url_id: int,
) -> UrlAnalysisResponse:
    result = (
        db.query(Url, Analysis)
        .join(
            Analysis,
            Analysis.url_db_id == Url.id,
        )
        .filter(
            Url.id == url_id,
            Url.user_id == user_id,
        )
        .first()
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="URL analysis not found",
        )

    url_record, analysis = result

    return build_url_response(
        url_record,
        analysis,
    )