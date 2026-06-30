#!/usr/bin/env python3
"""Build Splitmaa v3 dataset splits with Codex-authored high-risk examples."""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "finetune"))

import validate_splitmaa_dataset as validator  # noqa: E402


DATASET_DIR = Path("datasets/splitmaa_functiongemma")
V2_DIR = DATASET_DIR / "v2"
V3_DIR = DATASET_DIR / "v3"


NAMES = [
    "Alex",
    "David",
    "Priya",
    "Sai",
    "Deepak",
    "Arjun",
    "Nora",
    "Vikram",
    "Mira",
    "Tanya",
    "Luis",
    "Kavya",
    "Manish",
    "Amma",
    "Appa",
    "Rahul",
    "Zara",
    "Noor",
    "Ishan",
    "Meera",
    "Ritu",
    "Sam",
    "Lina",
    "Aaron",
    "Sasha",
    "Quinn",
]

GROUPS = [
    "weekend house",
    "office snacks",
    "kerala trip",
    "denver weekend",
    "goa apartment",
    "california flat",
    "movie night",
    "road food",
    "camping crew",
    "birthday dinner",
    "pune flat",
    "hyderabad stay",
]

ITEMS = [
    ("milk", "groceries"),
    ("chips", "food"),
    ("gas", "transport"),
    ("coffee", "food"),
    ("biryani", "food"),
    ("cab", "transport"),
    ("groceries", "groceries"),
    ("pizza", "food"),
    ("water bottles", "groceries"),
    ("parking", "transport"),
    ("cleaning supplies", "household"),
    ("snacks", "food"),
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=V3_DIR)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    base_train = read_jsonl(V2_DIR / "train.v2.jsonl")
    base_validation = read_jsonl(V2_DIR / "validation.v2.jsonl")
    base_test = read_jsonl(DATASET_DIR / "test.jsonl")

    train_generated = generate_rows("train", 980)
    validation_generated = generate_rows("validation", 180)
    test_generated = generate_rows("test", 180)

    splits = {
        "train": dedupe_rows(base_train + train_generated),
        "validation": dedupe_rows(base_validation + validation_generated),
        "test": dedupe_rows(base_test + test_generated),
    }

    report: dict[str, Any] = {
        "baseCounts": {
            "train": len(base_train),
            "validation": len(base_validation),
            "test": len(base_test),
        },
        "generatedCounts": {
            "train": len(train_generated),
            "validation": len(validation_generated),
            "test": len(test_generated),
        },
        "splits": {},
    }

    for split, rows in splits.items():
        output_path = args.output_dir / f"{split}.v3.jsonl"
        write_jsonl(output_path, rows)
        errors = validate_rows(rows, output_path)
        if errors:
            for error in errors[:80]:
                print(error)
            raise SystemExit(f"{split} v3 validation failed with {len(errors)} errors")
        report["splits"][split] = split_report(rows, output_path)

    report_path = args.output_dir / "generation_report.v3.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=True), encoding="utf-8")
    print(json.dumps(report["splits"], indent=2, ensure_ascii=True))
    print(f"report: {report_path}")
    return 0


def generate_rows(split: str, count: int) -> list[dict[str, Any]]:
    generators = [
        ("multi_step", generate_multi_step),
        ("expense_mutation", generate_expense_mutation),
        ("entity_mutation", generate_entity_mutation),
        ("record_lookup", generate_record_lookup),
        ("financial_answer", generate_financial_answer),
        ("clarification_response", generate_clarification_response),
        ("unsupported", generate_unsupported),
    ]
    weights = {
        "multi_step": 0.42,
        "expense_mutation": 0.17,
        "entity_mutation": 0.08,
        "record_lookup": 0.11,
        "financial_answer": 0.09,
        "clarification_response": 0.07,
        "unsupported": 0.06,
    }

    rows: list[dict[str, Any]] = []
    counters: Counter[str] = Counter()
    while len(rows) < count:
        kind = choose_weighted(weights)
        counters[kind] += 1
        generator = dict(generators)[kind]
        style = "messy" if len(rows) % 10 < 7 else "clean"
        row = generator(split, counters[kind], style)
        rows.append(row)
    return rows


def generate_multi_step(split: str, index: int, style: str) -> dict[str, Any]:
    group = pick(GROUPS, index)
    names = pick_members(index, 4 + (index % 3))
    currency = "INR" if index % 5 == 0 else "USD"
    amount1 = amount_text(24 + index, currency)
    amount2 = "" if index % 6 == 0 else amount_text(18 + index, currency)
    amount3 = amount_text(34 + index, currency)
    item1, category1 = ITEMS[index % len(ITEMS)]
    item2, category2 = ITEMS[(index + 3) % len(ITEMS)]
    wrong_item = "taxi"
    item3 = "gas"

    input_text = multi_step_input(style, group, names, item1, item2, wrong_item, item3, amount1, amount2, amount3, currency)
    missing = ["amount"] if not amount2 else []
    operations = [
        create_group(group, [current_user(), *refs(names)], currency),
        add_expense(group, item1, amount1, currency, ref(names[1]), equal_split([current_user(), *refs(names)]), category1),
        add_expense(
            group,
            item2,
            amount2,
            currency,
            current_user(),
            percentage_split([(ref(names[0]), "50%"), (current_user(), "25%"), (ref(names[1]), "25%")]),
            category2,
        ),
        add_expense(group, item3, amount3, currency, current_user(), equal_split([ref(names[0]), ref(names[2])]), "transport"),
    ]
    return example(f"v3_{split}_multi_{index:04d}", input_text, "multi_step", operations, missing, currency_hint=currency, confidence=0.88 if style == "messy" else 0.92)


def multi_step_input(
    style: str,
    group: str,
    names: list[str],
    item1: str,
    item2: str,
    wrong_item: str,
    item3: str,
    amount1: str,
    amount2: str,
    amount3: str,
    currency: str,
) -> str:
    if style == "clean":
        missing_phrase = f"{item2} split {names[0]} 50 percent and me and {names[1]} split the rest" if not amount2 else f"{item2} {amount2} paid by me split {names[0]} 50 percent and me and {names[1]} split the rest"
        return (
            f"Create {group} with me, {', '.join(names)}. Add {item1} {amount1} paid by {names[1]} split everyone, "
            f"add {missing_phrase}, and add {wrong_item} sorry {item3} {amount3} paid by me split only {names[0]} and {names[2]}."
        )
    missing_phrase = f"add {item2} uh between {names[0]} {names[1]} and me {names[0]} gets 50 percent me and {names[1]} split rest" if not amount2 else f"add {item2} {amount2} paid by me {names[0]} gets 50 percent me and {names[1]} split rest"
    return (
        f"make {group} with me {' '.join(names)} and add {item1} {amount1} paid by {names[1]} split all "
        f"then {missing_phrase} and add {wrong_item} sorry not {wrong_item} {item3} {amount3} paid by me split only {names[0]} and {names[2]}"
    )


def generate_expense_mutation(split: str, index: int, style: str) -> dict[str, Any]:
    currency = "INR" if index % 4 == 0 else "USD"
    group = pick(GROUPS, index + 2)
    names = pick_members(index + 3, 3)
    item, category = ITEMS[(index + 2) % len(ITEMS)]
    amount = "" if index % 8 == 0 else amount_text(12 + index, currency)
    payer = ref(names[0]) if index % 3 == 0 else current_user()

    if index % 5 == 0:
        split_value = percentage_split([(ref(names[0]), "50%"), (current_user(), "25%"), (ref(names[1]), "25%")])
        split_words = f"{names[0]} gets 50 percent me and {names[1]} split the rest"
    elif index % 5 == 1:
        split_value = full_amount_split(ref(names[1]))
        split_words = f"{names[1]} owes fully"
    else:
        split_value = equal_split([current_user(), ref(names[0]), ref(names[1])])
        split_words = f"split me {names[0]} and {names[1]}"

    if style == "clean":
        input_text = f"Add {item} {amount or ''} in {group} paid by {'me' if payer == current_user() else names[0]} {split_words}.".strip()
    else:
        input_text = f"add {item} {amount or 'uh'} {group} paid by {'me' if payer == current_user() else names[0]} {split_words}".strip()

    missing = ["amount"] if not amount else []
    operation = add_expense(group, item, amount, currency, payer, split_value, category)
    return example(f"v3_{split}_expense_{index:04d}", input_text, "expense_mutation", [operation], missing, currency_hint=currency, confidence=0.82 if missing else 0.9)


def generate_entity_mutation(split: str, index: int, style: str) -> dict[str, Any]:
    group = pick(GROUPS, index + 4)
    names = pick_members(index + 5, 3)
    currency = "INR" if index % 5 == 0 else "USD"
    if index % 3 == 0:
        input_text = f"creat grp {group} add me {' '.join(names)}" if style == "messy" else f"Create a group called {group} with me, {', '.join(names)}."
        operations = [create_group(group, [current_user(), *refs(names)], currency)]
        return example(f"v3_{split}_entity_{index:04d}", input_text, "entity_mutation", operations, [], currency_hint=currency)
    if index % 3 == 1:
        input_text = f"add {names[0]} to {group}" if style == "messy" else f"Add {names[0]} to the {group} group."
        operations = [{"operationType": "add_group_member", "args": {"groupRef": ref(group), "member": ref(names[0])}}]
        return example(f"v3_{split}_entity_{index:04d}", input_text, "entity_mutation", operations, [])
    input_text = "add him to the group" if style == "messy" else "Add the new person to the group."
    return example(f"v3_{split}_entity_{index:04d}", input_text, "entity_mutation", [], ["memberName", "groupName"], confidence=0.52)


def generate_record_lookup(split: str, index: int, style: str) -> dict[str, Any]:
    group = pick(GROUPS, index + 6)
    name = pick(NAMES, index + 7)
    item, _ = ITEMS[(index + 4) % len(ITEMS)]
    if index % 4 == 0:
        input_text = f"find {item} with {name} last month" if style == "messy" else f"Search for the {item} expense with {name} last month."
        op = {"operationType": "search_records", "args": {"query": item, "entityTypes": ["expense"], "personRef": ref(name), "dateRange": {"dateText": "last month", "dateIntent": "previous_calendar_month"}, "limit": 10}}
    elif index % 4 == 1:
        input_text = f"open {group}" if style == "messy" else f"Open the {group} group."
        op = {"operationType": "open_record", "args": {"entityType": "group", "searchQuery": group}}
    elif index % 4 == 2:
        input_text = "show those again" if style == "messy" else "Show those search results again."
        op = {"operationType": "show_previous", "args": {"target": {"refType": "last_result"}}}
    else:
        input_text = f"when was {item} in {group} added" if style == "messy" else f"When was the {item} expense in {group} added?"
        op = {"operationType": "get_record_metadata", "args": {"entityType": "expense", "query": f"{item} {group}"}}
    return example(f"v3_{split}_lookup_{index:04d}", input_text, "record_lookup", [op], [], confidence=0.86)


def generate_financial_answer(split: str, index: int, style: str) -> dict[str, Any]:
    currency = "INR" if index % 3 == 0 else "USD"
    group = pick(GROUPS, index + 8)
    name = pick(NAMES, index + 9)
    metrics = ["net_balance", "total_i_owe", "total_owed_to_me", "person_balance", "group_total", "total_spent"]
    metric = metrics[index % len(metrics)]
    if metric == "group_total":
        input_text = f"how much spent in {group}" if style == "messy" else f"How much did we spend in {group}?"
        args = {"metric": metric, "groupRef": ref(group), "currency": currency}
    elif metric == "person_balance":
        input_text = f"how much do i owe {name} last month" if style == "messy" else f"How much did I owe {name} last month?"
        args = {"metric": metric, "personRef": ref(name), "currency": currency, "dateRange": {"dateText": "last month", "dateIntent": "previous_calendar_month"}}
    else:
        input_text = f"tell {metric.replace('_', ' ')} in {currency.lower()}" if style == "messy" else f"Tell me my {metric.replace('_', ' ')} in {currency}."
        args = {"metric": metric, "currency": currency}
    op = {"operationType": "compute_summary", "args": args}
    return example(f"v3_{split}_financial_{index:04d}", input_text, "financial_answer", [op], [], currency_hint=currency, confidence=0.86)


def generate_clarification_response(split: str, index: int, style: str) -> dict[str, Any]:
    if index % 4 == 0:
        input_text = "second one" if style == "messy" else "Choose the second one."
        op = {"operationType": "select_option", "args": {"selection": {"selectionType": "ordinal", "ordinal": 2, "rawText": input_text}}}
        event = "contact_picker"
    elif index % 4 == 1:
        input_text = "amount was 47 dollars" if style == "messy" else "The amount was 47 dollars."
        op = {"operationType": "provide_missing_field", "args": {"field": "amount", "rawText": "47 dollars", "amountText": "47 dollars", "currencyHint": "USD"}}
        event = "missing_field_form"
    elif index % 4 == 2:
        input_text = "use rahul reddy" if style == "messy" else "Use Rahul Reddy from the list."
        op = {"operationType": "select_option", "args": {"selection": {"selectionType": "label", "label": "Rahul Reddy", "rawText": input_text}}}
        event = "contact_picker"
    else:
        input_text = "cancel this" if style == "messy" else "Cancel this pending workflow."
        op = {"operationType": "cancel_pending_workflow", "args": {"rawText": input_text}}
        event = "pending_workflow"
    return example(
        f"v3_{split}_clarification_{index:04d}",
        input_text,
        "clarification_response",
        [op],
        [],
        confidence=0.9,
        extra={"pendingWorkflowRef": {"refType": "active_pending_workflow"}, "pendingEventType": event},
    )


def generate_unsupported(split: str, index: int, style: str) -> dict[str, Any]:
    requests = [
        "order biryani online and use my card",
        "book a flight to goa",
        "write a poem about rent",
        "send a upi payment to rahul",
        "connect my bank account",
        "translate this receipt to spanish",
        "delete my gmail messages",
    ]
    input_text = pick(requests, index)
    if style == "clean":
        input_text = input_text.capitalize() + "."
    return example(
        f"v3_{split}_unsupported_{index:04d}",
        input_text,
        "unsupported",
        [],
        [],
        confidence=0.92,
        ambiguities=["This request is outside Splitmaa's local expense workflow."],
    )


def example(
    row_id: str,
    input_text: str,
    workflow_type: str,
    operations: list[dict[str, Any]],
    missing_fields: list[str],
    *,
    currency_hint: str | None = None,
    confidence: float = 0.88,
    ambiguities: list[str] | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    arguments: dict[str, Any] = {
        "schemaVersion": "1.0",
        "workflowType": workflow_type,
        "confidence": confidence,
        "operations": operations,
        "missingFields": missing_fields,
        "ambiguities": ambiguities or [],
    }
    if currency_hint:
        arguments["currencyHint"] = currency_hint
    if extra:
        arguments.update(extra)
    return {"id": row_id, "input": input_text, "expected": {"name": "extract_workflow_intent", "arguments": arguments}}


def create_group(group: str, members: list[dict[str, Any]], currency: str) -> dict[str, Any]:
    return {"operationType": "create_group", "args": {"groupName": group, "members": members, "currency": currency}}


def add_expense(
    group: str,
    description: str,
    amount: str,
    currency: str,
    paid_by: dict[str, Any],
    split: dict[str, Any],
    category: str,
) -> dict[str, Any]:
    return {
        "operationType": "add_expense",
        "args": {
            "groupRef": ref(group),
            "description": description,
            "amountText": amount,
            "currency": currency,
            "paidBy": paid_by,
            "split": split,
            "category": category,
            "paymentType": "unknown",
        },
    }


def current_user() -> dict[str, str]:
    return {"refType": "current_user"}


def ref(name: str) -> dict[str, str]:
    return {"refType": "name", "value": name}


def refs(names: list[str]) -> list[dict[str, str]]:
    return [ref(name) for name in names]


def equal_split(participants: list[dict[str, Any]]) -> dict[str, Any]:
    return {"splitType": "equal", "participants": participants}


def full_amount_split(participant: dict[str, Any]) -> dict[str, Any]:
    return {"splitType": "full_amount", "participant": participant}


def percentage_split(allocations: list[tuple[dict[str, Any], str]]) -> dict[str, Any]:
    return {
        "splitType": "percentage",
        "allocations": [{"participant": participant, "percentText": percent_text} for participant, percent_text in allocations],
    }


def amount_text(base: int, currency: str) -> str:
    if currency == "INR":
        return f"{base * 90} rupees"
    return f"{base} dollars" if base % 2 else f"${base}"


def pick(values: list[str] | list[tuple[str, str]], index: int):
    return values[index % len(values)]


def pick_members(index: int, count: int) -> list[str]:
    return [NAMES[(index + offset) % len(NAMES)] for offset in range(count)]


def choose_weighted(weights: dict[str, float]) -> str:
    threshold = random.random()
    cursor = 0.0
    for key, weight in weights.items():
        cursor += weight
        if threshold <= cursor:
            return key
    return next(reversed(weights))


def dedupe_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen_ids: set[str] = set()
    seen_inputs: set[str] = set()
    result: list[dict[str, Any]] = []
    for row in rows:
        normalized = normalize_input(row["input"])
        if row["id"] in seen_ids or normalized in seen_inputs:
            continue
        seen_ids.add(row["id"])
        seen_inputs.add(normalized)
        result.append(row)
    return result


def normalize_input(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9$]+", " ", value.lower())).strip()


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            clean = line.strip()
            if clean:
                rows.append(json.loads(clean))
    return rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=True, separators=(",", ":")) + "\n")


def validate_rows(rows: list[dict[str, Any]], path: Path) -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()
    for line_number, row in enumerate(rows, start=1):
        errors.extend(validator.validate_item(row, path, line_number, seen, strict_routing=True))
    return errors


def split_report(rows: list[dict[str, Any]], path: Path) -> dict[str, Any]:
    workflows = Counter(row["expected"]["arguments"]["workflowType"] for row in rows)
    operations = Counter(
        operation.get("operationType")
        for row in rows
        for operation in row["expected"]["arguments"].get("operations", [])
        if isinstance(operation, dict)
    )
    style = Counter("messy" if looks_messy(row["input"]) else "clean" for row in rows)
    operation_counts = Counter(len(row["expected"]["arguments"].get("operations", [])) for row in rows)
    splits = Counter(
        operation.get("args", {}).get("split", {}).get("splitType")
        for row in rows
        for operation in row["expected"]["arguments"].get("operations", [])
        if isinstance(operation, dict) and operation.get("operationType") == "add_expense"
    )
    return {
        "path": str(path),
        "rows": len(rows),
        "workflowCounts": dict(workflows.most_common()),
        "operationCounts": dict(operations.most_common()),
        "inputStyleCounts": dict(style.most_common()),
        "operationCountDistribution": dict(sorted(operation_counts.items())),
        "splitTypeCounts": dict(splits.most_common()),
        "maxInputWords": max(len(row["input"].split()) for row in rows),
    }


def looks_messy(value: str) -> bool:
    lowered = value.lower()
    return not any(char in value for char in ".,?") or any(token in lowered for token in [" uh ", " sorry ", "creat ", " grp ", " no wait "])


if __name__ == "__main__":
    raise SystemExit(main())
