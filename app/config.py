"""
Configuration management for production-ready dashboard
"""

from typing import Optional
import os
import json

try:
    from pydantic_settings import BaseSettings
except ImportError:
    # Fallback for older pydantic versions
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Enterprise Audit Trail Dashboard"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", "8082"))  # Railway uses $PORT
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./data/audit_production.db"
    )  # Railway PostgreSQL otomatik ekler
    # For PostgreSQL: "postgresql://user:password@localhost/dbname"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS - Railway'de environment variable olarak JSON string verin
    _cors_origins_str = os.getenv(
        "CORS_ORIGINS",
        '["http://localhost:8081","http://localhost:8082","http://127.0.0.1:8081","http://127.0.0.1:8082","*"]'
    )
    # Parse JSON string to list
    try:
        CORS_ORIGINS: list = json.loads(_cors_origins_str) if isinstance(_cors_origins_str, str) else _cors_origins_str
    except (json.JSONDecodeError, TypeError):
        # Fallback to default if parsing fails
        CORS_ORIGINS: list = [
            "http://localhost:8081",
            "http://localhost:8082",
            "http://127.0.0.1:8081",
            "http://127.0.0.1:8082",
            "*"
        ]
    
    # Redis (for caching and real-time)
    REDIS_URL: Optional[str] = None  # "redis://localhost:6379/0"
    
    # Data Generation
    GENERATE_REALISTIC_DATA: bool = True
    DATA_GENERATION_INTERVAL: int = 2  # seconds
    HISTORICAL_DATA_DAYS: int = 30  # Generate 30 days of historical data
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from environment


settings = Settings()

