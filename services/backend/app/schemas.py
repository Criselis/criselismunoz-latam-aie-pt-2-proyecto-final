"""
Pydantic schemas for users, profiles, and authentication.
"""

import uuid
from datetime import datetime
from enum import Enum
from pathlib import Path
import sys
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# ── Buscar dinámicamente la raíz del monorepo (funciona en host y dentro de Docker) ──
_repo_root = Path(__file__).resolve()
for _parent in range(10):  # límite de seguridad: 10 niveles
    if (_repo_root / "packages" / "shared").is_dir():
        break
    _repo_root = _repo_root.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from packages.shared.incident_rules import (
    INCIDENT_BRANCH_CENTRAL,
    INCIDENT_BRANCH_MIAMI,
    INCIDENT_BRANCH_VALENCIA,
    INCIDENT_CATEGORY_CORPORATE_TRAINING,
    INCIDENT_CATEGORY_CUSTOMER_SUPPORT,
    INCIDENT_CATEGORY_EXECUTIVE_MANAGEMENT,
    INCIDENT_CATEGORY_HUMAN_RESOURCES,
    INCIDENT_CATEGORY_MARKETING_COMMUNICATIONS,
    INCIDENT_CATEGORY_RECRUITMENT_OPERATIONS,
    INCIDENT_CATEGORY_SALES_BUSINESS_DEVELOPMENT,
    INCIDENT_CATEGORY_TECHNOLOGY_INFRASTRUCTURE,
    INCIDENT_ORIGIN_BRANCH,
    INCIDENT_ORIGIN_CUSTOMER,
    INCIDENT_ORIGIN_INTERNAL,
    INCIDENT_STATUS_DISCARDED,
    INCIDENT_STATUS_IN_PROGRESS,
    INCIDENT_STATUS_OPEN,
    INCIDENT_STATUS_RESOLVED,
)


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


# ===== Password Reset schemas =====

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("la contraseña debe tener al menos 6 caracteres")
        if len(v) > 72:
            raise ValueError("la contraseña no puede exceder 72 caracteres")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("la contraseña debe tener al menos 6 caracteres")
        if len(v) > 72:
            raise ValueError("la contraseña no puede exceder 72 caracteres")
        return v


class MessageOut(BaseModel):
    message: str


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
        if len(v) > 72:
            raise ValueError("la contraseña no puede exceder 72 caracteres")
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
        if v is not None and len(v) > 72:
            raise ValueError("la contraseña no puede exceder 72 caracteres")
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


# ===== Incident schemas =====

class IncidentCategory(str, Enum):
    recruitment_operations = INCIDENT_CATEGORY_RECRUITMENT_OPERATIONS
    corporate_training = INCIDENT_CATEGORY_CORPORATE_TRAINING
    customer_support = INCIDENT_CATEGORY_CUSTOMER_SUPPORT
    sales_business_development = INCIDENT_CATEGORY_SALES_BUSINESS_DEVELOPMENT
    marketing_communications = INCIDENT_CATEGORY_MARKETING_COMMUNICATIONS
    human_resources = INCIDENT_CATEGORY_HUMAN_RESOURCES
    technology_infrastructure = INCIDENT_CATEGORY_TECHNOLOGY_INFRASTRUCTURE
    executive_management = INCIDENT_CATEGORY_EXECUTIVE_MANAGEMENT


class IncidentStatus(str, Enum):
    open = INCIDENT_STATUS_OPEN
    in_progress = INCIDENT_STATUS_IN_PROGRESS
    resolved = INCIDENT_STATUS_RESOLVED
    discarded = INCIDENT_STATUS_DISCARDED


class IncidentOrigin(str, Enum):
    customer = INCIDENT_ORIGIN_CUSTOMER
    branch = INCIDENT_ORIGIN_BRANCH
    internal = INCIDENT_ORIGIN_INTERNAL


class IncidentBranch(str, Enum):
    central = INCIDENT_BRANCH_CENTRAL
    valencia = INCIDENT_BRANCH_VALENCIA
    miami = INCIDENT_BRANCH_MIAMI


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=140)
    description: str = Field(..., min_length=1)
    category: IncidentCategory
    origin: IncidentOrigin
    branch: IncidentBranch

    @field_validator("title", "description", mode="before")
    @classmethod
    def validate_required_text(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("este campo es obligatorio")
        return v.strip()


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[IncidentCategory] = None
    status: Optional[IncidentStatus] = None
    origin: Optional[IncidentOrigin] = None
    branch: Optional[IncidentBranch] = None

    @field_validator("title", "description", mode="before")
    @classmethod
    def validate_optional_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not isinstance(v, str) or not v.strip():
            raise ValueError("este campo no puede estar vacío")
        return v.strip()


class IncidentOut(BaseModel):
    id: str
    title: str
    description: str
    category: IncidentCategory
    status: IncidentStatus
    origin: IncidentOrigin
    branch: IncidentBranch
    created_at: str
    updated_at: str


# ===== Incident status transition =====

class IncidentStatusTransition(BaseModel):
    """Request to transition an incident to a new status."""
    status: IncidentStatus


class IncidentsMetrics(BaseModel):
    """Aggregated metrics for incidents."""
    total: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_origin: dict[str, int]
    by_branch: dict[str, int]


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


# ====================================================================
# Inventory — Pydantic request / response schemas (separate from ORM)
# ====================================================================

# ----- Product (TrainingProgram) -----

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    duration_hours: int = Field(default=0, ge=0)
    price: float = Field(default=0.0, ge=0.0)
    max_participants: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)


class ProductOut(BaseModel):
    id: str
    name: str
    sku: str
    description: Optional[str] = None
    duration_hours: int
    price: float
    max_participants: int
    is_active: bool
    current_stock: int = 0  # computed from orders, never stored directly
    created_at: str
    updated_at: str


# ----- Inbound order (StockEntry) -----

class InboundOrderCreate(BaseModel):
    product_id: str = Field(..., description="UUID of the product (training program)")
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None


class InboundOrderOut(BaseModel):
    id: str
    product_id: str
    quantity: int
    created_at: str
    user_uuid: str
    notes: Optional[str] = None


# ----- Outbound order (StockExit) -----

class OutboundOrderCreate(BaseModel):
    product_id: str = Field(..., description="UUID of the product (training program)")
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = None
    notes: Optional[str] = None


class OutboundOrderOut(BaseModel):
    id: str
    product_id: str
    quantity: int
    reason: Optional[str] = None
    created_at: str
    user_uuid: str
    notes: Optional[str] = None


# ----- Combined order response -----

class OrderOut(BaseModel):
    id: str
    order_type: str  # "inbound" | "outbound"
    product_id: str
    product_name: str
    quantity: int
    reason: Optional[str] = None
    created_at: str
    user_uuid: str
    notes: Optional[str] = None