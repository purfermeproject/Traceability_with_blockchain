import asyncio
import sys
from datetime import date, datetime, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.farmer import Farmer, Farm
from app.models.product import Product, Ingredient, RecipeIngredient
from app.models.batch import Recipe, Batch, BatchIngredient, BatchStatus, SourceType, COAStatus
from app.models.crop_cycle import CropCycle, CropEvent, CropStage
from app.models.vendor import Vendor
from app.models.audit_log import AuditLog
from app.models.mixins import new_uuid

from sqlalchemy import text

async def cleanup(db: AsyncSession):
    """Surgically clean up tracking data to remove duplicates."""
    print("Cleaning up existing tracking data via TRUNCATE CASCADE...")
    try:
        # Tables to clear: order doesnt matter with CASCADE but we list them all for clarity
        tables = [
            "audit_logs", "batch_ingredients", "batches", 
            "recipe_ingredients", "recipes", "crop_events", 
            "crop_cycles", "farms", "farmers", "vendors", 
            "ingredients", "products"
        ]
        await db.execute(text(f"TRUNCATE TABLE {', '.join(tables)} CASCADE"))
        await db.commit()
        print("Cleanup successful.")
    except Exception as e:
        await db.rollback()
        print(f"Cleanup failed: {e}")

async def seed():
    async with AsyncSessionLocal() as db:
        try:
            # 1. Cleanup first to ensure uniqueness
            await cleanup(db)

            print("Restoring exact March 5th data state (Deduplicated)...")

            # 1. Create Farmer: S. Ramana
            farmer_id = new_uuid()
            farmer = Farmer(
                id=farmer_id,
                name="S. Ramana",
                phone="9999999999",
                village="Srikakulam",
                district="Andhra Pradesh (AP)",
                profile_photo_url="https://images.unsplash.com/photo-1599839619722-39751411ea63?w=400",
                about="S. Ramana is a dedicated farmer who has been part of our sustainable agriculture program since 2025-01-22. Based in Srikakulam, they employ eco-friendly farming practices to ensure the highest quality produce while maintaining environmental sustainability.",
                is_active=True
            )
            db.add(farmer)
            await db.flush()
            print(f"Added Farmer: {farmer.name}")

            # 2. Create Farm: Ramana's Eco Farm
            farm_id = "AP532005SR" 
            farm = Farm(
                id=farm_id,
                farmer_id=farmer_id,
                name="Ramana's Eco Farm",
                location_pin="18.2949, 83.8938",
                acreage="1 Acre",
                npk_ratio="8:6:3",
                farming_technology="Broadcasting"
            )
            db.add(farm)
            await db.flush()
            print(f"Added Farm: {farm.name}")

            # 3. Create Ingredients
            ingredients = {
                "dates": Ingredient(id="ING-DATES-01", name="Dates", type="Fruit", requires_tracking=True),
                "whey": Ingredient(id="ING-WHEY-02", name="Whey Protein", type="Supplement", requires_tracking=True),
                "honey": Ingredient(id="ING-HONEY-03", name="Honey", type="Sweetener", requires_tracking=True),
                "millet": Ingredient(
                    id="ING-MILLET-04", 
                    name="Foxtail millet Flakes", 
                    type="Millet", 
                    requires_tracking=True,
                    procurement_details="Sourced directly from the Seed center Nutrihub, IIMR. SiA 3088 is a distinguished short-duration variety, specifically bred for superior drought tolerance and exceptional seedling vigor.",
                    key_benefits_json='[{"title": "Short Duration", "desc": "Rapid maturity cycle ideal for efficient crop rotation."}, {"title": "Drought Tolerant", "desc": "Thrives in regions with limited rainfall."}]'
                ),
            }
            db.add_all(ingredients.values())
            await db.flush()

            # 4. Create Crop Cycle for Millet
            cycle_id = new_uuid()
            crop_cycle = CropCycle(
                id=cycle_id,
                farmer_id=farmer_id,
                farm_id=farm_id,
                crop_name="Foxtail Millet",
                lot_reference_code="LOT-SR-2024-001",
                is_active=True
            )
            db.add(crop_cycle)
            await db.flush()

            # 5. Add Crop Events
            events = [
                CropEvent(
                    id=new_uuid(),
                    crop_cycle_id=cycle_id,
                    stage_name=CropStage.PLOUGHING,
                    event_date=date(2024, 11, 1),
                    description="Deep ploughing to improve soil aeration and nutrient distribution.",
                    photo_urls="https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=800"
                ),
                CropEvent(
                    id=new_uuid(),
                    crop_cycle_id=cycle_id,
                    stage_name=CropStage.SOWING,
                    event_date=date(2024, 11, 15),
                    description="Sowing of high-quality Foxtail Millet seeds (SiA 3088).",
                    photo_urls="https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800"
                )
            ]
            db.add_all(events)

            # 6. Create Product
            product_id = new_uuid()
            product = Product(
                id=product_id,
                name="Cashew Almond Walnuts",
                sku="CAW-2025-07",
                category="Snacks"
            )
            db.add(product)
            await db.flush()

            # 7. Create Recipe
            recipe_id = new_uuid()
            recipe = Recipe(
                id=recipe_id,
                product_id=product_id,
                version="v1.0",
                is_locked=True
            )
            db.add(recipe)
            await db.flush()
            
            db.add_all([
                RecipeIngredient(id=new_uuid(), recipe_id=recipe_id, ingredient_id="ING-DATES-01", expected_percentage=19.0),
                RecipeIngredient(id=new_uuid(), recipe_id=recipe_id, ingredient_id="ING-WHEY-02", expected_percentage=14.0),
                RecipeIngredient(id=new_uuid(), recipe_id=recipe_id, ingredient_id="ING-HONEY-03", expected_percentage=17.0),
                RecipeIngredient(id=new_uuid(), recipe_id=recipe_id, ingredient_id="ING-MILLET-04", expected_percentage=15.9),
            ])

            # 8. Create Batch BATCH-2025-07
            batch_id = new_uuid()
            batch = Batch(
                id=batch_id,
                batch_code="BATCH-2025-07",
                product_id=product_id,
                recipe_id=recipe_id,
                status=BatchStatus.LOCKED,
                blockchain_hash="0x7d9f2ec4a1b8e9d2f0x7d9f2ec4a1b8e9d2f0",
                locked_at=datetime(2025, 1, 22, 10, 0, 0, tzinfo=timezone.utc),
                forensic_report_url="https://drive.google.com/file/d/forensic-placeholder/view"
            )
            db.add(batch)
            await db.flush()

            # 9. Create Batch Ingredients
            batch_ings = [
                BatchIngredient(
                    id=new_uuid(), batch_id=batch_id, ingredient_id="ING-DATES-01",
                    actual_percentage=19.0, source_type=SourceType.VENDOR,
                    snapshot_vendor_name="Dates Supplier", snapshot_vendor_location="Hyderabad, Telangana",
                    coa_status=COAStatus.AVAILABLE, coa_link="https://drive.google.com/file/d/coa-dates/view"
                ),
                BatchIngredient(
                    id=new_uuid(), batch_id=batch_id, ingredient_id="ING-WHEY-02",
                    actual_percentage=14.0, source_type=SourceType.VENDOR,
                    snapshot_vendor_name="Whey Global", snapshot_vendor_location="Hrinova, Slovakia",
                    coa_status=COAStatus.AVAILABLE, coa_link="https://drive.google.com/file/d/coa-whey/view"
                ),
                BatchIngredient(
                    id=new_uuid(), batch_id=batch_id, ingredient_id="ING-HONEY-03",
                    actual_percentage=17.0, source_type=SourceType.VENDOR,
                    snapshot_vendor_name="Honey Farms", snapshot_vendor_location="Barabanki, Uttar Pradesh",
                    coa_status=COAStatus.AVAILABLE, coa_link="https://drive.google.com/file/d/coa-honey/view"
                ),
                BatchIngredient(
                    id=new_uuid(), batch_id=batch_id, ingredient_id="ING-MILLET-04",
                    actual_percentage=15.9, source_type=SourceType.FARM,
                    crop_cycle_id=cycle_id, coa_status=COAStatus.AVAILABLE,
                    coa_link="https://drive.google.com/file/d/coa-millet/view"
                ),
            ]
            db.add_all(batch_ings)
            
            print("Restored Batch: BATCH-2025-07 (Unique)")

            await db.commit()
            print("Cleanup and Seeding completed successfully!")
        except Exception as e:
            await db.rollback()
            import traceback
            with open("seed_error.txt", "w") as f:
                f.write(str(e) + "\n\n")
                f.write(traceback.format_exc())
            print(f"ERROR during seeding: {e}")
            raise e

if __name__ == "__main__":
    import traceback
    sys.path.append(".")
    try:
        asyncio.run(seed())
    except Exception:
        # traceback.print_exc() # Already logged to file
        sys.exit(1)
