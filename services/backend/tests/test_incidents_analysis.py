"""
Tests for the incidents CSV analysis: shared logic (packages/shared), the
scripts/analyze.py CLI and the API endpoints.

Expected values come from the Nexova incidents-analysis briefing.
"""

import csv
import io
import subprocess
import sys
from pathlib import Path

import pytest

from packages.shared.incidents_analysis import (
    CsvFormatError,
    analyze_csv_file,
    analyze_csv_text,
    to_csv,
    validate_record,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
SAMPLE_CSV = REPO_ROOT / "scripts" / "incidents-nexova.csv"
HEADER = "ticket_id,date,client_company,category,description,agent_id,status,customer_email,satisfaction_score"
VALID_ROW = {
    "ticket_id": "NXV-000001",
    "date": "2024-01-18",
    "client_company": "FinServ Group",
    "category": "ACCESS",
    "description": "Role permissions not updated",
    "agent_id": "AGT-08",
    "status": "CLOSED",
    "customer_email": "someone@example.com",
    "satisfaction_score": "5",
}


def counts(items, key):
    return {item[key]: item["count"] for item in items}


# ── Shared logic: exact briefing values ───────────────────────────


def test_sample_matches_briefing_exactly():
    result = analyze_csv_file(str(SAMPLE_CSV))

    assert result["total_records"] == 100
    assert result["valid_records"] == 96
    assert result["invalid_records"] == 4
    assert {k: v for k, v in counts(result["invalid_breakdown"], "rule").items() if v} == {
        "missing_client_company": 1,
        "invalid_category": 1,
        "invalid_email": 1,
        "closed_without_score": 1,
    }
    assert counts(result["by_category"], "category") == {
        "TECHNICAL": 28, "BILLING": 18, "ACCESS": 21, "HR_QUERY": 17, "COMPLAINT": 12,
    }
    assert counts(result["by_status"], "status") == {"OPEN": 27, "CLOSED": 56, "DISCARDED": 13}
    satisfaction = result["satisfaction"]
    assert satisfaction["closed_tickets"] == 56
    assert satisfaction["scored_tickets"] == 56
    assert satisfaction["average_score"] == 3.84
    assert [d["count"] for d in satisfaction["distribution"]] == [2, 5, 10, 22, 17]


def test_percentages_match_briefing():
    result = analyze_csv_file(str(SAMPLE_CSV))
    pct = {i["category"]: i["percentage"] for i in result["by_category"]}
    assert pct == {"TECHNICAL": 29.2, "BILLING": 18.8, "ACCESS": 21.9, "HR_QUERY": 17.7, "COMPLAINT": 12.5}
    pct = {i["status"]: i["percentage"] for i in result["by_status"]}
    assert pct == {"OPEN": 28.1, "CLOSED": 58.3, "DISCARDED": 13.5}


@pytest.mark.parametrize(
    "changes, rule",
    [
        ({"client_company": ""}, "missing_client_company"),
        ({"category": "OTHER"}, "invalid_category"),
        ({"category": ""}, "invalid_category"),
        ({"description": "abc"}, "invalid_description"),
        ({"agent_id": "AGENT-8"}, "invalid_agent_id"),
        ({"status": "PENDING"}, "invalid_status"),
        ({"customer_email": "not-an-email"}, "invalid_email"),
        ({"customer_email": ""}, "invalid_email"),
        ({"satisfaction_score": ""}, "closed_without_score"),
        ({"satisfaction_score": "7"}, "score_out_of_range"),
        ({"satisfaction_score": "abc"}, "score_out_of_range"),
    ],
)
def test_each_rule_is_detected(changes, rule):
    assert rule in validate_record({**VALID_ROW, **changes})


def test_valid_rows_and_open_ticket_without_score():
    assert validate_record(VALID_ROW) == []
    assert validate_record({**VALID_ROW, "status": "OPEN", "satisfaction_score": ""}) == []


def test_export_has_one_metric_per_row_and_no_emails():
    exported = to_csv(analyze_csv_file(str(SAMPLE_CSV)))
    rows = list(csv.reader(io.StringIO(exported)))

    assert rows[0] == ["section", "metric", "value"]
    assert all(len(row) == 3 for row in rows)
    assert ["satisfaction", "average_score", "3.84"] in rows
    assert ["summary", "invalid_records", "4"] in rows
    assert "@" not in exported


def test_missing_columns_and_empty_file_are_rejected():
    with pytest.raises(CsvFormatError):
        analyze_csv_text("ticket_id,date\nNXV-1,2024-01-01\n")
    with pytest.raises(CsvFormatError):
        analyze_csv_text("   ")


# ── Script ────────────────────────────────────────────────────────


def test_script_prints_summary_and_exports(tmp_path):
    output = tmp_path / "results.csv"
    run = subprocess.run(
        [sys.executable, str(REPO_ROOT / "scripts" / "analyze.py"), str(SAMPLE_CSV), "--output", str(output)],
        input="s\n",
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )

    for expected in ("TOTAL RECORDS IN FILE", "100", "Average score: 3.84 / 5.00", "Closed ticket, no score"):
        assert expected in run.stdout
    assert "@" not in run.stdout
    assert output.read_text(encoding="utf-8").startswith("section,metric,value")


# ── API ───────────────────────────────────────────────────────────


def upload(client, headers, content: bytes, filename="incidents.csv"):
    return client.post(
        "/api/incidents/analyze",
        headers=headers,
        files={"file": (filename, content, "text/csv")},
    )


def test_analyze_endpoint_returns_briefing_summary(client, auth_headers):
    response = upload(client, auth_headers, SAMPLE_CSV.read_bytes(), "incidents-nexova.csv")

    assert response.status_code == 200
    body = response.json()
    assert body["valid_records"] == 96
    assert body["invalid_records"] == 4
    assert body["satisfaction"]["average_score"] == 3.84
    assert "@" not in response.text


def test_export_returns_last_analysis_as_csv(client, auth_headers):
    upload(client, auth_headers, SAMPLE_CSV.read_bytes())
    response = client.get("/api/incidents/results/export", headers=auth_headers)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]
    assert response.text.startswith("section,metric,value")
    assert "satisfaction,average_score,3.84" in response.text


def test_analyze_requires_auth(client):
    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("incidents.csv", SAMPLE_CSV.read_bytes(), "text/csv")},
    )
    assert response.status_code == 401


@pytest.mark.parametrize(
    "content, filename, expected_status",
    [
        (b"", "incidents.csv", 400),
        (b"just,some\ncolumns,here\n", "incidents.csv", 422),
        ((HEADER + "\n").encode(), "incidents.csv", 422),
        (b"\xff\xfe\x00bad", "incidents.csv", 400),
        (b"a,b,c", "incidents.xlsx", 415),
    ],
)
def test_analyze_input_errors(client, auth_headers, content, filename, expected_status):
    response = upload(client, auth_headers, content, filename)
    assert response.status_code == expected_status
    assert response.json()["detail"]
