from fastapi import APIRouter
from app.core.config import settings
import time

router = APIRouter()

# Global metrics (Simple in-memory for now, upgrade to Redis later)
system_metrics = {
    "status": "ONLINE",
    "ai_latency_ms": 0,
    "ocr_speed_ms": 0,
    "last_activity": time.time(),
    "ai_state": "IDLE"
}

@router.get("/monitor")
async def get_system_monitor():
    return system_metrics
