"""
Inventory router — all routes under /inventory.

Enforces the cardinal business rule:
  Stock is never mutated directly. Only entry orders (StockEntry)
  and exit orders (StockExit) change the computed stock level.

All inventory data lives in Supabase (PostgreSQL via SQLModel).
Authentication remains in TinyDB — user_uuid is passed as a string
reference (no FK, no user-table replication).

All endpoints require authentication (Nexova is a B2B internal system).
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from app.auth import get_current_user
from app.database import get_db
from app.models import StockEntry, StockExit, TrainingProgram
from app.schemas import (
    InboundOrderCreate,
    InboundOrderOut,
    OutboundOrderCreate,
    OutboundOrderOut,
    OrderOut,
    ProductCreate,
    ProductOut,
)

logger = logging.getLogger("nexova-api.inventory")
router = APIRouter(prefix="/inventory", tags=["inventory"])


# ── Helpers ─────────────────────────────────────────────────────────

def _compute_stock(db: Session, program_id: str) -> int:
    """Derive current stock from the order history (no direct mutation)."""
    entries_result = db.exec(
        select(func.coalesce(func.sum(StockEntry.quantity), 0)).where(
            StockEntry.training_program_id == program_id
        )
    ).one()
    exits_result = db.exec(
        select(func.coalesce(func.sum(StockExit.quantity), 0)).where(
            StockExit.training_program_id == program_id
        )
    ).one()
    return int(entries_result) - int(exits_result)


def _raise_if_insufficient_stock(
    db: Session, program_id: str, required: int
) -> None:
    """Raise HTTP 400 if the current stock can't cover the requested exit."""
    current = _compute_stock(db, program_id)
    if current < required:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Stock insuficiente para el programa {program_id}: "
                f"se requieren {required}, hay {current} disponibles."
            ),
        )


def _program_to_out(p: TrainingProgram, db: Session) -> ProductOut:
    return ProductOut(
        id=p.id,
        name=p.name,
        sku=p.sku,
        description=p.description,
        duration_hours=p.duration_hours,
        price=p.price,
        max_participants=p.max_participants,
        is_active=p.is_active,
        current_stock=_compute_stock(db, p.id),
        created_at=p.created_at.isoformat(),
        updated_at=p.updated_at.isoformat(),
    )


# ====================================================================
# Products
# ====================================================================

@router.get("/products", response_model=list[ProductOut])
async def list_products(
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    """List all active training programs (products) with computed current_stock."""
    programs = db.exec(
        select(TrainingProgram).where(TrainingProgram.is_active == True)
    ).all()
    return [_program_to_out(p, db) for p in programs]


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    """Get a single product by ID with its computed current_stock."""
    program = db.get(TrainingProgram, product_id)
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado",
        )
    return _program_to_out(program, db)


@router.post("/products", response_model=ProductOut, status_code=201)
async def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    """
    Create a new product (training program).

    The product starts with zero stock. It can only accumulate stock
    through inbound orders.
    """
    existing = db.exec(
        select(TrainingProgram).where(TrainingProgram.sku == body.sku)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un producto con el SKU '{body.sku}'",
        )

    program = TrainingProgram(
        name=body.name,
        sku=body.sku,
        description=body.description,
        duration_hours=body.duration_hours,
        price=body.price,
        max_participants=body.max_participants,
        is_active=body.is_active,
    )
    db.add(program)
    db.commit()
    db.refresh(program)

    logger.info("Product created: %s (sku=%s)", program.id, program.sku)
    return _program_to_out(program, db)


# ====================================================================
# Inbound orders
# ====================================================================

@router.post("/orders/inbound", response_model=InboundOrderOut, status_code=201)
async def create_inbound_order(
    body: InboundOrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Register an inbound order that INCREASES stock.

    The requesting user's TinyDB UUID is recorded in user_uuid.
    Stock is never mutated directly — only the order is persisted.
    """
    program = db.get(TrainingProgram, body.product_id)
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado",
        )

    entry = StockEntry(
        training_program_id=body.product_id,
        quantity=body.quantity,
        user_uuid=current_user["id"],
        notes=body.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    logger.info(
        "Inbound order created: product=%s qty=%d user=%s",
        entry.training_program_id, entry.quantity, entry.user_uuid,
    )
    return InboundOrderOut(
        id=entry.id,
        product_id=entry.training_program_id,
        quantity=entry.quantity,
        created_at=entry.created_at.isoformat(),
        user_uuid=entry.user_uuid,
        notes=entry.notes,
    )


# ====================================================================
# Outbound orders
# ====================================================================

@router.post("/orders/outbound", response_model=OutboundOrderOut, status_code=201)
async def create_outbound_order(
    body: OutboundOrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Register an outbound order that REDUCES stock.

    Rejects with HTTP 400 if the resulting stock would be negative.
    The requesting user's TinyDB UUID is recorded in user_uuid.
    """
    program = db.get(TrainingProgram, body.product_id)
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado",
        )

    _raise_if_insufficient_stock(db, body.product_id, body.quantity)

    exit_order = StockExit(
        training_program_id=body.product_id,
        quantity=body.quantity,
        reason=body.reason,
        user_uuid=current_user["id"],
        notes=body.notes,
    )
    db.add(exit_order)
    db.commit()
    db.refresh(exit_order)

    logger.info(
        "Outbound order created: product=%s qty=%d user=%s",
        exit_order.training_program_id, exit_order.quantity, exit_order.user_uuid,
    )
    return OutboundOrderOut(
        id=exit_order.id,
        product_id=exit_order.training_program_id,
        quantity=exit_order.quantity,
        reason=exit_order.reason,
        created_at=exit_order.created_at.isoformat(),
        user_uuid=exit_order.user_uuid,
        notes=exit_order.notes,
    )


# ====================================================================
# All orders (combined)
# ====================================================================

@router.get("/orders", response_model=list[OrderOut])
async def list_orders(
    product_id: Optional[str] = Query(None, alias="product_id"),
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    """
    List all orders (inbound and outbound) with product data and user_uuid.

    Optionally filter by product_id. Each order includes the product name
    and the computed order type (inbound / outbound).
    """
    results: list[OrderOut] = []

    # Fetch entries
    entry_stmt = select(StockEntry)
    if product_id:
        entry_stmt = entry_stmt.where(StockEntry.training_program_id == product_id)
    for e in db.exec(entry_stmt).all():
        prog = db.get(TrainingProgram, e.training_program_id)
        results.append(OrderOut(
            id=e.id,
            order_type="inbound",
            product_id=e.training_program_id,
            product_name=prog.name if prog else "Unknown",
            quantity=e.quantity,
            reason=None,
            created_at=e.created_at.isoformat(),
            user_uuid=e.user_uuid,
            notes=e.notes,
        ))

    # Fetch exits
    exit_stmt = select(StockExit)
    if product_id:
        exit_stmt = exit_stmt.where(StockExit.training_program_id == product_id)
    for e in db.exec(exit_stmt).all():
        prog = db.get(TrainingProgram, e.training_program_id)
        results.append(OrderOut(
            id=e.id,
            order_type="outbound",
            product_id=e.training_program_id,
            product_name=prog.name if prog else "Unknown",
            quantity=e.quantity,
            reason=e.reason,
            created_at=e.created_at.isoformat(),
            user_uuid=e.user_uuid,
            notes=e.notes,
        ))

    # Sort by created_at descending (most recent first)
    results.sort(key=lambda o: o.created_at, reverse=True)
    return results