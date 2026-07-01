#!/usr/bin/env python3
"""Convert Splitmaa staging JSONL into generic chat JSON-output SFT rows."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


SYSTEM_PROMPT = "\n".join(
    [
        "You are Splitmaa's local workflow intent extractor.",
        "Return only compact JSON. Do not explain.",
        "The first character must be { and the last character must be }.",
        "Do not output markdown, prose, code fences, a second JSON object, or analysis text.",
        "The JSON must be one tool call:",
        '{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"...","confidence":0.0,"operations":[],"missingFields":[],"ambiguities":[]}}',
        "Use names and natural references only. Never invent trusted database IDs.",
    ]
)


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
    return {
        "id": item["id"],
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": item["input"]},
            {"role": "assistant", "content": json.dumps(item["expected"], ensure_ascii=True, separators=(",", ":"))},
        ],
    }


if __name__ == "__main__":
    raise SystemExit(main())
