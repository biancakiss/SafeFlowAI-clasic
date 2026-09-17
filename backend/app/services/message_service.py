from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.analysis_repository import (
    create_analysis,
)
from app.repositories.message_repository import (
    create_message,
)
from app.schemas.analysis import AnalysisResponse
from app.schemas.message import MessageRequest
from app.services.email_model_service import (
    predict_email,
    prepare_email_text,
)


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
    if data.message_type != "email":
        raise HTTPException(
            status_code=501,
            detail=(
                "The real model is currently "
                "available only for emails."
            ),
        )

    cleaned_message = prepare_email_text(
        data.subject,
        data.body,
    )

    prediction = predict_email(
        data.subject,
        data.body,
    )

    predicted_class = prediction[
        "predicted_class"
    ]

    model_score = prediction[
        "decision_margin"
    ]

    risk_score = prediction[
        "risk_score"
    ]

    risk_level = get_risk_level(
        risk_score
    )

    message = create_message(
        db,
        user_id=user_id,
        message_type=data.message_type,
        sender=data.sender,
        receiver=data.receiver,
        subject=data.subject,
        body=data.body,
        cleaned_text=cleaned_message,
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
        features={
            "preprocessing_version": (
                prediction[
                    "preprocessing_version"
                ]
            ),
            "score_type": "decision_margin",
            "text_length": len(cleaned_message),
        },
        triggered_rules=[],
        model_version=prediction[
            "model_version"
        ],
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