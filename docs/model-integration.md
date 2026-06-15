# Model Integration

FunctionGemma is not running locally in this repo yet.

Current state:

- `ruleBasedParser` powers the local demo.
- `functionGemmaParser` is an explicit placeholder.
- The app diagnostics report model status as `not_configured`.

Correct future boundary:

```text
TypeScript parser contract -> native Android/iOS runner -> local model inference -> parsed JSON -> Zod validation
```

The native runner must never mutate app state directly.
