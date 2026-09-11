import os
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env from backend directory or project root
load_dotenv(".env")
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

def _parse_smtp_from():
    raw_from = os.getenv("SMTP_FROM", "")
    from_name = "Grow Advisory Group"
    from_email = ""
    if raw_from and "<" in raw_from and ">" in raw_from:
        from_name = raw_from.split("<")[0].strip() or from_name
        from_email = raw_from.split("<")[1].split(">")[0].strip()
    elif raw_from:
        from_email = raw_from.strip()
    return from_name, from_email

_default_from_name, _default_from_email = _parse_smtp_from()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    API_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Entiq Start API"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./entiq.db")
    
    # JWT Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "entiq-super-secret-jwt-signing-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    # SMTP Email Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "email-smtp.ap-southeast-2.amazonaws.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME") or ""
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL") or _default_from_email
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME") or _default_from_name
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

settings = Settings()

