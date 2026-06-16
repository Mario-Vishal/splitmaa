#!/usr/bin/env python3
"""Validate Splitmaa canonical staging JSONL files."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


TOOL_NAME = "extract_workflow_intent"
WORKFLOW_TYPES = {
    "entity_mutation",
    "expense_mutation",
    "multi_step",
    "record_lookup",
    "financial_answer",
    "clarification_response",
    "unsupported",
}
OPERATION_TYPES = {
    "create_contact",
    "create_group",
    "add_group_member",
    "remove_group_member",
    "add_expense",
    "edit_expense",
    "delete_expense",
    "settle_up",
    "change_split",
    "search_records",
    "open_record",
    "list_records",
    "show_previous",
    "get_record_metadata",
    "compute_balance",
    "compute_total",
    "compute_summary",
    "compute_date_window_total",
    "select_option",
    "provide_contact_details",
    "provide_missing_field",
    "cancel_pending_workflow",
}
ENTITY_OPERATIONS = {"create_contact", "create_group", "add_group_member", "remove_group_member"}
EXPENSE_OPERATIONS = {"add_expense", "edit_expense", "delete_expense", "settle_up", "change_split"}
LOOKUP_OPERATIONS = {"search_records", "open_record", "list_records", "show_previous", "get_record_metadata"}
FINANCIAL_OPERATIONS = {"compute_balance", "compute_total", "compute_summary", "compute_date_window_total"}
CLARIFICATION_OPERATIONS = {
    "select_option",
    "provide_contact_details",
    "provide_missing_field",
    "cancel_pending_workflow",
}
ALLOWED_CURRENCIES = {"USD", "INR"}
ALLOWED_ENTITY_TYPES = {"contact", "group", "expense", "settlement", "activity_log"}
ALLOWED_REFS = {"current_user", "name", "record_ref", "last_result", "active_pending_workflow"}
ALLOWED_SUMMARY_TYPES = {
    "total_owed_to_me",
    "total_i_owe",
    "net_balance",
    "total_spent",
    "person_balance",
    "group_total",
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+", type=Path)
    parser.add_argument(
        "--strict-routing",
        action="store_true",
        help="Also validate workflowType against operation families. Use for curated training/eval data.",
    )
    args = parser.parse_args()

    errors: list[str] = []
    seen_ids: set[str] = set()
    count = 0

    for path in args.paths:
        with path.open("r", encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, start=1):
                clean = line.strip()
                if not clean:
                    continue
                count += 1
                try:
                    item = json.loads(clean)
                except json.JSONDecodeError as exc:
                    errors.append(f"{path}:{line_number}: invalid JSON: {exc}")
                    continue

                errors.extend(validate_item(item, path, line_number, seen_ids, strict_routing=args.strict_routing))

    if errors:
        for error in errors:
            print(error)
        print(f"invalid: {len(errors)} errors across {count} examples")
        return 1

    print(f"valid: {count} examples")
    return 0


def validate_item(item: Any, path: Path, line_number: int, seen_ids: set[str], strict_routing: bool = False) -> list[str]:
    errors: list[str] = []
    prefix = f"{path}:{line_number}"

    if not isinstance(item, dict):
        return [f"{prefix}: example must be an object"]

    assert_exact_keys(item, {"id", "input", "expected"}, prefix, errors)
    example_id = item.get("id")
    user_input = item.get("input")
    expected = item.get("expected")

    if not isinstance(example_id, str) or not example_id.strip():
        errors.append(f"{prefix}: id must be a non-empty string")
    elif example_id in seen_ids:
        errors.append(f"{prefix}: duplicate id {example_id}")
    else:
        seen_ids.add(example_id)

    if not isinstance(user_input, str) or not user_input.strip():
        errors.append(f"{prefix}: input must be a non-empty string")

    if not isinstance(expected, dict):
        errors.append(f"{prefix}: expected must be an object")
        return errors

    assert_exact_keys(expected, {"name", "arguments"}, f"{prefix}.expected", errors)
    if expected.get("name") != TOOL_NAME:
        errors.append(f"{prefix}: expected.name must be {TOOL_NAME!r}")
    if not isinstance(expected.get("arguments"), dict):
        errors.append(f"{prefix}: expected.arguments must be an object")
        return errors

    errors.extend(validate_intent(expected["arguments"], prefix, strict_routing=strict_routing))
    return errors


def validate_intent(arguments: dict[str, Any], prefix: str, strict_routing: bool = False) -> list[str]:
    errors: list[str] = []
    allowed = {
        "schemaVersion",
        "workflowType",
        "workflowVersion",
        "modelVersion",
        "clientVersion",
        "confidence",
        "locale",
        "currencyHint",
        "pendingWorkflowRef",
        "pendingEventType",
        "operations",
        "missingFields",
        "ambiguities",
    }
    assert_subset_keys(arguments, allowed, f"{prefix}.arguments", errors)

    if arguments.get("schemaVersion") != "1.0":
        errors.append(f"{prefix}: schemaVersion must be '1.0'")
    if arguments.get("workflowType") not in WORKFLOW_TYPES:
        errors.append(f"{prefix}: invalid workflowType {arguments.get('workflowType')!r}")
    confidence = arguments.get("confidence")
    if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
        errors.append(f"{prefix}: confidence must be a number from 0 to 1")
    if "currencyHint" in arguments and arguments["currencyHint"] not in ALLOWED_CURRENCIES:
        errors.append(f"{prefix}: unsupported currencyHint {arguments['currencyHint']!r}")

    operations = arguments.get("operations")
    missing_fields = arguments.get("missingFields")
    ambiguities = arguments.get("ambiguities")
    if not isinstance(operations, list):
        errors.append(f"{prefix}: operations must be an array")
        operations = []
    if not isinstance(missing_fields, list) or any(not_nonempty_string(item) for item in missing_fields):
        errors.append(f"{prefix}: missingFields must be a string array")
    if not isinstance(ambiguities, list) or any(not_nonempty_string(item) for item in ambiguities):
        errors.append(f"{prefix}: ambiguities must be a string array")

    for index, operation in enumerate(operations, start=1):
        errors.extend(validate_operation(operation, f"{prefix}.operation[{index}]"))

    if arguments.get("workflowType") != "unsupported" and not operations and not missing_fields:
        errors.append(f"{prefix}: non-unsupported intents need operations or missingFields")
    if strict_routing:
        errors.extend(validate_workflow_routing(arguments, operations, f"{prefix}.arguments"))

    return errors


def validate_workflow_routing(arguments: dict[str, Any], operations: list[Any], prefix: str) -> list[str]:
    workflow_type = arguments.get("workflowType")
    operation_types = [op.get("operationType") for op in operations if isinstance(op, dict)]
    errors: list[str] = []

    def reject_unless(allowed: set[str], label: str) -> None:
        invalid = [op for op in operation_types if op not in allowed]
        if invalid:
            errors.append(f"{prefix}: {workflow_type} cannot contain {invalid}; expected only {label} operations")

    if workflow_type == "unsupported":
        if operation_types:
            errors.append(f"{prefix}: unsupported must not contain operations")
    elif workflow_type == "clarification_response":
        reject_unless(CLARIFICATION_OPERATIONS, "clarification")
        if not arguments.get("pendingWorkflowRef"):
            errors.append(f"{prefix}: clarification_response requires pendingWorkflowRef")
        if not arguments.get("pendingEventType"):
            errors.append(f"{prefix}: clarification_response requires pendingEventType")
    elif workflow_type == "entity_mutation":
        reject_unless(ENTITY_OPERATIONS, "entity")
        if len(operation_types) != 1:
            errors.append(f"{prefix}: entity_mutation should contain exactly one entity operation")
    elif workflow_type == "expense_mutation":
        reject_unless(EXPENSE_OPERATIONS, "expense")
        if len(operation_types) != 1:
            errors.append(f"{prefix}: expense_mutation should contain exactly one expense operation")
    elif workflow_type == "record_lookup":
        reject_unless(LOOKUP_OPERATIONS, "lookup")
        if len(operation_types) != 1:
            errors.append(f"{prefix}: record_lookup should contain exactly one lookup operation")
    elif workflow_type == "financial_answer":
        reject_unless(FINANCIAL_OPERATIONS, "financial")
        if len(operation_types) != 1:
            errors.append(f"{prefix}: financial_answer should contain exactly one financial operation")
    elif workflow_type == "multi_step":
        if len(operation_types) < 2:
            errors.append(f"{prefix}: multi_step requires at least two concrete operations")

    return errors


def validate_operation(operation: Any, prefix: str) -> list[str]:
    errors: list[str] = []
    if not isinstance(operation, dict):
        return [f"{prefix}: operation must be an object"]
    assert_exact_keys(operation, {"operationType", "args"}, prefix, errors)
    operation_type = operation.get("operationType")
    args = operation.get("args")
    if operation_type not in OPERATION_TYPES:
        errors.append(f"{prefix}: invalid operationType {operation_type!r}")
        return errors
    if not isinstance(args, dict):
        errors.append(f"{prefix}: args must be an object")
        return errors

    if operation_type == "create_contact":
        assert_subset_keys(args, {"displayName", "email", "phone"}, f"{prefix}.args", errors)
        require_string(args, "displayName", prefix, errors)
    elif operation_type == "create_group":
        assert_subset_keys(args, {"groupName", "members", "currency"}, f"{prefix}.args", errors)
        require_string(args, "groupName", prefix, errors)
        require_refs(args.get("members"), f"{prefix}.args.members", errors)
        validate_currency(args, "currency", prefix, errors, optional=True)
    elif operation_type == "add_expense":
        assert_subset_keys(args, {"description", "amountText", "currency", "groupRef", "paidBy", "split", "category", "paymentType", "date"}, f"{prefix}.args", errors)
        require_string(args, "description", prefix, errors)
        require_string(args, "amountText", prefix, errors)
        validate_currency(args, "currency", prefix, errors)
        validate_ref(args.get("paidBy"), f"{prefix}.args.paidBy", errors)
        validate_split(args.get("split"), f"{prefix}.args.split", errors)
        if "groupRef" in args:
            validate_ref(args["groupRef"], f"{prefix}.args.groupRef", errors)
    elif operation_type == "settle_up":
        assert_subset_keys(args, {"from", "to", "amountText", "currency", "paymentType", "date"}, f"{prefix}.args", errors)
        validate_ref(args.get("from"), f"{prefix}.args.from", errors)
        validate_ref(args.get("to"), f"{prefix}.args.to", errors)
        require_string(args, "amountText", prefix, errors)
        validate_currency(args, "currency", prefix, errors)
    elif operation_type in {"search_records"}:
        assert_subset_keys(args, {"query", "entityTypes", "personRef", "groupRef", "currency", "category", "dateRange", "limit"}, f"{prefix}.args", errors)
        require_string(args, "query", prefix, errors)
        validate_entity_types(args.get("entityTypes"), f"{prefix}.args.entityTypes", errors)
    elif operation_type == "open_record":
        assert_subset_keys(args, {"entityType", "recordRef", "searchQuery", "highlightRef"}, f"{prefix}.args", errors)
        if args.get("entityType") not in ALLOWED_ENTITY_TYPES:
            errors.append(f"{prefix}: invalid entityType {args.get('entityType')!r}")
    elif operation_type == "get_record_metadata":
        assert_subset_keys(args, {"entityType", "recordRef", "query"}, f"{prefix}.args", errors)
        if args.get("entityType") not in ALLOWED_ENTITY_TYPES:
            errors.append(f"{prefix}: invalid entityType {args.get('entityType')!r}")
    elif operation_type.startswith("compute_"):
        assert_subset_keys(args, {"metric", "personRef", "groupRef", "currency", "dateRange"}, f"{prefix}.args", errors)
        if "metric" in args and args["metric"] not in ALLOWED_SUMMARY_TYPES:
            errors.append(f"{prefix}: invalid metric {args['metric']!r}")
        validate_currency(args, "currency", prefix, errors, optional=True)

    for currency in find_currency_values(args):
        if currency not in ALLOWED_CURRENCIES:
            errors.append(f"{prefix}: unsupported currency {currency!r}")
    return errors


def validate_split(value: Any, prefix: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{prefix}: split must be an object")
        return
    split_type = value.get("splitType")
    if split_type == "equal":
        assert_exact_keys(value, {"splitType", "participants"}, prefix, errors)
        require_refs(value.get("participants"), f"{prefix}.participants", errors)
    elif split_type == "full_amount":
        assert_exact_keys(value, {"splitType", "participant"}, prefix, errors)
        validate_ref(value.get("participant"), f"{prefix}.participant", errors)
    else:
        errors.append(f"{prefix}: invalid splitType {split_type!r}")


def require_refs(value: Any, prefix: str, errors: list[str]) -> None:
    if not isinstance(value, list) or not value:
        errors.append(f"{prefix}: refs must be a non-empty array")
        return
    for index, item in enumerate(value, start=1):
        validate_ref(item, f"{prefix}[{index}]", errors)


def validate_ref(value: Any, prefix: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{prefix}: ref must be an object")
        return
    ref_type = value.get("refType")
    if ref_type not in ALLOWED_REFS:
        errors.append(f"{prefix}: invalid refType {ref_type!r}")
        return
    if ref_type == "name":
        assert_exact_keys(value, {"refType", "value"}, prefix, errors)
        require_string(value, "value", prefix, errors)
    elif ref_type == "record_ref":
        assert_exact_keys(value, {"refType", "entityType", "id"}, prefix, errors)
        if value.get("entityType") not in ALLOWED_ENTITY_TYPES:
            errors.append(f"{prefix}: invalid entityType {value.get('entityType')!r}")
        require_string(value, "id", prefix, errors)
    else:
        assert_exact_keys(value, {"refType"}, prefix, errors)


def validate_entity_types(value: Any, prefix: str, errors: list[str]) -> None:
    if not isinstance(value, list) or not value:
        errors.append(f"{prefix}: entityTypes must be a non-empty array")
        return
    for item in value:
        if item not in ALLOWED_ENTITY_TYPES:
            errors.append(f"{prefix}: invalid entityType {item!r}")


def validate_currency(args: dict[str, Any], key: str, prefix: str, errors: list[str], optional: bool = False) -> None:
    if key not in args and optional:
        return
    if args.get(key) not in ALLOWED_CURRENCIES:
        errors.append(f"{prefix}: {key} must be USD or INR")


def find_currency_values(value: Any) -> list[str]:
    if isinstance(value, dict):
        return [
            nested
            for key, child in value.items()
            for nested in ([child] if key == "currency" and isinstance(child, str) else find_currency_values(child))
        ]
    if isinstance(value, list):
        return [nested for child in value for nested in find_currency_values(child)]
    return []


def require_string(arguments: dict[str, Any], key: str, prefix: str, errors: list[str]) -> None:
    if not isinstance(arguments.get(key), str) or not arguments.get(key).strip():
        errors.append(f"{prefix}: {key} must be a non-empty string")


def not_nonempty_string(value: Any) -> bool:
    return not isinstance(value, str) or not value.strip()


def assert_exact_keys(value: dict[str, Any], allowed: set[str], prefix: str, errors: list[str]) -> None:
    assert_subset_keys(value, allowed, prefix, errors)
    missing = allowed - set(value)
    for key in sorted(missing):
        errors.append(f"{prefix}: missing required key {key!r}")


def assert_subset_keys(value: dict[str, Any], allowed: set[str], prefix: str, errors: list[str]) -> None:
    for key in sorted(set(value) - allowed):
        errors.append(f"{prefix}: unknown key {key!r}")


if __name__ == "__main__":
    raise SystemExit(main())
