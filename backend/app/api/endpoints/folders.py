from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api.deps import get_session
from app.models.folder import Folder, FolderCreate, FolderRead
from app.models.paper import Paper

router = APIRouter()

@router.get("/", response_model=List[FolderRead])
def read_folders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session),
) -> Any:
    """
    Retrieve folders.
    """
    statement = select(Folder).offset(skip).limit(limit)
    folders = db.exec(statement).all()
    return folders

@router.post("/", response_model=FolderRead)
def create_folder(
    *,
    db: Session = Depends(get_session),
    folder_in: FolderCreate,
) -> Any:
    """
    Create new folder.
    """
    folder = Folder.from_orm(folder_in)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

@router.patch("/{id}", response_model=FolderRead)
def update_folder(
    *,
    db: Session = Depends(get_session),
    id: int,
    folder_in: FolderCreate,
) -> Any:
    """
    Update a folder (rename).
    """
    folder = db.get(Folder, id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    folder_data = folder_in.dict(exclude_unset=True)
    for key, value in folder_data.items():
        setattr(folder, key, value)
        
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

@router.delete("/{id}", response_model=FolderRead)
def delete_folder(
    *,
    db: Session = Depends(get_session),
    id: int,
) -> Any:
    """
    Delete a folder. Papers in it will have folder_id set to NULL (moved to root).
    """
    folder = db.get(Folder, id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
        
    # Unlink papers first (optional, but safer to be explicit)
    # OnDelete behavior depends on DB, but SQLModel relationship defaults usually don't cascade delete unless specified
    # Here we just delete the folder, and since Paper.folder_id is nullable, they should just become orphans (in root)
    # Or we can manually set them to None if we want to be sure
    
    statement = select(Paper).where(Paper.folder_id == id)
    papers = db.exec(statement).all()
    for paper in papers:
        paper.folder_id = None
        db.add(paper)
    
    db.delete(folder)
    db.commit()
    return folder
