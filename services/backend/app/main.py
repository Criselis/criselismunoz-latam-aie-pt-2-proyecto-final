"""
Nexova Talent Pipeline API — Main application entry point.

Run with:
    uvicorn app.main:app --reload
"""

import logging

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import supabase_engine
from app.models import SQLModel
from app.routers import auth as auth_router
from app.routers import users as users_router
from app.routers import profiles as profiles_router
from app.routers import records as records_router
from app.routers import incidents as incidents_router
from app.routers import inventory as inventory_router
from app.auth import get_current_user
from app.crud import profiles as crud_profiles
from app.crud.incidents import seed_incidents
from app.seed_inventory import seed_inventory_tables

# ── Logging ─────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nexova-api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    """Return concise, field-level validation errors to API clients.
    Logs the invalid request for observability."""
    errors = []
    for error in exc.errors():
        location = error.get("loc", [])
        field = str(location[-1]) if location else "request"
        errors.append({
            "field": field,
            "message": error.get("msg", "Valor no válido"),
        })
    logger.warning(
        "Validation error on %s %s: %s",
        request.method, request.url.path, errors,
    )
    return JSONResponse(status_code=400, content={"detail": errors})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Hide internal details while returning a useful generic error.
    Full traceback is logged server-side only."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "No se pudo completar la operación. Inténtalo de nuevo."},
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
app.include_router(incidents_router.router, prefix="/api")
app.include_router(inventory_router.router)


@app.on_event("startup")
async def seed_initial_data():
    # Initialise Supabase schema (development/learning only — use Alembic in production)
    SQLModel.metadata.create_all(supabase_engine)
    seed_incidents()
    # Seed inventory tables with demo data (non-blocking)
    try:
        from app.database import get_db
        db_gen = get_db()
        db = next(db_gen)
        seed_inventory_tables(db)
        db.close()
    except Exception:
        logger.exception("Failed to seed inventory tables — continuing.")


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