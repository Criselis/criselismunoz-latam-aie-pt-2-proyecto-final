"""
Incidents CRUD operations on TinyDB.
Centralized incident reports for customer, branch, and internal origins.
"""

from typing import Optional
from collections import Counter
from pathlib import Path
import sys

from app.database import incidents_table
from app.schemas import IncidentCreate, IncidentUpdate, new_uuid, now_iso

repo_root = Path(__file__).resolve().parents[4]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from packages.shared.incident_rules import (
    INCIDENT_CATEGORY_VALUES,
    INCIDENT_ORIGIN_VALUES,
    INCIDENT_STATUS_VALUES,
    INCIDENT_BRANCH_VALUES,
    VALID_TRANSITIONS,
)


INCIDENT_SEED_DATA = [
    {
        "title": "Cliente sin acceso al portal de soporte",
        "description": "Un cliente de retail no puede iniciar sesión en el portal y no recibe el correo de recuperación de contraseña.",
        "category": "customer_support",
        "status": "open",
        "origin": "customer",
        "branch": "central",
    },
    {
        "title": "Escalado por incumplimiento de SLA",
        "description": "Varias incidencias de un cliente tecnológico superaron las 24 horas comprometidas sin actualización visible para supervisión.",
        "category": "customer_support",
        "status": "in_progress",
        "origin": "customer",
        "branch": "valencia",
    },
    {
        "title": "Error en inscripción a formación corporativa",
        "description": "El responsable de una empresa financiera reporta que sus empleados no aparecen inscritos tras completar el formulario online.",
        "category": "corporate_training",
        "status": "resolved",
        "origin": "customer",
        "branch": "central",
    },
    {
        "title": "Cliente solicita visibilidad del proceso de selección",
        "description": "Un cliente pide actualización en tiempo real sobre candidatos en entrevista técnica para una vacante urgente.",
        "category": "recruitment_operations",
        "status": "open",
        "origin": "customer",
        "branch": "miami",
    },
]


def create_incident(data: IncidentCreate) -> dict:
    """Insert a new incident. Returns the full document."""
    now = now_iso()
    incident = {
        "id": new_uuid(),
        "title": data.title,
        "description": data.description,
        "category": data.category.value,
        "status": "open",
        "origin": data.origin.value,
        "branch": data.branch.value,
        "created_at": now,
        "updated_at": now,
    }
    incidents_table.insert(incident)
    return incident


def seed_incidents() -> None:
    """Load expected customer incident seed data when the table is empty."""
    if incidents_table.all():
        return

    now = now_iso()
    incidents_table.insert_multiple([
        {
            "id": new_uuid(),
            "title": incident["title"],
            "description": incident["description"],
            "category": incident["category"],
            "status": incident["status"],
            "origin": incident["origin"],
            "branch": incident["branch"],
            "created_at": now,
            "updated_at": now,
        }
        for incident in INCIDENT_SEED_DATA
    ])


def get_incident_by_id(incident_id: str) -> Optional[dict]:
    """Find an incident by its id."""
    results = incidents_table.search(lambda d: d.get("id") == incident_id)
    return results[0] if results else None


def get_all_incidents(
    status: Optional[str] = None,
    category: Optional[str] = None,
    origin: Optional[str] = None,
    branch: Optional[str] = None,
    search: Optional[str] = None,
) -> list[dict]:
    """Return incidents, optionally filtered."""
    incidents = incidents_table.all()

    if status:
        incidents = [i for i in incidents if i.get("status") == status]
    if category:
        incidents = [i for i in incidents if i.get("category") == category]
    if origin:
        incidents = [i for i in incidents if i.get("origin") == origin]
    if branch:
        incidents = [i for i in incidents if i.get("branch") == branch]
    if search:
        q = search.lower()
        incidents = [
            i for i in incidents
            if q in (i.get("title") or "").lower()
            or q in (i.get("description") or "").lower()
        ]

    return incidents


def update_incident(incident_id: str, data: IncidentUpdate) -> Optional[dict]:
    """Update incident fields. Returns the updated document or None."""
    incident = get_incident_by_id(incident_id)
    if incident is None:
        return None

    updates = {}
    if data.title is not None:
        updates["title"] = data.title
    if data.description is not None:
        updates["description"] = data.description
    if data.category is not None:
        updates["category"] = data.category.value
    if data.status is not None:
        updates["status"] = data.status.value
    if data.origin is not None:
        updates["origin"] = data.origin.value
    if data.branch is not None:
        updates["branch"] = data.branch.value

    if updates:
        updates["updated_at"] = now_iso()
        incidents_table.update(updates, lambda d: d.get("id") == incident_id)

    return get_incident_by_id(incident_id)


def delete_incident(incident_id: str) -> bool:
    """Delete an incident."""
    removed = incidents_table.remove(lambda d: d.get("id") == incident_id)
    return len(removed) > 0


def transition_incident_status(incident_id: str, new_status: str) -> Optional[dict]:
    """
    Transition an incident to a new status.
    Validates that the transition is legal according to the lifecycle.
    
    Returns:
        Updated incident dict on success, None if incident not found or transition invalid.
    
    Raises:
        ValueError: If the transition is not allowed.
    """
    incident = get_incident_by_id(incident_id)
    if incident is None:
        return None
    
    current_status = incident.get("status")
    
    # Check if transition is allowed
    allowed_next = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed_next:
        raise ValueError(
            f"transición de '{current_status}' a '{new_status}' no es permitida. "
            f"Estados válidos desde '{current_status}': {', '.join(allowed_next) if allowed_next else 'ninguno (estado final)'}"
        )
    
    # Apply transition
    incidents_table.update(
        {"status": new_status, "updated_at": now_iso()},
        lambda d: d.get("id") == incident_id,
    )
    
    return get_incident_by_id(incident_id)


def get_incidents_metrics() -> dict:
    """
    Calculate aggregated metrics for all incidents.
    
    Returns:
        dict with keys: total, by_status, by_category, by_origin, by_branch
    """
    incidents = incidents_table.all()
    
    by_status = Counter(i.get("status") for i in incidents)
    by_category = Counter(i.get("category") for i in incidents)
    by_origin = Counter(i.get("origin") for i in incidents)
    by_branch = Counter(i.get("branch") for i in incidents)
    
    return {
        "total": len(incidents),
        "by_status": {value: by_status.get(value, 0) for value in INCIDENT_STATUS_VALUES},
        "by_category": {value: by_category.get(value, 0) for value in INCIDENT_CATEGORY_VALUES},
        "by_origin": {value: by_origin.get(value, 0) for value in INCIDENT_ORIGIN_VALUES},
        "by_branch": {value: by_branch.get(value, 0) for value in INCIDENT_BRANCH_VALUES},
    }