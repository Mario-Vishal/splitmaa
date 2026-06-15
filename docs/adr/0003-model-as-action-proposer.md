# ADR 0003: Model As Action Proposer

## Status

Accepted

## Context

Splitmaa converts natural language into product actions. A local model can help propose an action, but model output is untrusted.

## Decision

The model may only propose structured actions. App code is responsible for schema validation, business validation, user confirmation, deterministic execution, persistence, and audit logging.

## Consequences

- No model output directly mutates state.
- Query answers must come from ground-truth local data.
- Mutations require confirmation.
- Diagnostics and audit logs can explain what happened.
