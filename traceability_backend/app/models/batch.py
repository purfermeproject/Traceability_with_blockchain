import enum
from datetime import datetime

from sqlalchemy import String, Boolean, ForeignKey, Enum as SAEnum, Text, Numeric, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, new_uuid


class BatchStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    LOCKED = "LOCKED"


class SourceType(str, enum.Enum):
    FARM = "FARM"
    VENDOR = "VENDOR"


class COAStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    PENDING = "PENDING"
    NOT_REQUIRED = "NOT_REQUIRED"


class Recipe(Base, TimestampMixin):
    __tablename__ = "recipes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id"), nullable=False, index=True
    )
    version: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "v1.0"
    # Locked recipe cannot be edited — a new version must be created
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="recipes")
    recipe_ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        "RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan"
    )
    batches: Mapped[list["Batch"]] = relationship("Batch", back_populates="recipe")


class Batch(Base, TimestampMixin):
    """
    Production batch. Implements strict DRAFT → LOCKED state machine.
    Once LOCKED, the record is immutable.
    """
    __tablename__ = "batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    batch_code: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id"), nullable=False, index=True
    )
    recipe_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recipes.id"), nullable=False
    )
    status: Mapped[BatchStatus] = mapped_column(
        SAEnum(BatchStatus, name="batchstatus"),
        nullable=False,
        default=BatchStatus.DRAFT,
    )
    # Phase 2: SHA-256 hash stored here on lock
    blockchain_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    product: Mapped["Product"] = relationship("Product", back_populates="batches")
    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="batches")
    batch_ingredients: Mapped[list["BatchIngredient"]] = relationship(
        "BatchIngredient", back_populates="batch", cascade="all, delete-orphan"
    )


class BatchIngredient(Base, TimestampMixin):
    """
    Historical snapshot of each ingredient in a locked batch.
    Vendor details are COPIED (snapshotted) at lock time so future
    vendor edits do not corrupt historical records.
    """
    __tablename__ = "batch_ingredients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    batch_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("batches.id"), nullable=False, index=True
    )
    ingredient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ingredients.id"), nullable=False
    )
    actual_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    source_type: Mapped[SourceType] = mapped_column(
        SAEnum(SourceType, name="sourcetype"), nullable=False
    )

    # Source linking (mutually exclusive)
    crop_cycle_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("crop_cycles.id"), nullable=True, index=True
    )
    vendor_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("vendors.id"), nullable=True
    )

    # ── Snapshots (copied at LOCK time for historical integrity) ───────────────
    snapshot_vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    snapshot_vendor_location: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # COA (Certificate of Analysis)
    coa_status: Mapped[COAStatus] = mapped_column(
        SAEnum(COAStatus, name="coastatus"),
        nullable=False,
        default=COAStatus.PENDING,
    )
    coa_link: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    # Relationships
    batch: Mapped["Batch"] = relationship("Batch", back_populates="batch_ingredients")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient")
    crop_cycle: Mapped["CropCycle | None"] = relationship("CropCycle")
    vendor: Mapped["Vendor | None"] = relationship("Vendor")
