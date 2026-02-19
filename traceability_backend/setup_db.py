"""
One-time database setup script.
Run this ONCE before starting the server.

Usage:
    python setup_db.py --pg-password YOUR_POSTGRES_PASSWORD

This script:
1. Creates the 'purferme' role with password 'password'
2. Creates the 'purferme_db' database
3. Grants all privileges
4. Generates a secure SECRET_KEY and writes it to .env
"""
import argparse
import os
import secrets
import sys
from pathlib import Path

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def create_db(pg_password: str) -> None:
    print("⏳ Connecting to PostgreSQL as 'postgres'...")
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="postgres",
            password=pg_password,
            database="postgres",
        )
    except psycopg2.OperationalError as e:
        print(f"❌ Connection failed: {e}")
        print("   Make sure PostgreSQL is running and the password is correct.")
        sys.exit(1)

    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    # Create role (ignore if exists)
    try:
        cur.execute("CREATE USER purferme WITH PASSWORD 'password';")
        print("✅ Created user 'purferme'")
    except psycopg2.errors.DuplicateObject:
        print("ℹ️  User 'purferme' already exists — skipped")

    # Create database (ignore if exists)
    try:
        cur.execute("CREATE DATABASE purferme_db OWNER purferme;")
        print("✅ Created database 'purferme_db'")
    except psycopg2.errors.DuplicateDatabase:
        print("ℹ️  Database 'purferme_db' already exists — skipped")

    cur.execute("GRANT ALL PRIVILEGES ON DATABASE purferme_db TO purferme;")
    print("✅ Granted privileges")
    cur.close()
    conn.close()


def patch_env_secret_key() -> None:
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        print("⚠️  .env not found — skipping SECRET_KEY patch")
        return

    content = env_path.read_text(encoding="utf-8")
    placeholder = "change_this_to_a_very_long_random_secret_key_at_least_64_chars"

    if placeholder in content:
        new_key = secrets.token_hex(64)  # 128-char hex string
        content = content.replace(placeholder, new_key)
        env_path.write_text(content, encoding="utf-8")
        print(f"✅ Generated & saved new SECRET_KEY to .env")
    else:
        print("ℹ️  SECRET_KEY already set — skipped")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PurFerme DB Setup")
    parser.add_argument(
        "--pg-password",
        required=True,
        help="Password for the 'postgres' superuser",
    )
    args = parser.parse_args()

    create_db(args.pg_password)
    patch_env_secret_key()

    print("\n🎉 Setup complete! Next steps:")
    print("   1. Run Alembic:  alembic revision --autogenerate -m 'initial'")
    print("   2. Apply:        alembic upgrade head")
    print("   3. Start server: .venv\\Scripts\\uvicorn app.main:app --reload")
