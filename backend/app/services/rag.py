"""
RAG Service - Pinecone Cloud Version
使用云端向量数据库，解决本地内存溢出问题
"""
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
    from pinecone import Pinecone, ServerlessSpec
    RAG_AVAILABLE = True
except ImportError as e:
    print(f"[RAG WARNING] Missing dependencies: {e}. RAG features disabled.")
    print("Install via: pip install pinecone-client sentence-transformers")
    RAG_AVAILABLE = False

# Lazy Loading Globals
_pinecone_client = None
_pinecone_index = None
_embedder = None
_rag_initialized = False
_sentence_transformer_cls = None

def get_rag_components():
    """初始化RAG组件（Pinecone版本）"""
    global _pinecone_client, _pinecone_index, _embedder, _rag_initialized, RAG_AVAILABLE, _sentence_transformer_cls
    
    if _rag_initialized:
        return _pinecone_client, _pinecone_index, _embedder

    if not RAG_AVAILABLE:
        return None, None, None
    
    if not settings.ENABLE_RAG:
        print("[RAG] RAG is disabled via ENABLE_RAG setting.")
        return None, None, None

    try:
        # 1. 初始化Pinecone客户端
        if not settings.PINECONE_API_KEY or settings.PINECONE_API_KEY == "your-pinecone-api-key":
            print("[RAG ERROR] Pinecone API Key not configured in .env")
            print("[RAG ERROR] Please add: PINECONE_API_KEY=your-key-here")
            RAG_AVAILABLE = False
            return None, None, None
        
        print(f"[PHANTOM] Initializing Pinecone RAG...")
        _pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
        
        # 2. 创建或连接到索引
        index_name = settings.PINECONE_INDEX_NAME
        embedding_dimension = 384  # paraphrase-multilingual-MiniLM-L12-v2的维度
        
        # 检查索引是否存在
        existing_indexes = _pinecone_client.list_indexes()
        index_names = [idx['name'] for idx in existing_indexes]
        
        if index_name not in index_names:
            print(f"[PHANTOM] Creating new Pinecone index: {index_name}")
            _pinecone_client.create_index(
                name=index_name,
                dimension=embedding_dimension,
                metric='cosine',
                spec=ServerlessSpec(
                    cloud=settings.PINECONE_CLOUD,
                    region=settings.PINECONE_REGION
                )
            )
            print(f"[PHANTOM] Index '{index_name}' created successfully")
        else:
            print(f"[PHANTOM] Using existing index: {index_name}")
        
        _pinecone_index = _pinecone_client.Index(index_name)
        print("[PHANTOM] Pinecone Connected.")
        
        # 3. 加载Embedding模型（仅本地计算embedding）
        try:
            # Lazy import to avoid heavy torch/sentence-transformers import during server boot.
            if _sentence_transformer_cls is None:
                from sentence_transformers import SentenceTransformer
                _sentence_transformer_cls = SentenceTransformer

            print(f"[PHANTOM] Loading Embedding Model (this may take a moment)...")
            os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
            
            model_name = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
            
            try:
                print(f"[PHANTOM] Loading Embedding Model: {model_name}...")
                _embedder = _sentence_transformer_cls(model_name, device='cpu')
            except Exception as dl_error:
                print(f"[PHANTOM] Download Timeout/Error with Mirror: {dl_error}.")
                print("[PHANTOM] Attempting fallback to local/smaller model...")
                
                try:
                    # Fallback 1: Try smaller model
                    _embedder = _sentence_transformer_cls('sentence-transformers/all-MiniLM-L6-v2', device='cpu')
                except:
                    # Fallback 2: Try completely offline mode if model exists in cache
                    print("[PHANTOM] Network failed. Checking local cache only...")
                    try:
                        _embedder = _sentence_transformer_cls(model_name, device='cpu')
                    except:
                        # Final fallback: use any available model
                        _embedder = _sentence_transformer_cls('all-MiniLM-L6-v2', device='cpu')

            print("[PHANTOM] Embedding Model Loaded.")
        except Exception as e:
            print(f"[PHANTOM] Model Load Failed: {e}")
            raise e

        _rag_initialized = True
        return _pinecone_client, _pinecone_index, _embedder
    except Exception as e:
        print(f"[PHANTOM] RAG CRITICAL FAILURE: {e}")
        import traceback
        traceback.print_exc()
        # Disable RAG to prevent loop
        RAG_AVAILABLE = False
        return None, None, None

def index_document(chunks_data: list, filename: str):
    """
    索引文档到Pinecone云端数据库
    
    Args:
        chunks_data: List of dicts {text, page, bbox} from OCR
        filename: Source filename (paper ID)
    """
    client, index, embedder = get_rag_components()
    if not index or not embedder: 
        return
    
    if not chunks_data: 
        return
    
    # Filter out empty chunks
    valid_chunks = [c for c in chunks_data if c.get("text", "").strip()]
    if not valid_chunks: 
        return
    
    # NO MORE CHUNK LIMIT - Pinecone可以处理任意数量
    print(f"[PINECONE] Indexing {len(valid_chunks)} chunks from paper {filename}")
    
    # Prepare data
    texts = [c["text"] for c in valid_chunks]
    
    # 批量处理 - 更大的batch size因为只是本地embedding计算
    BATCH_SIZE = 10  # Pinecone推荐batch size
    total_chunks = len(texts)
    
    successful_batches = 0
    failed_batches = 0
    
    import gc
    import sys
    
    for i in range(0, total_chunks, BATCH_SIZE):
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (total_chunks + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"  [PINECONE] Batch {batch_num}/{total_batches} (chunks {i}-{min(i+BATCH_SIZE, total_chunks)})...", flush=True)
        
        batch_texts = texts[i:i+BATCH_SIZE]
        batch_chunks = valid_chunks[i:i+BATCH_SIZE]
        
        try:
            # 1. 计算embeddings（本地）
            sys.stdout.flush()
            embeddings = embedder.encode(batch_texts, show_progress_bar=False).tolist()
            sys.stdout.flush()
            
            # 2. 准备Pinecone数据格式
            vectors = []
            for j, (text, emb, chunk) in enumerate(zip(batch_texts, embeddings, batch_chunks)):
                vector_id = f"{filename}_{uuid.uuid4()}"
                metadata = {
                    "source": filename,
                    "page": int(chunk["page"]),
                    "bbox": str(chunk["bbox"]),
                    "text": text[:1000]  # Pinecone metadata限制，存储前1000字符用于预览
                }
                vectors.append((vector_id, emb, metadata))
            
            # 3. 上传到Pinecone（云端，无内存压力）
            index.upsert(vectors=vectors)
            
            successful_batches += 1
            print(f"  [PINECONE] ✓ Batch {batch_num} indexed successfully.", flush=True)
            
            # 清理内存
            del embeddings
            gc.collect()
            
        except Exception as e:
            failed_batches += 1
            print(f"  [PINECONE] ✗ Batch {batch_num} FAILED: {e}", flush=True)
            import traceback
            traceback.print_exc()
            sys.stdout.flush()
            
            # Force garbage collection on error
            gc.collect()
            
            # Don't crash - continue with remaining batches
            continue
    
    print(f"[PINECONE] Indexing Complete: {filename}")
    print(f"[PINECONE] Summary: {successful_batches} successful, {failed_batches} failed")
    
    if failed_batches > 0:
        print(f"[WARNING] Some batches failed. RAG may have incomplete data for this file.")

def retrieve_context(query: str, n_results=5, file_filter: list[str] = None):
    """
    从Pinecone检索相关上下文
    
    Args:
        query: 用户查询
        n_results: 返回结果数量
        file_filter: 过滤特定文件（paper IDs）
    
    Returns:
        (context_text, citations)
    """
    client, index, embedder = get_rag_components()
    if not index or not embedder:
        return "", []
    
    try:
        # 1. 编码查询
        q_vec = embedder.encode([query]).tolist()[0]
        
        # 2. 构建过滤条件
        filter_dict = None
        if file_filter:
            if len(file_filter) == 1:
                filter_dict = {"source": {"$eq": file_filter[0]}}
            else:
                filter_dict = {"source": {"$in": file_filter}}
        
        print(f"[DEBUG PINECONE] Query: '{query}'")
        print(f"[DEBUG PINECONE] Filter: {filter_dict}")
        
        # 3. 查询Pinecone
        results = index.query(
            vector=q_vec,
            top_k=n_results,
            filter=filter_dict,
            include_metadata=True
        )
        
        # 4. 格式化结果
        context_text = ""
        citations = []
        
        if results and results.matches:
            for i, match in enumerate(results.matches):
                meta = match.metadata
                text = meta.get('text', '')
                src = meta.get('source', 'Unknown')
                page = meta.get('page', 1)
                bbox = meta.get('bbox', '[]')
                
                citation_index = i + 1
                
                # Format for LLM
                context_text += f"[{citation_index}] {text} (Source: {src}, Page: {page})\n\n"
                
                citations.append({
                    "index": citation_index,
                    "text": text,
                    "source": src,
                    "page": page,
                    "bbox": bbox,
                    "score": match.score  # Pinecone提供相似度分数
                })
        
        return context_text, citations
    except Exception as e:
        print(f"[RAG Error] {e}")
        import traceback
        traceback.print_exc()
        return "", []

def delete_document(filename: str):
    """
    从Pinecone删除文档的所有向量
    
    Args:
        filename: Paper ID
    """
    client, index, embedder = get_rag_components()
    if not index:
        return
    
    try:
        # Pinecone使用filter删除
        index.delete(filter={"source": {"$eq": filename}})
        print(f"[PINECONE] Deleted all vectors for paper {filename}")
    except Exception as e:
        print(f"[PINECONE ERROR] Failed to delete vectors: {e}")

def get_stats():
    """获取Pinecone索引统计信息"""
    client, index, embedder = get_rag_components()
    if not index:
        return {"status": "disabled"}
    
    try:
        stats = index.describe_index_stats()
        return {
            "status": "active",
            "total_vectors": stats.total_vector_count,
            "dimension": stats.dimension,
            "index_fullness": stats.index_fullness
        }
    except Exception as e:
        print(f"[PINECONE ERROR] Failed to get stats: {e}")
        return {"status": "error", "error": str(e)}
