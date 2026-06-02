from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Turner Home Hub"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://turner:changeme@database:5432/turnerhomehub"
    adguard_base_url: str = "http://192.168.1.164:8080"
    adguard_username: str = ""
    adguard_password: str = ""
    discord_webhook_url: str = ""
    unifi_controller_url: str = ""
    unifi_api_key: str = ""
    unifi_username: str = ""
    unifi_password: str = ""
    unifi_site_id: str = "default"
    unifi_verify_ssl: bool = False
    app_secret_key: str = Field(default="change-me", min_length=8)
    default_bypass_minutes: int = 30
    first_admin_username: str = "admin"
    first_admin_password: str = "changeme"
    notifications_enabled: bool = True
    repeated_attempt_threshold: int = 3
    repeated_attempt_window_minutes: int = 10
    pin_rate_limit_attempts: int = 5
    pin_rate_limit_window_seconds: int = 300


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
