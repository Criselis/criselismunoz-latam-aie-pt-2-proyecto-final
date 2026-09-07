"""
Nexova Talent Pipeline API — Main application entry point.

Run with:
    uvicorn app.main:app --reload
"""

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth as auth_router
from app.routers import users as users_router
from app.routers import profiles as profiles_router
from app.routers import records as records_router
from app.auth import get_current_user
from app.crud import profiles as crud_profiles

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
)

# ── CORS ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(profiles_router.router)
app.include_router(records_router.router)


# ── GET /auth/me — combined user + profile ─────────────────────────
# The frontend expects this endpoint to return user profile info.
@app.get("/auth/me", tags=["auth"])
async def auth_me(current_user: dict = Depends(get_current_user)):
    """Return the profile of the currently authenticated user
    (combined user credentials + profile data)."""
    profile = crud_profiles.get_profile_by_user_id(current_user["id"])
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "role": current_user["role"],
        "name": profile.get("name") if profile else None,
        "full_name": profile.get("name") if profile else None,
        "phone": profile.get("phone") if profile else None,
        "address": profile.get("address") if profile else None,
        "created_at": current_user["created_at"],
        "updated_at": profile.get("updated_at") if profile else current_user["created_at"],
    }


# ── Health check ───────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "nexova-api"}