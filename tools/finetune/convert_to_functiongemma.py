#!/usr/bin/env python3
"""Convert Splitmaa staging JSONL into FunctionGemma chat/tool-call JSONL."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


TOOLS = [
    {"type": "function", "function": {"name": "create_group", "description": "Create an expense group and ensure the named members exist as contacts."}},
    {"type": "function", "function": {"name": "create_contact", "description": "Create a contact profile for a person mentioned by the user."}},
    {"type": "function", "function": {"name": "add_expense", "description": "Record an equal-split expense paid by one person and shared by participants."}},
    {"type": "function", "function": {"name": "settle_up", "description": "Record a payment from one person to another to reduce an open balance."}},
    {"type": "function", "function": {"name": "query_balance", "description": "Read local balances without changing app data."}},
    {"type": "function", "function": {"name": "query_financial_summary", "description": "Read a grounded financial summary from local data."}},
    {"type": "function", "function": {"name": "search_records", "description": "Search local contacts, groups, expenses, settlements, or activity logs."}},
    {"type": "function", "function": {"name": "open_record", "description": "Navigate to a local record and optionally highlight it."}},
    {"type": "function", "function": {"name": "show_search_results", "description": "Show a previously created search result set."}},
    {"type": "function", "function": {"name": "clarification_required", "description": "Ask for missing information."}},
    {"type": "function", "function": {"name": "unsupported_request", "description": "Reject requests outside Splitmaa scope."}},
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with args.input.open("r", encoding="utf-8") as source, args.output.open("w", encoding="utf-8") as target:
        for line in source:
            clean = line.strip()
            if not clean:
                continue
            item = json.loads(clean)
            target.write(json.dumps(convert_item(item), ensure_ascii=True, separators=(",", ":")) + "\n")
            count += 1

    print(f"converted: {count} examples -> {args.output}")
    return 0


def convert_item(item: dict[str, Any]) -> dict[str, Any]:
    expected = item["expected"]
    return {
        "id": item["id"],
        "messages": [
            {
                "role": "developer",
                "content": "You are Splitmaa's local function-calling model. Return exactly one tool call.",
            },
            {
                "role": "user",
                "content": item["input"],
            },
            {
                "role": "assistant",
                "tool_calls": [
                    {
                        "type": "function",
                        "function": {
                            "name": expected["name"],
                            "arguments": expected["arguments"],
                        },
                    }
                ],
            },
        ],
        "tools": TOOLS,
    }


if __name__ == "__main__":
    raise SystemExit(main())
