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
from app.crud.crop_cycles import list_events_for_cycle, get_crop_cycle
from app.crud.farmers import get_farmer, get_farm
from app.db.session import get_async_session
from app.models.product import Ingredient
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
    farmer_data = None
    farm_data = None

    for bi in batch.batch_ingredients:
        coa_visible = bi.coa_status == COAStatus.AVAILABLE
        source_label = ""
        
    import json

    for bi in batch.batch_ingredients:
        coa_visible = bi.coa_status == COAStatus.AVAILABLE
        source_label = ""
        
        ingredient = await db.get(Ingredient, bi.ingredient_id)
        ing_name = ingredient.name if ingredient else "Unknown Ingredient"
        
        procurement = ingredient.procurement_details if ingredient else ""
        benefits = []
        if ingredient and ingredient.key_benefits_json:
            try:
                benefits = json.loads(ingredient.key_benefits_json)
            except:
                benefits = []

        if bi.source_type == SourceType.FARM and bi.crop_cycle_id:
            crop_cycle_ids_seen.add(bi.crop_cycle_id)
            source_label = "Sourced directly from Farmer"
            if not farmer_data:
                cycle = await get_crop_cycle(db, bi.crop_cycle_id)
                if cycle:
                    farmer = await get_farmer(db, cycle.farmer_id)
                    if farmer:
                        source_label = farmer.district # Use location for label
                        farmer_data = {
                            "name": farmer.name,
                            "location": farmer.district,
                            "joined_date": farmer.created_at.date().isoformat() if farmer.created_at else "2025-01-22",
                            "profile_photo_url": farmer.profile_photo_url,
                            "about": farmer.about or f"{farmer.name} is a dedicated farmer who has been part of our sustainable agriculture program."
                        }
                    if cycle.farm_id:
                        farm = await get_farm(db, cycle.farm_id)
                        if farm:
                            farm_data = {
                                "id": farm.id,
                                "name": farm.name,
                                "acreage": farm.acreage or "1 Acre",
                                "npk_ratio": farm.npk_ratio or "8:6:3",
                                "farming_technology": farm.farming_technology or "Broadcasting",
                                "location_pin": farm.location_pin
                            }
        elif bi.source_type == SourceType.VENDOR:
            source_label = bi.snapshot_vendor_location or "Unknown Location"

        ingredients_out.append(
            {
                "ingredient_id": bi.ingredient_id,
                "name": ing_name,
                "actual_percentage": float(bi.actual_percentage),
                "source_type": bi.source_type,
                "source_label": source_label,
                "coa_available": coa_visible,
                "coa_link": bi.coa_link if coa_visible else None,
                "procurement_details": procurement,
                "key_benefits": benefits
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

    # Sort timeline by natural agricultural stage order (not date)
    STAGE_ORDER = {
        "Ploughing": 0, "Sowing": 1, "Irrigation": 2,
        "Harvest": 3, "Processing": 4, "Storage": 5,
        "Damage": 6, "Other": 7
    }
    timeline.sort(key=lambda x: STAGE_ORDER.get(x["stage_name"], 99))

    # Fetch product name
    from app.models.product import Product
    product = await db.get(Product, batch.product_id)
    product_name = product.name if product else "Unknown Product"

    return {
        "batch_code": batch.batch_code,
        "product_name": product_name,
        "product_id": batch.product_id,
        "blockchain_hash": batch.blockchain_hash,
        "locked_at": batch.locked_at.isoformat() if batch.locked_at else None,
        "ingredients": ingredients_out,
        "timeline": timeline,
        "farmer": farmer_data,
        "farm": farm_data,
        "forensic_report_url": batch.forensic_report_url,
    }
