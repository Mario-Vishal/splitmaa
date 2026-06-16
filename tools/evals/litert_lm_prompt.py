#!/usr/bin/env python3
"""Run one LiteRT-LM prompt from stdin and print the model response.

This is the concrete desktop model command used by capture_predictions.py.
It intentionally handles exactly one prompt per process so the capture layer can
record per-example latency and failures independently.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--backend", choices=["cpu", "gpu"], default="cpu")
    parser.add_argument("--cache-dir", type=Path, default=Path(".cache/litert-lm"))
    parser.add_argument("--system", default="You are Splitmaa's local FunctionGemma workflow intent extractor.")
    args = parser.parse_args()

    if not args.model.exists():
        print(f"model file does not exist: {args.model}", file=sys.stderr)
        return 2

    prompt = sys.stdin.read()
    if not prompt.strip():
        print("empty prompt on stdin", file=sys.stderr)
        return 2

    try:
        import litert_lm
    except Exception as exc:
        print(f"failed to import litert_lm: {exc}", file=sys.stderr)
        return 2

    try:
        litert_lm.set_min_log_severity(litert_lm.LogSeverity.ERROR)
        backend = litert_lm.Backend.GPU() if args.backend == "gpu" else litert_lm.Backend.CPU()
        messages = [litert_lm.Message.system(args.system)] if args.system else None
        args.cache_dir.mkdir(parents=True, exist_ok=True)
        with litert_lm.Engine(str(args.model), backend=backend, cache_dir=str(args.cache_dir)) as engine:
            with engine.create_conversation(messages=messages) as conversation:
                response = conversation.send_message(prompt)
        sys.stdout.write(extract_text(response))
        return 0
    except Exception as exc:
        print(f"litert_lm inference failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


def extract_text(response: object) -> str:
    if isinstance(response, dict):
        content = response.get("content")
        if isinstance(content, list):
            parts = []
            for item in content:
                if isinstance(item, dict) and isinstance(item.get("text"), str):
                    parts.append(item["text"])
            if parts:
                return "".join(parts)
        if isinstance(response.get("text"), str):
            return response["text"]
    return str(response)


if __name__ == "__main__":
    raise SystemExit(main())
