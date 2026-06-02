from app.services.adguard import build_allow_rule, normalize_domain


def test_build_global_rule() -> None:
    assert build_allow_rule("https://Example.com/watch") == "@@||example.com^"


def test_build_per_client_rule() -> None:
    assert build_allow_rule("example.com", "192.168.1.55") == "@@||example.com^$client=192.168.1.55"


def test_normalize_domain() -> None:
    assert normalize_domain("HTTP://YouTube.com/path?q=1") == "youtube.com"
