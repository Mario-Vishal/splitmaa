# ADR 0008: Eval Before Fine-Tuning

## Status

Accepted

## Context

Fine-tuning without stable schemas and baseline measurements can optimize the wrong behavior.

## Decision

Splitmaa will build evals and baseline reports before attempting FunctionGemma fine-tuning.

## Consequences

- The current eval dataset is a smoke set only.
- Fine-tuning is deferred until failure categories are clear.
- Public docs should not imply a fine-tuned model exists before it does.
