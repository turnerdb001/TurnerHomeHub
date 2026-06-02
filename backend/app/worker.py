import asyncio

from app.core.database import SessionLocal
from app.models import Base
from app.core.database import engine
from app.services.bypass import expire_due_bypasses
from app.services.seed import seed_defaults


async def run() -> None:
    Base.metadata.create_all(bind=engine)
    while True:
        db = SessionLocal()
        try:
            seed_defaults(db)
            await expire_due_bypasses(db)
        finally:
            db.close()
        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(run())
