import pytest

from app.services.adguard import AdGuardClient


class DummyResponse:
    def json(self) -> dict:
        return {"user_rules": None}


@pytest.mark.anyio
async def test_list_rules_treats_null_user_rules_as_empty(monkeypatch) -> None:
    async def fake_request(*args, **kwargs):
        return DummyResponse()

    client = AdGuardClient()
    monkeypatch.setattr(client, "_request", fake_request)

    assert await client.list_rules() == []
