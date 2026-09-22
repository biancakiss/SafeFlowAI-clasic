from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyResetCodeRequest,
)
from app.services.auth_service import (
    login_user,
    register_user,
    request_password_reset,
    reset_password,
    verify_reset_code,
)


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    return register_user(db, data)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    token = login_user(db, data)

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_current_user_details(
    current_user=Depends(get_current_user),
):
    return current_user

@router.patch(
    "/me/profile",
    response_model=UserResponse,
    name="Update current user profile",
)
def update_current_user(
    data: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        value = value.strip()
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    request_password_reset(
        db,
        email=str(data.email),
    )

    return {
        "message": (
            "If the email exists, a reset code "
            "has been sent."
        )
    }

@router.post("/verify-reset-code")
def verify_reset_code_endpoint(
    data: VerifyResetCodeRequest,
    db: Session = Depends(get_db),
):
    is_valid = verify_reset_code(
        db,
        email=str(data.email),
        code=data.code,
    )

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset code",
        )

    return {
        "message": "Reset code is valid."
    }

@router.post("/reset-password")
def reset_password_endpoint(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    reset_password(
        db,
        email=str(data.email),
        code=data.code,
        new_password=data.new_password,
    )

    return {
        "message": "Password reset successfully."
    }