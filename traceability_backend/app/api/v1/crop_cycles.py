from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.logger import log_action
from app.core.dependencies import require_roles
from app.crud.crop_cycles import (
    create_crop_cycle,
    create_crop_event,
    delete_crop_event,
    get_crop_cycle,
    get_crop_event,
    list_crop_cycles,
    list_events_for_cycle,
    update_crop_cycle,
    update_crop_event,
)
from app.db.session import get_async_session
from app.schemas.crop_cycle import (
    CropCycleCreate,
    CropCycleRead,
    CropCycleUpdate,
    CropEventCreate,
    CropEventRead,
    CropEventUpdate,
)

router = APIRouter(prefix="/crop-cycles", tags=["Crop Cycles"])

AdminOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN"))
QAOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN", "QA"))


@router.get("", response_model=dict)
async def list_cycles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    cycles, total = await list_crop_cycles(db, skip=skip, limit=limit)
    return {"total": total, "items": [CropCycleRead.model_validate(c) for c in cycles]}


@router.post("", response_model=CropCycleRead, status_code=status.HTTP_201_CREATED)
async def create_cycle(
    data: CropCycleCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    cycle = await create_crop_cycle(db, data)
    await log_action(db, user_id=current_user.id, user_email=current_user.email,
                     action="CREATE_CROP_CYCLE", table_name="crop_cycles",
                     record_id=cycle.id, details=data.model_dump())
    return cycle


@router.get("/{cycle_id}", response_model=CropCycleRead)
async def get_cycle(
    cycle_id: str,
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    cycle = await get_crop_cycle(db, cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found.")
    return cycle


@router.patch("/{cycle_id}", response_model=CropCycleRead)
async def update_cycle(
    cycle_id: str,
    data: CropCycleUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    cycle = await get_crop_cycle(db, cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found.")
    updated = await update_crop_cycle(db, cycle, data)
    await log_action(db, user_id=current_user.id, user_email=current_user.email,
                     action="UPDATE_CROP_CYCLE", table_name="crop_cycles",
                     record_id=cycle_id, details=data.model_dump(exclude_unset=True))
    return updated


# ── Crop Events ───────────────────────────────────────────────────────────────
@router.get("/{cycle_id}/events", response_model=list[CropEventRead])
async def list_events(
    cycle_id: str,
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    """Returns events sorted by event_date ASC (Q4 compliance)."""
    return await list_events_for_cycle(db, cycle_id)


@router.post("/{cycle_id}/events", response_model=CropEventRead, status_code=status.HTTP_201_CREATED)
async def add_event(
    cycle_id: str,
    data: CropEventCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    data.crop_cycle_id = cycle_id
    event = await create_crop_event(db, data)
    await log_action(db, user_id=current_user.id, user_email=current_user.email,
                     action="CREATE_CROP_EVENT", table_name="crop_events",
                     record_id=event.id, details=data.model_dump())
    return event


@router.patch("/{cycle_id}/events/{event_id}", response_model=CropEventRead)
async def update_event(
    cycle_id: str,
    event_id: str,
    data: CropEventUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    event = await get_crop_event(db, event_id)
    if not event or event.crop_cycle_id != cycle_id:
        raise HTTPException(status_code=404, detail="Crop event not found.")
    updated = await update_crop_event(db, event, data)
    await log_action(db, user_id=current_user.id, user_email=current_user.email,
                     action="UPDATE_CROP_EVENT", table_name="crop_events",
                     record_id=event_id, details=data.model_dump(exclude_unset=True))
    return updated


@router.delete("/{cycle_id}/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_event(
    cycle_id: str,
    event_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    event = await get_crop_event(db, event_id)
    if not event or event.crop_cycle_id != cycle_id:
        raise HTTPException(status_code=404, detail="Crop event not found.")
    await delete_crop_event(db, event)
    await log_action(db, user_id=current_user.id, user_email=current_user.email,
                     action="DELETE_CROP_EVENT", table_name="crop_events",
                     record_id=event_id, details={"cycle_id": cycle_id})
