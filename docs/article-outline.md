# Building Splitmaa: An Edge LLM Mobile Showcase with Local Function Calling

## Why I Built This

Splitmaa demonstrates local function calling on a mobile expense workflow.

## Why This Is Not Just A Mobile App

The app is the reference client. The main project is the local command runtime, validation layer, confirmation UX, persistence, diagnostics, and eval path.

## Why I Vibe-Coded The Interface But Engineered The System

AI tools can accelerate mobile UI scaffolding. The engineering work is deciding what the model can propose, what the app validates, what must be confirmed, what gets logged, and what can safely persist.

## Local LLMs Need Architecture Around Them

Small edge models need compact context, fixed schemas, deterministic validation, explicit failure behavior, and diagnostics.

## Floating Assistant UX

The assistant is a command layer over the product, not a generic chatbot.

## Guided Execution Animations

Animations should visualize deterministic execution steps.

## Evals Before Fine-Tuning

Fine-tuning comes after baseline measurement and failure analysis.

## The FunctionGemma Pivot

FunctionGemma was the principled first choice: tiny, local, and made for function calling. The project still pivoted after generation-based evals showed that low loss was not enough. The decisive failure was the one-row overfit gate: teacher-forced token accuracy reached `1.0`, but free generation still malformed the nested workflow JSON.

The lesson: for small local models, the serialization shape can matter as much as the model family. Splitmaa's nested operation union worked better as strict JSON assistant output than as FunctionGemma-native tool-call output.

## Qwen As The Next Candidate

Qwen2.5-0.5B-Instruct became the primary candidate after passing the same one-row gate and beating Qwen3-0.6B slightly on the 20-row same-set gate. The cost is mobile size, so the app should treat the model as an optional downloaded local AI pack.

## Tradeoffs And Lessons Learned

Start local, keep mocks honest, and do not let model output directly mutate app state.
