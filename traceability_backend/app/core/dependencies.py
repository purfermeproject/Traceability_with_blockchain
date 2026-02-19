"""
FastAPI dependency injection helpers.
Contains:
  - get_current_user  → validates Bearer JWT and returns the User ORM object
  - require_roles     → factory that returns a Depends() enforcing one or more roles
"""
from typing import Annotated, List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_async_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
):
    """
    Decode the Bearer token, validate it is an access token,
    and return the matching User from the database.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exc
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    # Lazy import to avoid circular dependencies
    from app.crud.users import get_user_by_id

    user = await get_user_by_id(db, user_id=user_id)
    if user is None:
        raise credentials_exc
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled.",
        )
    return user


def require_roles(*roles: str):
    """
    Dependency factory: wraps get_current_user and enforces allowed roles.

    Usage:
        @router.post("/admin-only")
        async def admin_route(user = Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
            ...
    """
    async def _checker(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(roles)}",
            )
        return current_user
    return _checker


# ── Convenience aliases ───────────────────────────────────────────────────────
CurrentUser = Annotated[object, Depends(get_current_user)]
SuperAdminRequired = Depends(require_roles("SUPER_ADMIN"))
AdminOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN"))
QAOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN", "QA"))
