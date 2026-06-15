# Model Integration

FunctionGemma is not running locally in this repo yet.

Current state:

- `ruleBasedParser` powers the local demo.
- `functionGemmaParser` now calls a tool-aware runner interface and falls back to `ruleBasedParser` only when the runner is not ready.
- `modelToolDefinitions` lists the tool calls FunctionGemma is allowed to produce.
- `parseModelToolCall` validates model tool-call arguments before app code sees them.
- `appActionFromModelToolCall` converts a valid tool call into the existing Zod-backed app action schema.
- `createNativeFunctionGemmaRunner` calls the Android Expo module when the app is built as a development client/APK.
- The app diagnostics report fallback while the native module or model file is unavailable.

Correct future boundary:

```text
TypeScript parser contract -> native Android/iOS runner -> local model inference -> tool call JSON -> Zod validation -> deterministic app action
```

The native runner must never mutate app state directly.

The rule-based parser should stay thin. It exists only to keep the demo usable before the native FunctionGemma runner is ready; natural-language coverage belongs to FunctionGemma plus evals, not TypeScript regex growth.

Current mobile wiring uses `createNativeFunctionGemmaRunner()` plus the rule-based fallback. The native Android module loads `/data/local/tmp/llm/splitmaa_functiongemma.task` and returns raw generated text for TypeScript validation.
