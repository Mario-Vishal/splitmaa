#!/usr/bin/env python3
"""Audit high-risk Splitmaa dataset semantics that schema validation cannot prove."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any


BLOCKING_RULES = {
    "invented_numeric_amount",
    "correction_not_applied",
    "excluded_person_included",
    "percentage_shape_invalid",
    "percentage_total_mismatch",
    "missing_amount_not_marked",
    "amount_missing_but_not_empty",
    "payer_name_conflict",
    "numeric_money_field",
}
PAYMENT_METHOD_TOKENS = {"upi", "card", "cash", "venmo", "zelle"}
NON_PAYER_TOKENS = {"who", "what", "when", "where", "why", "how"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+", type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--fail-on-blocking", action="store_true")
    args = parser.parse_args()

    findings: list[dict[str, Any]] = []
    total_rows = 0
    for path in args.paths:
        for line_number, item in read_jsonl(path):
            total_rows += 1
            findings.extend(audit_item(item, path, line_number))

    rule_counts = Counter(finding["rule"] for finding in findings)
    severity_counts = Counter(finding["severity"] for finding in findings)
    report = {
        "paths": [str(path) for path in args.paths],
        "rows": total_rows,
        "findings": len(findings),
        "blockingFindings": sum(1 for finding in findings if finding["severity"] == "blocking"),
        "ruleCounts": dict(rule_counts.most_common()),
        "severityCounts": dict(severity_counts.most_common()),
        "items": findings,
    }

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2, ensure_ascii=True), encoding="utf-8")

    print(json.dumps({key: value for key, value in report.items() if key != "items"}, indent=2, ensure_ascii=True))
    if args.report:
        print(f"report: {args.report}")

    if args.fail_on_blocking and report["blockingFindings"]:
        return 1
    return 0


def audit_item(item: dict[str, Any], path: Path, line_number: int) -> list[dict[str, Any]]:
    text = normalize_text(item.get("input", ""))
    intent = item.get("expected", {}).get("arguments", {})
    operations = intent.get("operations") if isinstance(intent.get("operations"), list) else []
    missing_fields = intent.get("missingFields") if isinstance(intent.get("missingFields"), list) else []
    findings: list[dict[str, Any]] = []

    for operation_index, operation in enumerate(operations, start=1):
        if not isinstance(operation, dict):
            continue
        args = operation.get("args") if isinstance(operation.get("args"), dict) else {}
        op_type = operation.get("operationType")
        if op_type == "add_expense":
            findings.extend(audit_expense(item, path, line_number, operation_index, text, args, missing_fields))

    findings.extend(audit_corrections(item, path, line_number, text, operations))
    findings.extend(audit_exclusions(item, path, line_number, text, operations))
    findings.extend(audit_payers(item, path, line_number, text, operations))
    return findings


def audit_expense(
    item: dict[str, Any],
    path: Path,
    line_number: int,
    operation_index: int,
    text: str,
    args: dict[str, Any],
    missing_fields: list[Any],
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    description = normalize_text(args.get("description", ""))
    amount_text = args.get("amountText")

    for bad_key in ["amount", "amountMinor", "amountCents", "amount_cents"]:
        if bad_key in args:
            findings.append(finding(path, line_number, item, "numeric_money_field", "blocking", f"operation {operation_index} uses {bad_key}"))

    if not isinstance(amount_text, str):
        findings.append(finding(path, line_number, item, "amount_text_not_string", "blocking", f"operation {operation_index} amountText is not a string"))
    elif not amount_text.strip() and "amount" not in joined_missing_fields(missing_fields):
        findings.append(finding(path, line_number, item, "missing_amount_not_marked", "blocking", f"operation {operation_index} has empty amountText but missingFields does not include amount"))
    elif amount_text.strip() and description and description in text:
        phrase = expense_phrase(text, description)
        if phrase and not contains_money(phrase) and "amount" in joined_missing_fields(missing_fields):
            findings.append(finding(path, line_number, item, "amount_missing_but_not_empty", "blocking", f"operation {operation_index} has amountText although source phrase has no visible amount"))

    split = args.get("split")
    if isinstance(split, dict) and split.get("splitType") == "percentage":
        findings.extend(audit_percentage_split(item, path, line_number, operation_index, split))
    return findings


def audit_percentage_split(item: dict[str, Any], path: Path, line_number: int, operation_index: int, split: dict[str, Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    allocations = split.get("allocations")
    if not isinstance(allocations, list) or not allocations:
        return [finding(path, line_number, item, "percentage_shape_invalid", "blocking", f"operation {operation_index} percentage split has no allocations")]

    percentages: list[float] = []
    for allocation_index, allocation in enumerate(allocations, start=1):
        if not isinstance(allocation, dict):
            findings.append(finding(path, line_number, item, "percentage_shape_invalid", "blocking", f"operation {operation_index} allocation {allocation_index} is not an object"))
            continue
        if "participant" not in allocation or "percentText" not in allocation:
            findings.append(finding(path, line_number, item, "percentage_shape_invalid", "blocking", f"operation {operation_index} allocation {allocation_index} missing participant or percentText"))
            continue
        if not isinstance(allocation["percentText"], str):
            findings.append(finding(path, line_number, item, "percentage_shape_invalid", "blocking", f"operation {operation_index} allocation {allocation_index} percentText is not a string"))
            continue
        parsed = parse_percent(allocation["percentText"])
        if parsed is None:
            findings.append(finding(path, line_number, item, "percentage_shape_invalid", "blocking", f"operation {operation_index} allocation {allocation_index} has unparsable percentText"))
        else:
            percentages.append(parsed)

    if percentages and abs(sum(percentages) - 100.0) > 0.01:
        findings.append(finding(path, line_number, item, "percentage_total_mismatch", "blocking", f"operation {operation_index} percentages sum to {sum(percentages):.2f}"))
    return findings


def audit_corrections(item: dict[str, Any], path: Path, line_number: int, text: str, operations: list[Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    pairs = re.findall(r"\b(?:sorry|actually|no wait|not)\s+([a-z][a-z ]{0,24}?)\s+([a-z][a-z ]{0,24}?)(?:\s|$)", text)
    descriptions = [normalize_text(op.get("args", {}).get("description", "")) for op in operations if isinstance(op, dict)]
    for wrong, corrected in pairs:
        wrong = first_word(wrong)
        corrected = first_word(corrected)
        if wrong and corrected and wrong != corrected and wrong in descriptions and corrected not in descriptions:
            findings.append(finding(path, line_number, item, "correction_not_applied", "blocking", f"correction appears to prefer {corrected!r}, but description kept {wrong!r}"))
    return findings


def audit_exclusions(item: dict[str, Any], path: Path, line_number: int, text: str, operations: list[Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for operation_index, operation in enumerate(operations, start=1):
        if not isinstance(operation, dict) or operation.get("operationType") != "add_expense":
            continue
        args = operation.get("args", {})
        phrase = expense_phrase_for_operation(text, operations, operation_index)
        excluded = excluded_names(phrase)
        if not excluded:
            continue
        split = args.get("split")
        participants = split_participant_names(split)
        for name in excluded & participants:
            findings.append(finding(path, line_number, item, "excluded_person_included", "blocking", f"operation {operation_index} includes excluded person {name!r}"))
    return findings


def audit_payers(item: dict[str, Any], path: Path, line_number: int, text: str, operations: list[Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for operation_index, operation in enumerate(operations, start=1):
        if not isinstance(operation, dict) or operation.get("operationType") != "add_expense":
            continue
        args = operation.get("args", {})
        paid_by = ref_name(args.get("paidBy"))
        phrase = expense_phrase_for_operation(text, operations, operation_index)
        source_payer = source_payer_from_phrase(phrase or text)
        if source_payer and paid_by and source_payer != paid_by:
            findings.append(finding(path, line_number, item, "payer_name_conflict", "blocking", f"operation {operation_index} payer is {paid_by!r}, source says {source_payer!r}"))
    return findings


def finding(path: Path, line_number: int, item: dict[str, Any], rule: str, severity: str, message: str) -> dict[str, Any]:
    return {
        "path": str(path),
        "lineNumber": line_number,
        "id": item.get("id"),
        "rule": rule,
        "severity": severity,
        "message": message,
    }


def read_jsonl(path: Path) -> list[tuple[int, dict[str, Any]]]:
    rows = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            clean = line.strip()
            if clean:
                rows.append((line_number, json.loads(clean)))
    return rows


def normalize_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value).lower()).strip()


def first_word(value: str) -> str:
    match = re.search(r"[a-z]+", value)
    return match.group(0) if match else ""


def contains_money(value: str) -> bool:
    return bool(re.search(r"(\$|rupees?|dollars?|inr|usd|\b\d+(?:\.\d{1,2})?\b)", value))


def expense_phrase(text: str, description: str) -> str:
    if not description or description not in text:
        return ""
    start = text.find(description)
    end_candidates = [idx for idx in [text.find(" add ", start + len(description)), text.find(" and add ", start + len(description))] if idx != -1]
    end = min(end_candidates) if end_candidates else len(text)
    return text[start:end]


def expense_phrase_for_operation(text: str, operations: list[Any], operation_index: int) -> str:
    positioned: list[tuple[int, int, str]] = []
    cursor = 0
    for index, operation in enumerate(operations, start=1):
        if not isinstance(operation, dict) or operation.get("operationType") != "add_expense":
            continue
        description = normalize_text(operation.get("args", {}).get("description", ""))
        if not description:
            continue
        start = text.find(description, cursor)
        if start == -1:
            start = text.find(description)
        if start == -1:
            continue
        positioned.append((index, start, description))
        cursor = start + len(description)

    current = next(((start, description) for index, start, description in positioned if index == operation_index), None)
    if current is None:
        return ""
    start, description = current
    next_starts = [next_start for index, next_start, _ in positioned if index > operation_index and next_start > start]
    end = min(next_starts) if next_starts else len(text)
    return text[start:end]


def excluded_names(value: str) -> set[str]:
    names = set(re.findall(r"\bexcept\s+([a-z]+)\b", value))
    names.update(re.findall(r"\bnot\s+([a-z]+)\b", value))
    names.discard("me")
    names.discard("taxi")
    return names


def joined_missing_fields(missing_fields: list[Any]) -> str:
    return " ".join(field.lower() for field in missing_fields if isinstance(field, str))


def parse_percent(value: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)", value)
    return float(match.group(1)) if match else None


def split_participant_names(split: Any) -> set[str]:
    if not isinstance(split, dict):
        return set()
    if split.get("splitType") == "equal":
        return {ref_name(ref) for ref in split.get("participants", []) if ref_name(ref)}
    if split.get("splitType") == "percentage":
        return {ref_name(allocation.get("participant")) for allocation in split.get("allocations", []) if isinstance(allocation, dict) and ref_name(allocation.get("participant"))}
    if split.get("splitType") == "full_amount":
        name = ref_name(split.get("participant"))
        return {name} if name else set()
    return set()


def ref_name(value: Any) -> str:
    if not isinstance(value, dict):
        return ""
    if value.get("refType") == "current_user":
        return "me"
    if value.get("refType") == "name":
        return normalize_text(value.get("value", ""))
    return ""


def normalized_ref_token(value: str) -> str:
    return "me" if value in {"me", "i"} else normalize_text(value)


def source_payer_from_phrase(value: str) -> str:
    paid_by_match = re.search(r"\bpaid by\s+([a-z]+|me|i)\b", value)
    if paid_by_match:
        token = normalized_ref_token(paid_by_match.group(1))
        if token not in PAYMENT_METHOD_TOKENS:
            return token

    paid_method_match = re.search(r"\b([a-z]+|me|i)\s+paid by\s+(?:upi|card|cash|venmo|zelle)\b", value)
    if paid_method_match:
        return normalized_ref_token(paid_method_match.group(1))

    paid_plain_match = re.search(r"\b([a-z]+|me|i)\s+paid\b", value)
    if paid_plain_match:
        token = normalized_ref_token(paid_plain_match.group(1))
        return "" if token in NON_PAYER_TOKENS else token
    return ""


if __name__ == "__main__":
    raise SystemExit(main())
