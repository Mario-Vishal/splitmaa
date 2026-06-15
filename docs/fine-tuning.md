# Fine-Tuning

Fine-tuning is intentionally not complete.

The project should only fine-tune FunctionGemma after:

- action schemas stabilize
- parser prompts stabilize
- eval coverage is meaningful
- baseline failure modes are measured

Target future path:

```text
dataset -> baseline eval -> failure analysis -> LoRA/QLoRA experiment -> validation eval -> export -> mobile conversion
```

Current dataset contract:

- Train from base `google/functiongemma-270m-it`.
- Use one model-facing function: `extract_workflow_intent`.
- Store staging JSONL under `datasets/splitmaa_functiongemma/`.
- Validate every batch with `tools/finetune/validate_splitmaa_dataset.py`.
- Convert accepted splits with `tools/finetune/convert_to_functiongemma.py`.

The dataset should train workflow routing, strict operation extraction, names/references instead of IDs, `amountText`/`dateText`, missing information vs unsupported requests, and clarification replies such as “the second one.”
