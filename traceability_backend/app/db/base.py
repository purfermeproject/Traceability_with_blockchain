from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Single SQLAlchemy declarative base.
    All models inherit from this.
    Alembic reads this to detect schema changes.
    """
    pass
