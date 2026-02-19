"""
Utility helpers shared across the application.
"""
import re

DRIVE_REGEX = re.compile(r"^https://drive\.google\.com/")


def is_valid_drive_url(url: str | None) -> bool:
    """Returns True if the URL is a valid Google Drive link."""
    if not url:
        return False
    return bool(DRIVE_REGEX.match(url))


def split_photo_urls(raw: str | None) -> list[str]:
    """Split a comma-separated photo_urls string into a clean list."""
    if not raw:
        return []
    return [u.strip() for u in raw.split(",") if u.strip()]


def generate_batch_code(product_sku: str, sequence: int) -> str:
    """
    Generate a human-readable batch code.
    Example: PF-OATS-00042
    """
    return f"PF-{product_sku.upper()}-{sequence:05d}"
