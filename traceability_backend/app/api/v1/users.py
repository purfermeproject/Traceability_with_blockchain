"""
Admin user management routes (SUPER_ADMIN only).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.logger import log_action
from app.core.dependencies import require_roles
from app.crud.users import (
    create_user, get_user_by_email, get_user_by_id, list_users, update_user,
    deactivate_user, update_user_password
)
from app.db.session import get_async_session
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserPasswordChange
from app.core.hashing import verify_password

router = APIRouter(prefix="/users", tags=["User Management"])

SuperAdminOnly = Depends(require_roles("SUPER_ADMIN"))
AdminOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN", "QA", "FARMER"))


@router.get("/me", response_model=UserRead)
async def get_my_profile(
    current_user=AdminOrAbove,
):
    """Returns the current logged-in user profile."""
    return current_user


@router.get("", response_model=list[UserRead])
async def list_all_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_async_session),
    current_user: UserRead = SuperAdminOnly,
):
    """List all users (Super Admin only)."""
    return await list_users(db, skip=skip, limit=limit)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=SuperAdminOnly,
):
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")
    user = await create_user(db, data)
    await db.commit()
    await log_action(db, user_id=current_user.id, user_name=current_user.full_name, user_email=current_user.email,
                     action="CREATE_USER", table_name="users", record_id=user.id,
                     details={"email": user.email, "role": user.role})
    return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_existing_user(
    user_id: str,
    data: UserUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user=SuperAdminOnly,
):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    updated = await update_user(db, user, data)
    await db.commit()
    await log_action(db, user_id=current_user.id, user_name=current_user.full_name, user_email=current_user.email,
                     action="UPDATE_USER", table_name="users", record_id=user_id,
                     details=data.model_dump(exclude_unset=True))
    return updated


@router.delete("/{user_id}", response_model=UserRead)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user=SuperAdminOnly,
):
    """Deactivate a user (soft delete)."""
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    updated = await deactivate_user(db, user)
    await db.commit()
    await log_action(db, user_id=current_user.id, user_name=current_user.full_name, user_email=current_user.email,
                     action="DEACTIVATE_USER", table_name="users", record_id=user_id)
    return updated


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_my_password(
    data: UserPasswordChange,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    """Allow a user to change their own password."""
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password.")
    
    await update_user_password(db, current_user, data.new_password)
    await db.commit()
    await log_action(db, user_id=current_user.id, user_name=current_user.full_name, user_email=current_user.email,
                     action="CHANGE_PASSWORD", table_name="users", record_id=current_user.id)
    return None
