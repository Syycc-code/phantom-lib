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
    # 自动重置长时间THINKING状态（防止卡死）
    if system_metrics["ai_state"] == "THINKING":
        elapsed = time.time() - system_metrics.get("last_activity", 0)
        if elapsed > 60:  # 超过60秒自动重置为TIMEOUT
            system_metrics["ai_state"] = "TIMEOUT"
    
    return system_metrics
