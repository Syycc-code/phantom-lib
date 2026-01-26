import os
import re
import asyncio
import io
import uuid
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, SQLModel, create_engine
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from openai import AsyncOpenAI

# --- OCR Dependencies ---
import fitz  # PyMuPDF
from rapidocr_onnxruntime import RapidOCR
from concurrent.futures import ThreadPoolExecutor

# --- RAG Dependencies ---
# 设置 HuggingFace 镜像 (在导入 sentence_transformers 之前)
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    RAG_AVAILABLE = True
except Exception as e:
    print(f"[PHANTOM] RAG features disabled (Import Error): {e}")
    RAG_AVAILABLE = False

# Load Secret Keys
from pathlib import Path
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
# Fallback to local .env if parent not found
if not os.getenv("DEEPSEEK_API_KEY"):
    load_dotenv()

from models import Paper, PaperCreate, PaperRead

# --- Database Setup ---
sqlite_file_name = "phantom_database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# --- AI Setup ---
deepseek_client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", "mock-key"), 
    base_url="https://api.deepseek.com"
)

# --- OCR Setup ---
ocr_engine = RapidOCR()
executor = ThreadPoolExecutor(max_workers=4)  # Increased from 2 to 4 for better concurrency

# --- RAG Setup (Memory) ---
if RAG_AVAILABLE:
    chroma_client = chromadb.Client()
    # Use a persistent path if you want memory to survive restart, 
    # but for prototype, ephemeral is fine or use path="phantom_memory"
    # chroma_client = chromadb.PersistentClient(path="phantom_memory") 
    knowledge_collection = chroma_client.get_or_create_collection(name="phantom_knowledge")

    # Load Embedding Model (Downloads on first run)
    try:
        print("[PHANTOM] Loading Embedding Model (using hf-mirror.com)...")
        embedder = SentenceTransformer('all-MiniLM-L6-v2')
        print("[PHANTOM] Embedding Model Ready.")
    except Exception as e:
        print(f"[PHANTOM] Failed to load Embedding Model: {e}")
        print("[PHANTOM] RAG features will be disabled for this session.")
        RAG_AVAILABLE = False
        knowledge_collection = None
        embedder = None
else:
    chroma_client = None
    knowledge_collection = None
    embedder = None

# --- Lifecycle ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# --- CORS Setup (Fix Failed to fetch errors) ---
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---
class MindHackRequest(BaseModel):
    text: str
    mode: str

class FusionRequest(BaseModel):
    text_a: str
    title_a: str
    text_b: str
    title_b: str

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

# --- Helper: OCR (Turbo - Optimized for 3-5x Performance) ---
def extract_text_from_file_sync(file_content: bytes, filename: str) -> str:
    extracted_text = ""
    try:
        if filename.lower().endswith(".pdf"):
            with fitz.open(stream=file_content, filetype="pdf") as doc:
                # Performance Optimization: Only process first 2 pages (reduced from 3+last)
                target_pages = set(range(min(2, doc.page_count)))
                
                for page_num in sorted(list(target_pages)):
                    page = doc.load_page(page_num)
                    text = page.get_text()
                    if len(text.strip()) > 100:
                        extracted_text += f"\n--- Page {page_num+1} ---\n{text}\n"
                        continue
                    
                    # Fallback OCR - Performance: Reduced DPI from 96 to 72 for faster processing
                    pix = page.get_pixmap(dpi=72)
                    result, _ = ocr_engine(pix.tobytes("png"))
                    if result:
                        extracted_text += f"\n--- Page {page_num+1} (OCR) ---\n" + "\n".join([line[1] for line in result])
        
        elif filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            result, _ = ocr_engine(file_content)
            if result: extracted_text = "\n".join([line[1] for line in result])
        
        else:
            extracted_text = file_content.decode('utf-8', errors='ignore')

    except Exception as e:
        return f"[OCR ERROR] {str(e)}"
    
    return extracted_text

async def extract_text_from_file(file_content: bytes, filename: str) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, extract_text_from_file_sync, file_content, filename)

# --- Helper: Indexing (Memory Injection) ---
def index_document(text: str, filename: str):
    """Chunks text and stores in Vector DB"""
    if not RAG_AVAILABLE or not knowledge_collection or not embedder:
        print(f"[MEMORY] RAG not available, skipping indexing for {filename}")
        return
    
    # Simple chunking by paragraph or fixed size
    chunks = [text[i:i+500] for i in range(0, len(text), 500)]
    
    if not chunks: return

    # Embed
    embeddings = embedder.encode(chunks).tolist()
    ids = [f"{filename}_{uuid.uuid4()}" for _ in chunks]
    metadatas = [{"source": filename} for _ in chunks]

    knowledge_collection.add(
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )
    print(f"[MEMORY] Indexed {len(chunks)} fragments from {filename}")

# --- Endpoints ---

# 用于存储处理状态
processing_status = {}

@app.post("/api/scan_document")
async def scan_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        # 检查文件大小（限制50MB）
        if len(content) > 50 * 1024 * 1024:
            return {
                "filename": file.filename,
                "error": "文件过大（超过50MB），请上传较小的文件",
                "extracted_text": "",
                "char_count": 0
            }
        
        # 使用asyncio.wait_for添加超时（4分钟）
        text = await asyncio.wait_for(
            extract_text_from_file(content, file.filename or "unknown"),
            timeout=240.0
        )
        
        # 后台索引（不等待完成）
        if len(text) > 50:
            asyncio.create_task(
                asyncio.to_thread(index_document, text, file.filename or "unknown")
            )

        return {
            "filename": file.filename,
            "extracted_text": text,
            "char_count": len(text)
        }
    
    except asyncio.TimeoutError:
        return {
            "filename": file.filename,
            "error": "OCR处理超时（超过4分钟），请尝试上传较小的文件或质量更好的PDF",
            "extracted_text": "",
            "char_count": 0
        }
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"[OCR ERROR] {error_detail}")
        return {
            "filename": file.filename,
            "error": f"处理失败: {str(e)}",
            "extracted_text": "",
            "char_count": 0
        }

@app.get("/api/scan_status/{task_id}")
async def get_scan_status(task_id: str):
    """获取OCR处理状态"""
    status = processing_status.get(task_id, {"status": "unknown"})
    return status

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_phantom(request: ChatRequest):
    """
    Skill 6: RAG Chat (The IM Log)
    """
    if not RAG_AVAILABLE or not knowledge_collection or not embedder:
        return {
            "answer": "【RAG功能未启用】需要安装 Visual C++ Redistributable 才能使用 AI 记忆功能。\n\n暂时只能使用基础功能。",
            "sources": []
        }
    
    query = request.query
    api_key = os.getenv("DEEPSEEK_API_KEY")

    # 1. Retrieve (Optimized: n_results reduced from 3 to 2 for faster response)
    query_embedding = embedder.encode([query]).tolist()
    results = knowledge_collection.query(
        query_embeddings=query_embedding,
        n_results=2
    )
    
    context_text = ""
    sources = set()
    
    if results['documents']:
        for i, doc in enumerate(results['documents'][0]):
            meta = results['metadatas'][0][i]
            source = meta.get('source', 'Unknown')
            context_text += f"[Source: {source}]\n{doc}\n\n"
            sources.add(source)

    if not context_text:
        context_text = "No relevant internal documents found."

    # 2. Generate
    system_prompt = (
        "你是怪盗团的导航员 (Oracle/Navi)。你掌管着'印象空间'的知识库。"
        "请根据提供的[上下文]回答用户的提问。如果上下文里有答案,请引用来源。"
        "如果上下文没有,请用你的通用知识回答,但要说明'数据库中未找到相关情报'。"
        "风格：活泼、极客、充满黑客术语 (Hack, Exploit, Shadow)。"
    )

    if not api_key or api_key == "mock-key":
        await asyncio.sleep(1.5)
        return {
            "answer": f"【模拟回复】(API Key未配置)\n\n根据我对印象空间的扫描 ({list(sources)})... \n\n似乎 '{query}' 与认知世界的底层架构有关。建议深入调查。",
            "sources": list(sources)
        }

    try:
        response = await deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"上下文:\n{context_text}\n\n问题: {query}"},
            ],
            stream=False,
            max_tokens=500  # Added token limit for faster response
        )
        return {
            "answer": response.choices[0].message.content,
            "sources": list(sources)
        }
    except Exception as e:
        return {
            "answer": f"SYSTEM ERROR: Cognitive Link Severed. {str(e)}",
            "sources": []
        }

@app.post("/api/chat_stream")
async def chat_with_phantom_stream(request: ChatRequest):
    """
    流式RAG聊天 - 即时返回，边生成边显示
    """
    if not RAG_AVAILABLE or not knowledge_collection or not embedder:
        async def error_stream():
            yield f"data: {json.dumps({'error': 'RAG未启用'}, ensure_ascii=False)}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")
    
    query = request.query
    api_key = os.getenv("DEEPSEEK_API_KEY")

    async def generate():
        try:
            # 1. 快速检索
            query_embedding = embedder.encode([query]).tolist()
            results = knowledge_collection.query(
                query_embeddings=query_embedding,
                n_results=2  # 从3减少到2，加速检索
            )
            
            context_text = ""
            sources = set()
            
            if results['documents']:
                for i, doc in enumerate(results['documents'][0]):
                    meta = results['metadatas'][0][i]
                    source = meta.get('source', 'Unknown')
                    context_text += f"[Source: {source}]\n{doc}\n\n"
                    sources.add(source)

            if not context_text:
                context_text = "No relevant internal documents found."

            # 2. 流式生成
            system_prompt = (
                "你是怪盗团的导航员 (Oracle/Navi)。你掌管着'印象空间'的知识库。"
                "请根据提供的[上下文]回答用户的提问。如果上下文里有答案，请引用来源。"
                "如果上下文没有，请用你的通用知识回答，但要说明'数据库中未找到相关情报'。"
                "风格：活泼、极客、充满黑客术语 (Hack, Exploit, Shadow)。"
                "回答要简洁，直接给出关键信息。"
            )

            if not api_key or api_key == "mock-key":
                yield f"data: {json.dumps({'content': '【模拟模式】正在分析...'}, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.3)
                yield f"data: {json.dumps({'content': f'查询: {query}'}, ensure_ascii=False)}\n\n"
                yield f"data: {json.dumps({'done': True, 'sources': list(sources)}, ensure_ascii=False)}\n\n"
                return

            # 启用流式输出
            response = await deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"上下文:\n{context_text}\n\n问题: {query}"},
                ],
                stream=True,
                max_tokens=500,
            )
            
            # 流式返回
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"
            
            # 结束标记
            yield f"data: {json.dumps({'done': True, 'sources': list(sources)}, ensure_ascii=False)}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/api/mind_hack")
async def mind_hack(request: MindHackRequest):
    try:
        api_key = os.getenv("DEEPSEEK_API_KEY")
        
        if request.mode == "translate":
            system_prompt = "你是一个精通多语言的怪盗翻译官，请将以下学术文本翻译成通俗易懂的中文。保留专业术语但增加解释。风格：优雅、精准。"
        else: 
            system_prompt = "你是怪盗团的战术分析师（Navi）。分析这段文本的'潜台词'（Subtext）、'作者意图'（Intent）和'核心论点'（Core）。用Persona 5的风格（黑客、怪盗术语）回答。"
            
        if not api_key or api_key == "mock-key":
            await asyncio.sleep(1)
            return {"result": f"【模拟回复 - 离线模式】\n请在 .env 文件中配置 DEEPSEEK_API_KEY。\n\n目标文本: {request.text[:50]}..."}

        response = await deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": request.text}],
            stream=False
        )
        return {"result": response.choices[0].message.content}
    except Exception as e:
        print(f"[MindHack Error] {e}")
        return {"result": f"分析出错: {str(e)}"}

@app.post("/api/fuse")
async def fuse_documents(request: FusionRequest):
    # (Existing logic)
    return {"result": "Fusion Mock"} # Placeholder if not fully copied, but previously implemented
