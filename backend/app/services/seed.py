from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_secret
from app.models import Admin, AppSetting, FutureModule, Profile

FUTURE_MODULES = [
    ("Library", "library"),
    ("Family Calendar", "family-calendar"),
    ("Chores", "chores"),
    ("Request Approvals", "request-approvals"),
    ("Device Schedules", "device-schedules"),
    ("Home Inventory", "home-inventory"),
    ("Media Catalog", "media-catalog"),
]


def seed_defaults(db: Session) -> None:
    if not db.query(Admin).first():
        db.add(
            Admin(
                username=settings.first_admin_username,
                password_hash=hash_secret(settings.first_admin_password),
            )
        )

    db.query(Profile).filter(Profile.role.in_(["admin", "parent"])).update({"role": "user"})

    for name, slug in FUTURE_MODULES:
        if not db.query(FutureModule).filter(FutureModule.slug == slug).first():
            db.add(FutureModule(name=name, slug=slug, status="planned"))

    defaults = {
        "notifications": {
            "enabled": settings.notifications_enabled,
            "discord_webhook_url": settings.discord_webhook_url,
            "repeated_attempt_threshold": settings.repeated_attempt_threshold,
            "repeated_attempt_window_minutes": settings.repeated_attempt_window_minutes,
        },
        "theme": {"default": "tron"},
        "unifi": {
            "enabled": False,
            "controller_url": settings.unifi_controller_url,
            "api_key": settings.unifi_api_key,
            "username": settings.unifi_username,
            "password": settings.unifi_password,
            "site_id": settings.unifi_site_id,
            "verify_ssl": settings.unifi_verify_ssl,
        },
    }
    for key, value in defaults.items():
        if not db.query(AppSetting).filter(AppSetting.key == key).first():
            db.add(AppSetting(key=key, value_json=value))

    db.commit()
