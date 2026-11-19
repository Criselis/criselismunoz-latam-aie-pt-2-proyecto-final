"""
Records router: CRUD for candidate pipeline records.
All routes are protected — requires valid JWT.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.crud import records as crud_records
from app.crud import notes as crud_notes
from app.schemas import RecordCreate, RecordOut, RecordUpdate

logger = logging.getLogger("nexova-api.records")

router = APIRouter(prefix="/records", tags=["records"])


def _to_record_out(r: dict) -> RecordOut:
    return RecordOut(
        id=r["id"],
        full_name=r["full_name"],
        email=r["email"],
        phone=r["phone"],
        position=r["position"],
        linkedin_url=r.get("linkedin_url"),
        cv_url=r.get("cv_url"),
        status=r["status"],
        stage=r["stage"],
        experience_years=r["experience_years"],
        notes_count=r.get("notes_count", 0),
        user_uuid=r.get("user_uuid"),
        applied_at=r["applied_at"],
        updated_at=r["updated_at"],
    )


def _update_or_404(record_id: str, body: RecordUpdate) -> dict:
    try:
        updated = crud_records.update_record(record_id, body)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    if updated is None:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return updated


@router.get("", response_model=list[RecordOut])
async def list_records(
    status: str | None = None,
    stage: str | None = None,
    search: str | None = None,
    _current_user: dict = Depends(get_current_user),
):
    """List all candidate records (protected). Supports filtering."""
    records = crud_records.get_all_records(status=status, stage=stage, search=search)
    return [_to_record_out(r) for r in records]


@router.get("/{record_id}", response_model=RecordOut)
async def get_record(
    record_id: str,
    _current_user: dict = Depends(get_current_user),
):
    """Get a single candidate record (protected)."""
    record = crud_records.get_record_by_id(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return _to_record_out(record)


@router.post("", response_model=RecordOut, status_code=201)
async def create_record(
    body: RecordCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new candidate record (protected)."""
    record = crud_records.create_record(body, user_uuid=current_user["id"])
    logger.info("Record %s created by user %s", record["id"], current_user["id"])
    return _to_record_out(record)


@router.put("/{record_id}", response_model=RecordOut)
async def update_record(
    record_id: str,
    body: RecordUpdate,
    _current_user: dict = Depends(get_current_user),
):
    """Replace a candidate record (protected)."""
    return _to_record_out(_update_or_404(record_id, body))


@router.patch("/{record_id}", response_model=RecordOut)
async def patch_record(
    record_id: str,
    body: RecordUpdate,
    _current_user: dict = Depends(get_current_user),
):
    """Partially update a candidate record (protected)."""
    return _to_record_out(_update_or_404(record_id, body))


@router.delete("/{record_id}", status_code=204)
async def delete_record(
    record_id: str,
    _current_user: dict = Depends(get_current_user),
):
    """Delete a candidate record and its notes (protected)."""
    deleted = crud_records.delete_record(record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Registro no encontrado")


# ── Notes nested under /records/{record_id}/notes ──────────────────


@router.get("/{record_id}/notes", tags=["notes"])
async def list_notes(
    record_id: str,
    _current_user: dict = Depends(get_current_user),
):
    """Get all notes for a record (protected)."""
    record = crud_records.get_record_by_id(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    notes = crud_notes.get_notes_for_record(record_id)
    return [
        {
            "id": n["id"],
            "record_id": n["record_id"],
            "content": n["content"],
            "created_at": n["created_at"],
        }
        for n in notes
    ]


@router.post("/{record_id}/notes", status_code=201, tags=["notes"])
async def create_note(
    record_id: str,
    body: dict = None,
    _current_user: dict = Depends(get_current_user),
):
    """Add a note to a record (protected)."""
    from app.schemas import NoteCreate

    if body is None or "content" not in body:
        raise HTTPException(status_code=422, detail="Campo 'content' requerido")
    if not body["content"].strip():
        raise HTTPException(status_code=422, detail="El contenido de la nota no puede estar vacío")

    note_body = NoteCreate(content=body["content"].strip())
    record = crud_records.get_record_by_id(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    note = crud_notes.create_note(record_id, note_body)
    crud_records.increment_notes_count(record_id)
    return {
        "id": note["id"],
        "record_id": note["record_id"],
        "content": note["content"],
        "created_at": note["created_at"],
    }


@router.delete("/{record_id}/notes/{note_id}", status_code=204, tags=["notes"])
async def delete_note(
    record_id: str,
    note_id: str,
    _current_user: dict = Depends(get_current_user),
):
    """Delete a note (protected)."""
    record = crud_records.get_record_by_id(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    note = crud_notes.get_note_by_id(note_id)
    if note is None or note.get("record_id") != record_id:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    crud_notes.delete_note(note_id)
    crud_records.decrement_notes_count(record_id)