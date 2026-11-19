"""
Reset token CRUD operations on TinyDB.

Tracks used/invalidated password-reset tokens so they cannot be reused.
"""

from datetime import datetime, timedelta
from typing import Optional

from app.database import reset_tokens_table
from app.schemas import new_uuid, now_iso


def create_reset_token(user_id: str, expire_minutes: int = 30) -> str:
    """
    Generate and store a one-time reset token.
    Returns the token string.
    """
    token_id = new_uuid()
    token_str = new_uuid().replace("-", "")  # simpler token for URLs
    expires_at = datetime.utcnow() + timedelta(minutes=expire_minutes)

    doc = {
        "id": token_id,
        "token": token_str,
        "user_id": user_id,
        "used": False,
        "expires_at": expires_at.isoformat(),
        "created_at": now_iso(),
    }
    reset_tokens_table.insert(doc)
    return token_str


def get_reset_token(token: str) -> Optional[dict]:
    """Find a reset token document by its token string."""
    results = reset_tokens_table.search(lambda d: d.get("token") == token)
    return results[0] if results else None


def mark_token_used(token_id: str) -> None:
    """Mark a token as used (one-time use enforcement)."""
    reset_tokens_table.update({"used": True}, lambda d: d.get("id") == token_id)


def clean_expired_tokens() -> int:
    """Remove all expired tokens. Returns number of removed docs."""
    now = datetime.utcnow().isoformat()
    removed = reset_tokens_table.remove(
        lambda d: d.get("expires_at", "0") < now
    )
    return len(removed)


def invalidate_user_tokens(user_id: str) -> int:
    """Mark all tokens for a user as used (e.g., after password change)."""
    tokens = reset_tokens_table.search(lambda d: d.get("user_id") == user_id and not d.get("used"))
    count = 0
    for t in tokens:
        reset_tokens_table.update({"used": True}, lambda d: d.get("id") == t["id"])
        count += 1
    return count