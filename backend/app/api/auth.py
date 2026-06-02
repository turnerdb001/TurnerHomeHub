from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_secret
from app.models import Admin
from app.schemas import LoginRequest, TokenResponse
from app.services.audit import log_event

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    admin = db.query(Admin).filter(Admin.username == payload.username, Admin.is_active.is_(True)).first()
    if not admin or not verify_secret(payload.password, admin.password_hash):
        log_event(db, action="admin_login", result="failed", metadata={"username": payload.username})
        raise HTTPException(status_code=401, detail="Invalid username or password")

    admin.last_login_at = datetime.now(timezone.utc)
    db.add(admin)
    db.commit()
    log_event(db, action="admin_login", result="success", metadata={"username": payload.username})
    return TokenResponse(access_token=create_access_token(admin.username))
