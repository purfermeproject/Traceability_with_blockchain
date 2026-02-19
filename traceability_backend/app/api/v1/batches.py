from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_roles
from app.db.session import get_async_session
from app.models.batch import BatchStatus
from app.schemas.batch import BatchCreate, BatchRead, BatchSummary, BatchUpdate
from app.services.batch_service import (
    service_create_batch,
    service_get_batch_review,
    service_lock_batch,
    service_update_batch,
)
from app.crud.batches import get_batch, list_batches

router = APIRouter(prefix="/batches", tags=["Batches"])

AdminOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN"))
QAOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN", "QA"))


@router.get("", response_model=dict)
async def list_batches_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    status_filter: BatchStatus | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    batches, total = await list_batches(db, skip=skip, limit=limit, status=status_filter)
    return {"total": total, "items": [BatchSummary.model_validate(b) for b in batches]}


@router.post("", response_model=BatchRead, status_code=status.HTTP_201_CREATED)
async def create_batch_endpoint(
    data: BatchCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    return await service_create_batch(db, data, current_user)


@router.get("/{batch_id}", response_model=BatchRead)
async def get_batch_endpoint(
    batch_id: str,
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    batch = await get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    return batch


@router.patch("/{batch_id}", response_model=BatchRead)
async def update_batch_endpoint(
    batch_id: str,
    data: BatchUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    """Update a DRAFT batch. Returns 409 if batch is already LOCKED."""
    return await service_update_batch(db, batch_id, data, current_user)


@router.get("/{batch_id}/review", response_model=dict)
async def review_batch_endpoint(
    batch_id: str,
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    """
    Read-only review page data.
    Shows actual vs recipe percentage deviations.
    """
    return await service_get_batch_review(db, batch_id)


@router.post("/{batch_id}/lock", response_model=BatchRead)
async def lock_batch_endpoint(
    batch_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    """
    CONFIRM & LOCK.
    Transitions DRAFT → LOCKED. Irreversible.
    Generates SHA-256 hash and snapshots vendor data.
    """
    return await service_lock_batch(db, batch_id, current_user)
