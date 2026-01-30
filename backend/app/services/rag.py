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
    from chromadb.config import Settings as ChromaSettings
    from sentence_transformers import SentenceTransformer
    RAG_AVAILABLE = True
except ImportError as e:
    print(f"[RAG WARNING] Missing dependencies: {e}. RAG features disabled.")
    print("Install via: pip install chromadb sentence-transformers")
    RAG_AVAILABLE = False
    chroma_client = None
    knowledge_collection = None
    embedder = None

# Lazy Loading Globals
_chroma_client = None
_knowledge_collection = None
_embedder = None
_rag_initialized = False

def get_rag_components():
    global _chroma_client, _knowledge_collection, _embedder, _rag_initialized, RAG_AVAILABLE
    
    if _rag_initialized:
        return _chroma_client, _knowledge_collection, _embedder

    if not RAG_AVAILABLE:
        return None, None, None

    try:
        # Use PersistentClient for data persistence
        # FIXED: Use v2 path to avoid locks from crash
        persist_path = os.path.join(settings.UPLOAD_DIR, "chroma_db_v2")
        os.makedirs(persist_path, exist_ok=True)
        
        print(f"[PHANTOM] Initializing RAG (Lazy)... Path: {persist_path}")
        
        # Initialize one by one to catch specific errors
        try:
            # FIX: Disable telemetry and anonymized data to prevent network hangs
            # FIX: Use 'is_persistent=True' explicity if needed, but PersistentClient implies it.
            # Using basic PersistentClient is usually fine if path is correct.
            _chroma_client = chromadb.PersistentClient(
                path=persist_path,
                settings=ChromaSettings(anonymized_telemetry=False, allow_reset=True)
            )
            _knowledge_collection = _chroma_client.get_or_create_collection(name="phantom_knowledge")
            print("[PHANTOM] ChromaDB Connected.")
        except Exception as e:
            print(f"[PHANTOM] ChromaDB Init Failed: {e}")
            # Auto-recovery for schema mismatches (e.g., 'no such column: collections.topic')
            if "no such column" in str(e) or "database disk image is malformed" in str(e):
                print(f"[PHANTOM] DETECTED DB CORRUPTION. PERFORMING AUTO-RESET...")
                import shutil
                try:
                    if os.path.exists(persist_path):
                        shutil.rmtree(persist_path)
                    os.makedirs(persist_path, exist_ok=True)
                    print(f"[PHANTOM] DB RESET SUCCESSFUL. RETRYING INIT...")
                    
                    # Retry Init
                    _chroma_client = chromadb.PersistentClient(
                        path=persist_path,
                        settings=ChromaSettings(anonymized_telemetry=False, allow_reset=True)
                    )
                    _knowledge_collection = _chroma_client.get_or_create_collection(name="phantom_knowledge")
                    print("[PHANTOM] ChromaDB Re-Connected after Reset.")
                except Exception as retry_e:
                    print(f"[PHANTOM] AUTO-RESET FAILED: {retry_e}")
                    raise retry_e
            else:
                raise e

        try:
            print(f"[PHANTOM] Loading Embedding Model (this may take a moment)...")
            # Force CPU if CUDA OOM or issues
            # Switch to Multilingual model for better Chinese support
            
            # FIX: Use local cache path explicitly or try-catch download
            # We can also use 'all-MiniLM-L6-v2' which is smaller and less likely to timeout
            os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
            
            # --- MODEL MIRROR CONFIG ---
            # Use 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2' for best multilingual support
            # Use 'sentence-transformers/all-MiniLM-L6-v2' for speed/fallback
            model_name = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
            
            try:
                print(f"[PHANTOM] Loading Embedding Model: {model_name}...")
                # Add timeout options if possible, otherwise rely on mirror
                _embedder = SentenceTransformer(model_name, device='cpu', trust_remote_code=True)
            except Exception as dl_error:
                print(f"[PHANTOM] Download Timeout/Error with Mirror: {dl_error}.")
                print("[PHANTOM] Attempting fallback to local/smaller model...")
                
                try:
                    # Fallback 1: Try smaller model
                    _embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cpu')
                except:
                     # Fallback 2: Try completely offline mode if model exists in cache
                     print("[PHANTOM] Network failed. Checking local cache only...")
                     _embedder = SentenceTransformer(model_name, device='cpu', local_files_only=True)

            print("[PHANTOM] Embedding Model Loaded.")
        except Exception as e:
             print(f"[PHANTOM] Model Load Failed: {e}")
             raise e

        _rag_initialized = True
        return _chroma_client, _knowledge_collection, _embedder
    except Exception as e:
        print(f"[PHANTOM] RAG CRITICAL FAILURE: {e}")
        # Disable RAG to prevent loop
        RAG_AVAILABLE = False
        return None, None, None

def index_document(chunks_data: list, filename: str):
    """
    Args:
        chunks_data: List of dicts {text, page, bbox} from OCR
        filename: Source filename
    """
    client, collection, embedder = get_rag_components()
    if not collection or not embedder: return
    
    if not chunks_data: return
    
    # Filter out empty chunks
    valid_chunks = [c for c in chunks_data if c.get("text", "").strip()]
    if not valid_chunks: return

    # Prepare data for Chroma
    texts = [c["text"] for c in valid_chunks]
    
    # Generate Metadata
    # Chroma metadata values must be str, int, float, or bool. No lists.
    # So we serialize bbox to string.
    metadatas = [{
        "source": filename,
        "page": c["page"],
        "bbox": str(c["bbox"]) # Serialize list to string "[x0,y0,x1,y1]"
    } for c in valid_chunks]
    
    ids = [f"{filename}_{uuid.uuid4()}" for _ in valid_chunks]
    
    # Batch processing to avoid hitting limits
    BATCH_SIZE = 10
    total_chunks = len(texts)
    
    print(f"[MEMORY] Indexing {total_chunks} chunks from {filename} with spatial data...")
    
    for i in range(0, total_chunks, BATCH_SIZE):
        print(f"  [RAG DEBUG] Batch {i} to {i+BATCH_SIZE} start...", flush=True)
        batch_texts = texts[i:i+BATCH_SIZE]
        batch_metas = metadatas[i:i+BATCH_SIZE]
        batch_ids = ids[i:i+BATCH_SIZE]
        
        try:
            print("  [RAG DEBUG] Encoding...", flush=True)
            embeddings = embedder.encode(batch_texts).tolist()
            print("  [RAG DEBUG] Adding to Chroma...", flush=True)
            collection.add(
                documents=batch_texts,
                embeddings=embeddings,
                metadatas=batch_metas,
                ids=batch_ids
            )
            print("  [RAG DEBUG] Batch done.", flush=True)
        except Exception as e:
            print(f"  [RAG DEBUG] Batch Failed: {e}", flush=True)
            raise e
    
    print(f"[MEMORY] Indexing Complete: {filename}")

def retrieve_context(query: str, n_results=5, file_filter: list[str] = None): # Added file_filter
    client, collection, embedder = get_rag_components()
    if not collection or not embedder:
        return "", []
    
    try:
        q_vec = embedder.encode([query]).tolist()
        
        # Build Chroma Where Clause
        where_clause = {}
        if file_filter:
            if len(file_filter) == 1:
                where_clause = {"source": file_filter[0]}
            else:
                where_clause = {"source": {"$in": file_filter}}
        
        print(f"[DEBUG RAG] Query: '{query}'")
        print(f"[DEBUG RAG] Where Clause: {where_clause}")
        
        # DEBUG: Check total count in collection
        print(f"[DEBUG RAG] Total in Collection: {collection.count()}")
        
        # DEBUG: Check if ANY document matches source '1'
        if file_filter:
            check_source = collection.get(where={"source": file_filter[0]})
            print(f"[DEBUG RAG] Items with source='{file_filter[0]}': {len(check_source['ids'])}")

        results = collection.query(
            query_embeddings=q_vec, 
            n_results=n_results,
            where=where_clause if file_filter else None # Apply filter
        )
        
        context_text = ""
        citations = [] # List of {id, text, page, bbox}
        sources = set()
        
        if results.get('documents'):
            for i, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][i]
                src = meta.get('source', 'Unknown')
                page = meta.get('page', 1)
                bbox = meta.get('bbox', '[]')
                
                # Assign a citation index (1-based)
                citation_index = i + 1
                
                # Format for LLM: [1] Text... (Source: X, Page: Y)
                context_text += f"[{citation_index}] {doc} (Source: {src}, Page: {page})\n\n"
                
                citations.append({
                    "index": citation_index,
                    "text": doc,
                    "source": src,
                    "page": page,
                    "bbox": bbox # String format, frontend needs to parse
                })
                sources.add(src)
                
        return context_text, citations # Return citations list as well
    except Exception as e:
        print(f"[RAG Error] {e}")
        return "", []
