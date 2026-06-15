# Splitmaa

Splitmaa means **Split + Gemma**.

Splitmaa is an independent open-source edge-device LLM project demonstrated through a mobile expense assistant. It is not affiliated with Google or the Gemma team.

The project is framed as an AI system first: a small local function-calling model proposes constrained expense actions, the app validates them, asks for confirmation, and only then executes deterministic product updates.

## Current Status

Local MVP is complete.

- Real: pnpm monorepo scaffold, Expo mobile reference client, Splitwise/Notion-inspired Home, Groups, Contacts, and Diagnostics screens, group/contact detail views, compact bottom-sheet assistant, confirmation cards, rule-based parser fallback, FunctionGemma-callable tool contracts, action schemas, deterministic action application, AsyncStorage local persistence, audit logs, smoke eval runner, native runner boundary package, guided create-group execution animation, project plan, TODO tracker, session bridge.
- Mocked or not built yet: real local FunctionGemma inference, native Android FunctionGemma runner, full eval dataset, fine-tuned model, Android APK/dev build packaging, Supabase sync.

GitHub: https://github.com/Mario-Vishal/splitmaa

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
pnpm eval:smoke
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
-> FunctionGemma or thin fallback parser
-> structured tool call
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

The full roadmap is tracked in [PLAN.md](./PLAN.md) and [TODO.md](./TODO.md). The next major phase is stabilizing FunctionGemma tool calls and then wiring the native Android runner.
