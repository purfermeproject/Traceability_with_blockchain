from passlib.context import CryptContext

# bcrypt is the sole hashing scheme; deprecated="auto" auto-upgrades old hashes
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Return bcrypt hash of the plain-text password."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)
