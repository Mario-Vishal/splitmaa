# Splitmaa Manual v4 Dataset Notes

This folder is the manually authored FunctionGemma staging dataset for Splitmaa.

## Provenance
- Rows in this folder are written directly by Codex for Splitmaa.
- No template expansion script, loop, Ollama model, Qwen model, Gemma model, or ChatGPT batch is allowed to author rows in this folder.
- Validation, semantic audit, dedupe, pretty-printing, conversion, and reporting scripts may be used only as checks.

## Current Status
- `train.jsonl`, `validation.jsonl`, and `test.jsonl` contain 257 manually authored rows:
  - train: 185
  - validation: 39
  - test: 33
- Strict routing validation passes for all 257 rows.
- Semantic audit passes with zero findings.
- Input uniqueness checks report zero exact duplicates, zero normalized shape duplicates, and zero near-duplicate pairs at the current review threshold.
- The target remains about 600 manually authored initial rows, then 1,500-1,800 training rows before serious LoRA training.
- The existing `v3` dataset is retained only as stress/validator data and is not the trusted training source.

## Authoring Rules
- Keep the model-facing tool name as `extract_workflow_intent`.
- Use natural references and names, never trusted app IDs.
- Keep money as `amountText` plus `currency`; the app computes minor units.
- Keep relative dates as `dateText` and `dateIntent`; the app resolves actual UTC windows.
- Use `missingFields` for incomplete Splitmaa actions, not `unsupported`.
- Use `unsupported` only for requests outside Splitmaa's local expense scope.
- Include messy mobile/TTS text, typos, corrections, mixed names, Indian/US/Chinese contexts, and long multi-step commands.
