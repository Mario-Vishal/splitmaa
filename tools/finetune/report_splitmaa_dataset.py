#!/usr/bin/env python3
"""Report coverage and dry-eval subsets for Splitmaa staging JSONL datasets."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from statistics import mean
from typing import Any


DEFAULT_BASE = Path("datasets/splitmaa_functiongemma/manual_v4")
DEFAULT_TARGET = {"train": 1700, "validation": 350, "test": 350}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=Path, default=DEFAULT_BASE)
    parser.add_argument("--json-report", type=Path)
    parser.add_argument("--md-report", type=Path)
    args = parser.parse_args()

    json_report = args.json_report or args.base / "dataset_report.json"
    md_report = args.md_report or args.base / "dataset_report.md"

    rows = read_splits(args.base)
    report = build_report(rows)

    json_report.write_text(json.dumps(report, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    md_report.write_text(render_markdown(report), encoding="utf-8")

    print(json.dumps(report["summary"], indent=2, ensure_ascii=True))
    print(f"json: {json_report}")
    print(f"markdown: {md_report}")
    return 0


def read_splits(base: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for split in ["train", "validation", "test"]:
        path = base / f"{split}.jsonl"
        with path.open("r", encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, start=1):
                clean = line.strip()
                if not clean:
                    continue
                row = json.loads(clean)
                row["_split"] = split
                row["_path"] = str(path)
                row["_lineNumber"] = line_number
                rows.append(row)
    return rows


def build_report(rows: list[dict[str, Any]]) -> dict[str, Any]:
    by_split = Counter(row["_split"] for row in rows)
    workflow_counts = Counter(workflow(row) for row in rows)
    operation_counts: Counter[str] = Counter()
    split_type_counts: Counter[str] = Counter()
    currency_counts: Counter[str] = Counter()
    missing_field_counts: Counter[str] = Counter()
    examples_by_split_workflow: dict[str, Counter[str]] = {}
    word_counts = []
    operation_lengths = []

    for row in rows:
        split = row["_split"]
        examples_by_split_workflow.setdefault(split, Counter())[workflow(row)] += 1
        word_counts.append(len(words(row["input"])))
        operations = row["expected"]["arguments"].get("operations", [])
        operation_lengths.append(len(operations))

        for operation in operations:
            operation_counts[operation.get("operationType", "<missing>")] += 1
            for split_type in split_types(operation):
                split_type_counts[split_type] += 1
            for currency in currencies(operation):
                currency_counts[currency] += 1

        for field in row["expected"]["arguments"].get("missingFields", []):
            missing_field_counts[field] += 1

    subsets = build_subsets(rows)
    current_total = len(rows)
    target_total = sum(DEFAULT_TARGET.values())

    return {
        "summary": {
            "rows": current_total,
            "targetRows": target_total,
            "targetSplit": DEFAULT_TARGET,
            "remainingRows": target_total - current_total,
            "splitCounts": dict(sorted(by_split.items())),
            "workflowCounts": dict(sorted(workflow_counts.items())),
            "avgInputWords": round(mean(word_counts), 2) if word_counts else 0,
            "maxInputWords": max(word_counts) if word_counts else 0,
            "avgOperations": round(mean(operation_lengths), 2) if operation_lengths else 0,
            "maxOperations": max(operation_lengths) if operation_lengths else 0,
        },
        "splitWorkflowCounts": {split: dict(sorted(counter.items())) for split, counter in sorted(examples_by_split_workflow.items())},
        "operationCounts": dict(sorted(operation_counts.items())),
        "splitTypeCounts": dict(sorted(split_type_counts.items())),
        "currencyMentions": dict(sorted(currency_counts.items())),
        "missingFieldCounts": dict(sorted(missing_field_counts.items())),
        "styleHeuristics": style_report(rows),
        "evalSubsets": subsets,
    }


def workflow(row: dict[str, Any]) -> str:
    return row["expected"]["arguments"].get("workflowType", "<missing>")


def words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?", text)


def split_types(operation: dict[str, Any]) -> list[str]:
    args = operation.get("args", {})
    split = args.get("split")
    if isinstance(split, dict) and isinstance(split.get("splitType"), str):
        return [split["splitType"]]
    return []


def currencies(value: Any) -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            if key == "currency" and isinstance(item, str):
                found.append(item)
            else:
                found.extend(currencies(item))
    elif isinstance(value, list):
        for item in value:
            found.extend(currencies(item))
    return found


def build_subsets(rows: list[dict[str, Any]]) -> dict[str, Any]:
    subset_defs = {
        "long_multi_step": lambda row: workflow(row) == "multi_step"
        and (len(words(row["input"])) >= 18 or len(row["expected"]["arguments"].get("operations", [])) >= 3),
        "messy_mobile_tts": is_messy_mobile,
        "missing_fields": lambda row: bool(row["expected"]["arguments"].get("missingFields")),
        "clarification_response": lambda row: workflow(row) == "clarification_response",
        "financial_answer": lambda row: workflow(row) == "financial_answer",
        "lookup_navigation": lambda row: workflow(row) == "record_lookup",
        "unsupported_boundary": lambda row: workflow(row) == "unsupported",
        "percentage_splits": has_split_type("percentage"),
        "full_amount_splits": has_split_type("full_amount"),
        "settlements": has_operation("settle_up"),
        "destructive_or_edit": lambda row: any(
            operation.get("operationType") in {"edit_expense", "delete_expense", "change_split", "remove_group_member"}
            for operation in row["expected"]["arguments"].get("operations", [])
        ),
    }

    subsets: dict[str, Any] = {}
    for name, predicate in subset_defs.items():
        matched = [row for row in rows if predicate(row)]
        subsets[name] = {
            "count": len(matched),
            "bySplit": dict(sorted(Counter(row["_split"] for row in matched).items())),
            "sampleIds": [row["id"] for row in matched[:20]],
        }
    return subsets


def has_operation(operation_type: str):
    return lambda row: any(
        operation.get("operationType") == operation_type for operation in row["expected"]["arguments"].get("operations", [])
    )


def has_split_type(split_type: str):
    return lambda row: any(split_type in split_types(operation) for operation in row["expected"]["arguments"].get("operations", []))


def is_messy_mobile(row: dict[str, Any]) -> bool:
    text = row["input"]
    lower = text.lower()
    markers = [
        "sorry",
        "no wait",
        "actually",
        "forgot",
        "missing",
        "no price",
        "no amount",
        "amount missing",
        "price missing",
        "bucks",
        "rs",
        "rupees",
        "me and",
        "paid me",
        "split all",
        "owes full",
        "full amount",
    ]
    no_sentence_punctuation = not any(char in text for char in ".?!,;:")
    lower_case_start = text[:1].islower()
    return lower_case_start or no_sentence_punctuation or any(marker in lower for marker in markers)


def style_report(rows: list[dict[str, Any]]) -> dict[str, Any]:
    messy = [row for row in rows if is_messy_mobile(row)]
    clean = len(rows) - len(messy)
    return {
        "messyMobileLike": len(messy),
        "cleanLike": clean,
        "messyMobileLikeRate": round(len(messy) / len(rows), 4) if rows else 0,
    }


def render_markdown(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        "# Splitmaa Manual v4 Dataset Report",
        "",
        "## Summary",
        f"- Rows: `{summary['rows']}`",
        f"- Target rows before serious training: `{summary['targetRows']}`",
        f"- Target split: train `{summary['targetSplit']['train']}`, validation `{summary['targetSplit']['validation']}`, test `{summary['targetSplit']['test']}`",
        f"- Remaining rows to target: `{summary['remainingRows']}`",
        f"- Average input words: `{summary['avgInputWords']}`",
        f"- Max input words: `{summary['maxInputWords']}`",
        f"- Average operations: `{summary['avgOperations']}`",
        f"- Max operations: `{summary['maxOperations']}`",
        "",
        "## Split Counts",
    ]
    lines.extend(markdown_counter(summary["splitCounts"]))
    lines.extend(["", "## Workflow Counts"])
    lines.extend(markdown_counter(summary["workflowCounts"]))
    lines.extend(["", "## Operation Counts"])
    lines.extend(markdown_counter(report["operationCounts"]))
    lines.extend(["", "## Split Type Counts"])
    lines.extend(markdown_counter(report["splitTypeCounts"]))
    lines.extend(["", "## Missing Field Counts"])
    lines.extend(markdown_counter(report["missingFieldCounts"]))
    lines.extend(["", "## Style Heuristics"])
    lines.extend(markdown_counter(report["styleHeuristics"]))
    lines.extend(["", "## Eval Subsets"])
    for name, subset in sorted(report["evalSubsets"].items()):
        lines.append(f"- `{name}`: `{subset['count']}` rows, by split `{subset['bySplit']}`")
    lines.append("")
    return "\n".join(lines)


def markdown_counter(values: dict[str, Any]) -> list[str]:
    if not values:
        return ["- none"]
    return [f"- `{key}`: `{value}`" for key, value in values.items()]


if __name__ == "__main__":
    raise SystemExit(main())
