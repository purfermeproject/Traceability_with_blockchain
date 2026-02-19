from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.schemas.user import LoginRequest, TokenResponse, RefreshRequest
from app.services.auth_service import authenticate_user, refresh_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, summary="Login and receive JWT tokens")
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_async_session),
):
    return await authenticate_user(db, data)


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_async_session),
):
    return await refresh_access_token(db, data)
