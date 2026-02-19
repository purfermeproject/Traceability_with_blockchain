from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate
from app.models.mixins import new_uuid


async def get_vendor(db: AsyncSession, vendor_id: str) -> Vendor | None:
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    return result.scalars().first()


async def list_vendors(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    active_only: bool = True,
    search: str | None = None,
) -> tuple[list[Vendor], int]:
    query = select(Vendor)
    if active_only:
        query = query.where(Vendor.is_active == True)
    if search:
        query = query.where(Vendor.company_name.ilike(f"%{search}%"))
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()
    result = await db.execute(query.offset(skip).limit(limit))
    return list(result.scalars().all()), total


async def create_vendor(db: AsyncSession, data: VendorCreate) -> Vendor:
    vendor = Vendor(id=new_uuid(), **data.model_dump())
    db.add(vendor)
    await db.flush()
    return vendor


async def update_vendor(db: AsyncSession, vendor: Vendor, data: VendorUpdate) -> Vendor:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    await db.flush()
    return vendor
