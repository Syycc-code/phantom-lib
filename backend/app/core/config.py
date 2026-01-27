import os
from pathlib import Path
from dotenv import load_dotenv

# Try to find .env file
# Structure: backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> root
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Fallback
if not os.getenv("DEEPSEEK_API_KEY"):
    load_dotenv() 

class Settings:
    PROJECT_NAME: str = "Phantom Library"
    VERSION: str = "2.1.0"
    API_V1_STR: str = "/api"
    
    # Database
    DB_FILE: str = "phantom_database.db"
    SQLITE_URL: str = f"sqlite:///{DB_FILE}"
    
    # AI Config
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "mock-key")
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_TIMEOUT: float = 60.0
    
    # HuggingFace Mirror
    HF_ENDPOINT: str = "https://hf-mirror.com"
    
    # Paths
    UPLOAD_DIR: str = "uploads"

settings = Settings()

# Apply Global Envs
os.environ["HF_ENDPOINT"] = settings.HF_ENDPOINT
