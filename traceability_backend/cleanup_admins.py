import asyncio
from sqlalchemy import delete
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def cleanup_admins():
    emails_to_delete = [
        "admin@purferme.com",
        "admin2@purferme.com",
        "admin3@purferme.com",
        "admin@purfermeproject.com",
        "admin2@purfermeproject.com",
        "admin3@purfermeproject.com",
        "prachi@purferme.com",
        "Super Admin 2",
        "Super Admin 3"
    ]
    
    print(f"🧹 Starting cleanup of {len(emails_to_delete)} potential boilerplate admins...")
    
    async with AsyncSessionLocal() as db:
        for email in emails_to_delete:
            q = delete(User).where(User.email == email)
            result = await db.execute(q)
            if result.rowcount > 0:
                print(f"✅ Deleted: {email}")
            else:
                print(f"ℹ️  Not found: {email}")
        
        await db.commit()
    print("✨ Cleanup complete!")

if __name__ == "__main__":
    asyncio.run(cleanup_admins())
