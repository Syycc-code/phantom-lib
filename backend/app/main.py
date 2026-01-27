from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.api.endpoints import papers, chat, monitor
from app.services.rag import RAG_AVAILABLE
from sqlmodel import SQLModel
from app.api.deps import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init DB
    SQLModel.metadata.create_all(engine)
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
app.include_router(papers.router, prefix=settings.API_V1_STR, tags=["Papers"])
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["Chat"])
