# ADR 0009: Pivot From FunctionGemma To Qwen JSON Intent Extraction

## Status

Accepted.

## Context

Splitmaa needs a small local model that turns messy user messages into one strict `extract_workflow_intent` JSON object. The app owns validation, SQLite lookup, confirmation, execution, navigation, and audit.

FunctionGemma was the first choice because it is designed for local function calling and has a much smaller 270M parameter footprint. After building the manual v4 dataset and running local/Kaggle training, the FunctionGemma path did not pass generation-based gates.

Observed failures:

- Base FunctionGemma did not understand Splitmaa's workflow schema.
- LoRA and full fine-tune runs produced acceptable-looking loss but poor locked-test generation.
- One-row FunctionGemma overfit reached teacher-forced token accuracy `1.0` but still failed free-generation schema validation.
- FunctionGemma's native function-call chat template serializes nested operation objects with `args` before `operationType`, which is a bad shape for Splitmaa's discriminated operation union.

Qwen bakeoff results:

- `Qwen/Qwen2.5-0.5B-Instruct` passed one-row overfit at `1.0` across all metrics.
- On the 20-row same-set gate, Qwen2.5 scored parseable `0.90`, schema-valid `0.90`, workflow `0.90`, operation sequence `0.90`, exact intent `0.55`, and leaf argument accuracy `0.8854`.
- `Qwen/Qwen3-0.6B` also passed the one-row gate but emitted a thinking prefix and scored slightly lower on schema and leaf accuracy in the 20-row gate.
- `HuggingFaceTB/SmolLM2-360M-Instruct` passed the one-row metric gate, but continued generating prose/junk after the first JSON object and was slower locally.

## Decision

Use `Qwen/Qwen2.5-0.5B-Instruct` as the primary local intent-extraction candidate.

Keep the canonical dataset format unchanged:

```json
{"id":"...","input":"...","expected":{"name":"extract_workflow_intent","arguments":{}}}
```

Train Qwen using normal chat SFT rows:

- system: strict JSON-only Splitmaa extraction instruction
- user: original natural-language input
- assistant: compact JSON `expected`

Do not train Qwen on FunctionGemma's native `tool_calls` format.

## Consequences

Positive:

- Better empirical generation behavior in early gates.
- Simpler training target: assistant text is exactly the JSON object the app validator expects.
- Avoids FunctionGemma native serializer ordering problems.
- Keeps app architecture unchanged.

Negative:

- Model is larger than FunctionGemma.
- Mobile model pack likely needs Q4 quantization and optional download.
- Existing native module/package names still mention FunctionGemma and will need renaming or a new Qwen-capable runtime path.

## Follow-Up

- Train a bounded Qwen generalization run before full-corpus training.
- Evaluate on locked manual v4 test rows and failure subsets.
- If metrics pass, plan mobile quantization and runtime integration.
- Preserve FunctionGemma results as documented failed-path evidence for the final article.
