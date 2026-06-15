# ADR 0001: Root Session Bridge

## Status

Accepted

## Context

Splitmaa will be built across multiple Codex sessions. The project needs a durable handoff file that captures completions, learnings, tradeoffs, decisions, blockers, and next steps without requiring future sessions to reconstruct state from chat history.

## Decision

Create `SESSION_BRIDGE.md` at the repository root and update it after meaningful project changes.

## Consequences

- Future sessions can quickly recover project context.
- The file may duplicate some information from `PLAN.md` and `TODO.md`, but it serves a different purpose: session continuity.
- The bridge should stay concise and factual so it remains useful.
