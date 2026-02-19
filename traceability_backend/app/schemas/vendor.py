from app.schemas.common import PurFermeBase


class VendorCreate(PurFermeBase):
    company_name: str
    city: str
    state: str
    gst_no: str | None = None


class VendorUpdate(PurFermeBase):
    company_name: str | None = None
    city: str | None = None
    state: str | None = None
    gst_no: str | None = None
    is_active: bool | None = None


class VendorRead(PurFermeBase):
    id: str
    company_name: str
    city: str
    state: str
    gst_no: str | None
    is_active: bool
