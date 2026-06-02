from datetime import datetime, timezone
from urllib.parse import urljoin

import httpx

from app.core.config import settings


def normalize_domain(domain: str) -> str:
    cleaned = domain.strip().lower()
    cleaned = cleaned.removeprefix("http://").removeprefix("https://")
    return cleaned.split("/")[0]


def build_allow_rule(domain: str, client_ip: str | None = None) -> str:
    normalized = normalize_domain(domain)
    rule = f"@@||{normalized}^"
    if client_ip:
        rule = f"{rule}$client={client_ip}"
    return rule


class AdGuardClient:
    def __init__(self) -> None:
        self.base_url = settings.adguard_base_url.rstrip("/") + "/"
        self.auth = None
        if settings.adguard_username:
            self.auth = (settings.adguard_username, settings.adguard_password)

    async def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        async with httpx.AsyncClient(timeout=10, auth=self.auth) as client:
            response = await client.request(method, urljoin(self.base_url, path.lstrip("/")), **kwargs)
            response.raise_for_status()
            return response

    async def status(self) -> dict:
        last_call = datetime.now(timezone.utc)
        try:
            response = await self._request("GET", "/control/status")
            data = response.json()
            stats = await self._safe_stats()
            return {
                "online": True,
                "last_api_call": last_call,
                "blocked_query_count": stats.get("num_blocked_filtering") if stats else None,
                "dns_status": "running" if data.get("running") else "stopped",
                "error": None,
            }
        except Exception as exc:
            return {
                "online": False,
                "last_api_call": last_call,
                "blocked_query_count": None,
                "dns_status": "unknown",
                "error": str(exc),
            }

    async def _safe_stats(self) -> dict | None:
        try:
            return (await self._request("GET", "/control/stats")).json()
        except Exception:
            return None

    async def list_rules(self) -> list[str]:
        response = await self._request("GET", "/control/filtering/status")
        data = response.json()
        user_rules = data.get("user_rules") or []
        return [str(rule) for rule in user_rules]

    async def set_rules(self, rules: list[str]) -> None:
        await self._request("POST", "/control/filtering/set_rules", json={"rules": rules})

    async def add_rule(self, rule: str) -> None:
        rules = await self.list_rules()
        if rule not in rules:
            rules.append(rule)
            await self.set_rules(rules)

    async def remove_rule(self, rule: str) -> None:
        rules = await self.list_rules()
        filtered = [existing for existing in rules if existing != rule]
        if filtered != rules:
            await self.set_rules(filtered)
