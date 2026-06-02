from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models import Book, Borrower, Checkout

router = APIRouter(prefix="/library", tags=["library"], dependencies=[Depends(get_current_admin)])


@router.get("/summary")
def library_summary(db: Session = Depends(get_db)) -> dict:
    return {
        "status": "placeholder",
        "books": db.query(Book).count(),
        "borrowers": db.query(Borrower).count(),
        "checkouts": db.query(Checkout).count(),
        "message": "Library module models are ready for Phase 2 UI expansion.",
    }
