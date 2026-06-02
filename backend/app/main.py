from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import adguard, admin, auth, block, bypasses, library
from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.models import Base
from app.services.bypass import expire_due_bypasses
from app.services.seed import seed_defaults


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_defaults(db)
        await expire_due_bypasses(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(block.router)
app.include_router(bypasses.router)
app.include_router(admin.router)
app.include_router(adguard.router)
app.include_router(library.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "app": settings.app_name}
