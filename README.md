# Splitmaa

Splitmaa means **Split + Gemma**.

Splitmaa is an independent open-source edge-device LLM project demonstrated through a mobile expense assistant. It is not affiliated with Google or the Gemma team.

The project is framed as an AI system first: a small local function-calling model proposes constrained expense actions, the app validates them, asks for confirmation, and only then executes deterministic product updates.

## Current Status

Phase 0 is in progress.

- Real: pnpm monorepo scaffold, Expo mobile reference client, project plan, TODO tracker, session bridge.
- Mocked or not built yet: local FunctionGemma inference, parser runtime, action schemas, validation pipeline, guided execution, eval runner, fine-tuning, native model bridges.

## Quick Start

```bash
pnpm install
pnpm mobile:web
```

Useful commands:

```bash
pnpm mobile:start
pnpm mobile:android
pnpm mobile:ios
pnpm typecheck
pnpm test
```

On Windows PowerShell, use `pnpm.cmd` if script execution policy blocks `pnpm`:

```bash
pnpm.cmd install
pnpm.cmd mobile:web
```

## Architecture

```text
User text or voice transcript
-> compact product context
-> local parser / FunctionGemma boundary
-> structured function call or query intent
-> schema validation
-> context resolution and ground-truth lookup
-> confirmation card or answer card
-> user approval for mutations
-> guided execution animation
-> deterministic local state update
-> audit log and diagnostics
```

The model is an action proposer, not an executor. No model output should directly mutate state or write to storage.

## Repository Layout

```text
apps/mobile        Expo React Native reference client
packages/core      Shared domain logic and contracts
docs               Architecture, deployment, and project narrative
tools              Evals, fine-tuning, conversion, and benchmarks
datasets           Splitmaa command datasets
SESSION_BRIDGE.md  Source of truth for session handoff
PLAN.md            Build plan
TODO.md            Phase tracker
```

## Roadmap

The full roadmap is tracked in [PLAN.md](./PLAN.md) and [TODO.md](./TODO.md). The next major phase is theme, branding, and animation foundation.
