"""
Batch Service
=============
Business logic for batch creation, updates, locking, and review.
Orchestrates: CRUD → State Machine → Blockchain Hash → Audit Log.
"""
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.logger import log_action
from app.blockchain.hasher import generate_batch_hash
from app.crud.batches import (
    create_batch,
    get_batch,
    get_batch_by_code,
    list_batches,
    replace_batch_ingredients,
    snapshot_vendor_data,
)
from app.models.batch import Batch, BatchStatus
from app.models.user import User
from app.schemas.batch import BatchCreate, BatchUpdate
from app.state_machine.batch_lifecycle import BatchStateMachine


async def service_create_batch(
    db: AsyncSession, data: BatchCreate, current_user: User
) -> Batch:
    # Prevent duplicate batch codes
    existing = await get_batch_by_code(db, data.batch_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Batch code '{data.batch_code}' already exists.",
        )
    batch = await create_batch(db, data)
    await log_action(
        db,
        user_id=current_user.id,
        user_email=current_user.email,
        action="CREATE_BATCH",
        table_name="batches",
        record_id=batch.id,
        details={"batch_code": batch.batch_code, "status": "DRAFT"},
    )
    return batch


async def service_update_batch(
    db: AsyncSession, batch_id: str, data: BatchUpdate, current_user: User
) -> Batch:
    batch = await _get_or_404(db, batch_id)
    # State machine guard — raises 409 if locked
    BatchStateMachine.assert_editable(batch)

    if data.ingredients is not None:
        await replace_batch_ingredients(db, batch, data.ingredients)

    await log_action(
        db,
        user_id=current_user.id,
        user_email=current_user.email,
        action="UPDATE_BATCH",
        table_name="batches",
        record_id=batch.id,
        details={"changes": data.model_dump(exclude_unset=True)},
    )
    return batch


async def service_lock_batch(
    db: AsyncSession, batch_id: str, current_user: User
) -> Batch:
    batch = await _get_or_404(db, batch_id)

    # State machine — validates & transitions to LOCKED (raises if invalid)
    BatchStateMachine.lock(batch)

    # Copy vendor snapshots before locking
    await snapshot_vendor_data(db, batch)

    # Generate SHA-256 hash (Phase 2 blockchain readiness)
    batch.blockchain_hash = generate_batch_hash(batch)
    batch.locked_at = datetime.now(timezone.utc)

    await log_action(
        db,
        user_id=current_user.id,
        user_email=current_user.email,
        action="LOCK_BATCH",
        table_name="batches",
        record_id=batch.id,
        details={
            "batch_code": batch.batch_code,
            "blockchain_hash": batch.blockchain_hash,
        },
    )
    return batch


async def service_get_batch_review(db: AsyncSession, batch_id: str) -> dict:
    """
    Returns a read-only review summary comparing actual vs. recipe percentages.
    Used on the Batch Review page before the admin clicks CONFIRM & LOCK.
    """
    from sqlalchemy import select
    from app.models.batch import Recipe
    from app.models.product import RecipeIngredient

    batch = await _get_or_404(db, batch_id)

    # Load recipe ingredients for deviation check
    result = await db.execute(
        select(RecipeIngredient).where(RecipeIngredient.recipe_id == batch.recipe_id)
    )
    recipe_ings = {ri.ingredient_id: ri.expected_percentage for ri in result.scalars().all()}

    deviations = []
    for bi in batch.batch_ingredients:
        expected = recipe_ings.get(bi.ingredient_id, 0.0)
        actual = float(bi.actual_percentage)
        diff = actual - float(expected)
        deviations.append(
            {
                "ingredient_id": bi.ingredient_id,
                "expected_percentage": float(expected),
                "actual_percentage": actual,
                "deviation": round(diff, 2),
                "has_deviation": abs(diff) > 0.5,  # warn if >0.5% off recipe
            }
        )

    total_actual = sum(d["actual_percentage"] for d in deviations)

    return {
        "batch_id": batch.id,
        "batch_code": batch.batch_code,
        "status": batch.status,
        "total_actual_percentage": round(total_actual, 2),
        "is_lockable": abs(total_actual - 100.0) <= 0.1,
        "warnings": [d for d in deviations if d["has_deviation"]],
        "ingredients": deviations,
    }


async def _get_or_404(db: AsyncSession, batch_id: str) -> Batch:
    batch = await get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return batch
