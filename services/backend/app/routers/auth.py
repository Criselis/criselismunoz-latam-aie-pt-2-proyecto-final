"""
Auth router: login endpoint.
POST /auth/login  →  validate credentials  →  return JWT token
"""

from fastapi import APIRouter, HTTPException, status

from app.auth import create_access_token, hash_password, verify_password
from app.crud.users import get_user_by_email
from app.schemas import LoginRequest, Token, UserCreate, UserOut
from app.crud.users import create_user
from app.crud.profiles import create_profile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(body: LoginRequest):
    """Authenticate with email + password, returns a JWT token."""
    user = get_user_by_email(body.email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo",
        )

    token = create_access_token(user["id"])
    return Token(access_token=token, token_type="bearer")


# GET /auth/me is defined in app.main