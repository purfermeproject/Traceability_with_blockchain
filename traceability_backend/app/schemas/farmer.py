import re
from pydantic import field_validator
from app.schemas.common import PurFermeBase

DRIVE_REGEX = re.compile(r"^https://drive\.google\.com/")


def validate_drive_url(v: str | None) -> str | None:
    if v and not DRIVE_REGEX.match(v):
        raise ValueError("URL must start with https://drive.google.com/")
    return v


class FarmerCreate(PurFermeBase):
    name: str
    phone: str
    village: str
    district: str
    profile_photo_url: str | None = None

    @field_validator("profile_photo_url")
    @classmethod
    def validate_photo_url(cls, v):
        return validate_drive_url(v)


class FarmerUpdate(PurFermeBase):
    name: str | None = None
    phone: str | None = None
    village: str | None = None
    district: str | None = None
    profile_photo_url: str | None = None
    is_active: bool | None = None

    @field_validator("profile_photo_url")
    @classmethod
    def validate_photo_url(cls, v):
        return validate_drive_url(v)


class FarmerRead(PurFermeBase):
    id: str
    name: str
    phone: str
    village: str
    district: str
    profile_photo_url: str | None
    is_active: bool


class FarmCreate(PurFermeBase):
    farmer_id: str
    name: str
    location_pin: str | None = None


class FarmRead(PurFermeBase):
    id: str
    farmer_id: str
    name: str
    location_pin: str | None
