from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import AppSetting, DiscordNotification


def get_notification_settings(db: Session) -> dict[str, Any]:
    row = db.query(AppSetting).filter(AppSetting.key == "notifications").first()
    value = row.value_json if row else {}
    return {
        "enabled": bool(value.get("enabled", settings.notifications_enabled)),
        "discord_webhook_url": str(value.get("discord_webhook_url") or settings.discord_webhook_url or ""),
        "repeated_attempt_threshold": int(value.get("repeated_attempt_threshold", settings.repeated_attempt_threshold)),
        "repeated_attempt_window_minutes": int(
            value.get("repeated_attempt_window_minutes", settings.repeated_attempt_window_minutes)
        ),
    }


async def notify_discord(db: Session, event: str, payload: dict[str, Any]) -> None:
    notification = DiscordNotification(event=event, payload_json=payload, status="skipped")
    db.add(notification)
    db.commit()
    db.refresh(notification)

    notification_settings = get_notification_settings(db)
    webhook_url = notification_settings["discord_webhook_url"]
    if not notification_settings["enabled"] or not webhook_url:
        return

    content = (
        f"**{settings.app_name}: {event}**\n"
        f"Domain: `{payload.get('domain', 'n/a')}`\n"
        f"Client: `{payload.get('client_ip', 'n/a')}`\n"
        f"Profile/Device: `{payload.get('profile', 'unknown')}` / `{payload.get('device', 'unknown')}`\n"
        f"Result: `{payload.get('result', 'n/a')}`\n"
        f"Time: `{payload.get('timestamp', datetime.now(timezone.utc).isoformat())}`"
    )

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.post(webhook_url, json={"content": content})
            response.raise_for_status()
        notification.status = "sent"
        notification.sent_at = datetime.now(timezone.utc)
    except Exception as exc:
        notification.status = "failed"
        notification.error = str(exc)
    finally:
        db.add(notification)
        db.commit()
