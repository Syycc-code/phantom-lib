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

import httpx
from pydantic import BaseModel

class UrlUploadRequest(BaseModel):
    url: str

import re
from app.services.analysis import analyze_paper_content

@router.post("/upload/url", response_model=PaperRead)
async def upload_paper_from_url(request: UrlUploadRequest, session: Session = Depends(get_session)):
    start_time = time.time()
    url = request.url
    
    try:
        # 1. Basic Arxiv Handling
        if "arxiv.org" in url:
            # Transform /abs/ to /pdf/ if needed
            if "/abs/" in url:
                pdf_url = url.replace("/abs/", "/pdf/") + ".pdf"
            elif "/pdf/" in url and not url.endswith(".pdf"):
                pdf_url = url + ".pdf"
            else:
                pdf_url = url
                
            # Parse Year from Arxiv ID (e.g., 2312.xxxxx -> 2023, 1706.xxxxx -> 2017)
            # Match 4 digits after /pdf/ or /abs/ or in the ID
            year_match = re.search(r'(\d{4})\.\d{4,5}', url)
            if year_match:
                yy_str = year_match.group(1)[:2] # First 2 digits are Year
                parsed_year = "20" + yy_str
            else:
                parsed_year = "2025" # Default if not found
        else:
            pdf_url = url
            parsed_year = "2025"

        # 2. Download File
        async with httpx.AsyncClient() as client:
            resp = await client.get(pdf_url, follow_redirects=True)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch URL target")
            
            content = resp.content
            
            # Infer filename
            filename = url.split("/")[-1]
            if not filename.lower().endswith(".pdf"):
                filename += ".pdf"
                
        # 3. Save to Disk
        file_id = str(uuid.uuid4())
        save_path = f"{settings.UPLOAD_DIR}/{file_id}.pdf"
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        with open(save_path, "wb") as f:
            f.write(content)
            
        # 4. Processing
        preview_text = await extract_text_from_file(content, filename)
        
        new_paper = Paper(
            title=f"Arxiv: {filename}" if "arxiv" in url else filename,
            author="Unknown Entity", 
            year=parsed_year,
            url=url,
            file_path=save_path,
            abstract=preview_text[:500] + "..."
        )
        session.add(new_paper)
        session.commit()
        session.refresh(new_paper)
        
        # Trigger Indexing
        asyncio.create_task(asyncio.to_thread(index_document, preview_text, filename))
        
        # Trigger AI Analysis (Async)
        async def run_analysis(p_id, abstract):
            analysis = await analyze_paper_content(abstract)
            with Session(session.bind) as db: # New session for async task
                p = db.get(Paper, p_id)
                if p:
                    p.shadow_problem = analysis.get("shadow_problem")
                    p.persona_solution = analysis.get("persona_solution")
                    p.weakness_flaw = analysis.get("weakness_flaw")
                    # Note: We don't have a tags column in DB yet, usually stored as JSON or string
                    # For now, we skip tags or would need another migration
                    db.add(p)
                    db.commit()
        
        asyncio.create_task(run_analysis(new_paper.id, new_paper.abstract))
        
        system_metrics["ocr_speed_ms"] = int((time.time() - start_time) * 1000)
        return new_paper

    except Exception as e:
        print(f"[CRAWLER ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", response_model=PaperRead)
async def upload_paper(file: UploadFile = File(...), session: Session = Depends(get_session)):
    start_time = time.time()
    try:
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
        
        # Trigger AI Analysis (Async)
        async def run_analysis(p_id, abstract):
            analysis = await analyze_paper_content(abstract)
            with Session(session.bind) as db:
                p = db.get(Paper, p_id)
                if p:
                    p.shadow_problem = analysis.get("shadow_problem")
                    p.persona_solution = analysis.get("persona_solution")
                    p.weakness_flaw = analysis.get("weakness_flaw")
                    db.add(p)
                    db.commit()
        
        asyncio.create_task(run_analysis(new_paper.id, new_paper.abstract))
        
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
    return FileResponse(paper.file_path, media_type="application/pdf", filename=paper.title, content_disposition_type="inline")

class NoteUpdate(BaseModel):
    content: str

@router.put("/papers/{paper_id}/notes")
async def update_paper_notes(paper_id: int, note: NoteUpdate, session: Session = Depends(get_session)):
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    paper.user_notes = note.content
    session.add(paper)
    session.commit()
    return {"ok": True}

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
