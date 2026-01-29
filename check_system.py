import sys
import os
import sqlite3

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    print("[1] Testing Imports...")
    from app.main import app
    from app.models.folder import Folder
    from app.api.endpoints import folders
    print("    -> Imports OK")
except Exception as e:
    print(f"    -> IMPORT ERROR: {e}")
    sys.exit(1)

print("[2] Checking Database...")
try:
    conn = sqlite3.connect("backend/phantom_database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall()]
    print(f"    -> Tables: {tables}")
    
    if "folder" in tables:
        print("    -> 'folder' table EXISTS.")
    else:
        print("    -> 'folder' table MISSING!")
    
    if "paper" in tables:
        cursor.execute("PRAGMA table_info(paper)")
        cols = [r[1] for r in cursor.fetchall()]
        if "folder_id" in cols:
            print("    -> 'paper.folder_id' column EXISTS.")
        else:
            print("    -> 'paper.folder_id' column MISSING!")
            
    conn.close()
except Exception as e:
    print(f"    -> DB ERROR: {e}")

print("[3] Setup Check Complete.")
