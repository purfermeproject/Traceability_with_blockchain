"""
Auth Service
============
Handles login, token refresh, and super-admin seeding.
"""
from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.hashing import verify_password
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.crud.users import get_user_by_email, get_user_by_id
from app.schemas.user import LoginRequest, TokenResponse, RefreshRequest


async def authenticate_user(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    user = await get_user_by_email(db, data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact your administrator.",
        )
    return TokenResponse(
        access_token=create_access_token(user.id, extra_claims={"role": user.role}),
        refresh_token=create_refresh_token(user.id),
    )


async def refresh_access_token(db: AsyncSession, data: RefreshRequest) -> TokenResponse:
    try:
        payload = decode_token(data.refresh_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not a refresh token.",
        )

    user = await get_user_by_id(db, user_id=payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or disabled.",
        )

    return TokenResponse(
        access_token=create_access_token(user.id, extra_claims={"role": user.role}),
        refresh_token=create_refresh_token(user.id),
    )
