#!/usr/bin/env python3
"""Capture model predictions for Splitmaa eval datasets.

The model command receives one prompt on stdin and must print the raw model
output to stdout. This keeps the capture tool independent from the concrete
desktop inference backend used for FunctionGemma.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATASET = Path("datasets/splitmaa_functiongemma/test.jsonl")
DEFAULT_OUTPUT = Path("reports/functiongemma_eval/predictions.jsonl")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--model-command", required=True, help="Command that reads prompt from stdin and prints model output.")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--timeout-seconds", type=int, default=120)
    parser.add_argument("--resume", action="store_true", help="Skip ids already present in the output file.")
    parser.add_argument("--sleep-ms", type=int, default=0)
    parser.add_argument("--include-prompt", action="store_true", help="Store prompts in the prediction file for debugging.")
    args = parser.parse_args()

    examples = read_jsonl(args.dataset)
    if args.limit:
        examples = examples[: args.limit]

    completed_ids = read_completed_ids(args.output) if args.resume else set()
    args.output.parent.mkdir(parents=True, exist_ok=True)

    mode = "a" if args.resume else "w"
    captured = 0
    failures = 0
    with args.output.open(mode, encoding="utf-8") as target:
        for index, example in enumerate(examples, start=1):
            if example["id"] in completed_ids:
                continue

            prompt = build_prompt(example["input"])
            started = time.time()
            completed = subprocess.run(
                args.model_command,
                input=prompt,
                text=True,
                shell=True,
                capture_output=True,
                cwd=ROOT,
                timeout=args.timeout_seconds,
            )
            latency_ms = round((time.time() - started) * 1000)
            row = {
                "id": example["id"],
                "input": example["input"],
                "rawOutput": completed.stdout.strip(),
                "stderr": completed.stderr.strip(),
                "exitCode": completed.returncode,
                "latencyMs": latency_ms,
            }
            if args.include_prompt:
                row["prompt"] = prompt

            target.write(json.dumps(row, ensure_ascii=True, separators=(",", ":")) + "\n")
            target.flush()
            captured += 1
            failures += int(completed.returncode != 0)

            print(
                json.dumps(
                    {
                        "index": index,
                        "id": example["id"],
                        "exitCode": completed.returncode,
                        "latencyMs": latency_ms,
                        "captured": captured,
                    },
                    ensure_ascii=True,
                )
            )

            if args.sleep_ms > 0:
                time.sleep(args.sleep_ms / 1000)

    print(
        json.dumps(
            {
                "dataset": str(args.dataset),
                "output": str(args.output),
                "examples": len(examples),
                "captured": captured,
                "skipped": len(completed_ids),
                "commandFailures": failures,
            },
            indent=2,
            ensure_ascii=True,
        )
    )
    return 1 if failures else 0


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


def read_completed_ids(path: Path) -> set[str]:
    if not path.exists():
        return set()
    return {row["id"] for row in read_jsonl(path) if isinstance(row.get("id"), str)}


def build_prompt(user_input: str) -> str:
    return "\n".join(
        [
            "You are Splitmaa's local FunctionGemma workflow intent extractor.",
            "Return exactly one JSON tool call and no extra text.",
            "Tool call shape:",
            '{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"...","confidence":0.0,"operations":[],"missingFields":[],"ambiguities":[]}}',
            "",
            "Supported workflowType values:",
            "entity_mutation, expense_mutation, multi_step, record_lookup, financial_answer, clarification_response, unsupported.",
            "",
            "Use names and natural references only. The app owns trusted IDs, database lookup, confirmation, and execution.",
            "Use amountText for money, not amountMinor or amountCents. Use USD or INR only.",
            "Use unsupported only for out-of-domain requests, not incomplete Splitmaa actions.",
            "",
            f"User: {user_input}",
        ]
    )


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.TimeoutExpired as exc:
        print(f"model command timed out after {exc.timeout} seconds", file=sys.stderr)
        raise SystemExit(1) from exc
