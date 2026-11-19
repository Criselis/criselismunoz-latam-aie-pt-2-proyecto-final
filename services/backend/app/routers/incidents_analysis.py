"""
Incidents CSV analysis router (support tickets exported from the helpdesk).
Uses the same validation and metrics as scripts/analyze.py through
packages/shared/incidents_analysis.py. All routes are protected — requires valid JWT.
"""

import sys
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response

from app.auth import get_current_user

# ── Buscar dinámicamente la raíz del monorepo (funciona en host y dentro de Docker) ──
_repo_root = Path(__file__).resolve()
for _parent in range(10):  # límite de seguridad: 10 niveles
    if (_repo_root / "packages" / "shared").is_dir():
        break
    _repo_root = _repo_root.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from packages.shared.incidents_analysis import CsvFormatError, analyze_csv_text, to_csv  # noqa: E402

router = APIRouter(prefix="/incidents", tags=["incidents-analysis"])

# Last analysis kept in memory for the export endpoint (one per API process).
_last_analysis: dict[str, Any] | None = None


@router.post("/analyze")
async def analyze_incidents_file(
    file: UploadFile = File(..., description="Support tickets CSV exported from the helpdesk"),
    _current_user: dict = Depends(get_current_user),
):
    """Validate the uploaded CSV and return the summary metrics (protected)."""
    global _last_analysis

    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="El fichero debe ser un CSV (.csv).",
        )

    content = await file.read()
    if not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El fichero está vacío.",
        )
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El fichero no está codificado en UTF-8.",
        )

    try:
        result = analyze_csv_text(text, source_name=filename)
    except CsvFormatError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Formato de CSV incorrecto: {exc}",
        )

    if result["total_records"] == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El CSV tiene cabecera pero ningún registro.",
        )

    _last_analysis = result
    return result


@router.get("/results/export")
async def export_last_analysis(
    _current_user: dict = Depends(get_current_user),
):
    """Download the last analysis as CSV, one metric per row (protected)."""
    if _last_analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todavía no hay ningún análisis. Sube primero un CSV en POST /api/incidents/analyze.",
        )
    return Response(
        content=to_csv(_last_analysis),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="incidents-analysis-results.csv"'},
    )
