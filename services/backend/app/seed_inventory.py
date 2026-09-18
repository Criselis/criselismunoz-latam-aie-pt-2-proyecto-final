"""
Seed data for the inventory domain (Supabase tables).

Creates initial training programs and corresponding orders
so the demo shows meaningful computed stock levels.

Usage:
    from app.seed_inventory import seed_inventory_tables
    seed_inventory_tables(next(get_db()))
"""

import logging
from datetime import datetime, timezone

from sqlmodel import Session, select

from app.models import StockEntry, StockExit, TrainingProgram

logger = logging.getLogger("nexova-api.seed_inventory")

# Predefined UUIDs so seed data is reproducible across runs.
# Using fixed IDs avoids duplicate entries when the function is re-run.

SEED_PRODUCTS = [
    {
        "id": "a1000000-0000-4000-8000-000000000001",
        "name": "Liderazgo y Gestión de Equipos",
        "sku": "NEX-TRNG-LDR-001",
        "description": "Programa avanzado de liderazgo para mandos intermedios. Cubre comunicación, delegación, gestión del cambio y resolución de conflictos.",
        "duration_hours": 40,
        "price": 2400.00,
        "max_participants": 20,
    },
    {
        "id": "a1000000-0000-4000-8000-000000000002",
        "name": "Comunicación Corporativa Efectiva",
        "sku": "NEX-TRNG-COM-002",
        "description": "Taller práctico de comunicación verbal, no verbal y escrita para equipos de atención al cliente y ventas.",
        "duration_hours": 16,
        "price": 950.00,
        "max_participants": 25,
    },
    {
        "id": "a1000000-0000-4000-8000-000000000003",
        "name": "Transformación Digital para PYMEs",
        "sku": "NEX-TRNG-DGT-003",
        "description": "Programa intensivo sobre herramientas digitales, automatización de procesos y análisis de datos para pequeñas y medianas empresas.",
        "duration_hours": 32,
        "price": 1800.00,
        "max_participants": 15,
    },
]

SEED_ENTRIES = [
    {
        "id": "b2000000-0000-4000-8000-000000000001",
        "training_program_id": SEED_PRODUCTS[0]["id"],
        "quantity": 50,
        "user_uuid": "admin-seed-user",
        "notes": "Carga inicial de plazas — Liderazgo",
    },
    {
        "id": "b2000000-0000-4000-8000-000000000002",
        "training_program_id": SEED_PRODUCTS[1]["id"],
        "quantity": 30,
        "user_uuid": "admin-seed-user",
        "notes": "Carga inicial de plazas — Comunicación",
    },
    {
        "id": "b2000000-0000-4000-8000-000000000003",
        "training_program_id": SEED_PRODUCTS[2]["id"],
        "quantity": 20,
        "user_uuid": "admin-seed-user",
        "notes": "Carga inicial de plazas — Transformación Digital",
    },
]

SEED_EXITS = [
    {
        "id": "c3000000-0000-4000-8000-000000000001",
        "training_program_id": SEED_PRODUCTS[0]["id"],
        "quantity": 5,
        "reason": "Asignación a cliente TechCorp — cohorte Q4",
        "user_uuid": "admin-seed-user",
        "notes": "Reserva de 5 plazas para TechCorp",
    },
    {
        "id": "c3000000-0000-4000-8000-000000000002",
        "training_program_id": SEED_PRODUCTS[1]["id"],
        "quantity": 8,
        "reason": "Asignación a cliente RetailPlus — taller trimestral",
        "user_uuid": "admin-seed-user",
        "notes": "Reserva de 8 plazas para RetailPlus",
    },
]


def seed_inventory_tables(db: Session) -> None:
    """Insert seed products, entries, and exits if the DB is empty."""

    existing = db.exec(select(TrainingProgram).limit(1)).first()
    if existing:
        logger.info("Inventory tables already seeded — skipping.")
        return

    now = datetime.now(timezone.utc)

    # Products
    for p in SEED_PRODUCTS:
        program = TrainingProgram(
            id=p["id"],
            name=p["name"],
            sku=p["sku"],
            description=p["description"],
            duration_hours=p["duration_hours"],
            price=p["price"],
            max_participants=p["max_participants"],
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        db.add(program)
    db.flush()
    logger.info("Seeded %d training programs.", len(SEED_PRODUCTS))

    # Entries
    for e in SEED_ENTRIES:
        entry = StockEntry(
            id=e["id"],
            training_program_id=e["training_program_id"],
            quantity=e["quantity"],
            user_uuid=e["user_uuid"],
            created_at=now,
            notes=e["notes"],
        )
        db.add(entry)
    db.flush()
    logger.info("Seeded %d stock entries.", len(SEED_ENTRIES))

    # Exits
    for x in SEED_EXITS:
        exit_order = StockExit(
            id=x["id"],
            training_program_id=x["training_program_id"],
            quantity=x["quantity"],
            reason=x["reason"],
            user_uuid=x["user_uuid"],
            created_at=now,
            notes=x["notes"],
        )
        db.add(exit_order)
    db.flush()
    logger.info("Seeded %d stock exits.", len(SEED_EXITS))

    db.commit()

    # Log expected stock levels
    for p in SEED_PRODUCTS:
        entries_qty = sum(
            e["quantity"] for e in SEED_ENTRIES
            if e["training_program_id"] == p["id"]
        )
        exits_qty = sum(
            x["quantity"] for x in SEED_EXITS
            if x["training_program_id"] == p["id"]
        )
        logger.info(
            "  → %s: stock = %d - %d = %d",
            p["name"], entries_qty, exits_qty, entries_qty - exits_qty,
        )