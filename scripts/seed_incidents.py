#!/usr/bin/env python3
"""
Seed historical incidents from CSV into the database.
Reads data/raw/incidents_historical.csv and loads them as customer incidents.
Applies transformations, validates against schema, and ensures idempotence.

Usage:
    python scripts/seed_incidents.py [--csv-path PATH] [--dry-run]

Run from repository root:
    cd /path/to/repo
    source .venv/bin/activate
    python scripts/seed_incidents.py
"""

import sys
import csv
import hashlib
from pathlib import Path
from typing import Optional

# Adjust path to import from services/backend
repo_root = Path(__file__).parent.parent
backend_path = repo_root / "services" / "backend"
sys.path.insert(0, str(repo_root))
sys.path.insert(0, str(backend_path))

# Set working directory to backend so TinyDB path resolves correctly
import os
if not backend_path.is_dir():
    print(f"Error: Backend directory not found: {backend_path}", file=sys.stderr)
    sys.exit(1)
original_cwd = os.getcwd()
os.chdir(backend_path)

from app.schemas import (
    IncidentCreate,
    new_uuid,
)
from app.crud.incidents import get_all_incidents
from app.database import incidents_table
from packages.shared.incident_rules import (
    IncidentTransformationError,
    transform_historical_incident_row,
)
from pydantic import ValidationError


def generate_incident_hash(title: str, description: str) -> str:
    """Generate a unique hash for an incident to detect duplicates."""
    combined = f"{title}|{description}".encode()
    return hashlib.md5(combined).hexdigest()


def is_duplicate(title: str, description: str) -> bool:
    """
    Check if an incident with this title and description already exists.
    Compares normalized titles to avoid re-inserting identical records.
    """
    existing = get_all_incidents()
    for incident in existing:
        if (incident.get("title", "").lower() == title.lower() and
            incident.get("description", "").lower() == description.lower()):
            return True
    return False


def seed_from_csv(
    csv_path: Optional[str] = None,
    dry_run: bool = False,
) -> dict:
    """
    Load incidents from CSV.
    
    Args:
        csv_path: Path to CSV file. If None, uses default data/raw/incidents_historical.csv
        dry_run: If True, validate but don't insert
    
    Returns:
        dict with keys: 'loaded', 'skipped', 'failed', 'errors' (list of error dicts)
    """
    
    if csv_path is None:
        csv_path = repo_root / "data" / "raw" / "incidents_historical.csv"
    else:
        csv_path = Path(csv_path)
    
    if not csv_path.exists():
        print(f"Error: CSV file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)
    
    stats = {
        "loaded": 0,
        "skipped": 0,
        "failed": 0,
        "errors": [],
    }
    
    print(f"\n{'='*70}")
    print(f"SEED INCIDENTS FROM CSV")
    print(f"{'='*70}")
    print(f"CSV: {csv_path}")
    print(f"Dry-run: {dry_run}\n")
    
    # --- Open CSV with error handling for I/O issues ---
    try:
        csv_file = open(csv_path, "r", encoding="utf-8")
    except FileNotFoundError:
        print(f"Error: CSV file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)
    except PermissionError:
        print(f"Error: No permission to read: {csv_path}", file=sys.stderr)
        sys.exit(1)
    except UnicodeDecodeError:
        print(f"Error: Cannot decode file (expected UTF-8): {csv_path}", file=sys.stderr)
        sys.exit(1)
    
    REQUIRED_CSV_COLUMNS = {"estado", "categoría", "ubicación", "descripción", "fecha"}
    
    try:
        reader = csv.DictReader(csv_file)
        
        # Validate required columns before processing rows
        missing_cols = REQUIRED_CSV_COLUMNS - set(reader.fieldnames or [])
        if missing_cols:
            print(
                f"Error: CSV is missing required columns: {', '.join(sorted(missing_cols))}",
                file=sys.stderr,
            )
            sys.exit(1)
        
        for row_num, row in enumerate(reader, start=2):  # start=2 (skip header row 1)
            try:
                # Transform and validate
                transformed = transform_historical_incident_row(row)
                
                # Check for duplicates
                if is_duplicate(transformed["title"], transformed["description"]):
                    print(f"  ⊘ Row {row_num}: duplicado (título y descripción ya existen)")
                    stats["skipped"] += 1
                    continue
                
                # Validate against Pydantic schema
                incident_data = IncidentCreate(
                    title=transformed["title"],
                    description=transformed["description"],
                    category=transformed["category"],
                    origin=transformed["origin"],
                    branch=transformed["branch"],
                )
                
                # Insert (unless dry-run)
                if not dry_run:
                    # Insert directly into TinyDB with status from CSV
                    incident_doc = {
                        "id": new_uuid(),
                        "title": incident_data.title,
                        "description": incident_data.description,
                        "category": incident_data.category.value,
                        "status": transformed["status"],
                        "origin": incident_data.origin.value,
                        "branch": incident_data.branch.value,
                        "created_at": transformed["created_at"],
                        "updated_at": transformed["updated_at"],
                    }
                    incidents_table.insert(incident_doc)
                
                print(f"  ✓ Row {row_num}: '{incident_data.title[:50]}...' cargado")
                stats["loaded"] += 1
            
            except IncidentTransformationError as e:
                error_msg = str(e)
                print(f"  ✗ Row {row_num}: {error_msg}", file=sys.stderr)
                stats["errors"].append({"row": row_num, "reason": error_msg})
                stats["failed"] += 1
            
            except ValidationError as e:
                # Extract field names from validation error
                error_fields = [err["loc"][0] for err in e.errors()]
                error_msg = f"validación fallida en: {', '.join(str(f) for f in error_fields)}"
                print(f"  ✗ Row {row_num}: {error_msg}", file=sys.stderr)
                stats["errors"].append({"row": row_num, "reason": error_msg})
                stats["failed"] += 1
            
            except Exception as e:
                error_msg = f"error inesperado: {str(e)}"
                print(f"  ✗ Row {row_num}: {error_msg}", file=sys.stderr)
                stats["errors"].append({"row": row_num, "reason": error_msg})
                stats["failed"] += 1
    except csv.Error as e:
        print(f"Error parsing CSV: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        csv_file.close()
    print(f"\n{'-'*70}")
    print(f"RESUMEN")
    print(f"{'-'*70}")
    print(f"Cargadas:  {stats['loaded']}")
    print(f"Saltadas:  {stats['skipped']} (duplicados)")
    print(f"Fallidas:  {stats['failed']}")
    print(f"Total:     {stats['loaded'] + stats['skipped'] + stats['failed']}")
    
    if stats["errors"]:
        print(f"\n{'-'*70}")
        print(f"ERRORES (no se insertaron)")
        print(f"{'-'*70}")
        for error in stats["errors"]:
            print(f"  Fila {error['row']}: {error['reason']}")
    
    print(f"{'='*70}\n")
    
    return stats


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Seed historical incidents from CSV into the database."
    )
    parser.add_argument(
        "--csv-path",
        type=str,
        default=None,
        help="Path to CSV file (default: data/raw/incidents_historical.csv)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate but don't insert",
    )
    
    args = parser.parse_args()
    
    stats = seed_from_csv(csv_path=args.csv_path, dry_run=args.dry_run)
    
    # Exit with error code if any failed
    if stats["failed"] > 0:
        sys.exit(1)
    
    sys.exit(0)


if __name__ == "__main__":
    main()
