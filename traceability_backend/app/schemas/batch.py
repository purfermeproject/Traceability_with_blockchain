import re
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.batch import BatchStatus, SourceType, COAStatus
from app.schemas.common import PurFermeBase

DRIVE_REGEX = re.compile(r"^https://drive\.google\.com/")


# ── Product & Ingredient ──────────────────────────────────────────────────────
class ProductCreate(PurFermeBase):
    name: str = "New Product"
    sku: str | None = None
    category: str = "Grains"


class ProductRead(PurFermeBase):
    id: str
    name: str
    sku: str
    category: str
    recipes: list["RecipeRead"] = []


class IngredientCreate(PurFermeBase):
    name: str
    type: str = "Raw Material"
    requires_tracking: bool = False
    procurement_details: str | None = None
    key_benefits_json: str | None = None


class IngredientRead(PurFermeBase):
    id: str
    name: str
    type: str
    requires_tracking: bool
    procurement_details: str | None
    key_benefits_json: str | None



# ── Recipe ────────────────────────────────────────────────────────────────────
class RecipeIngredientCreate(PurFermeBase):
    ingredient_id: str
    expected_percentage: float
    coa_status: COAStatus = COAStatus.PENDING
    coa_link: str | None = None


class RecipeIngredientRead(PurFermeBase):
    id: str
    ingredient_id: str
    expected_percentage: float
    coa_status: COAStatus
    coa_link: str | None


class RecipeCreate(PurFermeBase):
    product_id: str
    version: str
    ingredients: list[RecipeIngredientCreate] = []


class RecipeRead(PurFermeBase):
    id: str
    product_id: str
    version: str
    is_locked: bool
    ingredients: list[RecipeIngredientRead] = []


# ── Batch ─────────────────────────────────────────────────────────────────────
class BatchIngredientCreate(PurFermeBase):
    ingredient_id: str
    actual_percentage: float
    source_type: SourceType
    crop_cycle_id: str | None = None
    vendor_id: str | None = None
    coa_status: COAStatus = COAStatus.PENDING
    coa_link: str | None = None

    @field_validator("coa_link")
    @classmethod
    def validate_coa_link(cls, v: str | None) -> str | None:
        if v and not DRIVE_REGEX.match(v):
            raise ValueError("COA link must start with https://drive.google.com/")
        return v


class BatchIngredientRead(PurFermeBase):
    id: str
    ingredient_id: str
    actual_percentage: float
    source_type: SourceType
    crop_cycle_id: str | None
    vendor_id: str | None
    snapshot_vendor_name: str | None
    snapshot_vendor_location: str | None
    coa_status: COAStatus
    coa_link: str | None


class BatchCreate(PurFermeBase):
    batch_code: str
    product_id: str
    recipe_id: str
    ingredients: list[BatchIngredientCreate] = []
    forensic_report_url: str | None = None

    @field_validator("forensic_report_url")
    @classmethod
    def validate_forensic_link(cls, v: str | None) -> str | None:
        if v and not DRIVE_REGEX.match(v):
            raise ValueError("Forensic report link must start with https://drive.google.com/")
        return v


class BatchUpdate(PurFermeBase):
    """Only allowed when batch is in DRAFT state."""
    ingredients: list[BatchIngredientCreate] | None = None
    forensic_report_url: str | None = None


class BatchRead(PurFermeBase):
    id: str
    batch_code: str
    product_id: str
    recipe_id: str
    status: BatchStatus
    blockchain_hash: str | None
    forensic_report_url: str | None
    created_at: datetime
    batch_ingredients: list[BatchIngredientRead] = []


class BatchSummary(PurFermeBase):
    """Lightweight response for list views."""
    id: str
    batch_code: str
    product_id: str
    status: BatchStatus
    forensic_report_url: str | None = None
    created_at: datetime


class IngredientComplianceUpdate(PurFermeBase):
    ingredient_id: str
    coa_status: COAStatus
    coa_link: str | None = None


class BatchComplianceUpdate(PurFermeBase):
    forensic_report_url: str | None = None
    ingredients: list[IngredientComplianceUpdate] | None = None
