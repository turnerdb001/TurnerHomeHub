from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import AccessLog, Device
from app.schemas import BlockVisitRequest
from app.services.audit import find_device, log_event
from app.services.notifications import notify_discord

router = APIRouter(prefix="/block", tags=["block"])


def request_ip(request: Request, fallback: str | None = None) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return fallback or (request.client.host if request.client else None)


@router.post("/visit")
async def block_visit(payload: BlockVisitRequest, request: Request, db: Session = Depends(get_db)) -> dict:
    client_ip = request_ip(request, payload.client_ip)
    device = find_device(db, client_ip)
    log_event(
        db,
        action="blocked_page_viewed",
        result="viewed",
        client_ip=client_ip,
        domain=payload.domain,
        device_id=device.id if device else None,
        profile_id=device.profile_id if device else None,
        metadata={"user_agent": payload.user_agent},
    )
    await notify_discord(
        db,
        "blocked site visited",
        {
            "domain": payload.domain,
            "client_ip": client_ip,
            "profile": device.profile.display_name if device and device.profile else "unknown",
            "device": device.name if device else "unknown",
            "result": "blocked_page_viewed",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    cooldown_until = datetime.now(timezone.utc) + timedelta(seconds=10)
    return {
        "domain": payload.domain,
        "client_ip": client_ip,
        "device": device.name if device else None,
        "profile": device.profile.display_name if device and device.profile else None,
        "pin_allowed_at": cooldown_until.isoformat(),
        "default_bypass_minutes": settings.default_bypass_minutes,
    }


@router.get("/activity")
def block_activity(db: Session = Depends(get_db)) -> list[dict]:
    rows = (
        db.query(AccessLog)
        .filter(AccessLog.action == "blocked_page_viewed")
        .order_by(AccessLog.timestamp.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": row.id,
            "timestamp": row.timestamp,
            "domain": row.domain,
            "client_ip": row.client_ip,
            "result": row.result,
        }
        for row in rows
    ]
