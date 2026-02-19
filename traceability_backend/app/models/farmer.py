from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, new_uuid


class Farmer(Base, TimestampMixin):
    __tablename__ = "farmers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    village: Mapped[str] = mapped_column(String(255), nullable=False)
    district: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_photo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    # Soft-delete — never hard delete a farmer (breaks FK history)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    farms: Mapped[list["Farm"]] = relationship("Farm", back_populates="farmer")
    crop_cycles: Mapped[list["CropCycle"]] = relationship(
        "CropCycle", back_populates="farmer"
    )


class Farm(Base, TimestampMixin):
    __tablename__ = "farms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    farmer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farmers.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    location_pin: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Relationships
    farmer: Mapped["Farmer"] = relationship("Farmer", back_populates="farms")
    crop_cycles: Mapped[list["CropCycle"]] = relationship(
        "CropCycle", back_populates="farm"
    )
