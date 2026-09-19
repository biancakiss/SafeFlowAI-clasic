from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.analysis_repository import (
    create_analysis,
)
from app.repositories.message_repository import (
    create_message,
)
from app.risk_engine.email_analysis import (
    analyze_email,
)
from app.risk_engine.sms_analysis import (
    analyze_sms,
)
from app.schemas.analysis import AnalysisResponse
from app.schemas.message import MessageRequest


def get_risk_level(risk_score: int) -> str:
    if risk_score >= 70:
        return "HIGH"

    if risk_score >= 40:
        return "MEDIUM"

    return "LOW"


def analyze_message(
    db: Session,
    *,
    data: MessageRequest,
    user_id: int,
) -> AnalysisResponse:

    if data.message_type == "email":
        analysis_result = analyze_email(
            subject=data.subject or "",
            body=data.body,
        )

    elif data.message_type == "sms":
        analysis_result = analyze_sms(
            body=data.body,
        )

    else:
        raise HTTPException(
            status_code=400,
            detail=(
                "message_type must be "
                "'email' or 'sms'."
            ),
        )

    ml_result = analysis_result[
        "ml_result"
    ]

    risk_result = analysis_result[
        "risk_result"
    ]

    predicted_class = ml_result.get(
        "predicted_class",
        ml_result.get("prediction"),
    )

    model_score = ml_result.get(
        "model_score"
    )

    risk_score = risk_result.get(
        "risk_score",
        risk_result.get(
            "rule_score",
            0,
        ),
    )

    risk_level = risk_result.get(
        "risk_level",
        get_risk_level(risk_score),
    )

    triggered_rules = risk_result.get(
        "triggered_rules",
        [],
    )

    content_features = analysis_result.get(
        "content_features",
        {},
    )

    cleaned_text = analysis_result.get(
        "cleaned_text",
        data.body,
    )

    message = create_message(
        db,
        user_id=user_id,
        message_type=data.message_type,
        sender=data.sender,
        receiver=data.receiver,
        subject=data.subject,
        body=data.body,
        cleaned_text=cleaned_text,
    )

    analysis = create_analysis(
        db,
        user_id=user_id,
        message_id=message.id,
        analysis_type=data.message_type,
        predicted_class=predicted_class,
        model_score=model_score,
        risk_score=risk_score,
        risk_level=risk_level,
        features=content_features,
        triggered_rules=triggered_rules,
        model_version=ml_result.get(
            "model_version"
        ),
    )

    return AnalysisResponse(
        analysis_id=analysis.id,
        message_id=message.id,
        user_id=analysis.user_id,
        analysis_type=analysis.analysis_type,
        predicted_class=analysis.predicted_class,
        model_score=analysis.model_score,
        risk_score=analysis.risk_score,
        risk_level=analysis.risk_level,
        triggered_rules=analysis.triggered_rules,
        features=analysis.features,
        model_version=analysis.model_version,
        created_at=analysis.created_at,
    )