#!/usr/bin/env python3
"""Capture Splitmaa JSON-tool-call predictions from a generic chat model or PEFT adapter."""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tools" / "finetune"))

from tools.finetune.convert_to_json_chat import SYSTEM_PROMPT  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--base-model", required=True)
    parser.add_argument("--adapter", type=Path)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--max-new-tokens", type=int, default=768)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    parser.add_argument("--dtype", choices=["auto", "bfloat16", "float16", "float32"], default="float32")
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()

    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    examples = read_jsonl(args.dataset)
    if args.limit:
        examples = examples[: args.limit]

    completed_ids = read_completed_ids(args.output) if args.resume else set()
    args.output.parent.mkdir(parents=True, exist_ok=True)

    dtype_by_name = {
        "auto": "auto",
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
    }
    model_source = str(args.adapter) if args.adapter and not (args.adapter / "adapter_config.json").exists() else args.base_model
    tokenizer_source = str(args.adapter) if args.adapter and (args.adapter / "tokenizer.json").exists() else args.base_model
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_source)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    if args.adapter and (args.adapter / "adapter_config.json").exists():
        from peft import PeftModel

        model = AutoModelForCausalLM.from_pretrained(
            args.base_model,
            dtype=dtype_by_name[args.dtype],
            attn_implementation="eager",
        )
        model = PeftModel.from_pretrained(model, str(args.adapter))
    else:
        model = AutoModelForCausalLM.from_pretrained(
            model_source,
            dtype=dtype_by_name[args.dtype],
            attn_implementation="eager",
        )
    model.eval()

    if args.device == "cuda" or (args.device == "auto" and torch.cuda.is_available()):
        model.to("cuda")

    mode = "a" if args.resume else "w"
    captured = 0
    with args.output.open(mode, encoding="utf-8") as target:
        for index, example in enumerate(examples, start=1):
            if example["id"] in completed_ids:
                continue

            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": example["input"]},
            ]
            started = time.time()
            try:
                inputs = tokenizer.apply_chat_template(
                    messages,
                    add_generation_prompt=True,
                    tokenize=True,
                    return_dict=True,
                    return_tensors="pt",
                )
                inputs = {key: value.to(model.device) for key, value in inputs.items()}
                with torch.no_grad():
                    output = model.generate(
                        **inputs,
                        max_new_tokens=args.max_new_tokens,
                        do_sample=False,
                        pad_token_id=tokenizer.pad_token_id,
                        eos_token_id=tokenizer.eos_token_id,
                        suppress_tokens=[tokenizer.pad_token_id] if tokenizer.pad_token_id is not None else None,
                    )
                new_tokens = output[0][inputs["input_ids"].shape[-1] :]
                raw_output = tokenizer.decode(new_tokens, skip_special_tokens=True)
                error = None
                exit_code = 0
            except Exception as exc:  # noqa: BLE001
                raw_output = ""
                error = f"{type(exc).__name__}: {exc}"
                exit_code = 1

            latency_ms = round((time.time() - started) * 1000)
            row = {
                "id": example["id"],
                "input": example["input"],
                "rawOutput": raw_output.strip(),
                "stderr": error or "",
                "exitCode": exit_code,
                "latencyMs": latency_ms,
            }
            target.write(json.dumps(row, ensure_ascii=True, separators=(",", ":")) + "\n")
            target.flush()
            captured += 1
            print(json.dumps({"index": index, "id": example["id"], "latencyMs": latency_ms, "captured": captured}))

    print(json.dumps({"dataset": str(args.dataset), "output": str(args.output), "captured": captured}, indent=2))
    return 0


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


if __name__ == "__main__":
    raise SystemExit(main())
