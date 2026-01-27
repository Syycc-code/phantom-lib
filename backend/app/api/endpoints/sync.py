from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import Session
from app.api.deps import get_session
from app.models.paper import Paper
from app.services.export import export_paper_to_markdown
import os

router = APIRouter()

# Global config storage (In memory for now, ideally DB or .env)
SYNC_CONFIG = {"obsidian_path": ""}

class SyncConfig(BaseModel):
    path: str

@router.post("/config")
async def set_sync_config(config: SyncConfig):
    if not os.path.exists(config.path):
        # We allow creating it if it looks like a valid path structure, but safer to check existence
        try:
            os.makedirs(config.path, exist_ok=True)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid path or permission denied")
            
    SYNC_CONFIG["obsidian_path"] = config.path
    return {"status": "Configured", "path": config.path}

@router.get("/config")
async def get_sync_config():
    return SYNC_CONFIG

@router.post("/export/{paper_id}")
async def sync_paper(paper_id: int, session: Session = Depends(get_session)):
    target_dir = SYNC_CONFIG.get("obsidian_path")
    if not target_dir:
        raise HTTPException(status_code=400, detail="Obsidian path not configured")
        
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    try:
        exported_path = export_paper_to_markdown(paper, target_dir)
        return {"status": "Synced", "file": exported_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
