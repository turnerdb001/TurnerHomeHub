from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import AccessLog, Base
from app.services.audit import log_event


def test_log_event_creates_row() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    row = log_event(db, action="pin_failed", result="wrong_pin", client_ip="127.0.0.1", domain="example.com")
    assert row.id == 1
    assert db.query(AccessLog).count() == 1
    db.close()
