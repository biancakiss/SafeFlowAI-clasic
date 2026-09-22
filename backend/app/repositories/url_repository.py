from sqlalchemy.orm import Session

from app.models.url import Url


def create_url(
    db: Session,
    *,
    user_id: int,
    url: str,
) -> Url:
    url_record = Url(
        user_id=user_id,
        url=url,
    )

    db.add(url_record)
    db.flush()

    return url_record


def get_user_urls(
    db: Session,
    *,
    user_id: int,
) -> list[Url]:
    return (
        db.query(Url)
        .filter(Url.user_id == user_id)
        .order_by(Url.created_at.desc())
        .all()
    )


def get_user_url_by_id(
    db: Session,
    *,
    user_id: int,
    url_id: int,
) -> Url | None:
    return (
        db.query(Url)
        .filter(
            Url.id == url_id,
            Url.user_id == user_id,
        )
        .first()
    )