"""
Pydantic schemas for users, profiles, and authentication.
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ===== Role enum =====

class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    user = "user"


# ===== Auth =====

class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # user id (uuid)
    exp: float


# ===== User schemas =====

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v:
            raise ValueError("email inválido")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("la contraseña debe tener al menos 6 caracteres")
        return v


class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if "@" not in v or "." not in v:
                raise ValueError("email inválido")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) < 6:
            raise ValueError("la contraseña debe tener al menos 6 caracteres")
        return v


class UserOut(BaseModel):
    id: str
    email: str
    is_active: bool
    role: UserRole
    created_at: str  # ISO datetime


# ===== Profile schemas =====

class ProfileOut(BaseModel):
    id: str
    user_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: str
    updated_at: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


# ===== Record (candidate) schemas =====

class RecordCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    position: str
    linkedin_url: Optional[str] = None
    cv_url: Optional[str] = None
    experience_years: int = 0


class RecordUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    linkedin_url: Optional[str] = None
    cv_url: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    experience_years: Optional[int] = None


class RecordOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    position: str
    linkedin_url: Optional[str] = None
    cv_url: Optional[str] = None
    status: str
    stage: str
    experience_years: int
    notes_count: int = 0
    user_uuid: Optional[str] = None  # TinyDB user id
    applied_at: str
    updated_at: str


# ===== Note schemas =====

class NoteCreate(BaseModel):
    content: str


class NoteOut(BaseModel):
    id: str
    record_id: str
    content: str
    created_at: str


# ===== Internal (TinyDB document) types =====

def new_uuid() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.utcnow().isoformat()