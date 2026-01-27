from typing import List
from pathlib import Path
import uuid
import shutil
import asyncio
import os
import time

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from app.api.deps import get_session
from app.models.paper import Paper, PaperRead
from app.services.ocr import extract_text_from_file
from app.services.rag import index_document
from app.core.config import settings
from app.api.endpoints.monitor import system_metrics

router = APIRouter()

@router.post("/upload", response_model=PaperRead)
async def upload_paper(file: UploadFile = File(...), session: Session = Depends(get_session)):
    start_time = time.time()
    try:
        file_id = str(uuid.uuid4())
        file_ext = Path(file.filename).suffix
        save_path = f"{settings.UPLOAD_DIR}/{file_id}{file_ext}"
        
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        with open(save_path, "rb") as f:
            content = f.read()
        preview_text = await extract_text_from_file(content, file.filename)
        
        new_paper = Paper(
            title=file.filename,
            file_path=save_path,
            abstract=preview_text[:300] + "..."
        )
        session.add(new_paper)
        session.commit()
        session.refresh(new_paper)
        
        asyncio.create_task(asyncio.to_thread(index_document, preview_text, file.filename))
        
        system_metrics["ocr_speed_ms"] = int((time.time() - start_time) * 1000)
        return new_paper
    except Exception as e:
        print(f"[UPLOAD ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/papers", response_model=List[PaperRead])
async def get_papers(session: Session = Depends(get_session)):
    return session.exec(select(Paper).order_by(Paper.created_at.desc())).all()

@router.get("/papers/{paper_id}/pdf")
async def get_paper_pdf(paper_id: int, session: Session = Depends(get_session)):
    paper = session.get(Paper, paper_id)
    if not paper or not paper.file_path or not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404)
    return FileResponse(paper.file_path, media_type="application/pdf", filename=paper.title)

@router.delete("/papers/{paper_id}")
async def delete_paper(paper_id: int, session: Session = Depends(get_session)):
    paper = session.get(Paper, paper_id)
    if not paper: raise HTTPException(status_code=404)
    if paper.file_path and os.path.exists(paper.file_path):
        os.remove(paper.file_path)
    session.delete(paper)
    session.commit()
    return {"ok": True}

# Legacy support
@router.post("/scan_document")
async def scan_document_legacy(file: UploadFile = File(...), session: Session = Depends(get_session)):
    return await upload_paper(file, session)
