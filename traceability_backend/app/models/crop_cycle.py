import enum
from datetime import date

from sqlalchemy import String, Date, Text, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, new_uuid


class CropStage(str, enum.Enum):
    PLOUGHING = "Ploughing"
    SOWING = "Sowing"
    IRRIGATION = "Irrigation"
    HARVEST = "Harvest"
    STORAGE = "Storage"
    DAMAGE = "Damage"
    OTHER = "Other"


class CropCycle(Base, TimestampMixin):
    """
    Container for a farmer's full crop journey.
    One crop cycle = one lot from ploughing to harvest.
    """
    __tablename__ = "crop_cycles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    farmer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farmers.id"), nullable=False, index=True
    )
    farm_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("farms.id"), nullable=True, index=True
    )
    crop_name: Mapped[str] = mapped_column(String(255), nullable=False)
    lot_reference_code: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    farmer: Mapped["Farmer"] = relationship("Farmer", back_populates="crop_cycles")
    farm: Mapped["Farm | None"] = relationship("Farm", back_populates="crop_cycles")
    events: Mapped[list["CropEvent"]] = relationship(
        "CropEvent",
        back_populates="crop_cycle",
        order_by="CropEvent.event_date.asc()",  # ALWAYS sort by date ASC per spec
        cascade="all, delete-orphan",
    )


class CropEvent(Base, TimestampMixin):
    """
    Individual timeline entry (e.g. 'Feb 11: Ploughing').
    Sorted strictly by event_date ASC — never by id or insert order.
    """
    __tablename__ = "crop_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    crop_cycle_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("crop_cycles.id"), nullable=False, index=True
    )
    stage_name: Mapped[CropStage] = mapped_column(
        SAEnum(CropStage, name="cropstage"), nullable=False
    )
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Comma-separated Google Drive links (multiple photos per event per spec)
    photo_urls: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    crop_cycle: Mapped["CropCycle"] = relationship("CropCycle", back_populates="events")
