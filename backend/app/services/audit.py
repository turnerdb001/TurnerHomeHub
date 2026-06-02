from typing import Any

from sqlalchemy.orm import Session

from app.models import AccessLog, Device


def find_device(db: Session, client_ip: str | None) -> Device | None:
    if not client_ip:
        return None
    return db.query(Device).filter(Device.ip_address == client_ip).first()


def log_event(
    db: Session,
    *,
    action: str,
    result: str,
    client_ip: str | None = None,
    domain: str | None = None,
    profile_id: int | None = None,
    device_id: int | None = None,
    metadata: dict[str, Any] | None = None,
) -> AccessLog:
    if device_id is None:
        device = find_device(db, client_ip)
        if device:
            device_id = device.id
            profile_id = profile_id or device.profile_id
    entry = AccessLog(
        action=action,
        result=result,
        client_ip=client_ip,
        domain=domain,
        profile_id=profile_id,
        device_id=device_id,
        metadata_json=metadata or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
