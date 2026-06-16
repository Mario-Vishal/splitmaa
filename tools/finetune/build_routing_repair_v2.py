#!/usr/bin/env python3
"""Build corrected v2 train/validation splits from routing repair artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "finetune"))

import validate_splitmaa_dataset as validator  # noqa: E402


DEFAULT_REPAIR_DIR = Path("datasets/splitmaa_functiongemma/repair")
DEFAULT_OUTPUT_DIR = Path("datasets/splitmaa_functiongemma/v2")

RELABEL_TARGETS = {
    "relabel_to_entity_mutation": "entity_mutation",
    "relabel_to_expense_mutation": "expense_mutation",
    "relabel_to_financial_answer": "financial_answer",
    "relabel_to_clarification_response": "clarification_response",
    "relabel_to_record_lookup": "record_lookup",
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repair-dir", type=Path, default=DEFAULT_REPAIR_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--splits", nargs="+", default=["train", "validation"])
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    report: dict[str, Any] = {"repairDir": str(args.repair_dir), "outputDir": str(args.output_dir), "splits": {}}

    total_counts: Counter[str] = Counter()
    for split in args.splits:
        split_report = build_split(split, args.repair_dir, args.output_dir)
        report["splits"][split] = split_report
        total_counts.update(split_report["counts"])

    report["totals"] = dict(total_counts)
    report_path = args.output_dir / "routing_repair_v2_report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=True), encoding="utf-8")
    print(json.dumps(report["totals"], indent=2, ensure_ascii=True))
    print(f"report: {report_path}")
    return 0


def build_split(split: str, repair_dir: Path, output_dir: Path) -> dict[str, Any]:
    clean_path = repair_dir / f"{split}.clean.jsonl"
    bad_path = repair_dir / f"routing_bad_{split}.jsonl"
    output_path = output_dir / f"{split}.v2.jsonl"
    manual_path = output_dir / f"{split}.manual_review.jsonl"

    counts: Counter[str] = Counter()
    workflow_counts: Counter[str] = Counter()
    manual_actions: Counter[str] = Counter()

    with output_path.open("w", encoding="utf-8") as output:
        for item in read_jsonl(clean_path):
            write_item(output, item)
            counts["kept_clean"] += 1
            workflow_counts[item["expected"]["arguments"]["workflowType"]] += 1

        with manual_path.open("w", encoding="utf-8") as manual:
            for item in read_jsonl(bad_path):
                fixed = try_fix(item)
                if fixed is None:
                    write_item(manual, item)
                    counts["manual_review"] += 1
                    manual_actions[item["_audit"]["suggestedAction"]] += 1
                    continue

                errors = validator.validate_item(fixed, output_path, 1, set(), strict_routing=True)
                if errors:
                    annotated = dict(item)
                    annotated["_repairAttemptErrors"] = errors
                    write_item(manual, annotated)
                    counts["manual_review"] += 1
                    manual_actions[item["_audit"]["suggestedAction"]] += 1
                    continue

                write_item(output, fixed)
                counts["auto_fixed"] += 1
                counts[item["_audit"]["suggestedAction"]] += 1
                workflow_counts[fixed["expected"]["arguments"]["workflowType"]] += 1

    return {
        "outputPath": str(output_path),
        "manualReviewPath": str(manual_path),
        "counts": dict(counts),
        "workflowCounts": dict(workflow_counts.most_common()),
        "manualActions": dict(manual_actions.most_common()),
    }


def try_fix(item: dict[str, Any]) -> dict[str, Any] | None:
    action = item["_audit"]["suggestedAction"]
    fixed = strip_audit(item)
    intent = fixed["expected"]["arguments"]
    operations = intent.get("operations") if isinstance(intent.get("operations"), list) else []

    if action in RELABEL_TARGETS:
        intent["workflowType"] = RELABEL_TARGETS[action]
        if intent["workflowType"] == "clarification_response":
            ensure_clarification_context(intent, operations)
        return fixed

    if action == "add_pending_event_type_or_regenerate":
        if intent.get("workflowType") != "clarification_response":
            return None
        if not all(op.get("operationType") in validator.CLARIFICATION_OPERATIONS for op in operations if isinstance(op, dict)):
            return None
        ensure_clarification_context(intent, operations)
        return fixed

    if action == "split_or_relabel_workflow":
        if len(operations) >= 2:
            intent["workflowType"] = "multi_step"
            return fixed
        return None

    return None


def ensure_clarification_context(intent: dict[str, Any], operations: list[Any]) -> None:
    intent.setdefault("pendingWorkflowRef", {"refType": "active_pending_workflow"})
    intent.setdefault("pendingEventType", infer_pending_event_type(operations))


def infer_pending_event_type(operations: list[Any]) -> str:
    operation_type = next((op.get("operationType") for op in operations if isinstance(op, dict)), None)
    if operation_type == "select_option":
        return "option_picker"
    if operation_type == "provide_contact_details":
        return "contact_details_form"
    if operation_type == "provide_missing_field":
        return "missing_field_form"
    if operation_type == "cancel_pending_workflow":
        return "pending_workflow"
    return "pending_workflow"


def strip_audit(item: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in item.items() if key != "_audit"}


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            clean = line.strip()
            if not clean:
                continue
            try:
                rows.append(json.loads(clean))
            except json.JSONDecodeError as exc:
                raise SystemExit(f"{path}:{line_number}: invalid JSON: {exc}") from exc
    return rows


def write_item(handle, item: dict[str, Any]) -> None:
    handle.write(json.dumps(item, ensure_ascii=True, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    raise SystemExit(main())
