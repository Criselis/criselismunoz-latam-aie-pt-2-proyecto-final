"""
Profile CRUD operations on TinyDB.
Profiles hold user-facing data (name, phone, address) linked one-to-one to users.
"""

from typing import Optional

from app.database import profiles_table
from app.schemas import ProfileUpdate, new_uuid, now_iso


def create_profile(user_id: str, name: Optional[str] = None,
                   phone: Optional[str] = None,
                   address: Optional[str] = None) -> dict:
    """Create a profile linked to a user."""
    now = now_iso()
    profile = {
        "id": new_uuid(),
        "user_id": user_id,
        "name": name,
        "phone": phone,
        "address": address,
        "created_at": now,
        "updated_at": now,
    }
    profiles_table.insert(profile)
    return profile


def get_profile_by_user_id(user_id: str) -> Optional[dict]:
    """Return the profile linked to the given user."""
    results = profiles_table.search(lambda d: d.get("user_id") == user_id)
    return results[0] if results else None


def update_profile(user_id: str, data: ProfileUpdate) -> Optional[dict]:
    """Update profile fields. Creates a profile if none exists."""
    profile = get_profile_by_user_id(user_id)
    if profile is None:
        return create_profile(
            user_id=user_id,
            name=data.name,
            phone=data.phone,
            address=data.address,
        )

    updates = {}
    if data.name is not None:
        updates["name"] = data.name
    if data.phone is not None:
        updates["phone"] = data.phone
    if data.address is not None:
        updates["address"] = data.address
    updates["updated_at"] = now_iso()

    if updates:
        profiles_table.update(updates, lambda d: d.get("user_id") == user_id)

    return get_profile_by_user_id(user_id)


def delete_profile_by_user_id(user_id: str) -> bool:
    """Remove the profile linked to a user."""
    removed = profiles_table.remove(lambda d: d.get("user_id") == user_id)
    return len(removed) > 0