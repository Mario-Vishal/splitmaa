# Evals

Splitmaa starts with evals before fine-tuning.

Current scaffold:

```bash
pnpm eval:smoke
```

This runs `tools/evals/run_eval.py` over `datasets/splitmaa/test.jsonl` and reports:

- function accuracy
- argument accuracy
- parser name

The current dataset is a smoke set only. It is not large enough for fine-tuning decisions.
