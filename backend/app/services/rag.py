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
        chroma_client = chromadb.Client()
        knowledge_collection = chroma_client.get_or_create_collection(name="phantom_knowledge")
        print("[PHANTOM] Loading Embedding Model...")
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
    chunks = [text[i:i+500] for i in range(0, len(text), 500)]
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
