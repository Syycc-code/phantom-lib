import sqlite3
import os

DB_PATH = "backend/phantom_database.db"

def check_tags():
    if not os.path.exists(DB_PATH):
        print(f"[ERROR] DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("--- SCHEMA ---")
    cursor.execute("PRAGMA table_info(paper)")
    columns = cursor.fetchall()
    tags_col = None
    for col in columns:
        print(col)
        if col[1] == 'tags':
            tags_col = col
            
    if not tags_col:
        print("[CRITICAL] 'tags' column MISSING in paper table!")
    else:
        print(f"[OK] 'tags' column found: {tags_col}")

    print("\n--- DATA (Top 5) ---")
    try:
        cursor.execute("SELECT id, title, tags FROM paper ORDER BY id DESC LIMIT 5")
        rows = cursor.fetchall()
        for row in rows:
            print(f"ID: {row[0]} | Title: {row[1][:20]}... | Tags: {row[2]}")
    except Exception as e:
        print(f"[ERROR] Reading data failed: {e}")

    conn.close()

if __name__ == "__main__":
    check_tags()
