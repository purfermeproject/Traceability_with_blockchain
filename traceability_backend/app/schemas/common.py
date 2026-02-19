"""
Shared Pydantic base config and common response shapes.
"""
from pydantic import BaseModel, ConfigDict


class PurFermeBase(BaseModel):
    """All schemas inherit from this — enables ORM mode globally."""
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(PurFermeBase):
    message: str


class PaginatedResponse(PurFermeBase):
    total: int
    page: int
    size: int
    items: list
