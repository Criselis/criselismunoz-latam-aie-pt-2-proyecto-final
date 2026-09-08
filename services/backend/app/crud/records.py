"""
Records CRUD operations on TinyDB.
Candidate pipeline records — each record stores who created it via user_uuid.
"""

from typing import Optional

from app.database import records_table
from app.schemas import RecordCreate, RecordUpdate, new_uuid, now_iso

VALID_STATUSES = {"received", "in_progress", "selected", "discarded"}
VALID_STAGES = {"pending", "review", "personal_interview", "technical_interview", "offer_presented"}


def create_record(data: RecordCreate, user_uuid: str) -> dict:
    """Insert a new candidate record. Returns the full document."""
    now = now_iso()
    record = {
        "id": new_uuid(),
        "full_name": data.full_name,
        "email": data.email,
        "phone": data.phone,
        "position": data.position,
        "linkedin_url": data.linkedin_url,
        "cv_url": data.cv_url,
        "status": "received",
        "stage": "pending",
        "experience_years": data.experience_years,
        "notes_count": 0,
        "user_uuid": user_uuid,
        "applied_at": now,
        "updated_at": now,
    }
    records_table.insert(record)
    return record


def get_record_by_id(record_id: str) -> Optional[dict]:
    """Find a record by its id."""
    results = records_table.search(lambda d: d.get("id") == record_id)
    return results[0] if results else None


def get_all_records(
    status: Optional[str] = None,
    stage: Optional[str] = None,
    search: Optional[str] = None,
) -> list[dict]:
    """Return records, optionally filtered."""
    records = records_table.all()

    if status:
        records = [r for r in records if r.get("status") == status]
    if stage:
        records = [r for r in records if r.get("stage") == stage]
    if search:
        q = search.lower()
        records = [
            r for r in records
            if q in (r.get("full_name") or "").lower()
            or q in (r.get("email") or "").lower()
            or q in (r.get("position") or "").lower()
        ]

    return records


def update_record(record_id: str, data: RecordUpdate) -> Optional[dict]:
    """Update record fields. Returns the updated document or None."""
    record = get_record_by_id(record_id)
    if record is None:
        return None

    updates = {}
    if data.full_name is not None:
        updates["full_name"] = data.full_name
    if data.email is not None:
        updates["email"] = data.email
    if data.phone is not None:
        updates["phone"] = data.phone
    if data.position is not None:
        updates["position"] = data.position
    if data.linkedin_url is not None:
        updates["linkedin_url"] = data.linkedin_url
    if data.cv_url is not None:
        updates["cv_url"] = data.cv_url
    if data.status is not None:
        if data.status not in VALID_STATUSES:
            raise ValueError(f"Status inválido: {data.status}")
        updates["status"] = data.status
    if data.stage is not None:
        if data.stage not in VALID_STAGES:
            raise ValueError(f"Stage inválido: {data.stage}")
        updates["stage"] = data.stage
    if data.experience_years is not None:
        updates["experience_years"] = data.experience_years
    updates["updated_at"] = now_iso()

    if updates:
        records_table.update(updates, lambda d: d.get("id") == record_id)

    return get_record_by_id(record_id)


def delete_record(record_id: str) -> bool:
    """Delete a record. Also deletes all its notes."""
    removed = records_table.remove(lambda d: d.get("id") == record_id)
    if removed:
        # Also delete linked notes
        from app.database import notes_table
        notes_table.remove(lambda d: d.get("record_id") == record_id)
    return len(removed) > 0


def increment_notes_count(record_id: str) -> None:
    """Increment the notes_count on a record by 1."""
    record = get_record_by_id(record_id)
    if record:
        records_table.update(
            {"notes_count": record.get("notes_count", 0) + 1},
            lambda d: d.get("id") == record_id,
        )


def decrement_notes_count(record_id: str) -> None:
    """Decrement the notes_count on a record by 1 (min 0)."""
    record = get_record_by_id(record_id)
    if record:
        new_count = max(0, record.get("notes_count", 0) - 1)
        records_table.update(
            {"notes_count": new_count},
            lambda d: d.get("id") == record_id,
        )