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
    delete_batch,
    get_batch,
    get_batch_by_code,
    list_batches,
    replace_batch_ingredients,
    snapshot_vendor_data,
)
from app.models.batch import Batch, BatchStatus
from app.models.user import User
from app.schemas.batch import BatchCreate, BatchUpdate, BatchComplianceUpdate
from app.state_machine.batch_lifecycle import BatchStateMachine


async def service_create_batch(
    db: AsyncSession, data: BatchCreate, current_user: User
) -> Batch:
    data.batch_code = data.batch_code.upper()
    # Prevent duplicate batch codes
    existing = await get_batch_by_code(db, data.batch_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Batch code '{data.batch_code}' already exists.",
        )
    batch = await create_batch(db, data)
    
    # Re-fetch with ingredients loaded for serialization
    batch = await get_batch(db, batch.id)
    
    await log_action(
        db,
        user_id=current_user.id,
        user_name=current_user.full_name,
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
        # Re-fetch to ensure batch_ingredients relationship is fresh for serialization
        batch = await get_batch(db, batch.id)

    await log_action(
        db,
        user_id=current_user.id,
        user_name=current_user.full_name,
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
        user_name=current_user.full_name,
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
                "coa_status": bi.coa_status,
                "coa_link": bi.coa_link,
            }
        )

    total_actual = sum(d["actual_percentage"] for d in deviations)

    return {
        "batch_id": batch.id,
        "batch_code": batch.batch_code,
        "status": batch.status,
        "total_actual_percentage": round(total_actual, 2),
        "is_lockable": abs(total_actual - 100.0) <= 0.1,
        "forensic_report_url": batch.forensic_report_url,
        "warnings": [d for d in deviations if d["has_deviation"]],
        "ingredients": deviations,
    }


async def service_delete_batch(
    db: AsyncSession, batch_id: str, current_user: User
) -> Batch:
    batch = await _get_or_404(db, batch_id)
    batch_code = batch.batch_code
    batch_status = batch.status.value

    await delete_batch(db, batch)

    await log_action(
        db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_email=current_user.email,
        action="DELETE_BATCH",
        table_name="batches",
        record_id=batch_id,
        details={"batch_code": batch_code, "previous_status": batch_status},
    )


async def service_generate_hash(
    db: AsyncSession, batch_id: str
) -> dict:
    batch = await _get_or_404(db, batch_id)
    if batch.status != BatchStatus.LOCKED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hash can only be generated for LOCKED batches.",
        )
    computed_hash = generate_batch_hash(batch)
    return {
        "batch_id": batch.id,
        "batch_code": batch.batch_code,
        "stored_hash": batch.blockchain_hash,
        "computed_hash": computed_hash,
        "integrity_ok": batch.blockchain_hash == computed_hash,
    }


async def _get_or_404(db: AsyncSession, batch_id: str) -> Batch:
    batch = await get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return batch


async def service_update_batch_compliance(
    db: AsyncSession, batch_id: str, data: BatchComplianceUpdate, current_user: User
) -> Batch:
    """
    Update forensic report and ingredient COAs specifically.
    STRICT: Only allowed for DRAFT batches as per PRD v6.
    """
    batch = await _get_or_404(db, batch_id)
    BatchStateMachine.assert_editable(batch)

    if data.forensic_report_url is not None:
        batch.forensic_report_url = data.forensic_report_url

    if data.ingredients:
        # Update COA status/link for specific ingredients
        for ing_update in data.ingredients:
            for bi in batch.batch_ingredients:
                if bi.ingredient_id == ing_update.ingredient_id:
                    bi.coa_status = ing_update.coa_status
                    bi.coa_link = ing_update.coa_link

    await db.commit()
    await db.refresh(batch)

    await log_action(
        db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_email=current_user.email,
        action="UPDATE_COMPLIANCE",
        table_name="batches",
        record_id=batch.id,
        details={"changes": data.model_dump(exclude_unset=True)},
    )
    return batch
