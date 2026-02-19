"""
Database session factory — provides both:
  - AsyncSession  (used in all FastAPI routes via Depends)
  - SyncSession   (used only by Alembic migrations)
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# ── Async engine (application runtime) ────────────────────────────────────────
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,       # logs SQL in development
    pool_pre_ping=True,        # recycles stale connections
    pool_size=10,              # base connection pool size
    max_overflow=20,           # extra connections under load
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,    # avoids lazy load errors after commit
    autoflush=False,
    autocommit=False,
)

# ── Sync engine (Alembic only — do NOT use in routes) ─────────────────────────
sync_engine = create_engine(settings.SYNC_DATABASE_URL, pool_pre_ping=True)
SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)


# ── FastAPI dependency ─────────────────────────────────────────────────────────
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields an async DB session per request.
    Automatically rolls back on exception and closes after response.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
