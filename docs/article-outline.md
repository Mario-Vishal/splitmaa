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

## Tradeoffs And Lessons Learned

Start local, keep mocks honest, and do not let model output directly mutate app state.
