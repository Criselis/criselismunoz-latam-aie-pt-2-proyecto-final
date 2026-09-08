"""
Auth router: login, forgot-password, reset-password, change-password.

Endpoints:
  POST /auth/login             →  validate credentials  →  return JWT token
  POST /auth/forgot-password   →  send reset email (always 200, no user enumeration)
  POST /auth/reset-password    →  consume token + update password
  POST /auth/change-password   →  requires current password (authenticated)
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.crud.reset_tokens import (
    create_reset_token,
    get_reset_token,
    mark_token_used,
    invalidate_user_tokens,
)
from app.crud.users import get_user_by_email, update_password
from app.email import send_password_reset_email
from app.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageOut,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserOut,
)
from app.crud.users import create_user
from app.crud.profiles import create_profile

router = APIRouter(prefix="/auth", tags=["auth"])


# ===== POST /auth/login ============================================

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


# ===== POST /auth/forgot-password ===================================

@router.post("/forgot-password", response_model=MessageOut)
async def forgot_password(body: ForgotPasswordRequest):
    """
    Send a password-reset email if the email exists.

    Always returns 200 OK to prevent user enumeration.
    The reset token expires in 30 minutes and can only be used once.
    """
    user = get_user_by_email(body.email)
    if user is not None:
        # Generate a one-time reset token
        reset_token = create_reset_token(user["id"], expire_minutes=30)
        # Attempt to send the email (silent failure if Resend fails)
        send_password_reset_email(body.email, reset_token)

    # Always return 200 — never reveal whether the email exists
    return MessageOut(
        message="Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
    )


# ===== POST /auth/reset-password ====================================

@router.post("/reset-password", response_model=MessageOut)
async def reset_password(body: ResetPasswordRequest):
    """
    Consume a one-time reset token and update the user's password.

    The token must be valid, not expired, and not previously used.
    """
    token_doc = get_reset_token(body.token)

    # Generic error — don't reveal why it failed
    if token_doc is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado.",
        )

    if token_doc.get("used", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este token ya fue utilizado. Solicita un nuevo restablecimiento.",
        )

    # Check expiration
    expires_at_str = token_doc.get("expires_at", "")
    if expires_at_str:
        try:
            expires_at = datetime.fromisoformat(expires_at_str)
            if datetime.utcnow() > expires_at:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El token ha expirado. Solicita un nuevo restablecimiento.",
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido.",
            )

    # Update the user's password
    user_id = token_doc["user_id"]
    new_hashed = hash_password(body.new_password)
    updated = update_password(user_id, new_hashed)

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar la contraseña.",
        )

    # Invalidate the token (one-time use)
    mark_token_used(token_doc["id"])

    # Invalidate any other unused tokens for this user
    invalidate_user_tokens(user_id)

    return MessageOut(message="Contraseña actualizada correctamente. Ya puedes iniciar sesión.")


# ===== POST /auth/change-password ===================================

@router.post("/change-password", response_model=MessageOut)
async def change_password(
    body: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Change password for the currently authenticated user.
    Requires the current password for verification.
    """
    # Verify current password
    if not verify_password(body.current_password, current_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La contraseña actual es incorrecta.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update to new password
    new_hashed = hash_password(body.new_password)
    updated = update_password(current_user["id"], new_hashed)

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar la contraseña.",
        )

    # Invalidate any outstanding reset tokens for this user
    invalidate_user_tokens(current_user["id"])

    return MessageOut(message="Contraseña cambiada correctamente.")


# GET /auth/me is defined in app.main