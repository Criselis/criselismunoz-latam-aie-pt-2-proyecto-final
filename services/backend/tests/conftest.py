"""
Shared fixtures for auth-related tests.

Uses an isolated TinyDB file per test session so tests don't interfere
with each other or with production data.
"""

import os
import sys
import tempfile

import pytest
from fastapi.testclient import TestClient

# ── Ensure the backend root is on sys.path ─────────────────────────
_backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

# ── Point TinyDB to a temp file BEFORE importing app modules ───────
_tmp_db = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
_tmp_db_path = _tmp_db.name
_tmp_db.close()

os.environ["NEXOVA_TINYDB_PATH"] = _tmp_db_path

# Now it's safe to import app modules
from app.main import app  # noqa: E402
from app.database import users_table, profiles_table, reset_tokens_table  # noqa: E402
from app.auth import hash_password  # noqa: E402
from app.schemas import new_uuid, now_iso  # noqa: E402


# ── Fixtures ───────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def _clean_db():
    """Wipe all tables between tests so they stay isolated."""
    yield
    users_table.truncate()
    profiles_table.truncate()
    reset_tokens_table.truncate()


@pytest.fixture()
def client():
    """Synchronous HTTP client wired to the FastAPI app."""
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture()
def registered_user(client):
    """Register a user via the API and return the response body dict."""
    payload = {
        "email": "alice@example.com",
        "password": "secret123",
        "name": "Alice Test",
    }
    resp = client.post("/users", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture()
def auth_token(client, registered_user):
    """Log in the registered_user and return the JWT string."""
    resp = client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "secret123"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def auth_headers(auth_token):
    """Authorization headers for an authenticated request."""
    return {"Authorization": f"Bearer {auth_token}"}
