#!/usr/bin/env python3
"""Fine-tune FunctionGemma with Hugging Face TRL SFTTrainer.

This follows Google's FunctionGemma fine-tuning guide:
https://ai.google.dev/gemma/docs/functiongemma/finetuning-with-functiongemma
"""

from __future__ import annotations

import argparse
import json
import os
import socket
from pathlib import Path


def force_ipv4() -> None:
    original_getaddrinfo = socket.getaddrinfo

    def ipv4_getaddrinfo(*args, **kwargs):
        return [info for info in original_getaddrinfo(*args, **kwargs) if info[0] == socket.AF_INET]

    socket.getaddrinfo = ipv4_getaddrinfo  # type: ignore[assignment]


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
    if snapshot_path.exists():
        return str(snapshot_path)
    return model_id


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", default="google/functiongemma-270m-it")
    parser.add_argument("--train", type=Path, default=Path("datasets/splitmaa_functiongemma/train.functiongemma.jsonl"))
    parser.add_argument("--validation", type=Path, default=Path("datasets/splitmaa_functiongemma/validation.functiongemma.jsonl"))
    parser.add_argument("--output-dir", default="outputs/functiongemma-splitmaa-sft")
    parser.add_argument("--learning-rate", type=float, default=5e-5)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--eval-batch-size", type=int, default=1)
    parser.add_argument("--gradient-accumulation-steps", type=int, default=4)
    parser.add_argument("--max-length", type=int, default=1024)
    parser.add_argument("--max-steps", type=int, default=-1)
    parser.add_argument("--trainer-backend", choices=["lean", "trl"], default="lean")
    parser.add_argument("--training-mode", choices=["lora", "full"], default="lora")
    parser.add_argument("--dtype", choices=["auto", "bfloat16", "float16", "float32"], default="bfloat16")
    parser.add_argument("--lora-r", type=int, default=8)
    parser.add_argument("--lora-alpha", type=int, default=16)
    parser.add_argument("--lora-dropout", type=float, default=0.05)
    parser.add_argument("--lora-include-mlp", action="store_true")
    parser.add_argument("--local-files-only", action="store_true", help="Load the base model only from the local Hugging Face cache.")
    parser.add_argument("--gradient-checkpointing", action="store_true")
    parser.add_argument("--eval-strategy", choices=["no", "epoch"], default="epoch")
    parser.add_argument("--push-to-hub", action="store_true")
    parser.add_argument("--no-force-ipv4", action="store_true", help="Do not force IPv4 for Hugging Face downloads.")
    args = parser.parse_args()

    if not args.no_force_ipv4:
        force_ipv4()
    if args.local_files_only:
        os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, DataCollatorForLanguageModeling, Trainer, TrainingArguments
        from trl import SFTConfig, SFTTrainer
    except Exception as exc:
        raise SystemExit(
            "Missing fine-tune dependencies. Install in a GPU/Colab environment with:\n"
            "pip install torch tensorboard transformers datasets accelerate evaluate trl protobuf sentencepiece\n"
            f"Import error: {exc}"
        ) from exc

    dtype_by_name = {
        "auto": "auto",
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
    }
    base_model = resolve_local_snapshot(args.base_model) if args.local_files_only else args.base_model

    class JsonlChatDataset(torch.utils.data.Dataset):
        def __init__(self, path: Path, tokenizer, max_length: int):
            self.examples = []
            with path.open("r", encoding="utf-8") as file:
                for line in file:
                    if not line.strip():
                        continue
                    row = json.loads(line)
                    text = tokenizer.apply_chat_template(
                        row["messages"],
                        tools=row.get("tools"),
                        tokenize=False,
                    )
                    self.examples.append(tokenizer(text, truncation=True, max_length=max_length))

        def __len__(self) -> int:
            return len(self.examples)

        def __getitem__(self, index: int):
            return self.examples[index]

    class MemorySafeSFTTrainer(SFTTrainer):
        """SFTTrainer without TRL's per-token entropy metric pass.

        TRL 1.6 computes entropy/accuracy from full vocabulary logits inside
        `compute_loss`. On Gemma's large vocabulary this can spike VRAM on
        12 GB Windows GPUs. The base Trainer loss is enough for our SFT run.
        """

        def compute_loss(self, model, inputs, return_outputs=False, num_items_in_batch=None):
            return Trainer.compute_loss(
                self,
                model,
                inputs,
                return_outputs=return_outputs,
                num_items_in_batch=num_items_in_batch,
            )

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        dtype=dtype_by_name[args.dtype],
        attn_implementation="eager",
        local_files_only=args.local_files_only,
    )
    model.config.use_cache = False
    tokenizer = AutoTokenizer.from_pretrained(base_model, local_files_only=args.local_files_only)

    peft_config = None
    if args.training_mode == "lora":
        try:
            from peft import LoraConfig, get_peft_model
        except Exception as exc:
            raise SystemExit(
                "LoRA training requires PEFT. Install it with:\n"
                ".venv-train\\Scripts\\python.exe -m pip install peft\n"
                f"Import error: {exc}"
            ) from exc

        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"]
        if args.lora_include_mlp:
            target_modules += ["gate_proj", "up_proj", "down_proj"]

        peft_config = LoraConfig(
            r=args.lora_r,
            lora_alpha=args.lora_alpha,
            lora_dropout=args.lora_dropout,
            bias="none",
            task_type="CAUSAL_LM",
            target_modules=target_modules,
        )
        if args.trainer_backend == "lean":
            model = get_peft_model(model, peft_config)

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    if args.trainer_backend == "lean":
        train_dataset = JsonlChatDataset(args.train, tokenizer, args.max_length)
        eval_dataset = JsonlChatDataset(args.validation, tokenizer, args.max_length)
    else:
        from datasets import load_dataset

        dataset = load_dataset(
            "json",
            data_files={
                "train": str(args.train),
                "validation": str(args.validation),
            },
        )
        train_dataset = dataset["train"]
        eval_dataset = dataset["validation"]

    torch_dtype = model.dtype
    common_config = dict(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        max_steps=args.max_steps,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.eval_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        gradient_checkpointing=args.gradient_checkpointing,
        gradient_checkpointing_kwargs={"use_reentrant": False},
        optim="adamw_torch_fused",
        logging_steps=1,
        eval_strategy=args.eval_strategy,
        eval_accumulation_steps=1,
        learning_rate=args.learning_rate,
        fp16=torch_dtype == torch.float16,
        bf16=torch_dtype == torch.bfloat16,
        lr_scheduler_type="constant",
        prediction_loss_only=True,
        save_strategy="epoch",
        save_total_limit=2,
        torch_empty_cache_steps=50,
        push_to_hub=args.push_to_hub,
        report_to="tensorboard",
    )

    if args.trainer_backend == "lean":
        config = TrainingArguments(**common_config)
        trainer = Trainer(
            model=model,
            args=config,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            processing_class=tokenizer,
            data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
        )
    else:
        config = SFTConfig(
            **common_config,
            max_length=args.max_length,
            packing=False,
        )
        trainer = MemorySafeSFTTrainer(
            model=model,
            args=config,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            processing_class=tokenizer,
            peft_config=peft_config,
        )

    if args.training_mode == "lora":
        trainer.model.print_trainable_parameters()
    trainer.train()
    trainer.save_model()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
