"""
Profiles router: management of user profiles (name, phone, address).
All routes under /profiles.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.crud import profiles as crud_profiles
from app.schemas import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileOut)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Get the profile of the currently authenticated user."""
    profile = crud_profiles.get_profile_by_user_id(current_user["id"])
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado",
        )
    return ProfileOut(
        id=profile["id"],
        user_id=profile["user_id"],
        name=profile.get("name"),
        phone=profile.get("phone"),
        address=profile.get("address"),
        created_at=profile["created_at"],
        updated_at=profile["updated_at"],
    )


@router.put("/me", response_model=ProfileOut)
async def update_my_profile(
    body: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the profile of the currently authenticated user."""
    updated = crud_profiles.update_profile(current_user["id"], body)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado",
        )
    return ProfileOut(
        id=updated["id"],
        user_id=updated["user_id"],
        name=updated.get("name"),
        phone=updated.get("phone"),
        address=updated.get("address"),
        created_at=updated["created_at"],
        updated_at=updated["updated_at"],
    )