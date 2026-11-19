"""
Application configuration.
Settings are loaded from environment variables with sensible defaults.
"""

import os
from datetime import timedelta

from dotenv import load_dotenv

# Load .env from the project root (services/backend/)
load_dotenv()


class Settings:
    PROJECT_NAME: str = "Nexova Talent Pipeline API"

    # ----- JWT -----
    # SECRET_KEY MUST be set in .env — never hardcode in production
    SECRET_KEY: str = os.getenv("NEXOVA_SECRET_KEY", "")
    if not SECRET_KEY:
        raise RuntimeError(
            "NEXOVA_SECRET_KEY is not set. "
            "Create a .env file in services/backend/ with:\n"
            '  NEXOVA_SECRET_KEY="your-secret-key"\n'
            "Use: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("NEXOVA_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )
    ACCESS_TOKEN_EXPIRE_DELTA: timedelta = timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # ----- CORS -----
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # ----- Resend (email) -----
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    RESEND_FROM_EMAIL: str = os.getenv("RESEND_FROM_EMAIL", "noreply@nexova.com")
    RESEND_FROM_NAME: str = os.getenv("RESEND_FROM_NAME", "Nexova Talent Pipeline")
    FRONTEND_URL: str = os.getenv(
        "NEXOVA_FRONTEND_URL",
        "http://localhost:3000",
    )

    # ----- TinyDB -----
    TINYDB_PATH: str = os.getenv(
        "NEXOVA_TINYDB_PATH",
        "data/nexova_db.json",
    )

    # ----- Supabase / PostgreSQL -----
    SUPABASE_DATABASE_URL: str = os.getenv("SUPABASE_DATABASE_URL", "")
    if not SUPABASE_DATABASE_URL:
        raise RuntimeError(
            "SUPABASE_DATABASE_URL is not set. "
            "Set it in .env as the PostgreSQL connection string for Supabase."
        )


settings = Settings()