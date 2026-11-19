"""Nexova support ticket analysis (Phase 1).

Usage:
    python scripts/analyze.py scripts/incidents-nexova.csv

Validates every ticket, prints the summary and offers to export the metrics to
results.csv (one metric per row). The validation and metric logic lives in
packages/shared/incidents_analysis.py and is shared with the API.
Customer emails are never printed or exported.
"""

import argparse
import os
import sys
from pathlib import Path

# Make packages/shared importable when running from any directory.
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from packages.shared.incidents_analysis import (  # noqa: E402
    CsvFormatError,
    analyze_csv_file,
    to_csv,
)

WIDTH = 60
LABEL_WIDTH = 32


def line(label: str, value: object, branch: str = "├─", extra: str = "") -> str:
    dotted = f"{label} ".ljust(LABEL_WIDTH, ".")
    return f"  {branch} {dotted} {str(value).rjust(3)}{extra}"


def tree(items: list[tuple[str, object, str]]) -> list[str]:
    return [
        line(label, value, "└─" if index == len(items) - 1 else "├─", extra)
        for index, (label, value, extra) in enumerate(items)
    ]


def format_report(result: dict) -> str:
    out = [
        "=" * WIDTH,
        "  NEXOVA — SUPPORT TICKET ANALYSIS",
        f"  Source file: {result['source_file']}",
        "=" * WIDTH,
        "",
        f"{'TOTAL RECORDS IN FILE '.ljust(LABEL_WIDTH + 3, '.')} {result['total_records']}",
        *tree([
            ("Valid records", result["valid_records"], ""),
            ("Invalid / incomplete", result["invalid_records"], ""),
        ]),
        "",
        "INVALID RECORDS BREAKDOWN",
    ]
    broken = [(i["label"], i["count"], "") for i in result["invalid_breakdown"] if i["count"]]
    out += tree(broken) if broken else ["  (no invalid records)"]

    out += ["", "BREAKDOWN BY CATEGORY (valid records)"]
    out += tree([(i["category"], i["count"], f"  ({i['percentage']:.1f}%)") for i in result["by_category"]])

    out += ["", "BREAKDOWN BY STATUS (valid records)"]
    out += tree([(i["status"], i["count"], f"  ({i['percentage']:.1f}%)") for i in result["by_status"]])

    sat = result["satisfaction"]
    average = "n/a" if sat["average_score"] is None else f"{sat['average_score']:.2f} / 5.00"
    out += [
        "",
        "SATISFACTION INDEX (closed tickets)",
        f"  Scored tickets: {sat['scored_tickets']} of {sat['closed_tickets']}",
        f"  Average score: {average}",
    ]
    out += tree([(f"Score {d['score']} ({d['label']})", d["count"], "") for d in sat["distribution"]])
    out += ["", "=" * WIDTH]
    return "\n".join(out)


def ask_export() -> bool:
    try:
        answer = input("¿Deseas exportar los resultados a CSV? [s / n]: ")
    except EOFError:
        return False
    return answer.strip().lower() in {"s", "si", "sí", "y", "yes"}


def main() -> int:
    # Windows consoles default to a legacy code page that cannot print "├─".
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Analyze a Nexova support ticket CSV export.")
    parser.add_argument("csv_path", help="Path to the incidents CSV file")
    parser.add_argument(
        "--output",
        default="results.csv",
        help="Where to write the exported metrics (default: results.csv)",
    )
    args = parser.parse_args()

    if not os.path.isfile(args.csv_path):
        print(f"Error: no se encontró el fichero: {args.csv_path}", file=sys.stderr)
        return 1

    try:
        result = analyze_csv_file(args.csv_path, source_name=os.path.basename(args.csv_path))
    except CsvFormatError as exc:
        print(f"Error: formato de CSV incorrecto: {exc}", file=sys.stderr)
        return 1
    except UnicodeDecodeError:
        print("Error: el fichero no está codificado en UTF-8.", file=sys.stderr)
        return 1

    print(format_report(result))

    if ask_export():
        with open(args.output, "w", encoding="utf-8", newline="") as handle:
            handle.write(to_csv(result))
        print(f"Results exported to {os.path.abspath(args.output)}")
    else:
        print("Export skipped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
