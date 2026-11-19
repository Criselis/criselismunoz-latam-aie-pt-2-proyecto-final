"""
Database initialisation — dual connections.

Two data stores are active simultaneously:

  **TinyDB** (local, document-based)
    Tables:
      - users         → login credentials (email, hashed_password, role, …)
      - profiles      → one-to-one linked to users (name, phone, address, …)
      - records       → candidate pipeline records
      - incidents     → centralized incident reports
      - notes         → notes linked to a candidate record
      - reset_tokens  → one-time password-reset tokens (used for invalidation)

  **Supabase (PostgreSQL)** via SQLModel
    Tables:
      - trainingprograms  → product catalogue (the entity Nexova manages)
      - stockentries      → inbound orders that increase stock
      - stockexits        → outbound orders that decrease stock
"""

from pathlib import Path
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine
from tinydb import TinyDB, table as tinydb_table

from app.config import settings

# ── TinyDB ──────────────────────────────────────────────────────────
_db_path = Path(settings.TINYDB_PATH)
_db_path.parent.mkdir(parents=True, exist_ok=True)

_db = TinyDB(str(_db_path))

users_table: tinydb_table.Table = _db.table("users")
profiles_table: tinydb_table.Table = _db.table("profiles")
records_table: tinydb_table.Table = _db.table("records")
incidents_table: tinydb_table.Table = _db.table("incidents")
notes_table: tinydb_table.Table = _db.table("notes")
reset_tokens_table: tinydb_table.Table = _db.table("reset_tokens")

# ── Supabase (PostgreSQL) via SQLModel ──────────────────────────────

supabase_engine = create_engine(
    settings.SUPABASE_DATABASE_URL,
    echo=False,  # set to True for verbose SQL logging during development
    pool_size=5,
    max_overflow=10,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLModel session per request."""
    with Session(supabase_engine) as session:
        yield session
