"""
Batch State Machine
===================
Enforces the DRAFT → LOCKED lifecycle described in the spec.

Rules:
- DRAFT: editable, QR inactive.
- LOCKED: immutable, QR active.
- NO reverse transition (LOCKED → DRAFT) ever allowed.
- Lock validation:
    - Ingredient percentages must sum to 100 ± 0.1 (Q2 tolerance rule).
    - Each ingredient must have a valid source (crop_cycle_id XOR vendor_id).
"""
from fastapi import HTTPException, status

from app.models.batch import Batch, BatchStatus

PERCENTAGE_TOLERANCE = 0.1  # ± 0.1% allowed deviation from 100%


class BatchStateMachine:

    @staticmethod
    def assert_editable(batch: Batch) -> None:
        """Raise 409 if the batch is already locked."""
        if batch.status == BatchStatus.LOCKED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Batch '{batch.batch_code}' is LOCKED and cannot be modified. "
                    "Create a new batch if a correction is required."
                ),
            )

    @staticmethod
    def validate_for_lock(batch: Batch) -> list[str]:
        """
        Returns a list of blocking validation errors.
        If the list is empty, the lock is allowed.
        """
        errors: list[str] = []

        if not batch.batch_ingredients:
            errors.append("Batch must have at least one ingredient before locking.")
            return errors  # no point checking further

        # ── Percentage sum check (Q2) ─────────────────────────────────────────
        total = sum(float(bi.actual_percentage) for bi in batch.batch_ingredients)
        deviation = abs(total - 100.0)
        if deviation > PERCENTAGE_TOLERANCE:
            errors.append(
                f"Ingredient percentages sum to {total:.2f}% "
                f"(deviation {deviation:.2f}% exceeds allowed ±{PERCENTAGE_TOLERANCE}%). "
                "Adjust before locking."
            )

        # ── Source linkage check ──────────────────────────────────────────────
        for bi in batch.batch_ingredients:
            has_farm = bi.crop_cycle_id is not None
            has_vendor = bi.vendor_id is not None
            if not has_farm and not has_vendor:
                errors.append(
                    f"Ingredient ID '{bi.ingredient_id}' has no source "
                    "(must link to a crop cycle OR a vendor)."
                )
            if has_farm and has_vendor:
                errors.append(
                    f"Ingredient ID '{bi.ingredient_id}' is linked to BOTH a crop cycle "
                    "and a vendor. Choose one source per ingredient."
                )

        return errors

    @classmethod
    def lock(cls, batch: Batch) -> None:
        """
        Attempt to transition DRAFT → LOCKED.
        Raises 400 with all blocking errors if validation fails.
        """
        cls.assert_editable(batch)
        errors = cls.validate_for_lock(batch)
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Batch cannot be locked.", "errors": errors},
            )
        batch.status = BatchStatus.LOCKED
