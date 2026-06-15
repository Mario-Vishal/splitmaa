# Model Integration

FunctionGemma native runner code exists for Android. Splitmaa exposes one model-facing function: `extract_workflow_intent`.

Current state:

- `ruleBasedParser` exists for isolated tests/evals only, not runtime fallback.
- `functionGemmaParser` calls a tool-aware runner interface and returns unsupported when the runner or model is not ready.
- `modelToolDefinitions` exposes only `extract_workflow_intent`.
- `parseModelToolCall` validates the strict workflow intent and operation union before app code sees it.
- `appActionFromModelToolCall` currently bridges valid workflow intents into the existing app action schema so the UI keeps working while the durable workflow engine is built.
- `createNativeFunctionGemmaRunner` calls the Android Expo module when the app is built as a development client/APK.
- The app diagnostics report model readiness while the native module or model file is unavailable.

Correct future boundary:

```text
TypeScript parser contract -> native Android/iOS runner -> local model inference -> extract_workflow_intent JSON -> Zod validation -> workflow state -> app-owned execution
```

The native runner must never mutate app state directly.

The rule-based parser should stay out of the runtime assistant path. Natural-language coverage belongs to FunctionGemma plus evals, not TypeScript regex growth.

Current mobile wiring uses `createNativeFunctionGemmaRunner()` only. The native Android module loads `/data/local/tmp/llm/splitmaa_functiongemma.task` and returns raw generated text for TypeScript validation.

The model should output names and references, not trusted SQLite IDs. The app owns ID resolution, duplicate-contact UI, confirmation tokens, stale-state checks, guarded commits, navigation, highlighting, and audit.
