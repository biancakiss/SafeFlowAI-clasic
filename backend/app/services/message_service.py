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
from app.models.analysis import Analysis
from app.models.message import Message
from app.schemas.message import (
    MessageRequest,
    MessageResponse,
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

def _build_message_response(
    message: Message,
    analysis: Analysis | None,
) -> MessageResponse:
    return MessageResponse(
        id=message.id,
        user_id=message.user_id,
        message_type=message.message_type,
        sender=message.sender,
        receiver=message.receiver,
        subject=message.subject,
        body=message.body,
        created_at=message.created_at,
        analysis_id=(
            analysis.id
            if analysis is not None
            else None
        ),
        predicted_class=(
            analysis.predicted_class
            if analysis is not None
            else None
        ),
        model_score=(
            analysis.model_score
            if analysis is not None
            else None
        ),
        risk_score=(
            analysis.risk_score
            if analysis is not None
            else None
        ),
        risk_level=(
            analysis.risk_level
            if analysis is not None
            else None
        ),
        triggered_rules=(
            analysis.triggered_rules
            if analysis is not None
            else []
        ),
    )


def get_user_messages(
    db: Session,
    *,
    user_id: int,
) -> list[MessageResponse]:
    messages = (
        db.query(Message)
        .filter(
            Message.user_id == user_id
        )
        .order_by(
            Message.created_at.desc()
        )
        .all()
    )

    result = []

    for message in messages:
        analysis = (
            db.query(Analysis)
            .filter(
                Analysis.message_id == message.id
            )
            .order_by(
                Analysis.created_at.desc()
            )
            .first()
        )

        result.append(
            _build_message_response(
                message,
                analysis,
            )
        )

    return result


def get_user_message_details(
    db: Session,
    *,
    user_id: int,
    message_id: int,
) -> MessageResponse:
    message = (
        db.query(Message)
        .filter(
            Message.id == message_id,
            Message.user_id == user_id,
        )
        .first()
    )

    if message is None:
        raise HTTPException(
            status_code=404,
            detail="Message not found",
        )

    analysis = (
        db.query(Analysis)
        .filter(
            Analysis.message_id == message.id
        )
        .order_by(
            Analysis.created_at.desc()
        )
        .first()
    )

    return _build_message_response(
        message,
        analysis,
    )