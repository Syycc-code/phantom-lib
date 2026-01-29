import sqlite3
import os

DB_FILE = "backend/phantom_database.db"

def add_tags_column():
    if not os.path.exists(DB_FILE):
        print(f"DB not found at {DB_FILE}")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        cursor.execute("PRAGMA table_info(paper)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "tags" not in columns:
            print("Adding 'tags' column to paper table...")
            cursor.execute("ALTER TABLE paper ADD COLUMN tags VARCHAR")
            conn.commit()
            print("[SUCCESS] Tags column added.")
        else:
            print("[SKIP] Tags column already exists.")
            
    except Exception as e:
        print(f"[ERROR] {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_tags_column()
