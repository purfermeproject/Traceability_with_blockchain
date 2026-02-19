from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import require_roles
from app.db.session import get_async_session
from app.models.batch import Recipe
from app.models.product import Product, Ingredient, RecipeIngredient
from app.schemas.batch import RecipeCreate, RecipeRead
from app.models.mixins import new_uuid

router = APIRouter(prefix="/recipes", tags=["Recipe Master"])

AdminOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN"))
QAOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN", "QA"))

@router.get("/products", summary="List all products with their latest recipes")
async def list_products(
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    result = await db.execute(
        select(Product).options(selectinload(Product.recipes))
    )
    products = result.scalars().all()
    return products

@router.post("", response_model=RecipeRead, status_code=status.HTTP_201_CREATED)
async def create_recipe_version(
    data: RecipeCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    """
    Create a new recipe version. 
    Archives the previous version of the same product by locking it.
    """
    # 1. Lock previous versions of this product
    await db.execute(
        update(Recipe)
        .where(Recipe.product_id == data.product_id)
        .values(is_locked=True)
    )

    # 2. Create the new recipe
    recipe = Recipe(
        id=new_uuid(),
        product_id=data.product_id,
        version=data.version,
        is_locked=False
    )
    db.add(recipe)
    await db.flush()

    # 3. Add ingredients to the new recipe
    for ing_data in data.ingredients:
        recipe_ing = RecipeIngredient(
            id=new_uuid(),
            recipe_id=recipe.id,
            ingredient_id=ing_data.ingredient_id,
            expected_percentage=ing_data.expected_percentage
        )
        db.add(recipe_ing)
    
    await db.commit()
    await db.refresh(recipe)
    return recipe

@router.get("/ingredients", summary="List all base ingredients")
async def list_ingredients(
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    result = await db.execute(select(Ingredient))
    return result.scalars().all()
