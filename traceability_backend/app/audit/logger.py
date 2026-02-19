"""
Audit Logging Service
=====================
Every write operation in the system calls `log_action()`.
Logs are append-only — never updated or deleted.
Only SUPER_ADMIN can query audit_logs via the API.
"""
import json
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.mixins import new_uuid


async def log_action(
    db: AsyncSession,
    *,
    user_id: str | None,
    user_email: str | None,
    action: str,
    table_name: str,
    record_id: str | None = None,
    details: dict | None = None,
) -> None:
    """
    Append a single structured audit entry.

    Args:
        action:     Short verb, e.g. "CREATE_BATCH", "LOCK_BATCH", "UPDATE_FARMER"
        table_name: The primary table affected, e.g. "batches"
        record_id:  PK of the record affected (optional)
        details:    Arbitrary JSON-serialisable dict with context/diff info
    """
    entry = AuditLog(
        id=new_uuid(),
        user_id=user_id,
        user_email=user_email,
        action=action,
        table_name=table_name,
        record_id=record_id,
        details=json.dumps(details, default=str) if details else None,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(entry)
    # No flush here — the calling service controls the transaction.
