#!/usr/bin/env python3
"""Capture predictions from a local Hugging Face base model plus PEFT adapter."""

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
DEFAULT_DATASET = Path("datasets/splitmaa_functiongemma/test.jsonl")
DEFAULT_OUTPUT = Path("reports/functiongemma_eval/colab_lora_predictions.jsonl")
DEFAULT_ADAPTER = Path("outputs/functiongemma-splitmaa-lora-colab")
DEFAULT_BASE_MODEL = "google/functiongemma-270m-it"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--base-model", default=DEFAULT_BASE_MODEL)
    parser.add_argument("--adapter", type=Path, default=DEFAULT_ADAPTER)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--max-new-tokens", type=int, default=768)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    parser.add_argument("--dtype", choices=["auto", "bfloat16", "float16", "float32"], default="bfloat16")
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()

    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    from tools.finetune.convert_to_functiongemma import convert_item

    examples = read_jsonl(args.dataset)
    if args.limit:
        examples = examples[: args.limit]

    completed_ids = read_completed_ids(args.output) if args.resume else set()
    args.output.parent.mkdir(parents=True, exist_ok=True)

    base_model = resolve_local_snapshot(args.base_model)
    dtype_by_name = {
        "auto": "auto",
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
    }

    tokenizer = AutoTokenizer.from_pretrained(str(args.adapter.resolve()), local_files_only=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        local_files_only=True,
        dtype=dtype_by_name[args.dtype],
        attn_implementation="eager",
    )
    model = PeftModel.from_pretrained(model, str(args.adapter.resolve()), local_files_only=True)
    model.eval()

    if args.device == "cuda" or (args.device == "auto" and torch.cuda.is_available()):
        model.to("cuda")

    mode = "a" if args.resume else "w"
    captured = 0
    with args.output.open(mode, encoding="utf-8") as target:
        for index, example in enumerate(examples, start=1):
            if example["id"] in completed_ids:
                continue

            converted = convert_item(example)
            messages = converted["messages"][:2]
            tools = converted["tools"]
            started = time.time()
            try:
                inputs = tokenizer.apply_chat_template(
                    messages,
                    tools=tools,
                    add_generation_prompt=True,
                    return_dict=True,
                    return_tensors="pt",
                )
                inputs = {key: value.to(model.device) for key, value in inputs.items()}
                with torch.no_grad():
                    output = model.generate(
                        **inputs,
                        max_new_tokens=args.max_new_tokens,
                        do_sample=False,
                        pad_token_id=tokenizer.eos_token_id,
                    )
                new_tokens = output[0][inputs["input_ids"].shape[-1] :]
                raw_output = tokenizer.decode(new_tokens, skip_special_tokens=False)
                error = None
                exit_code = 0
            except Exception as exc:  # noqa: BLE001 - preserve eval failure detail
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


def resolve_local_snapshot(model_id: str) -> str:
    if "/" not in model_id:
        return model_id

    cache_name = f"models--{model_id.replace('/', '--')}"
    cache_root = Path.home() / ".cache" / "huggingface" / "hub" / cache_name
    ref_path = cache_root / "refs" / "main"
    if not ref_path.exists():
        return model_id

    revision = ref_path.read_text(encoding="utf-8").strip()
    snapshot_path = cache_root / "snapshots" / revision
    return str(snapshot_path) if snapshot_path.exists() else model_id


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
