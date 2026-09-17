from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.database.session import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    message_type = Column(
        String(20),
        nullable=False,
    )

    sender = Column(
        String(255),
        nullable=True,
    )

    receiver = Column(
        String(255),
        nullable=True,
    )

    subject = Column(
        String(500),
        nullable=True,
    )

    body = Column(
        Text,
        nullable=False,
    )

    cleaned_text = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )