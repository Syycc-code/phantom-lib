import sqlite3
import os

# FIX: Point to the correct DB location used by the app
DB_FILE = "backend/phantom_database.db"

def add_folder_support():
    """Manually migrate DB to support folders if not exists"""
    if not os.path.exists(DB_FILE):
        print(f"[ERROR] DB File not found at: {DB_FILE}")
        # Try absolute path fallback if running from wrong dir
        DB_FILE_ALT = "phantom_database.db"
        if os.path.exists(DB_FILE_ALT):
             print(f"[WARN] Found DB at root {DB_FILE_ALT}, but app uses backend/. Please move it if needed.")
        return

    print(f"Checking for 'folder' table in {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # 1. Create Folder Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS folder (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR NOT NULL,
            description VARCHAR,
            created_at DATETIME NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_folder_name ON folder (name);")
        
        # 2. Add folder_id to Paper
        # Check if column exists first
        cursor.execute("PRAGMA table_info(paper)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "folder_id" not in columns:
            print("Adding folder_id column to paper table...")
            cursor.execute("ALTER TABLE paper ADD COLUMN folder_id INTEGER REFERENCES folder(id)")
            conn.commit()
            print("[SUCCESS] DB Schema Updated for Folders")
        else:
            print("[SKIP] DB already has folder support")
            
    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_folder_support()
