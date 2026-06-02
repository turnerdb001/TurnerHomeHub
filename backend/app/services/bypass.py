from datetime import datetime, time, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import Bypass, Profile
from app.services.adguard import AdGuardClient, build_allow_rule, normalize_domain
from app.services.audit import find_device, log_event

DURATION_MAP = {
    "5m": timedelta(minutes=5),
    "15m": timedelta(minutes=15),
    "30m": timedelta(minutes=30),
    "1h": timedelta(hours=1),
}


def duration_to_expiration(duration: str) -> datetime:
    now = datetime.now(timezone.utc)
    if duration == "day":
        local_end = datetime.combine(now.date(), time(hour=23, minute=59, second=59), tzinfo=timezone.utc)
        return max(local_end, now + timedelta(minutes=5))
    return now + DURATION_MAP.get(duration, timedelta(minutes=30))


async def create_bypass(
    db: Session,
    *,
    domain: str,
    client_ip: str | None,
    duration: str,
    approved_by: Profile,
    adguard: AdGuardClient | None = None,
) -> Bypass:
    adguard = adguard or AdGuardClient()
    normalized_domain = normalize_domain(domain)
    device = find_device(db, client_ip)
    rule = build_allow_rule(normalized_domain, client_ip)
    await adguard.add_rule(rule)

    bypass = Bypass(
        domain=normalized_domain,
        client_ip=client_ip,
        profile_id=device.profile_id if device else None,
        device_id=device.id if device else None,
        approved_by_profile_id=approved_by.id,
        rule_text=rule,
        starts_at=datetime.now(timezone.utc),
        expires_at=duration_to_expiration(duration),
        status="active",
    )
    db.add(bypass)
    db.commit()
    db.refresh(bypass)
    log_event(
        db,
        action="bypass_created",
        result="success",
        client_ip=client_ip,
        domain=normalized_domain,
        profile_id=approved_by.id,
        device_id=device.id if device else None,
        metadata={"duration": duration, "rule": rule},
    )
    return bypass


async def expire_due_bypasses(db: Session, adguard: AdGuardClient | None = None) -> int:
    adguard = adguard or AdGuardClient()
    now = datetime.now(timezone.utc)
    due = db.query(Bypass).filter(Bypass.status == "active", Bypass.expires_at <= now).all()
    count = 0
    for bypass in due:
        try:
            await adguard.remove_rule(bypass.rule_text)
            bypass.status = "expired"
            bypass.expired_at = now
            db.add(bypass)
            db.commit()
            log_event(
                db,
                action="bypass_expired",
                result="success",
                client_ip=bypass.client_ip,
                domain=bypass.domain,
                profile_id=bypass.profile_id,
                device_id=bypass.device_id,
                metadata={"rule": bypass.rule_text},
            )
            count += 1
        except Exception as exc:
            log_event(
                db,
                action="adguard_api_failure",
                result="error",
                client_ip=bypass.client_ip,
                domain=bypass.domain,
                metadata={"error": str(exc), "rule": bypass.rule_text},
            )
    return count
