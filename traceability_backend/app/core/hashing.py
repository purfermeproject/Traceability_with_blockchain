import bcrypt

def hash_password(plain_password: str) -> str:
    """Return bcrypt hash of the plain-text password using native bcrypt."""
    salt = bcrypt.gensalt()
    pwd_bytes = plain_password.encode('utf-8')
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its stored bcrypt hash."""
    pwd_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except ValueError:
        return False
