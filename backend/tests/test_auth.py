from app.core.security import create_access_token, decode_access_token


def test_token_roundtrip() -> None:
    token = create_access_token("admin")
    payload = decode_access_token(token)
    assert payload
    assert payload["sub"] == "admin"
