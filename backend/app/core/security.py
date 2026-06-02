from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12


def hash_secret(value: str) -> str:
    return pwd_context.hash(value)


def verify_secret(plain_value: str, hashed_value: str | None) -> bool:
    if not hashed_value:
        return False
    return pwd_context.verify(plain_value, hashed_value)


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.app_secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.app_secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None


def pin_is_valid_shape(pin: str) -> bool:
    return len(pin) == 6 and pin.isdigit()
