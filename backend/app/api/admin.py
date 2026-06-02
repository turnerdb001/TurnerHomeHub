from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.core.security import hash_secret, pin_is_valid_shape
from app.models import AccessLog, AppSetting, Bypass, Device, Profile
from app.schemas import (
    DashboardOverview,
    DeviceCreate,
    DeviceOut,
    DeviceUpdate,
    NotificationSettingsOut,
    NotificationSettingsUpdate,
    ProfileCreate,
    ProfileOut,
    ProfileUpdate,
    UniFiClientOut,
    UniFiSettingsOut,
    UniFiSettingsUpdate,
    UniFiSyncResult,
)
from app.services.audit import log_event
from app.services.notifications import get_notification_settings
from app.services.unifi import UniFiClient, get_unifi_settings, public_unifi_settings, sync_clients_to_devices

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


def today_start() -> datetime:
    return datetime.combine(date.today(), time.min, tzinfo=timezone.utc)


def profile_out(profile: Profile) -> ProfileOut:
    return ProfileOut(
        id=profile.id,
        display_name=profile.display_name,
        role=profile.role,
        is_active=profile.is_active,
        notes=profile.notes,
        has_pin=bool(profile.pin_hash),
    )


def device_out(device: Device) -> DeviceOut:
    return DeviceOut(
        id=device.id,
        name=device.name,
        profile_id=device.profile_id,
        ip_address=device.ip_address,
        mac_address=device.mac_address,
        device_type=device.device_type,
        notes=device.notes,
        owner=device.profile.display_name if device.profile else None,
    )


@router.get("/overview", response_model=DashboardOverview)
def overview(db: Session = Depends(get_db)) -> DashboardOverview:
    start = today_start()
    active_bypasses = db.query(Bypass).filter(Bypass.status == "active").order_by(Bypass.expires_at.asc()).limit(10).all()
    logs = db.query(AccessLog).order_by(AccessLog.timestamp.desc()).limit(30).all()
    top_domains = (
        db.query(AccessLog.domain, func.count(AccessLog.id).label("count"))
        .filter(AccessLog.domain.isnot(None), AccessLog.action == "blocked_page_viewed")
        .group_by(AccessLog.domain)
        .order_by(desc("count"))
        .limit(5)
        .all()
    )
    active_devices = (
        db.query(Device.name, func.count(AccessLog.id).label("count"))
        .join(AccessLog, AccessLog.device_id == Device.id)
        .group_by(Device.name)
        .order_by(desc("count"))
        .limit(5)
        .all()
    )
    return DashboardOverview(
        blocked_attempts_today=db.query(AccessLog)
        .filter(AccessLog.action == "blocked_page_viewed", AccessLog.timestamp >= start)
        .count(),
        failed_pin_attempts_today=db.query(AccessLog)
        .filter(AccessLog.action == "pin_failed", AccessLog.timestamp >= start)
        .count(),
        successful_bypasses_today=db.query(AccessLog)
        .filter(AccessLog.action == "bypass_created", AccessLog.timestamp >= start)
        .count(),
        active_bypasses=active_bypasses,
        recent_logs=logs,
        most_blocked_domains=[{"domain": domain, "count": count} for domain, count in top_domains],
        most_active_devices=[{"device": name, "count": count} for name, count in active_devices],
    )


@router.get("/settings/notifications", response_model=NotificationSettingsOut)
def get_notifications_settings(db: Session = Depends(get_db)) -> NotificationSettingsOut:
    value = get_notification_settings(db)
    return NotificationSettingsOut(
        enabled=value["enabled"],
        discord_webhook_url=value["discord_webhook_url"],
        repeated_attempt_threshold=value["repeated_attempt_threshold"],
        repeated_attempt_window_minutes=value["repeated_attempt_window_minutes"],
        webhook_configured=bool(value["discord_webhook_url"]),
    )


@router.put("/settings/notifications", response_model=NotificationSettingsOut)
def update_notifications_settings(
    payload: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
) -> NotificationSettingsOut:
    webhook = payload.discord_webhook_url.strip()
    if webhook and not webhook.startswith(("https://discord.com/api/webhooks/", "https://discordapp.com/api/webhooks/")):
        raise HTTPException(status_code=400, detail="Webhook must be a Discord webhook URL")

    value = {
        "enabled": payload.enabled,
        "discord_webhook_url": webhook,
        "repeated_attempt_threshold": payload.repeated_attempt_threshold,
        "repeated_attempt_window_minutes": payload.repeated_attempt_window_minutes,
    }
    row = db.query(AppSetting).filter(AppSetting.key == "notifications").first()
    if row:
        row.value_json = value
        row.updated_at = datetime.now(timezone.utc)
    else:
        row = AppSetting(key="notifications", value_json=value)
    db.add(row)
    db.commit()
    log_event(db, action="admin_changes", result="notification_settings_updated", metadata={"enabled": payload.enabled})
    return NotificationSettingsOut(
        enabled=value["enabled"],
        discord_webhook_url=value["discord_webhook_url"],
        repeated_attempt_threshold=value["repeated_attempt_threshold"],
        repeated_attempt_window_minutes=value["repeated_attempt_window_minutes"],
        webhook_configured=bool(value["discord_webhook_url"]),
    )


@router.get("/settings/unifi", response_model=UniFiSettingsOut)
def get_unifi_integration_settings(db: Session = Depends(get_db)) -> dict:
    return public_unifi_settings(get_unifi_settings(db))


@router.put("/settings/unifi", response_model=UniFiSettingsOut)
def update_unifi_integration_settings(
    payload: UniFiSettingsUpdate,
    db: Session = Depends(get_db),
) -> dict:
    controller_url = payload.controller_url.strip().rstrip("/")
    if controller_url and not controller_url.startswith(("https://", "http://")):
        raise HTTPException(status_code=400, detail="Controller URL must start with http:// or https://")

    value = {
        "enabled": payload.enabled,
        "controller_url": controller_url,
        "api_key": payload.api_key.strip(),
        "username": payload.username.strip(),
        "password": payload.password,
        "site_id": payload.site_id.strip() or "default",
        "verify_ssl": payload.verify_ssl,
    }
    row = db.query(AppSetting).filter(AppSetting.key == "unifi").first()
    if row:
        row.value_json = value
        row.updated_at = datetime.now(timezone.utc)
    else:
        row = AppSetting(key="unifi", value_json=value)
    db.add(row)
    db.commit()
    log_event(db, action="admin_changes", result="unifi_settings_updated", metadata={"enabled": payload.enabled})
    return public_unifi_settings(value)


@router.get("/unifi/status")
async def unifi_status(db: Session = Depends(get_db)) -> dict:
    config = get_unifi_settings(db)
    if not config["enabled"]:
        return {"online": False, "client_count": 0, "error": "UniFi integration is disabled"}
    return await UniFiClient(config).test_connection()


@router.get("/unifi/clients", response_model=list[UniFiClientOut])
async def list_unifi_clients(db: Session = Depends(get_db)) -> list[dict]:
    config = get_unifi_settings(db)
    if not config["enabled"]:
        raise HTTPException(status_code=400, detail="UniFi integration is disabled")
    return await UniFiClient(config).get_clients()


@router.post("/unifi/sync-devices", response_model=UniFiSyncResult)
async def sync_unifi_devices(db: Session = Depends(get_db)) -> UniFiSyncResult:
    config = get_unifi_settings(db)
    if not config["enabled"]:
        raise HTTPException(status_code=400, detail="UniFi integration is disabled")
    clients = await UniFiClient(config).get_clients()
    result = sync_clients_to_devices(db, clients)
    log_event(db, action="admin_changes", result="unifi_devices_synced", metadata=result)
    return UniFiSyncResult(clients=clients, **result)


@router.get("/profiles", response_model=list[ProfileOut])
def list_profiles(db: Session = Depends(get_db)) -> list[ProfileOut]:
    return [profile_out(row) for row in db.query(Profile).order_by(Profile.display_name).all()]


@router.post("/profiles", response_model=ProfileOut)
def create_profile(payload: ProfileCreate, db: Session = Depends(get_db)) -> ProfileOut:
    pin_hash = None
    if payload.pin:
        if payload.role != "user":
            raise HTTPException(status_code=400, detail="Only User profiles can have PINs")
        if not pin_is_valid_shape(payload.pin):
            raise HTTPException(status_code=400, detail="PIN must be exactly 6 digits")
        pin_hash = hash_secret(payload.pin)
    profile = Profile(
        display_name=payload.display_name,
        role=payload.role,
        is_active=payload.is_active,
        notes=payload.notes,
        pin_hash=pin_hash,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    log_event(db, action="admin_changes", result="profile_created", profile_id=profile.id)
    return profile_out(profile)


@router.patch("/profiles/{profile_id}", response_model=ProfileOut)
def update_profile(profile_id: int, payload: ProfileUpdate, db: Session = Depends(get_db)) -> ProfileOut:
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    data = payload.model_dump(exclude_unset=True)
    if "pin" in data and data["pin"] is not None:
        if data.get("role", profile.role) != "user":
            raise HTTPException(status_code=400, detail="Only User profiles can have PINs")
        if not pin_is_valid_shape(data["pin"]):
            raise HTTPException(status_code=400, detail="PIN must be exactly 6 digits")
        profile.pin_hash = hash_secret(data.pop("pin"))
    for key, value in data.items():
        setattr(profile, key, value)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    log_event(db, action="admin_changes", result="profile_updated", profile_id=profile.id)
    return profile_out(profile)


@router.delete("/profiles/{profile_id}")
def delete_profile(profile_id: int, db: Session = Depends(get_db)) -> dict:
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    db.query(Device).filter(Device.profile_id == profile_id).update({Device.profile_id: None})
    db.query(AccessLog).filter(AccessLog.profile_id == profile_id).update({AccessLog.profile_id: None})
    db.query(Bypass).filter(Bypass.profile_id == profile_id).update({Bypass.profile_id: None})
    db.query(Bypass).filter(Bypass.approved_by_profile_id == profile_id).update({Bypass.approved_by_profile_id: None})
    db.delete(profile)
    db.commit()
    log_event(db, action="admin_changes", result="profile_deleted", metadata={"profile_id": profile_id})
    return {"deleted": True}


@router.get("/devices", response_model=list[DeviceOut])
def list_devices(db: Session = Depends(get_db)) -> list[DeviceOut]:
    return [device_out(row) for row in db.query(Device).order_by(Device.name).all()]


@router.post("/devices", response_model=DeviceOut)
def create_device(payload: DeviceCreate, db: Session = Depends(get_db)) -> DeviceOut:
    device = Device(**payload.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    log_event(db, action="admin_changes", result="device_created", device_id=device.id, client_ip=device.ip_address)
    return device_out(device)


@router.patch("/devices/{device_id}", response_model=DeviceOut)
def update_device(device_id: int, payload: DeviceUpdate, db: Session = Depends(get_db)) -> DeviceOut:
    device = db.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(device, key, value)
    db.add(device)
    db.commit()
    db.refresh(device)
    log_event(db, action="admin_changes", result="device_updated", device_id=device.id, client_ip=device.ip_address)
    return device_out(device)


@router.delete("/devices/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)) -> dict:
    device = db.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.query(AccessLog).filter(AccessLog.device_id == device_id).update({AccessLog.device_id: None})
    db.query(Bypass).filter(Bypass.device_id == device_id).update({Bypass.device_id: None})
    db.delete(device)
    db.commit()
    log_event(db, action="admin_changes", result="device_deleted", metadata={"device_id": device_id})
    return {"deleted": True}
