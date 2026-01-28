"""
论文处理服务 - 统一的论文上传/分析/索引流程
"""
import asyncio
import os
import uuid
from typing import Optional
from sqlmodel import Session

from app.models.paper import Paper
from app.services.ocr import extract_text_from_file
from app.services.rag import index_document
from app.services.analysis import analyze_paper_content
from app.core.config import settings


async def process_paper(
    content: bytes,
    filename: str,
    session: Session,
    title: Optional[str] = None,
    author: str = "Unknown Entity",
    year: str = "2025",
    url: Optional[str] = None
) -> Paper:
    """
    统一的论文处理流程
    
    Args:
        content: PDF二进制内容
        filename: 文件名
        session: 数据库会话
        title: 论文标题（可选，默认使用filename）
        author: 作者
        year: 年份
        url: 来源URL（可选）
    
    Returns:
        处理完成的Paper对象
    """
    # 1. 保存文件到磁盘
    file_id = str(uuid.uuid4())
    save_path = f"{settings.UPLOAD_DIR}/{file_id}.pdf"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    with open(save_path, "wb") as f:
        f.write(content)
    
    # 2. 提取文本
    preview_text = await extract_text_from_file(content, filename)
    
    # 3. 创建数据库记录
    new_paper = Paper(
        title=title or filename,
        author=author,
        year=year,
        url=url,
        file_path=save_path,
        abstract=preview_text[:500] + "..." if len(preview_text) > 500 else preview_text
    )
    session.add(new_paper)
    session.commit()
    session.refresh(new_paper)
    
    try:
        # 4. 触发后台任务（添加安全检查）
        # 将同步的 index_document 放入线程池，避免阻塞
        asyncio.create_task(asyncio.to_thread(_safe_index_document, preview_text, filename))
        
        # 只在有ID和abstract时触发分析
        if new_paper.id and new_paper.abstract:
            asyncio.create_task(_run_analysis(new_paper.id, new_paper.abstract, session.bind))
    except Exception as e:
        print(f"[PROCESS ERROR] Background tasks failed: {e}")
    
    return new_paper

def _safe_index_document(text: str, filename: str):
    """Wrapper to prevent RAG crashes from killing the app"""
    try:
        index_document(text, filename)
    except Exception as e:
        print(f"[RAG INDEX ERROR] Failed to index {filename}: {e}")


async def _run_analysis(paper_id: int, abstract: str, engine):
    """
    异步AI分析任务（私有函数）
    
    使用新的数据库会话避免线程冲突
    """
    try:
        analysis = await analyze_paper_content(abstract)
        
        # 使用独立的会话更新数据库
        with Session(engine) as db:
            paper = db.get(Paper, paper_id)
            if paper:
                paper.shadow_problem = analysis.get("shadow_problem")
                paper.persona_solution = analysis.get("persona_solution")
                paper.weakness_flaw = analysis.get("weakness_flaw")
                # 未来可扩展 tags 字段
                db.add(paper)
                db.commit()
    except Exception as e:
        print(f"[ANALYSIS ERROR] Paper {paper_id}: {e}")
