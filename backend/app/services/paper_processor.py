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
    author: str = "Unknown Author", # Changed from Unknown Entity
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
    
    # 2. 提取文本 (Text + Spatial Metadata)
    full_text, chunks = await extract_text_from_file(content, filename)
    
    # 3. 创建数据库记录
    new_paper = Paper(
        title=title or filename,
        author=author,
        year=year,
        url=url,
        file_path=save_path,
        abstract=full_text[:500] + "..." if len(full_text) > 500 else full_text
    )
    session.add(new_paper)
    session.commit()
    session.refresh(new_paper)
    
    try:
        # 4. 触发后台任务（添加安全检查和崩溃保护）
        # 将同步的 index_document 放入线程池，避免阻塞
        # Updated: Pass chunks (with bbox) instead of raw text
        # CRITICAL: Use Paper ID as source for RAG to allow filtering by Folder
        rag_source = str(new_paper.id)
        
        # Create task with exception handler
        index_task = asyncio.create_task(asyncio.to_thread(_safe_index_document, chunks, rag_source))
        index_task.add_done_callback(_task_exception_handler)
        
        # 只在有ID和abstract时触发分析
        if new_paper.id and new_paper.abstract:
            analysis_task = asyncio.create_task(_run_analysis(new_paper.id, new_paper.abstract, session.bind))
            analysis_task.add_done_callback(_task_exception_handler)
    except Exception as e:
        print(f"[PROCESS ERROR] Background tasks failed to start: {e}")
        import traceback
        traceback.print_exc()
    
    return new_paper

def _safe_index_document(chunks: list, filename: str):
    """Wrapper to prevent RAG crashes from killing the app"""
    try:
        print(f"[RAG] Starting background indexing for: {filename}")
        index_document(chunks, filename)
        print(f"[RAG] Background indexing completed for: {filename}")
    except Exception as e:
        import traceback
        print(f"[RAG INDEX ERROR] Failed to index {filename}: {e}")
        print(f"[RAG INDEX ERROR] Traceback:")
        traceback.print_exc()
        # Don't re-raise - just log and continue

def _task_exception_handler(task):
    """Handle exceptions from background tasks to prevent crashes"""
    try:
        # This will raise if the task had an exception
        task.result()
    except Exception as e:
        import traceback
        print(f"[BACKGROUND TASK ERROR] Unhandled exception in async task: {e}")
        traceback.print_exc()
        # Don't re-raise - server should continue running


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
