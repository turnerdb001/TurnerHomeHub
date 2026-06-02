from datetime import datetime, timezone

from app.services.bypass import duration_to_expiration


def test_duration_to_expiration_future() -> None:
    expires = duration_to_expiration("5m")
    assert expires > datetime.now(timezone.utc)


def test_rest_of_day_future() -> None:
    expires = duration_to_expiration("day")
    assert expires > datetime.now(timezone.utc)
