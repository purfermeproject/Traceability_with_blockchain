from sqlalchemy import String, Boolean, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, new_uuid
from app.models.batch import COAStatus


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    recipes: Mapped[list["Recipe"]] = relationship("Recipe", back_populates="product")
    batches: Mapped[list["Batch"]] = relationship("Batch", back_populates="product")


class Ingredient(Base, TimestampMixin):
    __tablename__ = "ingredients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    # If true, must be linked to a crop cycle (farm-tracked ingredient)
    requires_tracking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Transparency Metadata (Q8)
    procurement_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_benefits_json: Mapped[str | None] = mapped_column(Text, nullable=True) # JSON array of {title, desc}


class RecipeIngredient(Base):
    """
    Template: the expected percentage of each ingredient in a recipe version.
    Used as the baseline for deviation detection during batch review.
    """
    __tablename__ = "recipe_ingredients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    recipe_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recipes.id"), nullable=False, index=True
    )
    ingredient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ingredients.id"), nullable=False
    )
    expected_percentage: Mapped[float] = mapped_column(nullable=False)

    # COA (Certificate of Analysis)
    coa_status: Mapped[COAStatus] = mapped_column(
        SAEnum(COAStatus, name="coastatus", create_constraint=False),
        nullable=False,
        default=COAStatus.PENDING,
    )
    coa_link: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="recipe_ingredients")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient")
