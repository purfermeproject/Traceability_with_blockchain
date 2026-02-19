from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.farmer import Farmer, Farm
from app.schemas.farmer import FarmerCreate, FarmerUpdate, FarmCreate
from app.models.mixins import new_uuid


# ── Farmer ────────────────────────────────────────────────────────────────────
async def get_farmer(db: AsyncSession, farmer_id: str) -> Farmer | None:
    result = await db.execute(select(Farmer).where(Farmer.id == farmer_id))
    return result.scalars().first()


async def list_farmers(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    active_only: bool = True,
    search: str | None = None,
) -> tuple[list[Farmer], int]:
    query = select(Farmer)
    if active_only:
        query = query.where(Farmer.is_active == True)
    if search:
        query = query.where(Farmer.name.ilike(f"%{search}%"))
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()
    result = await db.execute(query.offset(skip).limit(limit))
    return list(result.scalars().all()), total


async def create_farmer(db: AsyncSession, data: FarmerCreate) -> Farmer:
    farmer = Farmer(id=new_uuid(), **data.model_dump())
    db.add(farmer)
    await db.flush()
    return farmer


async def update_farmer(db: AsyncSession, farmer: Farmer, data: FarmerUpdate) -> Farmer:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(farmer, field, value)
    await db.flush()
    return farmer


# ── Farm ─────────────────────────────────────────────────────────────────────
async def get_farm(db: AsyncSession, farm_id: str) -> Farm | None:
    result = await db.execute(select(Farm).where(Farm.id == farm_id))
    return result.scalars().first()


async def list_farms_by_farmer(db: AsyncSession, farmer_id: str) -> list[Farm]:
    result = await db.execute(select(Farm).where(Farm.farmer_id == farmer_id))
    return list(result.scalars().all())


async def create_farm(db: AsyncSession, data: FarmCreate) -> Farm:
    farm = Farm(id=new_uuid(), **data.model_dump())
    db.add(farm)
    await db.flush()
    return farm
