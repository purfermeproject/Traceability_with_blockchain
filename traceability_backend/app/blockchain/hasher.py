"""
Blockchain Preparation Module (Phase 1 — Local Hashing)
=========================================================
When a batch is locked, a deterministic SHA-256 hash is generated
from the batch record and stored in `batches.blockchain_hash`.

Phase 2: This hash will be submitted to a smart contract for on-chain
verification. No changes to this module are required for that upgrade.

The hash is built from a canonical JSON representation of:
  - Batch code, product ID, recipe ID
  - Every batch ingredient (sorted by ingredient_id for determinism)
"""
import hashlib
import json
from datetime import date, datetime

from app.models.batch import Batch


def _serialize(obj):
    """Custom serializer for types not natively JSON-serializable."""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def generate_batch_hash(batch: Batch) -> str:
    """
    Produce a deterministic SHA-256 hex digest for a batch.
    Ingredients are sorted by ingredient_id to ensure the same hash
    regardless of insertion order.
    """
    payload = {
        "batch_code": batch.batch_code,
        "product_id": batch.product_id,
        "recipe_id": batch.recipe_id,
        "ingredients": sorted(
            [
                {
                    "ingredient_id": bi.ingredient_id,
                    "actual_percentage": str(bi.actual_percentage),
                    "source_type": bi.source_type,
                    "crop_cycle_id": bi.crop_cycle_id,
                    "vendor_id": bi.vendor_id,
                    "coa_status": bi.coa_status,
                }
                for bi in batch.batch_ingredients
            ],
            key=lambda x: x["ingredient_id"],
        ),
    }
    canonical = json.dumps(payload, sort_keys=True, default=_serialize)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
