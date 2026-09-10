from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import get_user_by_email
from app.repositories.user_repository import create_user
from app.schemas.auth import LoginRequest, RegisterRequest


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