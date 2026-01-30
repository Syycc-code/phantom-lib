import sys
import os
import time

print("Starting import diagnosis...")
sys.path.append(os.path.join(os.getcwd(), "backend"))

print("Importing config...")
try:
    from app.core.config import settings
    print(f"Config loaded. DB: {settings.DB_FILE}")
except Exception as e:
    print(f"Config failed: {e}")

print("Importing OCR...")
try:
    from app.services.ocr import extract_text_from_file_sync
    print("OCR loaded.")
except Exception as e:
    print(f"OCR failed: {e}")

print("Importing RAG (Heavy)...")
try:
    print("  Importing module app.services.rag...")
    # We do a direct import to see if the module level code runs
    import app.services.rag
    print("  Module imported.")
    
    print("  Importing index_document function...")
    from app.services.rag import index_document
    print("RAG loaded.")
except Exception as e:
    print(f"RAG failed: {e}")
    import traceback
    traceback.print_exc()

print("Diagnosis complete.")
