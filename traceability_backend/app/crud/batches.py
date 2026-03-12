from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch import Batch, BatchIngredient, BatchStatus, Recipe
from app.models.vendor import Vendor
from app.schemas.batch import BatchCreate, BatchIngredientCreate
from app.models.mixins import new_uuid


# ── Recipe ────────────────────────────────────────────────────────────────────
async def get_recipe(db: AsyncSession, recipe_id: str) -> Recipe | None:
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.recipe_ingredients))
        .where(Recipe.id == recipe_id)
    )
    return result.scalars().first()


async def list_recipes(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Recipe]:
    result = await db.execute(select(Recipe).offset(skip).limit(limit))
    return list(result.scalars().all())


# ── Batch ─────────────────────────────────────────────────────────────────────
async def get_batch(db: AsyncSession, batch_id: str) -> Batch | None:
    result = await db.execute(
        select(Batch)
        .options(selectinload(Batch.batch_ingredients))
        .where(Batch.id == batch_id)
    )
    return result.scalars().first()


async def get_batch_by_code(db: AsyncSession, batch_code: str) -> Batch | None:
    result = await db.execute(
        select(Batch)
        .options(selectinload(Batch.batch_ingredients))
        .where(func.lower(Batch.batch_code) == batch_code.lower())
    )
    return result.scalars().first()


async def list_batches(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    status: BatchStatus | None = None,
) -> tuple[list[Batch], int]:
    query = select(Batch)
    if status:
        query = query.where(Batch.status == status)
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()
    result = await db.execute(query.offset(skip).limit(limit))
    return list(result.scalars().all()), total


async def create_batch(db: AsyncSession, data: BatchCreate) -> Batch:
    batch = Batch(
        id=new_uuid(),
        batch_code=data.batch_code,
        product_id=data.product_id,
        recipe_id=data.recipe_id,
        status=BatchStatus.DRAFT,
    )
    db.add(batch)
    await db.flush()

    for ing_data in data.ingredients:
        await _add_batch_ingredient(db, batch.id, ing_data)

    return batch


async def _add_batch_ingredient(
    db: AsyncSession, batch_id: str, data: BatchIngredientCreate
) -> BatchIngredient:
    bi = BatchIngredient(
        id=new_uuid(),
        batch_id=batch_id,
        ingredient_id=data.ingredient_id,
        actual_percentage=data.actual_percentage,
        source_type=data.source_type,
        crop_cycle_id=data.crop_cycle_id,
        vendor_id=data.vendor_id,
        coa_status=data.coa_status,
        coa_link=data.coa_link,
    )
    db.add(bi)
    await db.flush()
    return bi


async def replace_batch_ingredients(
    db: AsyncSession, batch: Batch, ingredients: list[BatchIngredientCreate]
) -> None:
    """Delete existing ingredients and insert new ones (DRAFT only)."""
    for bi in batch.batch_ingredients:
        await db.delete(bi)
    await db.flush()
    for ing_data in ingredients:
        await _add_batch_ingredient(db, batch.id, ing_data)


async def delete_batch(db: AsyncSession, batch: Batch) -> None:
    """Delete a batch and its ingredients (cascade)."""
    await db.delete(batch)
    await db.flush()


async def snapshot_vendor_data(db: AsyncSession, batch: Batch) -> None:
    """
    Called at LOCK time.
    Copies vendor name + location into batch_ingredient snapshot fields
    so future vendor edits cannot corrupt historical records.
    """
    for bi in batch.batch_ingredients:
        if bi.vendor_id:
            vendor = await db.get(Vendor, bi.vendor_id)
            if vendor:
                bi.snapshot_vendor_name = vendor.company_name
                bi.snapshot_vendor_location = f"{vendor.city}, {vendor.state}"
    await db.flush()
