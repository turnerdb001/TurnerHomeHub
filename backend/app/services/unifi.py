from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import AppSetting, Device


def normalize_mac(value: str | None) -> str | None:
    if not value:
        return None
    raw = value.strip().lower()
    if "." in raw and ":" not in raw and "-" not in raw:
        compact = raw.replace(".", "")
        if len(compact) == 12:
            return ":".join(compact[index : index + 2] for index in range(0, 12, 2))
    return raw.replace("-", ":")


def get_unifi_settings(db: Session) -> dict[str, Any]:
    row = db.query(AppSetting).filter(AppSetting.key == "unifi").first()
    value = row.value_json if row else {}
    return {
        "enabled": bool(value.get("enabled", False)),
        "controller_url": str(value.get("controller_url") or settings.unifi_controller_url or "").rstrip("/"),
        "api_key": str(value.get("api_key") or settings.unifi_api_key or ""),
        "username": str(value.get("username") or settings.unifi_username or ""),
        "password": str(value.get("password") or settings.unifi_password or ""),
        "site_id": str(value.get("site_id") or settings.unifi_site_id or "default"),
        "verify_ssl": bool(value.get("verify_ssl", settings.unifi_verify_ssl)),
    }


def public_unifi_settings(value: dict[str, Any]) -> dict[str, Any]:
    return {
        **value,
        "api_key_configured": bool(value.get("api_key")),
        "password_configured": bool(value.get("password")),
    }


def normalize_client(raw: dict[str, Any]) -> dict[str, Any]:
    return {
        "mac_address": normalize_mac(raw.get("mac")) or "",
        "ip_address": raw.get("ip"),
        "name": raw.get("name") or raw.get("hostname") or raw.get("mac"),
        "hostname": raw.get("hostname"),
        "manufacturer": raw.get("oui"),
        "is_wired": bool(raw.get("is_wired", False)),
        "network": raw.get("network"),
        "ssid": raw.get("essid"),
        "ap_mac": normalize_mac(raw.get("ap_mac")),
        "switch_mac": normalize_mac(raw.get("sw_mac")),
        "switch_port": raw.get("sw_port"),
        "blocked": bool(raw.get("blocked", False)),
        "last_seen": raw.get("last_seen"),
    }


class UniFiClient:
    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config
        self.base_url = str(config["controller_url"]).rstrip("/")
        self.site_id = config["site_id"]
        self.verify_ssl = bool(config["verify_ssl"])
        self.headers: dict[str, str] = {}
        if config.get("api_key"):
            self.headers["X-API-KEY"] = config["api_key"]

    def _http_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(base_url=self.base_url, headers=self.headers, verify=self.verify_ssl, timeout=15)

    async def test_connection(self) -> dict[str, Any]:
        if not self.base_url:
            return {"online": False, "client_count": 0, "error": "UniFi controller URL is not configured"}
        try:
            clients = await self.get_clients()
            return {"online": True, "client_count": len(clients), "error": None}
        except Exception as exc:
            return {"online": False, "client_count": 0, "error": str(exc)}

    async def get_clients(self) -> list[dict[str, Any]]:
        if not self.base_url:
            raise RuntimeError("UniFi controller URL is not configured")

        if self.config.get("api_key"):
            async with self._http_client() as client:
                response = await client.get(f"/proxy/network/api/s/{self.site_id}/stat/sta")
                response.raise_for_status()
                data = response.json()
                return [normalize_client(row) for row in data.get("data", []) if row.get("mac")]

        if not self.config.get("username") or not self.config.get("password"):
            raise RuntimeError("Configure a UniFi API key or username/password")

        async with self._http_client() as client:
            login_response = await client.post(
                "/api/auth/login",
                json={
                    "username": self.config["username"],
                    "password": self.config["password"],
                    "remember": True,
                },
            )
            login_response.raise_for_status()
            csrf_token = login_response.headers.get("X-CSRF-Token")
            if csrf_token:
                client.headers["X-CSRF-Token"] = csrf_token
            response = await client.get(f"/proxy/network/api/s/{self.site_id}/stat/sta")
            response.raise_for_status()
            data = response.json()
            return [normalize_client(row) for row in data.get("data", []) if row.get("mac")]


def device_type_from_client(client: dict[str, Any]) -> str:
    name = f"{client.get('name') or ''} {client.get('hostname') or ''}".lower()
    if any(token in name for token in ["iphone", "android", "pixel", "galaxy"]):
        return "phone"
    if any(token in name for token in ["ipad", "tablet"]):
        return "tablet"
    if any(token in name for token in ["xbox", "playstation", "switch"]):
        return "console"
    if any(token in name for token in ["roku", "tv", "chromecast", "appletv"]):
        return "TV"
    if any(token in name for token in ["macbook", "desktop", "laptop", "pc"]):
        return "computer"
    return "other"


def sync_clients_to_devices(db: Session, clients: list[dict[str, Any]]) -> dict[str, Any]:
    imported = 0
    updated = 0
    skipped = 0

    for client in clients:
        mac = normalize_mac(client.get("mac_address"))
        if not mac:
            skipped += 1
            continue

        notes = (
            f"Imported from UniFi. Network: {client.get('network') or 'unknown'}; "
            f"SSID: {client.get('ssid') or 'n/a'}; wired: {client.get('is_wired')}"
        )
        device = db.query(Device).filter(Device.mac_address == mac).first()
        if device:
            device.ip_address = client.get("ip_address") or device.ip_address
            device.notes = device.notes or notes
            if not device.name or device.name == device.mac_address:
                device.name = client.get("name") or mac
            updated += 1
        else:
            db.add(
                Device(
                    name=client.get("name") or client.get("hostname") or mac,
                    ip_address=client.get("ip_address"),
                    mac_address=mac,
                    device_type=device_type_from_client(client),
                    notes=notes,
                )
            )
            imported += 1

    db.commit()
    return {"imported": imported, "updated": updated, "skipped": skipped}
