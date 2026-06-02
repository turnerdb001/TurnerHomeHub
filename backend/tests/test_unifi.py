from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base, Device
from app.services.unifi import normalize_mac, sync_clients_to_devices


def test_normalize_mac_formats() -> None:
    assert normalize_mac("AA-BB-CC-DD-EE-FF") == "aa:bb:cc:dd:ee:ff"
    assert normalize_mac("aabb.ccdd.eeff") == "aa:bb:cc:dd:ee:ff"


def test_sync_clients_imports_and_updates_by_mac() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    result = sync_clients_to_devices(
        db,
        [
            {
                "mac_address": "aa:bb:cc:dd:ee:ff",
                "ip_address": "192.168.1.25",
                "name": "Kitchen-iPad",
                "hostname": "kitchen-ipad",
                "network": "Kids",
                "ssid": "Home",
                "is_wired": False,
            }
        ],
    )
    assert result["imported"] == 1
    assert db.query(Device).count() == 1

    result = sync_clients_to_devices(
        db,
        [
            {
                "mac_address": "aa:bb:cc:dd:ee:ff",
                "ip_address": "192.168.1.26",
                "name": "Kitchen-iPad",
                "hostname": "kitchen-ipad",
                "network": "Kids",
                "ssid": "Home",
                "is_wired": False,
            }
        ],
    )
    assert result["updated"] == 1
    assert db.query(Device).first().ip_address == "192.168.1.26"
    db.close()
