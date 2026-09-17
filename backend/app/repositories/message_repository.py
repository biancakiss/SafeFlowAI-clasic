from sqlalchemy.orm import Session

from app.models.message import Message


def create_message(
    db: Session,
    *,
    user_id: int,
    message_type: str,
    sender: str | None,
    receiver: str | None,
    subject: str | None,
    body: str,
    cleaned_text: str,
) -> Message:
    message = Message(
        user_id=user_id,
        message_type=message_type,
        sender=sender,
        receiver=receiver,
        subject=subject,
        body=body,
        cleaned_text=cleaned_text,
    )

    db.add(message)
    db.flush()
    db.refresh(message)

    return message