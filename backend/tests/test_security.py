from app.core.security import hash_secret, pin_is_valid_shape, verify_secret


def test_hash_secret_never_plaintext() -> None:
    hashed = hash_secret("123456")
    assert hashed != "123456"
    assert verify_secret("123456", hashed)
    assert not verify_secret("000000", hashed)


def test_pin_shape() -> None:
    assert pin_is_valid_shape("123456")
    assert not pin_is_valid_shape("12345")
    assert not pin_is_valid_shape("abcdef")
