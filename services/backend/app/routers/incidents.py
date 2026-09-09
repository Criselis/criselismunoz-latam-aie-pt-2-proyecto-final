"""
Incidents router: CRUD for centralized incident reports.
All routes are protected — requires valid JWT.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.crud import incidents as crud_incidents
from app.schemas import (
    IncidentCreate,
    IncidentOut,
    IncidentUpdate,
    IncidentStatusTransition,
    IncidentsMetrics,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])


def to_incident_out(incident: dict) -> IncidentOut:
    return IncidentOut(
        id=incident["id"],
        title=incident["title"],
        description=incident["description"],
        category=incident["category"],
        status=incident["status"],
        origin=incident["origin"],
        branch=incident["branch"],
        created_at=incident["created_at"],
        updated_at=incident["updated_at"],
    )


@router.get("", response_model=list[IncidentOut])
async def list_incidents(
    status: str | None = None,
    category: str | None = None,
    origin: str | None = None,
    branch: str | None = None,
    search: str | None = None,
    _current_user: dict = Depends(get_current_user),
):
    """List all incidents (protected). Supports filtering."""
    incidents = crud_incidents.get_all_incidents(
        status=status,
        category=category,
        origin=origin,
        branch=branch,
        search=search,
    )
    return [to_incident_out(i) for i in incidents]


@router.get("/summary", response_model=IncidentsMetrics)
async def get_incidents_summary(
    _current_user: dict = Depends(get_current_user),
):
    """Get aggregated metrics for all incidents (protected)."""
    metrics = crud_incidents.get_incidents_metrics()
    return IncidentsMetrics(**metrics)


@router.get("/{incident_id}", response_model=IncidentOut)
async def get_incident(
    incident_id: str,
    _current_user: dict = Depends(get_current_user),
):
    """Get a single incident (protected)."""
    incident = crud_incidents.get_incident_by_id(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    return to_incident_out(incident)


@router.post("", response_model=IncidentOut, status_code=201)
async def create_incident(
    body: IncidentCreate,
    _current_user: dict = Depends(get_current_user),
):
    """Create a new incident (protected)."""
    incident = crud_incidents.create_incident(body)
    return to_incident_out(incident)


@router.patch("/{incident_id}/status", response_model=IncidentOut)
async def transition_incident_status(
    incident_id: str,
    body: IncidentStatusTransition,
    _current_user: dict = Depends(get_current_user),
):
    """
    Transition an incident to a new status (protected).
    Validates the transition against the incident lifecycle rules.
    
    Allowed transitions:
    - open → in_progress, discarded
    - in_progress → resolved, discarded
    - resolved → (terminal, no transitions allowed)
    - discarded → (terminal, no transitions allowed)
    """
    try:
        updated = crud_incidents.transition_incident_status(
            incident_id, body.status.value
        )
        if updated is None:
            raise HTTPException(status_code=404, detail="Incidencia no encontrada")
        return to_incident_out(updated)
    except ValueError as e:
        # Invalid transition
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{incident_id}", response_model=IncidentOut)
async def update_incident(
    incident_id: str,
    body: IncidentUpdate,
    _current_user: dict = Depends(get_current_user),
):
    """Replace or update an incident (protected)."""
    updated = crud_incidents.update_incident(incident_id, body)
    if updated is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    return to_incident_out(updated)


@router.patch("/{incident_id}", response_model=IncidentOut)
async def patch_incident(
    incident_id: str,
    body: IncidentUpdate,
    _current_user: dict = Depends(get_current_user),
):
    """Partially update an incident (protected)."""
    updated = crud_incidents.update_incident(incident_id, body)
    if updated is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    return to_incident_out(updated)


@router.delete("/{incident_id}", status_code=204)
async def delete_incident(
    incident_id: str,
    _current_user: dict = Depends(get_current_user),
):
    """Delete an incident (protected)."""
    deleted = crud_incidents.delete_incident(incident_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")