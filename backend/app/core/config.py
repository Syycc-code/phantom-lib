import os
from pathlib import Path
from dotenv import load_dotenv

# Try to find .env file
# Structure: backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> root
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
print(f"[CONFIG] Loading environment from: {env_path}")
load_dotenv(dotenv_path=env_path)

# Fallback
if not os.getenv("DEEPSEEK_API_KEY"):
    print("[CONFIG] .env not found at calculated path, trying default load_dotenv()")
    load_dotenv() 

class Settings:
    PROJECT_NAME: str = "Phantom Library"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database (Absolute Path Fix)
    BASE_DIR: str = str(Path(__file__).resolve().parent.parent.parent)
    DB_FILE: str = os.path.join(BASE_DIR, "phantom_database.db")
    SQLITE_URL: str = f"sqlite:///{DB_FILE}"
    
    # AI Config
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "mock-key")
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_TIMEOUT: float = 60.0
    
    # HuggingFace Mirror
    HF_ENDPOINT: str = "https://hf-mirror.com"
    
    # Paths
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")

settings = Settings()

# Log API Key Status
if settings.DEEPSEEK_API_KEY == "mock-key":
    print("[CONFIG] [WARN] Using 'mock-key'. AI features will be disabled.")
else:
    masked_key = f"{settings.DEEPSEEK_API_KEY[:5]}...{settings.DEEPSEEK_API_KEY[-3:]}"
    print(f"[CONFIG] [OK] DeepSeek API Key loaded: {masked_key}")

# Apply Global Envs
os.environ["HF_ENDPOINT"] = settings.HF_ENDPOINT
