"""
Import all models here so that:
1. SQLAlchemy's mapper can build relationships correctly.
2. Alembic's autogenerate detects all tables.
"""
from app.db.base import Base  # noqa: F401

from app.models.user import User, UserRole  # noqa: F401
from app.models.farmer import Farmer, Farm  # noqa: F401
from app.models.vendor import Vendor  # noqa: F401
from app.models.product import Product, Ingredient, RecipeIngredient  # noqa: F401
from app.models.crop_cycle import CropCycle, CropEvent, CropStage  # noqa: F401
from app.models.batch import (  # noqa: F401
    Recipe,
    Batch,
    BatchIngredient,
    BatchStatus,
    SourceType,
    COAStatus,
)
from app.models.audit_log import AuditLog  # noqa: F401
