"""
Authentication utilities:
  - Password hashing (libpass + bcrypt)
  - JWT creation and decoding (python-jose)
  - FastAPI dependency: get_current_user
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.hash import bcrypt

from app.config import settings
from app.crud.users import get_user_by_id
from app.schemas import TokenPayload

# ── Password hashing (libpass fork of passlib) ────────────────────


def hash_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.verify(plain, hashed)


# ── Token creation / decoding ──────────────────────────────────────

def create_access_token(user_id: str) -> str:
    """Create a signed JWT with the user id as subject (sub)."""
    expire = datetime.utcnow() + settings.ACCESS_TOKEN_EXPIRE_DELTA
    payload: dict = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[TokenPayload]:
    """Decode and validate a JWT. Returns None if invalid/expired."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return TokenPayload(sub=payload["sub"], exp=payload["exp"])
    except JWTError:
        return None


# ── OAuth2 scheme ──────────────────────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False,
)


# ── Dependency: get_current_user ───────────────────────────────────

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
) -> dict:
    """
    FastAPI dependency that extracts and validates the Bearer token,
    then fetches and returns the user document from TinyDB.
    Raises 401 if the token is missing, invalid, or the user no longer exists.
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado: token requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(payload.sub)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Dependency that additionally requires the admin role."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol admin",
        )
    return current_user