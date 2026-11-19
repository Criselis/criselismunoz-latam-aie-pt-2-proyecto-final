"""Shared incident domain rules used by the API and seed scripts."""

from datetime import datetime


INCIDENT_CATEGORY_RECRUITMENT_OPERATIONS = "recruitment_operations"
INCIDENT_CATEGORY_CORPORATE_TRAINING = "corporate_training"
INCIDENT_CATEGORY_CUSTOMER_SUPPORT = "customer_support"
INCIDENT_CATEGORY_SALES_BUSINESS_DEVELOPMENT = "sales_business_development"
INCIDENT_CATEGORY_MARKETING_COMMUNICATIONS = "marketing_communications"
INCIDENT_CATEGORY_HUMAN_RESOURCES = "human_resources"
INCIDENT_CATEGORY_TECHNOLOGY_INFRASTRUCTURE = "technology_infrastructure"
INCIDENT_CATEGORY_EXECUTIVE_MANAGEMENT = "executive_management"

INCIDENT_STATUS_OPEN = "open"
INCIDENT_STATUS_IN_PROGRESS = "in_progress"
INCIDENT_STATUS_RESOLVED = "resolved"
INCIDENT_STATUS_DISCARDED = "discarded"

INCIDENT_ORIGIN_CUSTOMER = "customer"
INCIDENT_ORIGIN_BRANCH = "branch"
INCIDENT_ORIGIN_INTERNAL = "internal"

INCIDENT_BRANCH_CENTRAL = "central"
INCIDENT_BRANCH_VALENCIA = "valencia"
INCIDENT_BRANCH_MIAMI = "miami"

INCIDENT_CATEGORY_VALUES = (
    INCIDENT_CATEGORY_RECRUITMENT_OPERATIONS,
    INCIDENT_CATEGORY_CORPORATE_TRAINING,
    INCIDENT_CATEGORY_CUSTOMER_SUPPORT,
    INCIDENT_CATEGORY_SALES_BUSINESS_DEVELOPMENT,
    INCIDENT_CATEGORY_MARKETING_COMMUNICATIONS,
    INCIDENT_CATEGORY_HUMAN_RESOURCES,
    INCIDENT_CATEGORY_TECHNOLOGY_INFRASTRUCTURE,
    INCIDENT_CATEGORY_EXECUTIVE_MANAGEMENT,
)

INCIDENT_STATUS_VALUES = (
    INCIDENT_STATUS_OPEN,
    INCIDENT_STATUS_IN_PROGRESS,
    INCIDENT_STATUS_RESOLVED,
    INCIDENT_STATUS_DISCARDED,
)

INCIDENT_ORIGIN_VALUES = (
    INCIDENT_ORIGIN_CUSTOMER,
    INCIDENT_ORIGIN_BRANCH,
    INCIDENT_ORIGIN_INTERNAL,
)

INCIDENT_BRANCH_VALUES = (
    INCIDENT_BRANCH_CENTRAL,
    INCIDENT_BRANCH_VALENCIA,
    INCIDENT_BRANCH_MIAMI,
)

VALID_TRANSITIONS = {
    INCIDENT_STATUS_OPEN: (INCIDENT_STATUS_IN_PROGRESS, INCIDENT_STATUS_DISCARDED),
    INCIDENT_STATUS_IN_PROGRESS: (INCIDENT_STATUS_RESOLVED, INCIDENT_STATUS_DISCARDED),
    INCIDENT_STATUS_RESOLVED: (),
    INCIDENT_STATUS_DISCARDED: (),
}

CSV_STATUS_MAP = {
    "abierto": INCIDENT_STATUS_OPEN,
    "open": INCIDENT_STATUS_OPEN,
    "en_progreso": INCIDENT_STATUS_IN_PROGRESS,
    "in_progress": INCIDENT_STATUS_IN_PROGRESS,
    "resuelto": INCIDENT_STATUS_RESOLVED,
    "resolved": INCIDENT_STATUS_RESOLVED,
    "descartado": INCIDENT_STATUS_DISCARDED,
    "discarded": INCIDENT_STATUS_DISCARDED,
}

CSV_CATEGORY_MAP = {
    "operaciones_selección": INCIDENT_CATEGORY_RECRUITMENT_OPERATIONS,
    "recruitment_operations": INCIDENT_CATEGORY_RECRUITMENT_OPERATIONS,
    "formación_corporativa": INCIDENT_CATEGORY_CORPORATE_TRAINING,
    "corporate_training": INCIDENT_CATEGORY_CORPORATE_TRAINING,
    "soporte_cliente": INCIDENT_CATEGORY_CUSTOMER_SUPPORT,
    "customer_support": INCIDENT_CATEGORY_CUSTOMER_SUPPORT,
    "ventas_desarrollo_negocio": INCIDENT_CATEGORY_SALES_BUSINESS_DEVELOPMENT,
    "sales_business_development": INCIDENT_CATEGORY_SALES_BUSINESS_DEVELOPMENT,
    "marketing_comunicaciones": INCIDENT_CATEGORY_MARKETING_COMMUNICATIONS,
    "marketing_communications": INCIDENT_CATEGORY_MARKETING_COMMUNICATIONS,
    "recursos_humanos": INCIDENT_CATEGORY_HUMAN_RESOURCES,
    "human_resources": INCIDENT_CATEGORY_HUMAN_RESOURCES,
    "tecnología_infraestructura": INCIDENT_CATEGORY_TECHNOLOGY_INFRASTRUCTURE,
    "technology_infrastructure": INCIDENT_CATEGORY_TECHNOLOGY_INFRASTRUCTURE,
    "dirección_ejecutiva": INCIDENT_CATEGORY_EXECUTIVE_MANAGEMENT,
    "executive_management": INCIDENT_CATEGORY_EXECUTIVE_MANAGEMENT,
}

CSV_BRANCH_MAP = {
    "central": INCIDENT_BRANCH_CENTRAL,
    "centro": INCIDENT_BRANCH_CENTRAL,
    "valencia": INCIDENT_BRANCH_VALENCIA,
    "miami": INCIDENT_BRANCH_MIAMI,
}


class IncidentTransformationError(Exception):
    """Raised when an incident source record cannot be transformed."""


def extract_incident_title(description: str, max_length: int = 140) -> str:
    first_sentence = description.split(".")[0].strip()
    if first_sentence and len(first_sentence) <= max_length:
        return first_sentence

    title = ""
    for word in description.split():
        next_title = f"{title} {word}".strip()
        if len(next_title) > max_length:
            break
        title = next_title

    return title or "Incidencia sin título"


def transform_historical_incident_row(row: dict) -> dict:
    estado = (row.get("estado") or "").strip().lower()
    categoria = (row.get("categoría") or "").strip().lower()
    ubicacion = (row.get("ubicación") or "").strip().lower()
    descripcion = (row.get("descripción") or "").strip()
    fecha = (row.get("fecha") or "").strip()

    if not descripcion:
        raise IncidentTransformationError("descripción vacía")
    if not fecha:
        raise IncidentTransformationError("fecha vacía")
    try:
        datetime.fromisoformat(fecha)
    except ValueError as exc:
        raise IncidentTransformationError(f"fecha inválida: {fecha}") from exc

    if estado not in CSV_STATUS_MAP:
        raise IncidentTransformationError(f"estado desconocido: {estado}")
    if categoria not in CSV_CATEGORY_MAP:
        raise IncidentTransformationError(f"categoría desconocida: {categoria}")
    if ubicacion not in CSV_BRANCH_MAP:
        raise IncidentTransformationError(f"ubicación desconocida: {ubicacion}")

    return {
        "title": extract_incident_title(descripcion),
        "description": descripcion,
        "category": CSV_CATEGORY_MAP[categoria],
        "status": CSV_STATUS_MAP[estado],
        "origin": INCIDENT_ORIGIN_CUSTOMER,
        "branch": CSV_BRANCH_MAP[ubicacion],
        "created_at": fecha,
        "updated_at": fecha,
    }


def empty_incident_metrics() -> dict:
    return {
        "total": 0,
        "by_status": dict.fromkeys(INCIDENT_STATUS_VALUES, 0),
        "by_category": dict.fromkeys(INCIDENT_CATEGORY_VALUES, 0),
        "by_origin": dict.fromkeys(INCIDENT_ORIGIN_VALUES, 0),
        "by_branch": dict.fromkeys(INCIDENT_BRANCH_VALUES, 0),
    }