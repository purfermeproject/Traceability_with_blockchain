from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.logger import log_action
from app.core.dependencies import require_roles, get_current_user
from app.crud.farmers import (
    create_farm,
    create_farmer,
    get_farm,
    get_farmer,
    list_farms_by_farmer,
    list_farmers,
    update_farmer,
)
from app.db.session import get_async_session
from app.schemas.farmer import FarmerCreate, FarmerRead, FarmerUpdate, FarmCreate, FarmRead

router = APIRouter(prefix="/farmers", tags=["Farmers"])

AdminOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN"))
QAOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN", "QA"))


@router.get("", response_model=dict)
async def list_farmers_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    search: str | None = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    farmers, total = await list_farmers(db, skip=skip, limit=limit, active_only=active_only, search=search)
    return {"total": total, "items": [FarmerRead.model_validate(f) for f in farmers]}


from sqlalchemy import func, select
from app.models.farmer import Farmer

@router.post("", response_model=FarmerRead, status_code=status.HTTP_201_CREATED)
async def create_farmer_endpoint(
    data: FarmerCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    # Case-insensitive duplicate check
    existing = await db.execute(
        select(Farmer).where(func.lower(Farmer.name) == data.name.lower())
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Farmer with name '{data.name}' already exists."
        )

    farmer = await create_farmer(db, data)
    await log_action(db, user_id=current_user.id, user_name=current_user.full_name, user_email=current_user.email,
                     action="CREATE_FARMER", table_name="farmers", record_id=farmer.id,
                     details=data.model_dump())
    return farmer


@router.get("/{farmer_id}", response_model=FarmerRead)
async def get_farmer_endpoint(
    farmer_id: str,
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    farmer = await get_farmer(db, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    return farmer


@router.patch("/{farmer_id}", response_model=FarmerRead)
async def update_farmer_endpoint(
    farmer_id: str,
    data: FarmerUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    farmer = await get_farmer(db, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    
    if data.name:
        # Case-insensitive duplicate check for name (excluding self)
        existing = await db.execute(
            select(Farmer).where(
                func.lower(Farmer.name) == data.name.lower(),
                Farmer.id != farmer_id
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Farmer with name '{data.name}' already exists."
            )

    updated = await update_farmer(db, farmer, data)
    await log_action(db, user_id=current_user.id, user_name=current_user.full_name, user_email=current_user.email,
                     action="UPDATE_FARMER", table_name="farmers", record_id=farmer_id,
                     details=data.model_dump(exclude_unset=True))
    return updated


# ── Farms under a farmer ───────────────────────────────────────────────────────
@router.get("/{farmer_id}/farms", response_model=list[FarmRead])
async def list_farms_endpoint(
    farmer_id: str,
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    return await list_farms_by_farmer(db, farmer_id)


@router.post("/{farmer_id}/farms", response_model=FarmRead, status_code=status.HTTP_201_CREATED)
async def create_farm_endpoint(
    farmer_id: str,
    data: FarmCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    data.farmer_id = farmer_id
    farm = await create_farm(db, data)
    await log_action(db, user_id=current_user.id, user_name=current_user.full_name, user_email=current_user.email,
                     action="CREATE_FARM", table_name="farms", record_id=farm.id,
                     details=data.model_dump())
    return farm
