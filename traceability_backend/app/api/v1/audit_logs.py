"""
Audit log route — SUPER_ADMIN only (Q11 compliance).
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_roles
from app.db.session import get_async_session
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

SuperAdminOnly = Depends(require_roles("SUPER_ADMIN"))


@router.get("", summary="View audit logs — SUPER_ADMIN only")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    action: str | None = None,
    table_name: str | None = None,
    db: AsyncSession = Depends(get_async_session),
    _=SuperAdminOnly,
):
    query = select(AuditLog).order_by(AuditLog.timestamp.desc())
    if action:
        query = query.where(AuditLog.action == action)
    if table_name:
        query = query.where(AuditLog.table_name == table_name)
    result = await db.execute(query.offset(skip).limit(limit))
    logs = result.scalars().all()
    return {
        "total": len(logs),
        "items": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_name": log.user_name,
                "user_email": log.user_email,
                "action": log.action,
                "table_name": log.table_name,
                "record_id": log.record_id,
                "details": log.details,
                "timestamp": log.timestamp,
            }
            for log in logs
        ],
    }
