import sqlite3
import os
from app.models.paper import Paper
from sqlmodel import SQLModel, create_engine

DB_FILE = "phantom_database.db"
BACKUP_FILE = "phantom_database.bak"

def check_and_fix():
    if not os.path.exists(DB_FILE):
        print(f"Database {DB_FILE} not found. A new one will be created on startup.")
        return

    print(f"Checking database: {DB_FILE}")
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) FROM paper")
        count = cursor.fetchone()[0]
        print(f"[OK] Database integrity check passed. Found {count} papers.")
        conn.close()
    except Exception as e:
        print(f"[ERR] Database corrupted or schema mismatch: {e}")
        print("Attempting to backup and reset...")
        conn.close()
        
        # Backup
        if os.path.exists(BACKUP_FILE):
            os.remove(BACKUP_FILE)
        os.rename(DB_FILE, BACKUP_FILE)
        print(f"Original DB backed up to {BACKUP_FILE}")
        print("Please restart the backend to recreate the database.")

if __name__ == "__main__":
    check_and_fix()