from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.paper import Paper


class FolderBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None

class Folder(FolderBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Relationship
    papers: List["Paper"] = Relationship(back_populates="folder")

class FolderCreate(FolderBase):
    pass

class FolderRead(FolderBase):
    id: int
    created_at: datetime
