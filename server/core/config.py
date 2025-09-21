from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Interact UI Agent Server"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    DATABASE_URL: str = "sqlite:///./app.db"
    
    MCP_BRIDGE_URL: str = "http://localhost:8001/mcp"
    
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Email Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    
    # File Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    
    # External API Keys
    LANGSMITH_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()