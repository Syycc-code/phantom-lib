import json
import time
import asyncio
from typing import Optional, List
from pydantic import BaseModel

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.rag import deepseek_client, retrieve_context, RAG_AVAILABLE
from app.services.search import perform_web_search, SEARCH_AVAILABLE
from app.core.config import settings
from app.core.prompts import SYSTEM_PROMPTS
from app.api.endpoints.monitor import system_metrics

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[dict]] = []

class MindHackRequest(BaseModel):
    text: str
    mode: str

@router.post("/chat_stream")
async def chat_stream(request: ChatRequest):
    system_metrics["ai_state"] = "THINKING"
    system_metrics["last_activity"] = time.time()
    start_time = time.time()

    async def generate():
        try:
            # 1. RAG
            context_text, sources = retrieve_context(request.query)
            if not context_text: context_text = "No relevant internal documents found."

            # 2. Web Search
            if "No relevant internal documents found" in context_text and SEARCH_AVAILABLE:
                system_metrics["ai_state"] = "SEARCHING"
                yield f"data: {json.dumps({'content': '🔍 [Searching Web]...\\n'}, ensure_ascii=False)}\n\n"
                web_res = await asyncio.to_thread(perform_web_search, request.query)
                if web_res:
                    context_text = f"【Web Intel】\n{web_res}"
                    sources.append("Global Network")
                system_metrics["ai_state"] = "THINKING"

            # 3. Prompt
            messages = [{"role": "system", "content": SYSTEM_PROMPTS["CHAT_NAVI"]}]
            if request.history:
                for msg in request.history[-6:]:
                    role = "assistant" if msg.get("role") == "oracle" else "user"
                    messages.append({"role": role, "content": msg.get("content", "")})
            messages.append({"role": "user", "content": f"Context:\n{context_text}\n\nQuery: {request.query}"})

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
            yield f"data: {json.dumps({'done': True, 'sources': sources}, ensure_ascii=False)}\n\n"

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
            # Or just return the raw JSON if frontend expects it
            # For compatibility with frontend expecting {"result": str}, we format it:
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
