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
    SECRET_KEY: str = os.getenv(
        "NEXOVA_SECRET_KEY",
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

    # ----- TinyDB -----
    TINYDB_PATH: str = os.getenv(
        "NEXOVA_TINYDB_PATH",
        "data/nexova_db.json",
    )


settings = Settings()