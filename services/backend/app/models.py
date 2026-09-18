"""
SQLModel ORM models for the inventory domain.

Two data stores are used deliberately:
  - TinyDB  → users & authentication (unchanged)
  - Supabase → all business data (TrainingProgram, StockEntry, StockExit)

Business rule — enforced at the API and model level:
  Stock is never mutated directly. Only entry/exit orders change inventory.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel


# ===== Product entity: TrainingProgram ==============================

class TrainingProgram(SQLModel, table=True):
    """
    A training course/program that Nexova offers to clients.
    This is the "product" in the inventory system.
    """
    __tablename__: str = "trainingprograms"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        nullable=False,
    )
    name: str = Field(nullable=False, max_length=255)
    sku: str = Field(
        nullable=False, max_length=100, unique=True, index=True,
        description="Stock-keeping unit — unique code for this program",
    )
    description: Optional[str] = Field(default=None, max_length=2000)
    duration_hours: int = Field(default=0, ge=0)
    price: float = Field(default=0.0, ge=0.0)
    max_participants: int = Field(
        default=0, ge=0,
        description="Maximum participants per cohort (0 = unlimited)",
    )
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )


# ===== Entry order: StockEntry ======================================

class StockEntry(SQLModel, table=True):
    """
    An inbound order that INCREASES stock for a TrainingProgram.
    Quantity must be positive.
    """
    __tablename__: str = "stockentries"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        nullable=False,
    )
    training_program_id: str = Field(
        nullable=False, foreign_key="trainingprograms.id",
        index=True,
        description="FK to the training program this entry is for",
    )
    quantity: int = Field(nullable=False, gt=0)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    user_uuid: str = Field(
        nullable=False, max_length=255,
        description="UUID of the TinyDB user who created this order",
    )
    notes: Optional[str] = Field(default=None, max_length=1000)


# ===== Exit order: StockExit ========================================

class StockExit(SQLModel, table=True):
    """
    An outbound order that DECREASES stock for a TrainingProgram.
    Quantity must be positive.
    """
    __tablename__: str = "stockexits"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        nullable=False,
    )
    training_program_id: str = Field(
        nullable=False, foreign_key="trainingprograms.id",
        index=True,
        description="FK to the training program this exit is for",
    )
    quantity: int = Field(nullable=False, gt=0)
    reason: Optional[str] = Field(
        default=None, max_length=500,
        description="Reason for the stock reduction (e.g. participant assignment)",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    user_uuid: str = Field(
        nullable=False, max_length=255,
        description="UUID of the TinyDB user who created this order",
    )
    notes: Optional[str] = Field(default=None, max_length=1000)