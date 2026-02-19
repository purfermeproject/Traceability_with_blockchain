from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crop_cycle import CropCycle, CropEvent
from app.schemas.crop_cycle import CropCycleCreate, CropCycleUpdate, CropEventCreate, CropEventUpdate
from app.models.mixins import new_uuid


# ── CropCycle ─────────────────────────────────────────────────────────────────
async def get_crop_cycle(db: AsyncSession, cycle_id: str) -> CropCycle | None:
    result = await db.execute(
        select(CropCycle)
        .options(selectinload(CropCycle.events))
        .where(CropCycle.id == cycle_id)
    )
    return result.scalars().first()


async def list_crop_cycles(
    db: AsyncSession, skip: int = 0, limit: int = 50
) -> tuple[list[CropCycle], int]:
    query = select(CropCycle)
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()
    result = await db.execute(query.offset(skip).limit(limit))
    return list(result.scalars().all()), total


async def create_crop_cycle(db: AsyncSession, data: CropCycleCreate) -> CropCycle:
    cycle = CropCycle(id=new_uuid(), **data.model_dump())
    db.add(cycle)
    await db.flush()
    return cycle


async def update_crop_cycle(
    db: AsyncSession, cycle: CropCycle, data: CropCycleUpdate
) -> CropCycle:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cycle, field, value)
    await db.flush()
    return cycle


# ── CropEvent ─────────────────────────────────────────────────────────────────
async def get_crop_event(db: AsyncSession, event_id: str) -> CropEvent | None:
    result = await db.execute(select(CropEvent).where(CropEvent.id == event_id))
    return result.scalars().first()


async def list_events_for_cycle(
    db: AsyncSession, cycle_id: str
) -> list[CropEvent]:
    """Always sorted by event_date ASC per spec Q4."""
    result = await db.execute(
        select(CropEvent)
        .where(CropEvent.crop_cycle_id == cycle_id)
        .order_by(CropEvent.event_date.asc())
    )
    return list(result.scalars().all())


async def create_crop_event(db: AsyncSession, data: CropEventCreate) -> CropEvent:
    event = CropEvent(id=new_uuid(), **data.model_dump())
    db.add(event)
    await db.flush()
    return event


async def update_crop_event(
    db: AsyncSession, event: CropEvent, data: CropEventUpdate
) -> CropEvent:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    await db.flush()
    return event


async def delete_crop_event(db: AsyncSession, event: CropEvent) -> None:
    await db.delete(event)
    await db.flush()
