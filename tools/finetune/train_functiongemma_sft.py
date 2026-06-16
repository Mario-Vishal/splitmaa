#!/usr/bin/env python3
"""Fine-tune FunctionGemma with Hugging Face TRL SFTTrainer.

This follows Google's FunctionGemma fine-tuning guide:
https://ai.google.dev/gemma/docs/functiongemma/finetuning-with-functiongemma
"""

from __future__ import annotations

import argparse
import socket
from pathlib import Path


def force_ipv4() -> None:
    original_getaddrinfo = socket.getaddrinfo

    def ipv4_getaddrinfo(*args, **kwargs):
        return [info for info in original_getaddrinfo(*args, **kwargs) if info[0] == socket.AF_INET]

    socket.getaddrinfo = ipv4_getaddrinfo  # type: ignore[assignment]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", default="google/functiongemma-270m-it")
    parser.add_argument("--train", type=Path, default=Path("datasets/splitmaa_functiongemma/train.functiongemma.jsonl"))
    parser.add_argument("--validation", type=Path, default=Path("datasets/splitmaa_functiongemma/validation.functiongemma.jsonl"))
    parser.add_argument("--output-dir", default="outputs/functiongemma-splitmaa-sft")
    parser.add_argument("--learning-rate", type=float, default=5e-5)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--max-length", type=int, default=1024)
    parser.add_argument("--push-to-hub", action="store_true")
    parser.add_argument("--no-force-ipv4", action="store_true", help="Do not force IPv4 for Hugging Face downloads.")
    args = parser.parse_args()

    if not args.no_force_ipv4:
        force_ipv4()

    try:
        import torch
        from datasets import load_dataset
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from trl import SFTConfig, SFTTrainer
    except Exception as exc:
        raise SystemExit(
            "Missing fine-tune dependencies. Install in a GPU/Colab environment with:\n"
            "pip install torch tensorboard transformers datasets accelerate evaluate trl protobuf sentencepiece\n"
            f"Import error: {exc}"
        ) from exc

    dataset = load_dataset(
        "json",
        data_files={
            "train": str(args.train),
            "validation": str(args.validation),
        },
    )

    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        dtype="auto",
        device_map="auto",
        attn_implementation="eager",
    )
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)

    torch_dtype = model.dtype
    config = SFTConfig(
        output_dir=args.output_dir,
        max_length=args.max_length,
        packing=False,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_checkpointing=False,
        optim="adamw_torch_fused",
        logging_steps=1,
        eval_strategy="epoch",
        learning_rate=args.learning_rate,
        fp16=torch_dtype == torch.float16,
        bf16=torch_dtype == torch.bfloat16,
        lr_scheduler_type="constant",
        push_to_hub=args.push_to_hub,
        report_to="tensorboard",
    )

    trainer = SFTTrainer(
        model=model,
        args=config,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        processing_class=tokenizer,
    )
    trainer.train()
    trainer.save_model()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
