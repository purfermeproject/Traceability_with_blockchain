from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_roles
from app.db.session import get_async_session
from app.models.batch import Batch, BatchStatus, COAStatus, BatchIngredient

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

QAOrAbove = Depends(require_roles("SUPER_ADMIN", "ADMIN", "QA"))

@router.get("/metrics", summary="Get dashboard metrics")
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_async_session),
    _=QAOrAbove,
):
    """
    Returns metrics for the admin dashboard:
    - Active Batches (Draft vs Locked)
    - Pending COAs
    """
    # Count batches by status
    draft_count = await db.scalar(
        select(func.count(Batch.id)).where(Batch.status == BatchStatus.DRAFT)
    ) or 0
    locked_count = await db.scalar(
        select(func.count(Batch.id)).where(Batch.status == BatchStatus.LOCKED)
    ) or 0

    # Count pending COAs
    pending_coa_count = await db.scalar(
        select(func.count(BatchIngredient.id)).where(BatchIngredient.coa_status == COAStatus.PENDING)
    ) or 0

    return {
        "active_batches": {
            "draft": draft_count,
            "locked": locked_count,
            "total": draft_count + locked_count
        },
        "pending_coas": pending_coa_count
    }
