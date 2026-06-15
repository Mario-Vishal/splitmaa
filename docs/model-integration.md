# Model Integration

FunctionGemma is not running locally in this repo yet.

Current state:

- `ruleBasedParser` powers the local demo.
- `functionGemmaParser` is an explicit placeholder.
- `modelToolDefinitions` lists the tool calls FunctionGemma is allowed to produce.
- `parseModelToolCall` validates model tool-call arguments before app code sees them.
- `appActionFromModelToolCall` converts a valid tool call into the existing Zod-backed app action schema.
- The app diagnostics report model status as `not_configured`.

Correct future boundary:

```text
TypeScript parser contract -> native Android/iOS runner -> local model inference -> tool call JSON -> Zod validation -> deterministic app action
```

The native runner must never mutate app state directly.

The rule-based parser should stay thin. It exists only to keep the demo usable before the native FunctionGemma runner is ready; natural-language coverage belongs to FunctionGemma plus evals, not TypeScript regex growth.
