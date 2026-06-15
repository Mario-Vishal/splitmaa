#!/usr/bin/env python3
"""Validate Splitmaa canonical staging JSONL files."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ALLOWED_TOOLS = {
    "create_group",
    "create_contact",
    "add_expense",
    "settle_up",
    "query_balance",
    "query_financial_summary",
    "search_records",
    "open_record",
    "show_search_results",
    "clarification_required",
    "unsupported_request",
}

ALLOWED_CURRENCIES = {"USD", "INR"}
ALLOWED_ENTITY_TYPES = {"contact", "group", "expense", "settlement", "activity_log"}
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

                errors.extend(validate_item(item, path, line_number, seen_ids))

    if errors:
        for error in errors:
            print(error)
        print(f"invalid: {len(errors)} errors across {count} examples")
        return 1

    print(f"valid: {count} examples")
    return 0


def validate_item(item: Any, path: Path, line_number: int, seen_ids: set[str]) -> list[str]:
    errors: list[str] = []
    prefix = f"{path}:{line_number}"

    if not isinstance(item, dict):
        return [f"{prefix}: example must be an object"]

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

    name = expected.get("name")
    arguments = expected.get("arguments")
    if name not in ALLOWED_TOOLS:
        errors.append(f"{prefix}: unsupported tool {name!r}")
    if not isinstance(arguments, dict):
        errors.append(f"{prefix}: expected.arguments must be an object")
        return errors

    errors.extend(validate_tool_arguments(name, arguments, prefix))
    return errors


def validate_tool_arguments(name: str, arguments: dict[str, Any], prefix: str) -> list[str]:
    errors: list[str] = []

    for currency in find_currency_values(arguments):
        if currency not in ALLOWED_CURRENCIES:
            errors.append(f"{prefix}: unsupported currency {currency!r}")

    if name == "create_group":
        require_string(arguments, "groupName", prefix, errors)
        require_string_list(arguments, "memberNames", prefix, errors)
    elif name == "create_contact":
        require_string(arguments, "displayName", prefix, errors)
    elif name == "add_expense":
        require_string(arguments, "description", prefix, errors)
        require_positive_int(arguments, "amountCents", prefix, errors)
        require_string(arguments, "currency", prefix, errors)
        require_string(arguments, "paidByName", prefix, errors)
        require_string_list(arguments, "participantNames", prefix, errors)
        if arguments.get("splitType") != "equal":
            errors.append(f"{prefix}: add_expense.splitType must be equal")
    elif name == "settle_up":
        require_string(arguments, "fromName", prefix, errors)
        require_string(arguments, "toName", prefix, errors)
        require_positive_int(arguments, "amountCents", prefix, errors)
        require_string(arguments, "currency", prefix, errors)
    elif name == "query_financial_summary":
        if arguments.get("summaryType") not in ALLOWED_SUMMARY_TYPES:
            errors.append(f"{prefix}: invalid summaryType {arguments.get('summaryType')!r}")
    elif name == "search_records":
        require_string(arguments, "query", prefix, errors)
        entity_types = arguments.get("entityTypes")
        if not isinstance(entity_types, list) or not entity_types:
            errors.append(f"{prefix}: search_records.entityTypes must be a non-empty array")
        elif any(entity_type not in ALLOWED_ENTITY_TYPES for entity_type in entity_types):
            errors.append(f"{prefix}: invalid entityTypes {entity_types!r}")
    elif name == "open_record":
        if arguments.get("entityType") not in ALLOWED_ENTITY_TYPES:
            errors.append(f"{prefix}: invalid entityType {arguments.get('entityType')!r}")
    elif name == "show_search_results":
        require_string(arguments, "resultSetId", prefix, errors)
    elif name == "clarification_required":
        require_string(arguments, "question", prefix, errors)
        require_string_list(arguments, "missingFields", prefix, errors)
    elif name == "unsupported_request":
        require_string(arguments, "reason", prefix, errors)

    return errors


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


def require_string_list(arguments: dict[str, Any], key: str, prefix: str, errors: list[str]) -> None:
    value = arguments.get(key)
    if not isinstance(value, list) or not value or any(not isinstance(item, str) or not item.strip() for item in value):
        errors.append(f"{prefix}: {key} must be a non-empty string array")


def require_positive_int(arguments: dict[str, Any], key: str, prefix: str, errors: list[str]) -> None:
    value = arguments.get(key)
    if not isinstance(value, int) or value <= 0:
        errors.append(f"{prefix}: {key} must be a positive integer")


if __name__ == "__main__":
    raise SystemExit(main())
