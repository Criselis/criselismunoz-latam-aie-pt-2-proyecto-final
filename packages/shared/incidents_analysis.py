"""Support ticket CSV analysis shared by scripts/analyze.py and the API.

Rules, fields and expected values come from the Nexova incidents-analysis
briefing (Roberto Díaz, Customer Support). Rows are processed one by one, so the
same code works for the 100-row sample and for large production exports.

Privacy: customer_email is only checked for validity. It is never stored,
returned, printed or exported.
"""

from __future__ import annotations

import csv
import io
import re
from typing import Any, Iterable, Mapping

EXPECTED_COLUMNS = (
    "ticket_id",
    "date",
    "client_company",
    "category",
    "description",
    "agent_id",
    "status",
    "customer_email",
    "satisfaction_score",
)

CATEGORIES = ("TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT")
STATUSES = ("OPEN", "CLOSED", "DISCARDED")
SCORE_LABELS = {
    1: "Very dissatisfied",
    2: "Dissatisfied",
    3: "Neutral",
    4: "Satisfied",
    5: "Very satisfied",
}

# Invalid-record rules, in the order of the briefing (plus the required fields
# and status, which the project brief also treats as invalid when missing/wrong).
RULES: dict[str, str] = {
    "missing_ticket_id": "Missing ticket_id",
    "missing_date": "Missing date",
    "missing_client_company": "Missing client_company",
    "invalid_category": "Invalid or missing category",
    "invalid_description": "Missing or too short description",
    "invalid_agent_id": "Invalid or missing agent_id",
    "invalid_status": "Invalid or missing status",
    "invalid_email": "Invalid or missing email",
    "closed_without_score": "Closed ticket, no score",
    "score_out_of_range": "Satisfaction score out of range",
}

_AGENT_ID = re.compile(r"^AGT-\d{2}$")
_MIN_DESCRIPTION = 5


class CsvFormatError(ValueError):
    """The file is empty, is not a CSV or does not have the expected columns."""


def validate_record(row: Mapping[str, Any]) -> list[str]:
    """Return the codes of every rule the row breaks (empty list = valid)."""
    value = {field: str(row.get(field) or "").strip() for field in EXPECTED_COLUMNS}
    errors: list[str] = []

    if not value["ticket_id"]:
        errors.append("missing_ticket_id")
    if not value["date"]:
        errors.append("missing_date")
    if not value["client_company"]:
        errors.append("missing_client_company")
    if value["category"] not in CATEGORIES:
        errors.append("invalid_category")
    if len(value["description"]) < _MIN_DESCRIPTION:
        errors.append("invalid_description")
    if not _AGENT_ID.fullmatch(value["agent_id"]):
        errors.append("invalid_agent_id")
    if value["status"] not in STATUSES:
        errors.append("invalid_status")
    if "@" not in value["customer_email"]:
        errors.append("invalid_email")

    score_text = value["satisfaction_score"]
    if score_text:
        score = _parse_score(score_text)
        if score is None:
            errors.append("score_out_of_range")
    elif value["status"] == "CLOSED":
        errors.append("closed_without_score")

    return errors


def analyze_rows(rows: Iterable[Mapping[str, Any]], source_name: str = "") -> dict[str, Any]:
    """Validate every row and compute the metrics over the valid ones."""
    total = valid = 0
    invalid_by_rule = {code: 0 for code in RULES}
    by_category = {category: 0 for category in CATEGORIES}
    by_status = {status: 0 for status in STATUSES}
    closed = 0
    score_counts = {score: 0 for score in SCORE_LABELS}

    for row in rows:
        total += 1
        errors = validate_record(row)
        if errors:
            for code in errors:
                invalid_by_rule[code] += 1
            continue

        valid += 1
        category = row["category"].strip()
        status = row["status"].strip()
        by_category[category] += 1
        by_status[status] += 1
        if status == "CLOSED":
            closed += 1
            score = _parse_score(str(row.get("satisfaction_score") or ""))
            if score is not None:
                score_counts[score] += 1

    scored = sum(score_counts.values())
    average = round(sum(s * c for s, c in score_counts.items()) / scored, 2) if scored else None

    return {
        "source_file": source_name,
        "total_records": total,
        "valid_records": valid,
        "invalid_records": total - valid,
        "invalid_breakdown": [
            {"rule": code, "label": label, "count": invalid_by_rule[code]}
            for code, label in RULES.items()
        ],
        "by_category": _with_percentages(by_category, valid, "category"),
        "by_status": _with_percentages(by_status, valid, "status"),
        "satisfaction": {
            "closed_tickets": closed,
            "scored_tickets": scored,
            "average_score": average,
            "distribution": [
                {"score": score, "label": label, "count": score_counts[score]}
                for score, label in SCORE_LABELS.items()
            ],
        },
    }


def analyze_csv_text(text: str, source_name: str = "") -> dict[str, Any]:
    """Analyze CSV content already loaded as text (used by the API upload)."""
    if not text.strip():
        raise CsvFormatError("el fichero está vacío")
    return analyze_rows(_reader(io.StringIO(text)), source_name)


def analyze_csv_file(path: str, source_name: str | None = None) -> dict[str, Any]:
    """Analyze a CSV on disk, streaming it row by row (used by the script)."""
    with open(path, encoding="utf-8-sig", newline="") as handle:
        first = handle.read(1)
        if not first:
            raise CsvFormatError("el fichero está vacío")
        handle.seek(0)
        return analyze_rows(_reader(handle), source_name or path)


def to_metric_rows(result: Mapping[str, Any]) -> list[tuple[str, str, str]]:
    """One metric per row: (section, metric, value). Percentages as their own rows."""
    rows: list[tuple[str, str, str]] = [
        ("summary", "total_records", str(result["total_records"])),
        ("summary", "valid_records", str(result["valid_records"])),
        ("summary", "invalid_records", str(result["invalid_records"])),
    ]
    rows += [("invalid_records", item["rule"], str(item["count"])) for item in result["invalid_breakdown"]]
    for section, key in (("category", "category"), ("status", "status")):
        for item in result[f"by_{key}"]:
            rows.append((section, item[key], str(item["count"])))
            rows.append((section, f"{item[key]}_pct", f"{item['percentage']:.1f}"))
    satisfaction = result["satisfaction"]
    average = satisfaction["average_score"]
    rows += [
        ("satisfaction", "closed_tickets", str(satisfaction["closed_tickets"])),
        ("satisfaction", "scored_tickets", str(satisfaction["scored_tickets"])),
        ("satisfaction", "average_score", "" if average is None else f"{average:.2f}"),
    ]
    rows += [
        ("satisfaction", f"score_{item['score']}", str(item["count"]))
        for item in satisfaction["distribution"]
    ]
    return rows


def to_csv(result: Mapping[str, Any]) -> str:
    """Serialize the metrics as CSV with header section,metric,value."""
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(("section", "metric", "value"))
    writer.writerows(to_metric_rows(result))
    return buffer.getvalue()


def _reader(handle: io.TextIOBase) -> csv.DictReader:
    reader = csv.DictReader(handle)
    header = [name.strip().lstrip("﻿") for name in (reader.fieldnames or [])]
    missing = [column for column in EXPECTED_COLUMNS if column not in header]
    if missing:
        raise CsvFormatError("faltan columnas obligatorias: " + ", ".join(missing))
    reader.fieldnames = header
    return reader


def _parse_score(text: str) -> int | None:
    """Integer 1–5, or None when the value is not a valid score."""
    try:
        score = int(text.strip())
    except ValueError:
        return None
    return score if score in SCORE_LABELS else None


def _with_percentages(counts: Mapping[str, int], total: int, key: str) -> list[dict[str, Any]]:
    return [
        {key: name, "count": count, "percentage": round(count * 100 / total, 1) if total else 0.0}
        for name, count in counts.items()
    ]
