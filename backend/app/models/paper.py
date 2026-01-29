from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .folder import Folder

class PaperBase(SQLModel):
    title: str
    author: str = "Unknown"
    year: str = "2024"
    abstract: Optional[str] = None
    url: Optional[str] = None 
    file_path: Optional[str] = None
    tags: Optional[str] = Field(default=None, description="Comma separated tags") # NEW
    folder_id: Optional[int] = Field(default=None, foreign_key="folder.id")

class Paper(PaperBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)
    
    # "Third Eye" Analysis Results
    shadow_problem: Optional[str] = None
    persona_solution: Optional[str] = None
    weakness_flaw: Optional[str] = None
    
    # Phantom Notes
    user_notes: Optional[str] = None

    # Relationship
    folder: Optional["Folder"] = Relationship(back_populates="papers")

class PaperCreate(PaperBase):
    pass

class PaperUpdate(SQLModel):
    title: Optional[str] = None
    author: Optional[str] = None
    year: Optional[str] = None
    abstract: Optional[str] = None
    url: Optional[str] = None
    file_path: Optional[str] = None
    tags: Optional[str] = None
    folder_id: Optional[int] = None
    shadow_problem: Optional[str] = None
    persona_solution: Optional[str] = None
    weakness_flaw: Optional[str] = None
    user_notes: Optional[str] = None

class PaperRead(PaperBase):
    id: int
    created_at: datetime
    shadow_problem: Optional[str]
    persona_solution: Optional[str]
    weakness_flaw: Optional[str]
    user_notes: Optional[str] = None
    folder_id: Optional[int] = None
    tags: Optional[str] = None # Explicitly include in Read model if needed, though PaperBase covers it


