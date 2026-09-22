from datetime import datetime
from typing import Any

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    transaction_db_id: Mapped[int | None] = mapped_column(
        ForeignKey("transactions.id"),
        nullable=True,
        index=True,
    )

    message_id: Mapped[int | None] = mapped_column(
        ForeignKey("messages.id"),
        nullable=True,
        index=True,
    )

    analysis_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    predicted_class: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    model_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    risk_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    triggered_rules: Mapped[
        list[dict[str, Any]]
    ] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    features: Mapped[
        dict[str, Any]
    ] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    model_version: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    url_db_id: Mapped[int | None] = mapped_column(
        ForeignKey("urls.id"),
        nullable=True,
        index=True,
    )

    url = relationship(
        "Url",
        back_populates="analyses",
    )
