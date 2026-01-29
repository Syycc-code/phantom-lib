from typing import List, Any, Optional
import os
import time
import httpx

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select, desc
from pydantic import BaseModel

from app.api.deps import get_session
from app.models.paper import Paper, PaperRead, PaperUpdate
from app.services.paper_processor import process_paper
from app.services.url_parser import parse_url
from app.api.endpoints.monitor import system_metrics
import fitz
from app.services.rag import deepseek_client
from app.core.prompts import SYSTEM_PROMPTS
from app.core.config import settings

router = APIRouter()

class TranslatePageRequest(BaseModel):
    page: int

import json

@router.post("/papers/{paper_id}/translate_page")
async def translate_paper_page(
    paper_id: int, 
    request: TranslatePageRequest,
    session: Session = Depends(get_session)
):
    paper = session.get(Paper, paper_id)
    if not paper or not paper.file_path or not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404, detail="Paper not found")
    
    text = ""
    try:
        with fitz.open(paper.file_path) as doc:
            if 0 <= request.page - 1 < len(doc):
                page = doc[request.page - 1]
                text = page.get_text()
            else:
                 raise HTTPException(status_code=400, detail="Page out of range")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Error: {str(e)}")
        
    if not text.strip():
        # Return empty block list for consistency
        return {"blocks": [{"src": "", "dst": "⚠️ 此页面没有文本。"}]}
        
    try:
        response = await deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPTS["MIND_HACK_TRANSLATE_JSON"]},
                {"role": "user", "content": text}
            ],
            stream=False,
            timeout=60.0
        )
        content = response.choices[0].message.content.strip()
        
        # Safe JSON parsing
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        
        try:
            blocks = json.loads(content)
        except json.JSONDecodeError:
            # Fallback for malformed JSON
            blocks = [{"src": text, "dst": content}]
            
        return {"blocks": blocks}
    except Exception as e:
        return {"blocks": [{"src": text, "dst": f"Translation Failed: {str(e)}"}]}


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
        
        # 2. 下载文件（增加超时时间）
        async with httpx.AsyncClient(timeout=120.0) as client:  # 2分钟超时
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

@router.get("/papers")
async def get_papers(session: Session = Depends(get_session)):
    # Return raw objects to debug validation errors
    papers = session.exec(select(Paper).order_by(desc(Paper.created_at))).all()
    return papers

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

@router.patch("/papers/{paper_id}", response_model=PaperRead)
def update_paper(
    *,
    db: Session = Depends(get_session),
    paper_id: int,
    paper_in: PaperUpdate,
) -> Any:
    """
    Update a paper.
    """
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    paper_data = paper_in.dict(exclude_unset=True)
    for key, value in paper_data.items():
        setattr(paper, key, value)
        
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper

@router.patch("/papers/{paper_id}/move", response_model=PaperRead)
def move_paper(
    *,
    db: Session = Depends(get_session),
    paper_id: int,
    folder_id: Optional[int] = None, # If None, move to root
) -> Any:
    """
    Move paper to a specific folder (or root if folder_id is null)
    """
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    paper.folder_id = folder_id
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper

# Legacy support
@router.post("/scan_document")
async def scan_document_legacy(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session)
):
    """向后兼容接口"""
    return await upload_paper(file, session)
