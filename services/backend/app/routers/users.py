"""
Users router: management of user credentials.
All routes under /users.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user, get_current_admin, hash_password
from app.crud import users as crud_users
from app.crud import profiles as crud_profiles
from app.schemas import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate):
    """Register a new user. Also creates the linked profile."""
    # Check duplicate email
    existing = crud_users.get_user_by_email(body.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese email",
        )

    hashed_pw = hash_password(body.password)
    user = crud_users.create_user(body, hashed_pw)

    # Create linked profile
    crud_profiles.create_profile(
        user_id=user["id"],
        name=body.name,
        phone=body.phone,
        address=body.address,
    )

    return UserOut(
        id=user["id"],
        email=user["email"],
        is_active=user["is_active"],
        role=user["role"],
        created_at=user["created_at"],
    )


@router.get("", response_model=list[UserOut])
async def list_users(_current_user: dict = Depends(get_current_user)):
    """List all users (protected)."""
    users = crud_users.get_all_users()
    return [
        UserOut(
            id=u["id"],
            email=u["email"],
            is_active=u["is_active"],
            role=u["role"],
            created_at=u["created_at"],
        )
        for u in users
    ]


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: str,
    _current_user: dict = Depends(get_current_user),
):
    """Get user by ID (protected)."""
    user = crud_users.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return UserOut(
        id=user["id"],
        email=user["email"],
        is_active=user["is_active"],
        role=user["role"],
        created_at=user["created_at"],
    )


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update user. Only the own user or an admin can update."""
    # Permission check: only same user or admin
    if current_user["id"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar este usuario",
        )

    user = crud_users.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # Only admins can change roles
    if body.role is not None and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo un admin puede cambiar el rol",
        )

    hashed_pw = hash_password(body.password) if body.password is not None else None
    updated = crud_users.update_user(user_id, body, hashed_password=hashed_pw)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    return UserOut(
        id=updated["id"],
        email=updated["email"],
        is_active=updated["is_active"],
        role=updated["role"],
        created_at=updated["created_at"],
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin),
):
    """Delete user and linked profile (admin only)."""
    deleted = crud_users.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # Also delete linked profile
    crud_profiles.delete_profile_by_user_id(user_id)