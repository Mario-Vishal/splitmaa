#!/usr/bin/env python3
"""Split Splitmaa dataset rows by strict workflow routing validity."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "finetune"))

import validate_splitmaa_dataset as validator  # noqa: E402


DEFAULT_DATASET_DIR = Path("datasets/splitmaa_functiongemma")
DEFAULT_OUTPUT_DIR = DEFAULT_DATASET_DIR / "repair"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-dir", type=Path, default=DEFAULT_DATASET_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--splits", nargs="+", default=["train", "validation", "test"])
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)

    report: dict[str, Any] = {
        "datasetDir": str(args.dataset_dir),
        "outputDir": str(args.output_dir),
        "splits": {},
        "totals": {
            "rows": 0,
            "cleanRows": 0,
            "badRows": 0,
            "errors": 0,
            "errorTypes": {},
            "workflowCounts": {},
            "badWorkflowCounts": {},
        },
    }

    total_error_types: Counter[str] = Counter()
    total_workflows: Counter[str] = Counter()
    total_bad_workflows: Counter[str] = Counter()

    for split in args.splits:
        source = args.dataset_dir / f"{split}.jsonl"
        if not source.exists():
            raise SystemExit(f"missing split file: {source}")

        clean_path = args.output_dir / f"{split}.clean.jsonl"
        bad_path = args.output_dir / f"routing_bad_{split}.jsonl"
        split_report, error_types, workflow_counts, bad_workflow_counts = audit_split(source, clean_path, bad_path)

        report["splits"][split] = split_report
        report["totals"]["rows"] += split_report["rows"]
        report["totals"]["cleanRows"] += split_report["cleanRows"]
        report["totals"]["badRows"] += split_report["badRows"]
        report["totals"]["errors"] += split_report["errors"]
        total_error_types.update(error_types)
        total_workflows.update(workflow_counts)
        total_bad_workflows.update(bad_workflow_counts)

    report["totals"]["errorTypes"] = dict(total_error_types.most_common())
    report["totals"]["workflowCounts"] = dict(total_workflows.most_common())
    report["totals"]["badWorkflowCounts"] = dict(total_bad_workflows.most_common())

    report_path = args.output_dir / "routing_audit_report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=True), encoding="utf-8")

    print(json.dumps(report["totals"], indent=2, ensure_ascii=True))
    print(f"report: {report_path}")
    return 0


def audit_split(source: Path, clean_path: Path, bad_path: Path) -> tuple[dict[str, Any], Counter[str], Counter[str], Counter[str]]:
    rows = 0
    clean_rows = 0
    bad_rows = 0
    error_count = 0
    error_types: Counter[str] = Counter()
    workflow_counts: Counter[str] = Counter()
    bad_workflow_counts: Counter[str] = Counter()
    bad_operation_counts: Counter[str] = Counter()

    with source.open("r", encoding="utf-8") as src, clean_path.open("w", encoding="utf-8") as clean, bad_path.open("w", encoding="utf-8") as bad:
        for line_number, line in enumerate(src, start=1):
            clean_line = line.strip()
            if not clean_line:
                continue
            rows += 1
            item = json.loads(clean_line)
            intent = item.get("expected", {}).get("arguments", {})
            workflow_type = intent.get("workflowType", "<missing>")
            workflow_counts[workflow_type] += 1

            errors = validator.validate_item(item, source, line_number, set(), strict_routing=True)
            if errors:
                bad_rows += 1
                bad_workflow_counts[workflow_type] += 1
                error_count += len(errors)
                for error in errors:
                    error_types[normalize_error(error)] += 1
                for operation_type in operation_types(intent):
                    bad_operation_counts[operation_type] += 1
                annotated = dict(item)
                annotated["_audit"] = {
                    "source": str(source),
                    "lineNumber": line_number,
                    "errors": errors,
                    "workflowType": workflow_type,
                    "operationTypes": operation_types(intent),
                    "suggestedAction": suggest_action(intent, errors),
                }
                bad.write(json.dumps(annotated, ensure_ascii=True, separators=(",", ":")) + "\n")
            else:
                clean_rows += 1
                clean.write(clean_line + "\n")

    split_report = {
        "source": str(source),
        "cleanPath": str(clean_path),
        "badPath": str(bad_path),
        "rows": rows,
        "cleanRows": clean_rows,
        "badRows": bad_rows,
        "errors": error_count,
        "errorTypes": dict(error_types.most_common()),
        "workflowCounts": dict(workflow_counts.most_common()),
        "badWorkflowCounts": dict(bad_workflow_counts.most_common()),
        "badOperationCounts": dict(bad_operation_counts.most_common()),
    }
    return split_report, error_types, workflow_counts, bad_workflow_counts


def operation_types(intent: dict[str, Any]) -> list[str]:
    operations = intent.get("operations")
    if not isinstance(operations, list):
        return []
    return [operation.get("operationType", "<missing>") for operation in operations if isinstance(operation, dict)]


def normalize_error(error: str) -> str:
    marker = ".arguments: "
    if marker in error:
        return error.split(marker, 1)[1]
    return error


def suggest_action(intent: dict[str, Any], errors: list[str]) -> str:
    workflow_type = intent.get("workflowType")
    ops = operation_types(intent)
    op = ops[0] if len(ops) == 1 else None

    if workflow_type == "multi_step" and len(ops) < 2:
        if op in validator.ENTITY_OPERATIONS:
            return "relabel_to_entity_mutation"
        if op in validator.EXPENSE_OPERATIONS:
            return "relabel_to_expense_mutation"
        if op in validator.LOOKUP_OPERATIONS:
            return "relabel_to_record_lookup"
        if op in validator.FINANCIAL_OPERATIONS:
            return "relabel_to_financial_answer"
        if op in validator.CLARIFICATION_OPERATIONS:
            return "relabel_to_clarification_response"
        return "regenerate_or_discard_missing_operations"
    if workflow_type == "clarification_response" and any("pendingEventType" in error for error in errors):
        return "add_pending_event_type_or_regenerate"
    if workflow_type in {"entity_mutation", "expense_mutation", "record_lookup", "financial_answer"} and len(ops) != 1:
        return "split_or_relabel_workflow"
    return "manual_review"


if __name__ == "__main__":
    raise SystemExit(main())
