#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理数据库中文件已丢失的论文记录
"""
import os
import sqlite3
import sys

# 设置UTF-8编码输出
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DB_PATH = "phantom_database.db"

def clean_missing_pdfs():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 查询所有论文
    cursor.execute("SELECT id, title, file_path FROM paper")
    papers = cursor.fetchall()
    
    deleted_count = 0
    for paper_id, title, file_path in papers:
        if not file_path or not os.path.exists(file_path):
            print(f"[DELETE] ID={paper_id}, Title={title}")
            print(f"  Missing file: {file_path}")
            cursor.execute("DELETE FROM paper WHERE id = ?", (paper_id,))
            deleted_count += 1
        else:
            print(f"[KEEP] ID={paper_id}, Title={title}")
    
    conn.commit()
    conn.close()
    
    print(f"\nCleanup complete! Deleted {deleted_count} invalid records")

if __name__ == "__main__":
    clean_missing_pdfs()
