from pydantic import EmailStr, field_validator
from app.models.user import UserRole
from app.schemas.common import PurFermeBase


class UserCreate(PurFermeBase):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.ADMIN

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class UserRead(PurFermeBase):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool


class UserUpdate(PurFermeBase):
    full_name: str | None = None
    is_active: bool | None = None
    role: UserRole | None = None


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(PurFermeBase):
    email: EmailStr
    password: str


class TokenResponse(PurFermeBase):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(PurFermeBase):
    refresh_token: str
