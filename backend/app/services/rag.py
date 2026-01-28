import uuid
import os
from openai import AsyncOpenAI
from app.core.config import settings

# DeepSeek Client
deepseek_client = AsyncOpenAI(
    api_key=settings.DEEPSEEK_API_KEY, 
    base_url=settings.DEEPSEEK_BASE_URL,
    timeout=settings.DEEPSEEK_TIMEOUT
)

try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    chroma_client = None
    knowledge_collection = None
    embedder = None

if RAG_AVAILABLE:
    try:
        # Use PersistentClient for data persistence
        persist_path = os.path.join(settings.UPLOAD_DIR, "chroma_db")
        os.makedirs(persist_path, exist_ok=True)
        
        chroma_client = chromadb.PersistentClient(path=persist_path)
        knowledge_collection = chroma_client.get_or_create_collection(name="phantom_knowledge")
        
        print(f"[PHANTOM] Loading Embedding Model... (DB Path: {persist_path})")
        embedder = SentenceTransformer('all-MiniLM-L6-v2')
        print("[PHANTOM] Embedding Model Ready.")
    except Exception as e:
        print(f"[PHANTOM] RAG Init Failed: {e}")
        RAG_AVAILABLE = False
        chroma_client = None
        knowledge_collection = None
        embedder = None

def index_document(text: str, filename: str):
    if not RAG_AVAILABLE or not knowledge_collection or not embedder: return
    
    # Robust chunking with overlap
    chunk_size = 500
    overlap = 100
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = start + chunk_size
        if end >= text_len:
            chunks.append(text[start:])
            break
            
        # Try to find a natural break point (newline, period, space)
        break_found = False
        for sep in ['\n', '. ', ' ']:
            # Search in the last 20% of the candidate chunk
            idx = text.rfind(sep, max(0, int(end - 100)), end)
            if idx != -1:
                end = idx + len(sep)
                break_found = True
                break
        
        chunks.append(text[start:end])
        # Move start forward: if we found a break, we can overlap slightly or just continue
        # To be safe and keep context, we always overlap
        start = max(start + 1, end - overlap)
        
    if not chunks: return
    
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

def retrieve_context(query: str, n_results=2):
    if not RAG_AVAILABLE or not knowledge_collection or not embedder:
        return "", []
    
    try:
        q_vec = embedder.encode([query]).tolist()
        results = knowledge_collection.query(query_embeddings=q_vec, n_results=n_results)
        
        context_text = ""
        sources = set()
        
        if results.get('documents'):
            for i, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][i]
                src = meta.get('source', 'Unknown')
                context_text += f"[Source: {src}]\n{doc}\n\n"
                sources.add(src)
        return context_text, list(sources)
    except Exception as e:
        print(f"[RAG Error] {e}")
        return "", []
