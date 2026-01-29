print("Importing os/sys...")
import os
import sys
sys.path.append(os.path.join(os.getcwd(), "backend"))

print("Importing sqlmodel...")
from sqlmodel import Session, create_engine, select

print("Importing config...")
from app.core.config import settings

print("Importing paper...")
from app.models.paper import Paper

print("Importing folder...")
from app.models.folder import Folder

print("Importing ocr...")
from app.services.ocr import extract_text_from_file_sync

print("Importing rag...")
from app.services.rag import index_document

print("Imports done.")
