from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

ProfileRole = Literal["user", "child"]
DeviceType = Literal["phone", "tablet", "computer", "TV", "console", "other"]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


class ProfileBase(BaseModel):
    display_name: str
    role: ProfileRole
    is_active: bool = True
    notes: str | None = None


class ProfileCreate(ProfileBase):
    pin: str | None = Field(default=None, min_length=6, max_length=6)


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    role: ProfileRole | None = None
    is_active: bool | None = None
    notes: str | None = None
    pin: str | None = Field(default=None, min_length=6, max_length=6)


class ProfileOut(ProfileBase):
    id: int
    has_pin: bool

    class Config:
        from_attributes = True


class DeviceBase(BaseModel):
    name: str
    profile_id: int | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    device_type: DeviceType = "other"
    notes: str | None = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: str | None = None
    profile_id: int | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    device_type: DeviceType | None = None
    notes: str | None = None


class DeviceOut(DeviceBase):
    id: int
    owner: str | None = None

    class Config:
        from_attributes = True


class BlockVisitRequest(BaseModel):
    domain: str | None = None
    client_ip: str | None = None
    user_agent: str | None = None


class BypassRequest(BaseModel):
    domain: str
    pin: str = Field(min_length=6, max_length=6)
    client_ip: str | None = None
    duration: Literal["5m", "15m", "30m", "1h", "day"] = "30m"


class BypassOut(BaseModel):
    id: int
    domain: str
    client_ip: str | None
    rule_text: str
    starts_at: datetime
    expires_at: datetime
    status: str

    class Config:
        from_attributes = True


class AccessLogOut(BaseModel):
    id: int
    timestamp: datetime
    action: str
    client_ip: str | None
    domain: str | None
    result: str
    metadata_json: dict[str, Any]

    class Config:
        from_attributes = True


class AdGuardStatus(BaseModel):
    online: bool
    last_api_call: datetime
    blocked_query_count: int | None = None
    dns_status: str
    error: str | None = None


class DashboardOverview(BaseModel):
    blocked_attempts_today: int
    failed_pin_attempts_today: int
    successful_bypasses_today: int
    active_bypasses: list[BypassOut]
    recent_logs: list[AccessLogOut]
    most_blocked_domains: list[dict[str, Any]]
    most_active_devices: list[dict[str, Any]]


class NotificationSettingsOut(BaseModel):
    enabled: bool
    discord_webhook_url: str = ""
    repeated_attempt_threshold: int
    repeated_attempt_window_minutes: int
    webhook_configured: bool


class NotificationSettingsUpdate(BaseModel):
    enabled: bool
    discord_webhook_url: str = ""
    repeated_attempt_threshold: int = Field(ge=1, le=100)
    repeated_attempt_window_minutes: int = Field(ge=1, le=1440)


class UniFiSettingsOut(BaseModel):
    enabled: bool
    controller_url: str = ""
    api_key: str = ""
    username: str = ""
    password: str = ""
    site_id: str = "default"
    verify_ssl: bool = False
    api_key_configured: bool
    password_configured: bool


class UniFiSettingsUpdate(BaseModel):
    enabled: bool
    controller_url: str = ""
    api_key: str = ""
    username: str = ""
    password: str = ""
    site_id: str = "default"
    verify_ssl: bool = False


class UniFiClientOut(BaseModel):
    mac_address: str
    ip_address: str | None = None
    name: str | None = None
    hostname: str | None = None
    manufacturer: str | None = None
    is_wired: bool = False
    network: str | None = None
    ssid: str | None = None
    ap_mac: str | None = None
    switch_mac: str | None = None
    switch_port: int | None = None
    blocked: bool = False
    last_seen: int | None = None


class UniFiSyncResult(BaseModel):
    imported: int
    updated: int
    skipped: int
    clients: list[UniFiClientOut]
