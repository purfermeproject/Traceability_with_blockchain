import re
from datetime import date
from pydantic import field_validator, model_validator

from app.models.crop_cycle import CropStage
from app.schemas.common import PurFermeBase

DRIVE_REGEX = re.compile(r"^https://drive\.google\.com/")


class CropCycleCreate(PurFermeBase):
    farmer_id: str
    farm_id: str | None = None
    crop_name: str
    lot_reference_code: str


class CropCycleUpdate(PurFermeBase):
    crop_name: str | None = None
    is_active: bool | None = None


class CropCycleRead(PurFermeBase):
    id: str
    farmer_id: str
    farm_id: str | None
    crop_name: str
    lot_reference_code: str
    is_active: bool


class CropEventCreate(PurFermeBase):
    crop_cycle_id: str
    stage_name: CropStage
    event_date: date
    description: str | None = None
    photo_urls: str | None = None  # comma-separated Drive links

    @field_validator("event_date")
    @classmethod
    def no_future_dates(cls, v: date) -> date:
        """Q5: time-traveling farmers not allowed."""
        from datetime import date as dt
        if v > dt.today():
            raise ValueError("event_date cannot be in the future.")
        return v

    @field_validator("photo_urls")
    @classmethod
    def validate_photo_urls(cls, v: str | None) -> str | None:
        """Each comma-separated URL must match the Drive regex (Q8)."""
        if v:
            urls = [u.strip() for u in v.split(",") if u.strip()]
            for url in urls:
                if not DRIVE_REGEX.match(url):
                    raise ValueError(
                        f"Invalid Drive URL: '{url}'. Must start with https://drive.google.com/"
                    )
        return v


class CropEventUpdate(PurFermeBase):
    stage_name: CropStage | None = None
    event_date: date | None = None
    description: str | None = None
    photo_urls: str | None = None

    @field_validator("event_date")
    @classmethod
    def no_future_dates(cls, v: date | None) -> date | None:
        from datetime import date as dt
        if v and v > dt.today():
            raise ValueError("event_date cannot be in the future.")
        return v


class CropEventRead(PurFermeBase):
    id: str
    crop_cycle_id: str
    stage_name: CropStage
    event_date: date
    description: str | None
    photo_urls: str | None
    # Convenience: split photo_urls into a list for frontend consumption
    photo_url_list: list[str] = []

    @model_validator(mode="after")
    def split_photo_urls(self) -> "CropEventRead":
        if self.photo_urls:
            self.photo_url_list = [u.strip() for u in self.photo_urls.split(",") if u.strip()]
        return self
