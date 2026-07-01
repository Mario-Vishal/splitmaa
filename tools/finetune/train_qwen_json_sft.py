#!/usr/bin/env python3
"""Fine-tune Qwen2.5 for Splitmaa strict JSON intent extraction.

This is a thin preset wrapper over the shared chat SFT trainer. The canonical
dataset remains Splitmaa staging JSONL; convert it with
`convert_to_json_chat.py` before training.
"""

from __future__ import annotations

import sys

from train_functiongemma_sft import main


DEFAULTS = {
    "--base-model": "Qwen/Qwen2.5-0.5B-Instruct",
    "--train": "datasets/splitmaa_functiongemma/manual_v4/train.qwen.jsonl",
    "--validation": "datasets/splitmaa_functiongemma/manual_v4/validation.qwen.jsonl",
    "--output-dir": "outputs/qwen25-05b-splitmaa-manual-v4-lora",
    "--trainer-backend": "lean",
    "--training-mode": "lora",
    "--dtype": "float32",
    "--amp-dtype": "none",
    "--learning-rate": "0.0002",
    "--epochs": "3",
    "--batch-size": "1",
    "--eval-batch-size": "1",
    "--gradient-accumulation-steps": "8",
    "--max-length": "2048",
    "--lora-r": "16",
    "--lora-alpha": "32",
    "--lora-dropout": "0.05",
    "--eval-strategy": "epoch",
    "--progress-accuracy-batches": "4",
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
