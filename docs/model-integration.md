# Model Integration

Splitmaa is pivoting the model layer from FunctionGemma-native tool calls to Qwen JSON intent extraction. The app still exposes one logical model-facing function: `extract_workflow_intent`.

Current state:

- `ruleBasedParser` exists for isolated tests/evals only, not runtime fallback.
- `functionGemmaParser` and the native runner package still exist from the first implementation path.
- `modelToolDefinitions` exposes only `extract_workflow_intent`.
- `parseModelToolCall` validates the strict workflow intent and operation union before app code sees it.
- `appActionFromModelToolCall` currently bridges valid workflow intents into the existing app action schema so the UI keeps working while the durable workflow engine is built.
- `createNativeFunctionGemmaRunner` calls the Android Expo module when the app is built as a development client/APK.
- The app diagnostics report model readiness while the native module or model file is unavailable.

Correct future boundary:

```text
TypeScript parser contract -> native Android/iOS runner -> local model inference -> JSON extract_workflow_intent object -> Zod validation -> workflow state -> app-owned execution
```

The native runner must never mutate app state directly.

The rule-based parser should stay out of the runtime assistant path. Natural-language coverage belongs to the fine-tuned local model plus evals, not TypeScript regex growth.

Current mobile wiring uses `createNativeFunctionGemmaRunner()` only. That is now technical debt from the FunctionGemma path. The Qwen path needs either:

- a renamed generic local model runner package, or
- a new Qwen-compatible mobile runtime path that returns raw generated text for TypeScript validation.

The model should output names and references, not trusted SQLite IDs. The app owns ID resolution, duplicate-contact UI, confirmation tokens, stale-state checks, guarded commits, navigation, highlighting, and audit.

Active training/eval target:

- base model: `Qwen/Qwen2.5-0.5B-Instruct`
- output format: one compact JSON object, no native FunctionGemma `tool_calls`
- canonical dataset: `datasets/splitmaa_functiongemma/manual_v4/*.jsonl`
- converted Qwen artifacts: `datasets/splitmaa_functiongemma/manual_v4/*.qwen.jsonl`
