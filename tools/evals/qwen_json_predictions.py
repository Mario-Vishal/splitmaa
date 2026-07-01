#!/usr/bin/env python3
"""Capture Splitmaa predictions from the current Qwen JSON-intent candidate."""

from __future__ import annotations

import sys

from hf_json_predictions import main


DEFAULTS = {
    "--dataset": "datasets/splitmaa_functiongemma/manual_v4/test.jsonl",
    "--base-model": "Qwen/Qwen2.5-0.5B-Instruct",
    "--adapter": "outputs/qwen25-05b-splitmaa-manual-v4-lora",
    "--output": "reports/qwen_eval/manual_v4_predictions.jsonl",
    "--device": "cuda",
    "--dtype": "float32",
    "--max-new-tokens": "1024",
}


def with_defaults(argv: list[str]) -> list[str]:
    provided = {arg for arg in argv if arg.startswith("--")}
    injected: list[str] = []
    for key, value in DEFAULTS.items():
        if key not in provided:
            injected.extend([key, value])
    return [argv[0], *injected, *argv[1:]]


if __name__ == "__main__":
    sys.argv = with_defaults(sys.argv)
    raise SystemExit(main())
