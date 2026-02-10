"""
Pinecone连接测试脚本
运行此脚本验证Pinecone配置是否正确
"""
import os
import sys
from pathlib import Path

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

print("=" * 60)
print("Pinecone RAG Configuration Test")
print("=" * 60)

# 1. Check environment variables
print("\n[1] Checking Environment Variables...")
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

ENABLE_RAG = os.getenv("ENABLE_RAG", "false")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "phantom-library")
PINECONE_REGION = os.getenv("PINECONE_REGION", "us-east-1")

print(f"  ENABLE_RAG: {ENABLE_RAG}")
print(f"  PINECONE_INDEX_NAME: {PINECONE_INDEX_NAME}")
print(f"  PINECONE_REGION: {PINECONE_REGION}")

if not PINECONE_API_KEY or PINECONE_API_KEY == "your-pinecone-api-key":
    print("  [FAIL] PINECONE_API_KEY not configured!")
    print("  Please add to .env:")
    print("  PINECONE_API_KEY=pcsk_YOUR_ACTUAL_KEY")
    sys.exit(1)
else:
    masked_key = f"{PINECONE_API_KEY[:10]}...{PINECONE_API_KEY[-4:]}"
    print(f"  [OK] PINECONE_API_KEY: {masked_key}")

if ENABLE_RAG.lower() not in ("true", "1", "yes"):
    print("  [WARN] RAG is DISABLED. Set ENABLE_RAG=true in .env")

# 2. Test imports
print("\n[2] Testing Dependencies...")
try:
    from pinecone import Pinecone
    print("  [OK] pinecone-client installed")
except ImportError:
    print("  [FAIL] pinecone-client not installed")
    print("  Install with: pip install pinecone-client==3.0.0")
    sys.exit(1)

try:
    from sentence_transformers import SentenceTransformer
    print("  [OK] sentence-transformers installed")
except ImportError:
    print("  [FAIL] sentence-transformers not installed")
    print("  Install with: pip install sentence-transformers")
    sys.exit(1)

# 3. Test Pinecone connection
print("\n[3] Testing Pinecone Connection...")
try:
    pc = Pinecone(api_key=PINECONE_API_KEY)
    print("  [OK] Pinecone client initialized")
    
    # List indexes
    indexes = pc.list_indexes()
    index_names = [idx['name'] for idx in indexes]
    print(f"  Existing indexes: {index_names if index_names else 'None'}")
    
    # Check if our index exists
    if PINECONE_INDEX_NAME in index_names:
        print(f"  [OK] Index '{PINECONE_INDEX_NAME}' exists")
        
        # Get index stats
        index = pc.Index(PINECONE_INDEX_NAME)
        stats = index.describe_index_stats()
        print(f"\n  [STATS] Index Statistics:")
        print(f"     Total vectors: {stats.total_vector_count}")
        print(f"     Dimension: {stats.dimension}")
        print(f"     Index fullness: {stats.index_fullness * 100:.2f}%")
    else:
        print(f"  [INFO] Index '{PINECONE_INDEX_NAME}' does not exist yet")
        print("     It will be created automatically on first use")
        
except Exception as e:
    print(f"  [FAIL] Pinecone connection failed: {e}")
    print("\n  Troubleshooting:")
    print("  1. Check your API key is correct")
    print("  2. Verify network connection")
    print("  3. Check Pinecone Dashboard: https://app.pinecone.io/")
    sys.exit(1)

# 4. Test embedding model
print("\n[4] Testing Embedding Model...")
try:
    os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
    print("  Loading model (this may take a moment)...")
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cpu')
    print("  [OK] Embedding model loaded successfully")
    
    # Test encoding
    test_text = ["This is a test"]
    emb = model.encode(test_text, show_progress_bar=False)
    print(f"  Embedding dimension: {len(emb[0])}")
    
except Exception as e:
    print(f"  [FAIL] Model loading failed: {e}")
    sys.exit(1)

# 5. Test full RAG initialization
print("\n[5] Testing Full RAG Initialization...")
try:
    from app.services.rag import get_rag_components
    client, index, embedder = get_rag_components()
    
    if client and index and embedder:
        print("  [OK] RAG components initialized successfully")
        print("\n  [SUCCESS] All tests passed! Pinecone RAG is ready to use.")
    else:
        print("  [WARN] RAG components not initialized")
        print("     This may be normal if ENABLE_RAG=false")
        
except Exception as e:
    print(f"  [FAIL] RAG initialization failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("Configuration test complete!")
print("=" * 60)
print("\nNext steps:")
print("1. Start backend: python -m uvicorn app.main:app --host 0.0.0.0 --port 8002")
print("2. Upload a PDF and check backend logs")
print("3. Try AI chat with document retrieval")
