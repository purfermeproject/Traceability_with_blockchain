from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # ── App ────────────────────────────────────────────────────────────────────
    PROJECT_NAME: str = "PurFerme Traceability API"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # ── Database ────────────────────────────────────────────────────────────────
    DATABASE_URL: str
    SYNC_DATABASE_URL: str

    # ── JWT ─────────────────────────────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ────────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ── Rate Limiting ───────────────────────────────────────────────────────────
    PUBLIC_RATE_LIMIT: int = 100

    # ── Seed Super-Admin ────────────────────────────────────────────────────────
    FIRST_SUPERADMIN_EMAIL: str = "admin@purferme.com"
    FIRST_SUPERADMIN_PASSWORD: str = "ChangeMe@123"

    SECOND_SUPERADMIN_EMAIL: str | None = None
    SECOND_SUPERADMIN_PASSWORD: str | None = None

    THIRD_SUPERADMIN_EMAIL: str | None = None
    THIRD_SUPERADMIN_PASSWORD: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
