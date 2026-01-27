from typing import List
import os
import time
import httpx

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select, desc
from pydantic import BaseModel

from app.api.deps import get_session
from app.models.paper import Paper, PaperRead
from app.services.paper_processor import process_paper
from app.services.url_parser import parse_url
from app.api.endpoints.monitor import system_metrics

router = APIRouter()


class UrlUploadRequest(BaseModel):
    url: str

@router.post("/upload/url", response_model=PaperRead)
async def upload_paper_from_url(
    request: UrlUploadRequest, 
    session: Session = Depends(get_session)
):
    """通过URL上传论文（支持Arxiv等平台）"""
    start_time = time.time()
    url = request.url
    
    try:
        # 1. 解析URL（业务逻辑已转移至 url_parser）
        download_url, year = parse_url(url)
        
        # 2. 下载文件
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(download_url, follow_redirects=True)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to fetch URL (HTTP {resp.status_code})"
                )
            content = resp.content
        
        # 3. 推断文件名
        filename = url.split("/")[-1]
        if not filename.lower().endswith(".pdf"):
            filename += ".pdf"
        
        # 4. 使用统一的处理服务
        title = f"Arxiv: {filename}" if "arxiv" in url else filename
        new_paper = await process_paper(
            content=content,
            filename=filename,
            session=session,
            title=title,
            year=year,
            url=url
        )
        
        system_metrics["ocr_speed_ms"] = int((time.time() - start_time) * 1000)
        return new_paper
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[URL_UPLOAD_ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", response_model=PaperRead)
async def upload_paper(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session)
):
    """直接上传PDF文件"""
    start_time = time.time()
    
    try:
        # 1. 读取文件内容
        content = await file.read()
        
        # 2. 使用统一的处理服务
        new_paper = await process_paper(
            content=content,
            filename=file.filename or "unknown.pdf",
            session=session
        )
        
        system_metrics["ocr_speed_ms"] = int((time.time() - start_time) * 1000)
        return new_paper
        
    except Exception as e:
        print(f"[FILE_UPLOAD_ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/papers", response_model=List[PaperRead])
async def get_papers(session: Session = Depends(get_session)):
    return session.exec(select(Paper).order_by(desc(Paper.created_at))).all()

@router.get("/papers/{paper_id}/pdf")
async def get_paper_pdf(paper_id: int, session: Session = Depends(get_session)):
    paper = session.get(Paper, paper_id)
    if not paper or not paper.file_path or not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404)
    return FileResponse(
        paper.file_path, 
        media_type="application/pdf", 
        filename=paper.title,
        content_disposition_type="inline"
    )

class NoteUpdate(BaseModel):
    content: str

@router.put("/papers/{paper_id}/notes")
async def update_paper_notes(
    paper_id: int, 
    note: NoteUpdate, 
    session: Session = Depends(get_session)
):
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404)
    paper.user_notes = note.content
    session.add(paper)
    session.commit()
    return {"ok": True}

@router.delete("/papers/{paper_id}")
async def delete_paper(paper_id: int, session: Session = Depends(get_session)):
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404)
    
    # 删除文件
    if paper.file_path and os.path.exists(paper.file_path):
        os.remove(paper.file_path)
    
    session.delete(paper)
    session.commit()
    return {"ok": True}

# Legacy support
@router.post("/scan_document")
async def scan_document_legacy(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session)
):
    """向后兼容接口"""
    return await upload_paper(file, session)
