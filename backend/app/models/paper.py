from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class PaperBase(SQLModel):
    title: str
    author: str = "Unknown"
    year: str = "2024"
    abstract: Optional[str] = None
    url: Optional[str] = None 
    file_path: Optional[str] = None

class Paper(PaperBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)
    
    # "Third Eye" Analysis Results
    shadow_problem: Optional[str] = None
    persona_solution: Optional[str] = None
    weakness_flaw: Optional[str] = None
    
    # Phantom Notes
    user_notes: Optional[str] = None

class PaperCreate(PaperBase):
    pass

class PaperRead(PaperBase):
    id: int
    created_at: datetime
    shadow_problem: Optional[str]
    persona_solution: Optional[str]
    weakness_flaw: Optional[str]
    user_notes: Optional[str] = None
