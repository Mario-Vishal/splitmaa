# Splitmaa Session Bridge

This file is the source of truth for continuing Splitmaa across Codex sessions. Update it after each meaningful phase, commit, tradeoff, or blocker.

## Project Identity

- Name: Splitmaa
- Meaning: Split + Gemma
- Framing: edge-device LLM system with a mobile expense assistant as the reference client.
- Core safety rule: model output proposes actions; validated app code executes actions only after confirmation.

## Current Phase

Phase 0 - Repo Setup.

## Latest Completion Log

- 2026-06-14: Started from an empty workspace.
- 2026-06-14: Created Expo TypeScript mobile scaffold under `apps/mobile`.
- 2026-06-14: Added root pnpm workspace structure.
- 2026-06-14: Added README, PLAN, TODO, docs, and this session bridge.
- 2026-06-14: Installed workspace dependencies with `pnpm.cmd install`.
- 2026-06-14: Added Expo web preview packages through `expo install`.
- 2026-06-14: Verified `pnpm.cmd typecheck` and `pnpm.cmd test`.
- 2026-06-14: Initialized root Git repository on `main`.
- 2026-06-14: Created initial commit `8b11246` (`chore: bootstrap splitmaa workspace`).
- 2026-06-14: Created and pushed GitHub repo: https://github.com/Mario-Vishal/splitmaa

## Learnings

- PowerShell blocks `pnpm` and `npm` `.ps1` shims in this environment. Use `pnpm.cmd` and `npm.cmd`.
- `gh auth status` reported an invalid saved token, but `gh repo create` still succeeded for `Mario-Vishal`.
- Expo's current scaffold selected SDK `~56.0.11`, React `19.2.3`, and React Native `0.85.3`.
- Expo web preview for this SDK also needs `react-dom`, `react-native-web`, and `@expo/metro-runtime`.

## Tradeoffs

- Start with a small, honest Expo reference client instead of trying to complete native model integration during setup.
- Keep FunctionGemma execution documented as future work until a real native runner exists.
- Use a root-level `SESSION_BRIDGE.md` instead of burying handoff notes in docs so future sessions load project state quickly.

## Decisions

- `SESSION_BRIDGE.md` is the continuation source of truth.
- `PLAN.md` tracks project strategy and phase order.
- `TODO.md` tracks tactical work.
- `README.md` is updated as the public-facing project state changes.

## Next Session Checklist

- Initialize root git repository.
- Begin Phase 1: theme, branding, and animation foundation.
- Keep updating `SESSION_BRIDGE.md`, `TODO.md`, and `README.md` after meaningful progress.

## Blockers

- No active blocker for Phase 1.

## Commit Log

- `8b11246` - `chore: bootstrap splitmaa workspace`
- `4154bb7` - `docs: record phase zero handoff`
