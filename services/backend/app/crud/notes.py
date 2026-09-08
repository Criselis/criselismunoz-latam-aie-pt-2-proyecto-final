"""
Notes CRUD operations on TinyDB.
Notes are linked to a candidate record via record_id.
"""

from typing import Optional

from app.database import notes_table
from app.schemas import NoteCreate, new_uuid, now_iso


def create_note(record_id: str, data: NoteCreate) -> dict:
    """Add a note to a record. Returns the note document."""
    note = {
        "id": new_uuid(),
        "record_id": record_id,
        "content": data.content,
        "created_at": now_iso(),
    }
    notes_table.insert(note)
    return note


def get_notes_for_record(record_id: str) -> list[dict]:
    """Return all notes for a record, ordered by creation date."""
    notes = notes_table.search(lambda d: d.get("record_id") == record_id)
    notes.sort(key=lambda n: n.get("created_at", ""))
    return notes


def get_note_by_id(note_id: str) -> Optional[dict]:
    """Find a note by its id."""
    results = notes_table.search(lambda d: d.get("id") == note_id)
    return results[0] if results else None


def delete_note(note_id: str) -> bool:
    """Delete a note. Returns True if deleted."""
    removed = notes_table.remove(lambda d: d.get("id") == note_id)
    return len(removed) > 0