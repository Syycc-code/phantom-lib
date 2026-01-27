from sqlmodel import Session
from app.core.config import settings
from sqlmodel import create_engine

connect_args = {"check_same_thread": False}
engine = create_engine(settings.SQLITE_URL, connect_args=connect_args)

def get_session():
    with Session(engine) as session:
        yield session
