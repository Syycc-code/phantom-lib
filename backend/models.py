from typing import Optional
from sqlmodel import Field, SQLModel

class PaperBase(SQLModel):
    title: str
    author: str
    year: str
    abstract: Optional[str] = None
    url: Optional[str] = None

class Paper(PaperBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # "Third Eye" Analysis Results
    shadow_problem: Optional[str] = None  # The Core Problem
    persona_solution: Optional[str] = None # The Solution
    weakness_flaw: Optional[str] = None   # The Critical Flaw

class PaperCreate(PaperBase):
    pass

class PaperRead(PaperBase):
    id: int
    shadow_problem: Optional[str]
    persona_solution: Optional[str]
    weakness_flaw: Optional[str]
