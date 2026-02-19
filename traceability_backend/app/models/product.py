from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, new_uuid


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

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="recipe_ingredients")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient")
