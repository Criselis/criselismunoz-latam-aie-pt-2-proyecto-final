"""
User CRUD operations on TinyDB.
Users store only credentials (email, hashed_password, role, is_active).
"""

from typing import Optional

from app.database import users_table
from app.schemas import UserCreate, UserUpdate, new_uuid, now_iso


def create_user(data: UserCreate, hashed_password: str) -> dict:
    """Insert a new user document. Returns the full document."""
    doc_id = new_uuid()
    user_doc = {
        "id": doc_id,
        "email": data.email.strip().lower(),
        "hashed_password": hashed_password,
        "is_active": True,
        "role": "user",  # default role
        "created_at": now_iso(),
    }
    users_table.insert(user_doc)
    return user_doc


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Find user by TinyDB-stored id field."""
    results = users_table.search(lambda d: d.get("id") == user_id)
    return results[0] if results else None


def get_user_by_email(email: str) -> Optional[dict]:
    """Find user by email (case-insensitive)."""
    needle = email.strip().lower()
    results = users_table.search(lambda d: d.get("email") == needle)
    return results[0] if results else None


def get_all_users() -> list[dict]:
    """Return all user documents."""
    return users_table.all()


def update_user(user_id: str, data: UserUpdate, hashed_password: Optional[str] = None) -> Optional[dict]:
    """Update user fields. Returns the updated document or None if not found."""
    user = get_user_by_id(user_id)
    if user is None:
        return None

    updates = {}
    if data.email is not None:
        updates["email"] = data.email.strip().lower()
    if hashed_password is not None:
        updates["hashed_password"] = hashed_password
    if data.role is not None:
        updates["role"] = data.role.value

    if updates:
        users_table.update(updates, lambda d: d.get("id") == user_id)

    return get_user_by_id(user_id)


def delete_user(user_id: str) -> bool:
    """Delete user document. Returns True if deleted."""
    removed = users_table.remove(lambda d: d.get("id") == user_id)
    return len(removed) > 0