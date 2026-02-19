import re
from pydantic import field_validator
from app.models.batch import BatchStatus, SourceType, COAStatus
from app.schemas.common import PurFermeBase

DRIVE_REGEX = re.compile(r"^https://drive\.google\.com/")


# ── Recipe ────────────────────────────────────────────────────────────────────
class RecipeIngredientCreate(PurFermeBase):
    ingredient_id: str
    expected_percentage: float


class RecipeCreate(PurFermeBase):
    product_id: str
    version: str
    ingredients: list[RecipeIngredientCreate] = []


class RecipeRead(PurFermeBase):
    id: str
    product_id: str
    version: str
    is_locked: bool


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


class BatchUpdate(PurFermeBase):
    """Only allowed when batch is in DRAFT state."""
    ingredients: list[BatchIngredientCreate] | None = None


class BatchRead(PurFermeBase):
    id: str
    batch_code: str
    product_id: str
    recipe_id: str
    status: BatchStatus
    blockchain_hash: str | None
    batch_ingredients: list[BatchIngredientRead] = []


class BatchSummary(PurFermeBase):
    """Lightweight response for list views."""
    id: str
    batch_code: str
    product_id: str
    status: BatchStatus
