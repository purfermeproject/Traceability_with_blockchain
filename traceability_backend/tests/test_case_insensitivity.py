import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from sqlalchemy import func

from app.api.v1.farmers import create_farmer_endpoint
from app.api.v1.vendors import create_vendor_endpoint
from app.api.v1.recipes import create_product, create_ingredient
from app.services.batch_service import service_create_batch
from app.schemas.farmer import FarmerCreate
from app.schemas.vendor import VendorCreate
from app.schemas.batch import BatchCreate, ProductCreate, IngredientCreate
from app.models.user import User

@pytest.mark.asyncio
async def test_create_farmer_case_insensitive_duplicate():
    db = AsyncMock()
    # Mock existing farmer
    mock_result = MagicMock()
    mock_result.scalars().first.return_value = MagicMock()
    db.execute.return_value = mock_result
    
    data = FarmerCreate(name="Ramana", village="V", district="D")
    
    with pytest.raises(HTTPException) as exc:
        await create_farmer_endpoint(data, db, current_user=MagicMock())
    assert exc.value.status_code == 400
    assert "already exists" in exc.value.detail

@pytest.mark.asyncio
async def test_create_batch_auto_uppercase():
    db = AsyncMock()
    # Mock no existing batch
    mock_result = MagicMock()
    mock_result.scalars().first.return_value = None
    db.execute.return_value = mock_result
    
    # Mock CRUD return
    mock_batch = MagicMock()
    mock_batch.id = "123"
    mock_batch.batch_code = "BATCH-01"
    
    # We need to mock get_batch and create_batch
    # Since they are imported into service_create_batch, we might need to mock them there
    # But for a simple test, let's just check if it calls get_batch_by_code with uppercase
    
    # Actually, let's test the service directly and mock get_batch_by_code
    with MagicMock() as mock_crud:
        import app.services.batch_service as svc
        svc.get_batch_by_code = AsyncMock(return_value=None)
        svc.create_batch = AsyncMock(return_value=mock_batch)
        svc.get_batch = AsyncMock(return_value=mock_batch)
        svc.log_action = AsyncMock()
        
        data = BatchCreate(batch_code="batch-01", product_id="p1", recipe_id="r1", ingredients=[])
        user = MagicMock(spec=User)
        user.id = "u1"
        
        await svc.service_create_batch(db, data, user)
        
        assert data.batch_code == "BATCH-01"
        svc.get_batch_by_code.assert_called_with(db, "BATCH-01")

@pytest.mark.asyncio
async def test_create_product_auto_sku_uppercase():
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars().first.return_value = None
    db.execute.return_value = mock_result
    
    data = ProductCreate(name="Peanut Butter", sku="pb-001", category="Spread")
    
    # We need to mock new_uuid and db.add/commit/refresh
    with MagicMock() as mock_mixins:
        import app.api.v1.recipes as recipes
        recipes.new_uuid = MagicMock(return_value="uuid-1")
        db.refresh = AsyncMock()
        db.commit = AsyncMock()
        
        res = await recipes.create_product(data, db, current_user=MagicMock())
        assert res.sku == "PB-001"
