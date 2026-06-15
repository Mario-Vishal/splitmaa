# Mobile Inference

Real mobile inference is future work.

Expected Android boundary:

- Kotlin model loader.
- LiteRT-LM or equivalent runtime.
- Native bridge returning raw model output and latency.

Expected iOS boundary:

- Swift model loader.
- Native bridge returning raw model output and latency.

TypeScript remains responsible for parsing, validation, confirmation, execution, persistence, and diagnostics.
