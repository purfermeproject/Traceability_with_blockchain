"""
PurFerme Traceability API — Application Entrypoint
===================================================
Wires together:
  - FastAPI app with CORS, rate limiting
  - All API v1 routers
  - Public consumer router
  - Startup: DB table creation + SUPER_ADMIN seed
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings

# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# ── Startup / Shutdown ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed first super-admin on startup."""
    from app.db.session import async_engine
    from app.db.base import Base
    import app.models  # noqa — ensures all models are registered

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await _seed_superadmin()
    yield
    await async_engine.dispose()


async def _seed_superadmin() -> None:
    """
    Idempotent seed: creates the initial SUPER_ADMIN user if none exists.
    Credentials come from .env (FIRST_SUPERADMIN_EMAIL / _PASSWORD).
    """
    from app.db.session import AsyncSessionLocal
    from app.crud.users import get_user_by_email, create_user
    from app.schemas.user import UserCreate
    from app.models.user import UserRole

    async with AsyncSessionLocal() as db:
        existing = await get_user_by_email(db, settings.FIRST_SUPERADMIN_EMAIL)
        if not existing:
            await create_user(
                db,
                UserCreate(
                    email=settings.FIRST_SUPERADMIN_EMAIL,
                    full_name="Super Administrator",
                    password=settings.FIRST_SUPERADMIN_PASSWORD,
                    role=UserRole.SUPER_ADMIN,
                ),
            )
            await db.commit()


# ── App Factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description=(
            "Farm-to-Fork traceability platform. "
            "Admin panel + Consumer QR journey. Blockchain-ready."
        ),
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # ── Middleware ────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── Routers ───────────────────────────────────────────────────────────────
    from app.api.v1 import auth, farmers, vendors, crop_cycles, batches, qr, users, audit_logs, public, dashboard, recipes

    prefix = settings.API_V1_STR

    app.include_router(auth.router, prefix=prefix)
    app.include_router(users.router, prefix=prefix)
    app.include_router(farmers.router, prefix=prefix)
    app.include_router(vendors.router, prefix=prefix)
    app.include_router(crop_cycles.router, prefix=prefix)
    app.include_router(batches.router, prefix=prefix)
    app.include_router(qr.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    app.include_router(recipes.router, prefix=prefix)
    app.include_router(audit_logs.router, prefix=prefix)
    app.include_router(public.router)  # No version prefix — public consumer URL

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "ok", "service": settings.PROJECT_NAME}

    return app


app = create_app()
