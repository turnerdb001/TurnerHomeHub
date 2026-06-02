from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.block import request_ip
from app.core.config import settings
from app.core.database import get_db
from app.core.security import pin_is_valid_shape, verify_secret
from app.models import AccessLog, Bypass, Profile
from app.schemas import BypassOut, BypassRequest
from app.services.audit import log_event
from app.services.bypass import create_bypass, expire_due_bypasses
from app.services.notifications import notify_discord

router = APIRouter(prefix="/bypasses", tags=["bypasses"])


def rate_limited(db: Session, client_ip: str | None) -> bool:
    if not client_ip:
        return False
    since = datetime.now(timezone.utc) - timedelta(seconds=settings.pin_rate_limit_window_seconds)
    attempts = (
        db.query(func.count(AccessLog.id))
        .filter(
            AccessLog.client_ip == client_ip,
            AccessLog.action == "pin_failed",
            AccessLog.timestamp >= since,
        )
        .scalar()
    )
    return int(attempts or 0) >= settings.pin_rate_limit_attempts


@router.post("", response_model=BypassOut)
async def request_bypass(payload: BypassRequest, request: Request, db: Session = Depends(get_db)) -> Bypass:
    client_ip = request_ip(request, payload.client_ip)
    if rate_limited(db, client_ip):
        log_event(db, action="pin_rate_limited", result="blocked", client_ip=client_ip, domain=payload.domain)
        raise HTTPException(status_code=429, detail="Too many failed PIN attempts. Try again later.")

    if not pin_is_valid_shape(payload.pin):
        log_event(db, action="pin_failed", result="invalid_shape", client_ip=client_ip, domain=payload.domain)
        raise HTTPException(status_code=400, detail="PIN must be exactly 6 digits")

    approver = None
    approver_profiles = db.query(Profile).filter(Profile.is_active.is_(True), Profile.role == "user").all()
    for profile in approver_profiles:
        if verify_secret(payload.pin, profile.pin_hash):
            approver = profile
            break

    if not approver:
        log_event(db, action="pin_failed", result="wrong_pin", client_ip=client_ip, domain=payload.domain)
        await notify_discord(
            db,
            "wrong PIN attempt",
            {"domain": payload.domain, "client_ip": client_ip, "result": "wrong_pin", "timestamp": datetime.now(timezone.utc).isoformat()},
        )
        raise HTTPException(status_code=401, detail="Invalid PIN")

    bypass = await create_bypass(
        db,
        domain=payload.domain,
        client_ip=client_ip,
        duration=payload.duration,
        approved_by=approver,
    )
    log_event(db, action="pin_success", result="success", client_ip=client_ip, domain=payload.domain, profile_id=approver.id)
    await notify_discord(
        db,
        "bypass approved",
        {
            "domain": payload.domain,
            "client_ip": client_ip,
            "profile": approver.display_name,
            "result": "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    return bypass


@router.get("/active", response_model=list[BypassOut])
def active_bypasses(db: Session = Depends(get_db)) -> list[Bypass]:
    return db.query(Bypass).filter(Bypass.status == "active").order_by(Bypass.expires_at.asc()).all()


@router.post("/expire-due")
async def expire_due(db: Session = Depends(get_db)) -> dict:
    count = await expire_due_bypasses(db)
    return {"expired": count}
