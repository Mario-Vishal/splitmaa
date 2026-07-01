#!/usr/bin/env python3
"""Report token lengths for converted chat SFT JSONL files."""

from __future__ import annotations

import argparse
import json
import socket
from pathlib import Path
from typing import Any


def force_ipv4() -> None:
    original_getaddrinfo = socket.getaddrinfo

    def ipv4_getaddrinfo(*args, **kwargs):
        return [info for info in original_getaddrinfo(*args, **kwargs) if info[0] == socket.AF_INET]

    socket.getaddrinfo = ipv4_getaddrinfo  # type: ignore[assignment]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument("--model", default="Qwen/Qwen2.5-0.5B-Instruct")
    parser.add_argument("--max-length", type=int, default=2048)
    parser.add_argument("--no-force-ipv4", action="store_true")
    args = parser.parse_args()

    if not args.no_force_ipv4:
        force_ipv4()

    from transformers import AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(args.model)
    reports = [report_file(path, tokenizer, args.max_length) for path in args.files]
    print(json.dumps({"model": args.model, "maxLength": args.max_length, "files": reports}, indent=2, sort_keys=True))
    return 1 if any(report["truncatedExamples"] or report["zeroTrainableExamples"] for report in reports) else 0


def report_file(path: Path, tokenizer: Any, max_length: int) -> dict[str, Any]:
    report = {
        "path": str(path),
        "examples": 0,
        "maxInputTokens": 0,
        "maxPromptTokens": 0,
        "maxTrainableTokens": 0,
        "minTrainableTokens": None,
        "truncatedExamples": 0,
        "zeroTrainableExamples": 0,
    }
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            clean = line.strip()
            if not clean:
                continue
            row = json.loads(clean)
            messages = row["messages"]
            text = tokenizer.apply_chat_template(messages, tokenize=False)
            prompt_text = tokenizer.apply_chat_template(messages[:2], add_generation_prompt=True, tokenize=False)
            full_ids = tokenizer(text, truncation=False)["input_ids"]
            prompt_ids = tokenizer(prompt_text, truncation=False)["input_ids"]
            trainable_tokens = max(0, len(full_ids) - min(len(prompt_ids), len(full_ids)))

            report["examples"] += 1
            report["maxInputTokens"] = max(report["maxInputTokens"], len(full_ids))
            report["maxPromptTokens"] = max(report["maxPromptTokens"], len(prompt_ids))
            report["maxTrainableTokens"] = max(report["maxTrainableTokens"], trainable_tokens)
            current_min = report["minTrainableTokens"]
            report["minTrainableTokens"] = trainable_tokens if current_min is None else min(current_min, trainable_tokens)
            if len(full_ids) > max_length:
                report["truncatedExamples"] += 1
            if trainable_tokens == 0:
                report["zeroTrainableExamples"] += 1
                print(f"{path}:{line_number}: zero trainable tokens", flush=True)
    if report["minTrainableTokens"] is None:
        report["minTrainableTokens"] = 0
    return report


if __name__ == "__main__":
    raise SystemExit(main())
