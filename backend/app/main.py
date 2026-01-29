import os
import sys

# FIX: Windows DLL Load Error for Torch/Numpy
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# FIX: Force load mkl/intel libraries if present
try:
    import numpy
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.api.endpoints import papers, chat, monitor, sync, folders, debug
from app.services.rag import RAG_AVAILABLE
from sqlmodel import SQLModel
from app.api.deps import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init DB
    print(f"[DB] Initializing database at: {settings.SQLITE_URL}")
    SQLModel.metadata.create_all(engine)
    
    # Check Count
    from sqlmodel import Session, select
    from app.models.paper import Paper
    with Session(engine) as session:
        count = session.exec(select(Paper)).all()
        print(f"[DB] Current Paper Count: {len(count)}")

    # Ensure Uploads
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    if RAG_AVAILABLE:
        print("[PHANTOM] RAG Service Ready.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(monitor.router, prefix=settings.API_V1_STR, tags=["Monitor"])
app.include_router(folders.router, prefix=settings.API_V1_STR + "/folders", tags=["Folders"])
app.include_router(papers.router, prefix=settings.API_V1_STR, tags=["Papers"])
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["Chat"])
# Trigger Reload V2
app.include_router(sync.router, prefix=settings.API_V1_STR + "/sync", tags=["Sync"])
app.include_router(debug.router, prefix=settings.API_V1_STR + "/debug", tags=["Debug"])
