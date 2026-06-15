#!/usr/bin/env python3
"""Convert Splitmaa staging JSONL into FunctionGemma chat/tool-call JSONL."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "extract_workflow_intent",
            "description": "Extract one strict Splitmaa workflow intent. The app owns trusted IDs, SQLite lookup, UI clarification, confirmation, money/date normalization, commits, navigation, and audit.",
        },
    },
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
                "content": "You are Splitmaa's local FunctionGemma workflow intent extractor. Return exactly one extract_workflow_intent tool call.",
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
