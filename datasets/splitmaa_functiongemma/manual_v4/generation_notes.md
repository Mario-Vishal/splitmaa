# Splitmaa Manual v4 Dataset Notes

This folder is the manually authored FunctionGemma staging dataset for Splitmaa.

## Provenance
- Rows in this folder are written directly by Codex for Splitmaa.
- No template expansion script, loop, Ollama model, Qwen model, Gemma model, or ChatGPT batch is allowed to author rows in this folder.
- Validation, semantic audit, dedupe, pretty-printing, conversion, and reporting scripts may be used only as checks.

## Current Status
- `train.jsonl`, `validation.jsonl`, and `test.jsonl` contain 1,600 manually authored rows:
  - train: 1,120
  - validation: 240
  - test: 240
- Strict routing validation passes for all 1,600 rows.
- Semantic audit passes with zero findings.
- Evaluator self-test over the locked test split passes at 1.0 across parseability, schema validity, workflow accuracy, operation sequence accuracy, exact intent, and leaf argument accuracy.
- Input uniqueness checks report zero exact duplicates. The latest near-duplicate scan reports 19 low-risk pairs at threshold 0.78, mostly short lookup and financial command shapes that remain semantically distinct.
- The initial 600-row manual seed target is complete, and expansion has reached a 1,600-row checkpoint.
- Passing train and validation splits have been converted to FunctionGemma format:
  - `train.functiongemma.jsonl`: 1,120 examples
  - `validation.functiongemma.jsonl`: 240 examples
- The frozen pre-training target is 2,400 rows total:
  - train: 1,700
  - validation: 350
  - locked test: 350
- The existing `v3` dataset is retained only as stress/validator data and is not the trusted training source.

## Authoring Rules
- Keep the model-facing tool name as `extract_workflow_intent`.
- Use natural references and names, never trusted app IDs.
- Keep money as `amountText` plus `currency`; the app computes minor units.
- Keep relative dates as `dateText` and `dateIntent`; the app resolves actual UTC windows.
- Use `missingFields` for incomplete Splitmaa actions, not `unsupported`.
- Use `unsupported` only for requests outside Splitmaa's local expense scope.
- Include messy mobile/TTS text, typos, corrections, mixed names, Indian/US/Chinese contexts, and long multi-step commands.
