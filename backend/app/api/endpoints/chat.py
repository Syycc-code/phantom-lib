import json
import time
import asyncio
from typing import Optional, List
from pydantic import BaseModel

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from app.api.deps import get_session
from app.models.paper import Paper
from app.services.rag import deepseek_client, retrieve_context, RAG_AVAILABLE
from app.services.search import perform_web_search, SEARCH_AVAILABLE
from app.core.config import settings
from app.core.prompts import SYSTEM_PROMPTS
from app.api.endpoints.monitor import system_metrics

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[dict]] = []
    scope: Optional[dict] = None # { folder_id: 123 }
    paper_ids: Optional[List[int]] = [] # Selected paper IDs from sources panel
    use_web_search: Optional[bool] = False # Deep research mode toggle

class MindHackRequest(BaseModel):
    text: str
    mode: str

@router.post("/chat_stream")
async def chat_stream(
    request: ChatRequest,
    session: Session = Depends(get_session)
):
    system_metrics["ai_state"] = "THINKING"
    system_metrics["last_activity"] = time.time()
    start_time = time.time()

    async def generate():
        try:
            # 1. RAG
            print(f"[CHAT] Starting RAG... Available: {RAG_AVAILABLE}")
            citations = []
            sources = []
            
            # Filter Logic & System Context
            file_filter = None
            scope_info = "Current Scope: GLOBAL (Searching all files)."
            
            # --- PRIORITY 1: Use paper_ids if provided (user selected sources) ---
            if request.paper_ids and len(request.paper_ids) > 0:
                file_filter = [str(pid) for pid in request.paper_ids]
                # Fetch paper titles for scope info
                try:
                    from sqlmodel import col
                    selected_papers = session.exec(select(Paper).where(col(Paper.id).in_(request.paper_ids))).all()
                    if selected_papers:
                        paper_titles = ", ".join([f"'{p.title}'" for p in selected_papers])
                        scope_info = f"Current Scope: USER SELECTED {len(selected_papers)} source(s): [{paper_titles}]."
                        print(f"[CHAT] Using user-selected papers: {file_filter}")
                except Exception as e:
                    print(f"[CHAT] Error fetching selected papers: {e}")
                    
            # --- PRIORITY 2: Use folder scope if no paper_ids ---
            elif request.scope and request.scope.get('folder_id'):
                folder_id = request.scope['folder_id']
                folder_name = request.scope.get('name', 'Unknown Folder')
                # Get all paper IDs in this folder
                try:
                    papers = session.exec(select(Paper).where(Paper.folder_id == int(folder_id))).all()
                    if papers:
                        file_filter = [str(p.id) for p in papers]
                        paper_titles = ", ".join([f"'{p.title}'" for p in papers])
                        scope_info = f"Current Scope: Folder '{folder_name}'. Contains {len(papers)} files: [{paper_titles}]."
                        print(f"[CHAT] Scope: Folder {folder_id} -> Papers: {file_filter}")
                    else:
                        scope_info = f"Current Scope: Folder '{folder_name}'. This folder is EMPTY."
                        print(f"[CHAT] Scope: Folder {folder_id} is empty.")
                        file_filter = ["__empty__"] # Force no results
                except Exception as e:
                    print(f"[CHAT] Error in folder scope: {e}")
            else:
                # Global Scope - Count total files
                try:
                    total_count = session.exec(select(Paper)).all()
                    scope_info = f"Current Scope: GLOBAL. Knowledge Base contains {len(total_count)} files."
                except Exception as e:
                    print(f"[CHAT] Error counting papers: {e}")

            context_text = ""
            if RAG_AVAILABLE:
                try:
                    # Use request.query for RAG search
                    context_text, citations = await asyncio.to_thread(retrieve_context, request.query, file_filter=file_filter)
                    print(f"[CHAT] RAG Complete. Citations found: {len(citations)}")
                    
                    # --- FIX: Map Source ID to Paper Title ---
                    if citations:
                        # Extract IDs (assuming source is numeric ID string)
                        paper_ids_list = []
                        for c in citations:
                            if c['source'].isdigit():
                                paper_ids_list.append(int(c['source']))
                        
                        if paper_ids_list:
                            # Fetch titles from DB
                            try:
                                from sqlmodel import col
                                db_papers = session.exec(select(Paper).where(col(Paper.id).in_(paper_ids_list))).all()
                                paper_map = {str(p.id): p.title for p in db_papers}
                            except Exception as db_e:
                                print(f"[CHAT] Failed to map titles: {db_e}")
                                paper_map = {}

                            # Update Citations
                            for c in citations:
                                if c['source'] in paper_map:
                                    c['source'] = paper_map[c['source']]
                    # -----------------------------------------

                except Exception as e:
                    print(f"[CHAT] RAG Failed: {e}")
                    import traceback
                    traceback.print_exc()
                    context_text = ""
            else:
                context_text = ""

            # Prepend System Info to Context
            final_context = f"【System Metadata】\n{scope_info}\n\n"

            # 1.5 ABSTRACT FALLBACK (Smart Context)
            # If RAG found nothing (or very little), and we have specific papers selected,
            # inject their abstracts directly.
            if (not citations or len(citations) == 0):
                papers_for_fallback = []
                
                # Get papers for fallback
                if request.paper_ids and len(request.paper_ids) > 0:
                    # User-selected papers
                    print("[CHAT] RAG empty. Fetching abstracts for selected papers...")
                    try:
                        from sqlmodel import col
                        selected_papers = session.exec(select(Paper).where(col(Paper.id).in_(request.paper_ids))).all()
                        if selected_papers and len(selected_papers) <= 5:
                            papers_for_fallback = selected_papers
                    except Exception as e:
                        print(f"[CHAT] Failed to fetch selected papers: {e}")
                elif request.scope and request.scope.get('folder_id'):
                    # Folder scope
                    try:
                        folder_id = request.scope['folder_id']
                        folder_papers = session.exec(select(Paper).where(Paper.folder_id == int(folder_id))).all()
                        if folder_papers and len(folder_papers) <= 5:
                            papers_for_fallback = folder_papers
                    except Exception as e:
                        print(f"[CHAT] Failed to fetch folder papers: {e}")
                
                # Inject abstracts as fallback
                if papers_for_fallback:
                    print(f"[CHAT] Injecting {len(papers_for_fallback)} paper abstracts as fallback context.")
                    abstracts_text = ""
                    for p in papers_for_fallback:
                        if p.abstract:
                            abstracts_text += f"\n[Abstract of '{p.title}']:\n{p.abstract}\n"
                    
                    if abstracts_text:
                        context_text = f"【Direct Paper Abstracts】{abstracts_text}\n\n" + context_text
                        # Fake source for UI
                        sources.append("Paper Abstract")

            final_context += f"【Retrieved Content】\n{context_text if context_text else 'No specific content matches found via RAG search.'}"

            # 2. Web Search
            sources = list(set(sources + [c.get('source', 'Unknown') for c in citations])) # Merge sources
            
            # Search web if:
            # 1. Context is truly empty (fallback), OR
            # 2. User explicitly enabled Deep Research mode
            is_context_empty = not context_text.strip()
            should_search_web = (is_context_empty or request.use_web_search) and SEARCH_AVAILABLE
            
            if should_search_web:
                system_metrics["ai_state"] = "SEARCHING"
                search_reason = "No local context found" if is_context_empty else "Deep Research enabled"
                search_msg = f"🔍 [{search_reason}] Searching Web...\n"
                yield f"data: {json.dumps({'content': search_msg}, ensure_ascii=False)}\n\n"
                web_res = await asyncio.to_thread(perform_web_search, request.query)
                if web_res:
                    final_context += f"\n\n【Web Intel】\n{web_res}"
                    sources.append("Global Network")
                system_metrics["ai_state"] = "THINKING"

            # 3. Prompt
            # Inject citation instruction
            citation_instruction = "IMPORTANT: Use the provided context to answer. When citing specific information, append [index] at the end of the sentence. Example: 'The method uses X [1].'"
            
            messages = [{"role": "system", "content": SYSTEM_PROMPTS["CHAT_NAVI"] + "\n" + citation_instruction}]
            if request.history:
                for msg in request.history[-6:]:
                    role = "assistant" if msg.get("role") == "oracle" else "user"
                    messages.append({"role": role, "content": msg.get("content", "")})
            messages.append({"role": "user", "content": f"Context:\n{final_context}\n\nQuery: {request.query}"})

            # 4. Stream
            if not settings.DEEPSEEK_API_KEY or settings.DEEPSEEK_API_KEY == "mock-key":
                yield f"data: {json.dumps({'content': '【Mock Mode】'}, ensure_ascii=False)}\n\n"
                yield f"data: {json.dumps({'done': True}, ensure_ascii=False)}\n\n"
                return

            response = await deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                stream=True,
                max_tokens=1000,
                timeout=settings.DEEPSEEK_TIMEOUT
            )

            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'content': chunk.choices[0].delta.content}, ensure_ascii=False)}\n\n"
            
            system_metrics["ai_latency_ms"] = int((time.time() - start_time) * 1000)
            system_metrics["ai_state"] = "IDLE"
            system_metrics["last_activity"] = time.time()
            
            # Send citations with the done event
            yield f"data: {json.dumps({'done': True, 'sources': sources, 'citations': citations}, ensure_ascii=False)}\n\n"

        except Exception as e:
            system_metrics["ai_state"] = "ERROR"
            system_metrics["last_activity"] = time.time()
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

from app.services.analysis import analyze_paper_content

@router.post("/mind_hack")
async def mind_hack(request: MindHackRequest):
    system_metrics["ai_state"] = "THINKING"
    system_metrics["last_activity"] = time.time()
    try:
        # If mode is analyze_paper, we use the specialized service
        if request.mode == "analyze_paper":
            # request.text here is assumed to be the abstract or full text
            result = await analyze_paper_content(request.text)
            # Convert JSON result to string for display or further processing
            formatted_res = (
                f"TAGS: {', '.join(result.get('tags', []))}\n\n"
                f"SHADOW: {result.get('shadow_problem')}\n"
                f"PERSONA: {result.get('persona_solution')}\n"
                f"FLAW: {result.get('weakness_flaw')}"
            )
            system_metrics["ai_state"] = "IDLE"
            system_metrics["last_activity"] = time.time()
            return {"result": formatted_res, "raw": result}

        sys_prompt = SYSTEM_PROMPTS["MIND_HACK_TRANSLATE"] if request.mode == "translate" else SYSTEM_PROMPTS["MIND_HACK_ANALYZE"]
        response = await deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "system", "content": sys_prompt}, {"role": "user", "content": request.text}],
            stream=False
        )
        system_metrics["ai_state"] = "IDLE"
        system_metrics["last_activity"] = time.time()
        return {"result": response.choices[0].message.content}
    except Exception as e:
        system_metrics["ai_state"] = "ERROR"
        system_metrics["last_activity"] = time.time()
        return {"result": f"Error: {e}"}
