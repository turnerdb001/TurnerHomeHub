from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin
from app.schemas import AdGuardStatus
from app.services.adguard import AdGuardClient

router = APIRouter(prefix="/adguard", tags=["adguard"])


@router.get("/status", response_model=AdGuardStatus, dependencies=[Depends(get_current_admin)])
async def adguard_status() -> dict:
    return await AdGuardClient().status()
