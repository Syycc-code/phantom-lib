import os
import re
import asyncio
from fastapi import FastAPI, HTTPException
from sqlmodel import Session, select, SQLModel, create_engine
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from openai import AsyncOpenAI

# Load Secret Keys
load_dotenv()

from models import Paper, PaperCreate, PaperRead

# --- Database Setup ---
sqlite_file_name = "phantom_database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# --- DeepSeek Client Setup ---
# Using OpenAI compatibility client
# You must set DEEPSEEK_API_KEY in .env
deepseek_client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", "mock-key"), 
    base_url="https://api.deepseek.com"
)

# --- Lifecycle ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# --- Schemas for API Requests ---
class StealRequest(BaseModel):
    url: str

class ThirdEyeRequest(BaseModel):
    paper_id: int

# --- Helper: Scraper Skill ---
async def scrape_arxiv(url: str):
    async with httpx.AsyncClient() as client:
        # Mock user agent to avoid being blocked
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        try:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to infiltrate URL: {str(e)}")
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # This logic is specific to Arxiv, but can be expanded
        title_tag = soup.find('h1', class_='title')
        title = title_tag.text.replace('Title:', '').strip() if title_tag else "Unknown Title"
        
        author_tag = soup.find('div', class_='authors')
        author = author_tag.text.replace('Authors:', '').strip().split('\n')[0] if author_tag else "Unknown Author"
        
        abstract_tag = soup.find('blockquote', class_='abstract')
        abstract = abstract_tag.text.replace('Abstract:', '').strip() if abstract_tag else "No Abstract Found"
        
        # Extract year roughly from date line or use current year as fallback
        dateline = soup.find('div', class_='dateline')
        year = "2024"
        if dateline:
            match = re.search(r'\d{4}', dateline.text)
            if match:
                year = match.group(0)

        return {
            "title": title,
            "author": author,
            "year": year,
            "abstract": abstract,
            "url": url
        }

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Phantom Thieves Backend Operational"}

@app.get("/api/papers", response_model=list[PaperRead])
def get_papers():
    with Session(engine) as session:
        papers = session.exec(select(Paper)).all()
        return papers

@app.post("/api/steal", response_model=PaperRead)
async def steal_heart(request: StealRequest):
    """
    Skill 1: Scrape metadata from a URL and save to DB.
    """
    # 1. Scrape Data
    # For prototype, we assume it's an Arxiv URL.
    # If not arxiv, we return dummy data or error.
    if "arxiv.org" in request.url:
        data = await scrape_arxiv(request.url)
    else:
        # Fallback/Dummy for non-arxiv demos
        await asyncio.sleep(2) # Fake processing time
        data = {
            "title": "The Cognitive Science of Phantom Thieves",
            "author": "Joker & Morgana",
            "year": "2025",
            "abstract": "This paper explores the psychological impact of changing hearts in the Metaverse.",
            "url": request.url
        }

    # 2. Save to DB
    paper = Paper(**data)
    with Session(engine) as session:
        session.add(paper)
        session.commit()
        session.refresh(paper)
        return paper

@app.post("/api/third_eye", response_model=PaperRead)
async def activate_third_eye(request: ThirdEyeRequest):
    """
    Skill 2: Use DeepSeek to analyze the paper.
    """
    with Session(engine) as session:
        paper = session.get(Paper, request.paper_id)
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found in Mementos")
        
        if not paper.abstract:
             raise HTTPException(status_code=400, detail="Paper has no abstract to analyze")

        # Call DeepSeek (Mocked if no key provided in env to prevent crash)
        api_key = os.getenv("DEEPSEEK_API_KEY")
        
        if not api_key or api_key == "mock-key":
            # MOCK RESPONSE for seamless UI demo
            await asyncio.sleep(2)
            shadow = "Academic Obscurantism"
            persona = "Stylized Knowledge Graphs"
            weakness = "High Computational Cost"
        else:
            # REAL CALL
            system_prompt = (
                "You are a tactical analyst for the Phantom Thieves. Analyze this academic abstract. "
                "Reveal the 'Core Problem' (Shadow), the 'Solution' (Persona), and the 'Critical Flaw' (Weakness). "
                "Keep it brief (max 10 words each) and punchy."
            )
            try:
                response = await deepseek_client.chat.completions.create(
                    model="deepseek-chat",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": paper.abstract},
                    ],
                    stream=False
                )
                content = response.choices[0].message.content
                # Very naive parsing - in production we'd ask for JSON
                # For now, we'll just put the whole text in one field or try to split
                # Let's just dump the text for now or mock the split
                lines = content.split('\n')
                shadow = next((l for l in lines if "Shadow" in l), "Unknown Shadow")
                persona = next((l for l in lines if "Persona" in l), "Unknown Persona")
                weakness = next((l for l in lines if "Weakness" in l), "Unknown Weakness")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"DeepSeek Connection Failed: {str(e)}")

        # Update DB
        paper.shadow_problem = shadow
        paper.persona_solution = persona
        paper.weakness_flaw = weakness
        
        session.add(paper)
        session.commit()
        session.refresh(paper)
        return paper
