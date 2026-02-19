from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.logger import log_action
from app.core.dependencies import require_roles
from app.crud.vendors import create_vendor, get_vendor, list_vendors, update_vendor
from app.db.session import get_async_session
from app.schemas.vendor import VendorCreate, VendorRead, VendorUpdate

router = APIRouter(prefix="/vendors", tags=["Vendors"])

AdminOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN"))
QAOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN", "QA"))


@router.get("", response_model=dict)
async def list_vendors_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    search: str | None = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    vendors, total = await list_vendors(db, skip=skip, limit=limit, active_only=active_only, search=search)
    return {"total": total, "items": [VendorRead.model_validate(v) for v in vendors]}


@router.post("", response_model=VendorRead, status_code=status.HTTP_201_CREATED)
async def create_vendor_endpoint(
    data: VendorCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    vendor = await create_vendor(db, data)
    await log_action(db, user_id=current_user.id, user_email=current_user.email,
                     action="CREATE_VENDOR", table_name="vendors", record_id=vendor.id,
                     details=data.model_dump())
    return vendor


@router.get("/{vendor_id}", response_model=VendorRead)
async def get_vendor_endpoint(
    vendor_id: str,
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    vendor = await get_vendor(db, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")
    return vendor


@router.patch("/{vendor_id}", response_model=VendorRead)
async def update_vendor_endpoint(
    vendor_id: str,
    data: VendorUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user=AdminOrAbove,
):
    vendor = await get_vendor(db, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")
    updated = await update_vendor(db, vendor, data)
    await log_action(db, user_id=current_user.id, user_email=current_user.email,
                     action="UPDATE_VENDOR", table_name="vendors", record_id=vendor_id,
                     details=data.model_dump(exclude_unset=True))
    return updated
