from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password
)
from app.models.user import User
from app.repositories.user_repository import get_user_by_email
from app.repositories.user_repository import create_user
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.email_service import send_reset_code_email

def register_user(db: Session, data: RegisterRequest) -> User:
    email = str(data.email).lower()

    existing_user = get_user_by_email(db, email)

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=email,
        bank_name=data.bank_name,
        country=data.country,
        password_hash=hash_password(data.password),
    )

    return create_user(db, user)


def login_user(db: Session, data: LoginRequest) -> str:
    email = str(data.email).lower()
    user = get_user_by_email(db, email)

    if user is None or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return create_access_token(subject=user.email)

def hash_reset_code(code: str) -> str:
    return hashlib.sha256(
        code.encode("utf-8")
    ).hexdigest()


def generate_reset_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def request_password_reset(
    db: Session,
    *,
    email: str,
) -> None:
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:
        return

    code = generate_reset_code()

    user.reset_code_hash = hash_reset_code(code)
    user.reset_code_expires_at = (
        datetime.now(timezone.utc)
        + timedelta(hours=2)
    )

    db.commit()

    send_reset_code_email(
        recipient_email=user.email,
        code=code,
    )

def verify_reset_code(
    db: Session,
    *,
    email: str,
    code: str,
) -> bool:
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:
        return False

    if user.reset_code_hash is None:
        return False

    if user.reset_code_expires_at is None:
        return False

    now = datetime.now(timezone.utc)

    if user.reset_code_expires_at < now:
        return False

    return (
        user.reset_code_hash
        == hash_reset_code(code)
    )

def reset_password(
    db: Session,
    *,
    email: str,
    code: str,
    new_password: str,
) -> None:
    is_valid = verify_reset_code(
        db,
        email=email,
        code=code,
    )

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset code",
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    user.password_hash = hash_password(new_password)

    # Codul nu mai poate fi reutilizat.
    user.reset_code_hash = None
    user.reset_code_expires_at = None

    db.commit()