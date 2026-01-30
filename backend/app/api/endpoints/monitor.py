from fastapi import APIRouter
from app.core.config import settings
import time
import os
import signal
import threading
import sys

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

@router.post("/monitor/shutdown")
async def shutdown():
    """Gracefully shutdown the server"""
    print("[SYSTEM] Received SHUTDOWN command.")
    
    def kill():
        time.sleep(1)
        print("[SYSTEM] Exiting process...")
        # Use os._exit to force kill fast, or sys.exit for cleanup
        os._exit(0)
    
    threading.Thread(target=kill).start()
    return {"status": "SHUTTING_DOWN"}
