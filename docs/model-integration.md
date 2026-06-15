# Model Integration

FunctionGemma native runner code exists for Android, but real inference is not verified until a compatible `.task` model is on a physical device.

Current state:

- `ruleBasedParser` exists for isolated tests/evals only, not runtime fallback.
- `functionGemmaParser` now calls a tool-aware runner interface and returns unsupported when the runner or model is not ready.
- `modelToolDefinitions` lists the tool calls FunctionGemma is allowed to produce.
- `parseModelToolCall` validates model tool-call arguments before app code sees them.
- `appActionFromModelToolCall` converts a valid tool call into the existing Zod-backed app action schema.
- `createNativeFunctionGemmaRunner` calls the Android Expo module when the app is built as a development client/APK.
- The app diagnostics report model readiness while the native module or model file is unavailable.

Correct future boundary:

```text
TypeScript parser contract -> native Android/iOS runner -> local model inference -> tool call JSON -> Zod validation -> deterministic app action
```

The native runner must never mutate app state directly.

The rule-based parser should stay out of the runtime assistant path. Natural-language coverage belongs to FunctionGemma plus evals, not TypeScript regex growth.

Current mobile wiring uses `createNativeFunctionGemmaRunner()` only. The native Android module loads `/data/local/tmp/llm/splitmaa_functiongemma.task` and returns raw generated text for TypeScript validation.
