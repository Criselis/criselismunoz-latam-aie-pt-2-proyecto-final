"""
TinyDB initialisation.

Tables:
  - users         → login credentials (email, hashed_password, role, …)
  - profiles      → one-to-one linked to users (name, phone, address, …)
  - records       → candidate pipeline records
  - incidents     → centralized incident reports
  - notes         → notes linked to a candidate record
  - reset_tokens  → one-time password-reset tokens (used for invalidation)
"""

from pathlib import Path

from tinydb import TinyDB, table as tinydb_table

from app.config import settings

# Ensure the parent directory for the DB file exists
_db_path = Path(settings.TINYDB_PATH)
_db_path.parent.mkdir(parents=True, exist_ok=True)

_db = TinyDB(str(_db_path))

# Tables
users_table: tinydb_table.Table = _db.table("users")
profiles_table: tinydb_table.Table = _db.table("profiles")
records_table: tinydb_table.Table = _db.table("records")
incidents_table: tinydb_table.Table = _db.table("incidents")
notes_table: tinydb_table.Table = _db.table("notes")
reset_tokens_table: tinydb_table.Table = _db.table("reset_tokens")
