# File: app/config/settings.py
from pathlib import Path
from typing import Dict, Any
import json
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    UPLOAD_DIR: Path = Path("uploads")
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME: str = "rag_db"
    
    @staticmethod
    def get_models_config() -> Dict[str, Any]:
        with open('/app/backend/models_config.json', 'r') as f:
            return json.load(f)

settings = Settings()
print(settings.MONGO_URI)
