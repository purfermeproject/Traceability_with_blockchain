from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import require_roles
from app.db.session import get_async_session
from app.models.batch import Recipe
from app.models.product import Product, Ingredient, RecipeIngredient
from app.schemas.batch import RecipeCreate, RecipeRead, ProductCreate, ProductRead, IngredientCreate, IngredientRead
from app.models.mixins import new_uuid

router = APIRouter(prefix="/recipes", tags=["Recipe Master"])

AdminOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN"))
QAOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN", "QA"))

@router.get("/products", response_model=list[ProductRead])
async def list_products(
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    result = await db.execute(
        select(Product).options(
            selectinload(Product.recipes).selectinload(Recipe.recipe_ingredients)
        )
    )
    products = result.scalars().all()
    
    # Map 'recipe_ingredients' to 'ingredients' to match Pydantic schema and frontend
    for p in products:
        for r in p.recipes:
            r.ingredients = r.recipe_ingredients
            
    return products

from sqlalchemy import func

@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    """Create a new product master record."""
    # Case-insensitive duplicate check for name
    existing_name = await db.execute(
        select(Product).where(func.lower(Product.name) == data.name.lower())
    )
    if existing_name.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with name '{data.name}' already exists."
        )

    sku = (data.sku or "").upper()
    if not sku:
        import time
        sku = f"SKU-{int(time.time())}"
    else:
        # Check for duplicate SKU (case-insensitive)
        existing_sku = await db.execute(
            select(Product).where(func.lower(Product.sku) == sku.lower())
        )
        if existing_sku.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{sku}' already exists."
            )

    product = Product(
        id=new_uuid(),
        name=data.name,
        sku=sku,
        category=data.category
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product

@router.put("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: str,
    data: ProductCreate, # Reuse create schema for name/category
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    """Update basic product info (name/category)."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Case-insensitive duplicate check for name (excluding self)
    existing_name = await db.execute(
        select(Product).where(
            func.lower(Product.name) == data.name.lower(),
            Product.id != product_id
        )
    )
    if existing_name.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with name '{data.name}' already exists."
        )

    product.name = data.name
    product.category = data.category
    
    await db.commit()
    await db.refresh(product)
    return product

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
            expected_percentage=ing_data.expected_percentage,
            coa_status=ing_data.coa_status,
            coa_link=ing_data.coa_link,
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

@router.post("/ingredients", response_model=IngredientRead, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    data: IngredientCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    """Register a new base ingredient."""
    # Case-insensitive duplicate check for name
    existing = await db.execute(
        select(Ingredient).where(func.lower(Ingredient.name) == data.name.lower())
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ingredient with name '{data.name}' already exists."
        )

    ingredient = Ingredient(
        id=new_uuid(),
        name=data.name,
        type=data.type,
        requires_tracking=data.requires_tracking,
        procurement_details=data.procurement_details,
        key_benefits_json=data.key_benefits_json
    )
    db.add(ingredient)
    await db.commit()
    await db.refresh(ingredient)
    return ingredient

@router.put("/ingredients/{ingredient_id}", response_model=IngredientRead)
async def update_ingredient(
    ingredient_id: str,
    data: IngredientCreate, # Reuse create schema
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    """Update base ingredient info and transparency metadata."""
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    # Case-insensitive duplicate check for name (excluding self)
    existing = await db.execute(
        select(Ingredient).where(
            func.lower(Ingredient.name) == data.name.lower(),
            Ingredient.id != ingredient_id
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ingredient with name '{data.name}' already exists."
        )

    ingredient.name = data.name
    ingredient.type = data.type
    ingredient.requires_tracking = data.requires_tracking
    ingredient.procurement_details = data.procurement_details
    ingredient.key_benefits_json = data.key_benefits_json
    
    await db.commit()
    await db.refresh(ingredient)
    return ingredient
