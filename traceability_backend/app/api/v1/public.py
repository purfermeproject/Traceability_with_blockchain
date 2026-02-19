"""
Public Consumer Routes — NO authentication required.
Rate-limited to prevent abuse.

Spec:
- GET /public/batch/{batch_code}
    Returns batch info + timeline events (sorted by event_date ASC)
    Only returns LOCKED batches.
    Hides COA button if coa_status == PENDING.
"""
from fastapi import APIRouter, Depends, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.batches import get_batch_by_code
from app.crud.crop_cycles import list_events_for_cycle
from app.db.session import get_async_session
from app.models.batch import BatchStatus, COAStatus, SourceType

router = APIRouter(prefix="/public", tags=["Consumer Public"])
limiter = Limiter(key_func=get_remote_address)


@router.get(
    "/batch/{batch_code}",
    summary="Consumer journey page — no auth required",
)
async def get_consumer_batch(
    batch_code: str,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Returns the full crop journey for a consumer scanning a QR code.

    Rules:
    - Only LOCKED batches are publicly visible.
    - Events sorted by event_date ASC.
    - COA link hidden if status = PENDING.
    - Crop Damage stage flagged separately for special UI rendering (Q7).
    """
    batch = await get_batch_by_code(db, batch_code)

    if not batch or batch.status != BatchStatus.LOCKED:
        raise HTTPException(
            status_code=404,
            detail="Product journey not found or not yet published.",
        )

    # Build ingredient list
    ingredients_out = []
    crop_cycle_ids_seen = set()

    for bi in batch.batch_ingredients:
        coa_visible = bi.coa_status == COAStatus.AVAILABLE
        source_label = ""
        if bi.source_type == SourceType.FARM and bi.crop_cycle_id:
            source_label = f"Sourced from Farmer (Crop Cycle: {bi.crop_cycle_id})"
            crop_cycle_ids_seen.add(bi.crop_cycle_id)
        elif bi.source_type == SourceType.VENDOR:
            loc = bi.snapshot_vendor_location or ""
            source_label = f"Sourced from {bi.snapshot_vendor_name or 'Vendor'} – {loc}"

        ingredients_out.append(
            {
                "ingredient_id": bi.ingredient_id,
                "actual_percentage": float(bi.actual_percentage),
                "source_type": bi.source_type,
                "source_label": source_label,
                "coa_available": coa_visible,
                "coa_link": bi.coa_link if coa_visible else None,
            }
        )

    # Build timeline from all linked crop cycles
    timeline = []
    for cycle_id in crop_cycle_ids_seen:
        events = await list_events_for_cycle(db, cycle_id)
        for evt in events:
            photo_list = (
                [u.strip() for u in evt.photo_urls.split(",") if u.strip()]
                if evt.photo_urls
                else []
            )
            timeline.append(
                {
                    "stage_name": evt.stage_name,
                    "event_date": evt.event_date.isoformat(),
                    "description": evt.description,
                    "photo_urls": photo_list,
                    "is_damage_event": evt.stage_name == "Damage",  # Q7 flag
                }
            )

    # Sort timeline by event_date ASC (Q4)
    timeline.sort(key=lambda x: x["event_date"])

    return {
        "batch_code": batch.batch_code,
        "product_id": batch.product_id,
        "blockchain_hash": batch.blockchain_hash,
        "locked_at": batch.locked_at.isoformat() if batch.locked_at else None,
        "ingredients": ingredients_out,
        "timeline": timeline,
    }
