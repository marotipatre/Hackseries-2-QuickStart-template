"""
Configuration settings for ChainGuardian backend.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # OpenRouter API Configuration
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    AI_MODEL: str = "neuralbase/nemotron-3-nano-30b-a3b:free"
    
    # Algorand Configuration
    ALGORAND_NETWORK: str = "testnet"
    ALGORAND_NODE_URL: Optional[str] = None
    ALGORAND_INDEXER_URL: Optional[str] = None
    
    # GuardianVault Contract
    GUARDIAN_VAULT_APP_ID: Optional[int] = None
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./chainguardian.db"
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:8000"]
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields in .env


# Global settings instance
settings = Settings()
