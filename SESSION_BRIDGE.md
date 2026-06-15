# Splitmaa Session Bridge

This file is the source of truth for continuing Splitmaa across Codex sessions. Update it after each meaningful phase, commit, tradeoff, or blocker.

## Project Identity

- Name: Splitmaa
- Meaning: Split + Gemma
- Framing: edge-device LLM system with a mobile expense assistant as the reference client.
- Core safety rule: model output proposes actions; validated app code executes actions only after confirmation.

## Current Phase

Polished local MVP complete. Next phase: Android dev build/APK packaging and real native FunctionGemma integration planning.

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
- 2026-06-15: Added theme/branding foundation with SVG logo and wordmark.
- 2026-06-15: Added core money helpers, balance logic, action schemas, execution plans, parser contracts, diagnostics, and deterministic action application.
- 2026-06-15: Added AsyncStorage local persistence with snapshot validation and Zustand store hydration.
- 2026-06-15: Verified `pnpm.cmd typecheck`, `pnpm.cmd test`, and Expo web export.
- 2026-06-15: Added bottom navigation, Home/Groups/Contacts/Diagnostics screens, floating assistant, confirmation cards, and persisted confirmed assistant actions.
- 2026-06-15: Added smoke eval dataset/runner and FunctionGemma runner boundary package.
- 2026-06-15: Redesigned UI in a Splitwise/Notion direction with top owed/owing summary, Home group/contact cards, detail pages, horizontal pill tabs, and compact bottom-sheet assistant.
- 2026-06-15: Tightened the mobile UI with less padding, softer filled cards, green/red debt chips, reduced instructional copy, and a small right-corner assistant launcher.
- 2026-06-15: Cleaned assistant sheet by removing default filler text, adding an X close button, and making the handle close on tap/downward pull.
- 2026-06-15: Removed assistant predefined command chips, removed empty/filler message area, replaced text detail back buttons with compact icon buttons, and removed fake static segment controls.
- 2026-06-15: Added guided create-group execution for `create a group called california add sai and deepak`: compact progress toast, touch-blocking overlay, automatic Groups navigation, created group detail opening, and post-action summary graph above the input.

## Learnings

- PowerShell blocks `pnpm` and `npm` `.ps1` shims in this environment. Use `pnpm.cmd` and `npm.cmd`.
- `gh auth status` reported an invalid saved token, but `gh repo create` still succeeded for `Mario-Vishal`.
- Expo's current scaffold selected SDK `~56.0.11`, React `19.2.3`, and React Native `0.85.3`.
- Expo web preview for this SDK also needs `react-dom`, `react-native-web`, and `@expo/metro-runtime`.
- Expo native additions are pinned through `expo install`: AsyncStorage, SVG, Reanimated, and Gesture Handler.
- `@react-native/metro-config` needed a direct `0.85.3` pin to satisfy React Native peer dependencies.

## Tradeoffs

- Start with a small, honest Expo reference client instead of trying to complete native model integration during setup.
- Keep FunctionGemma execution documented as future work until a real native runner exists.
- Use a root-level `SESSION_BRIDGE.md` instead of burying handoff notes in docs so future sessions load project state quickly.
- Use AsyncStorage for MVP local persistence rather than SQLite or Supabase so the app remains easy to preview.
- Persist validated `LocalAppState` snapshots first; add repositories/query services once the assistant workflow is ready.
- Keep the MVP local and honest: FunctionGemma native inference is represented by a placeholder boundary until real Kotlin/Swift runner work is done.
- Prioritize a calm finance UI: fewer visible chat messages, stronger debt summary, tappable cards, and detail views over a generic chatbot layout.
- Prefer native app density over website spacing: compact headers, short subtitles, filled surfaces, and fewer full-width controls.
- Assistant should stay compact and utilitarian; avoid filler messages and obvious explanatory copy.
- Do not add predefined prompt chips unless they are explicitly requested; use placeholder hints instead.
- Guided assistant execution should shrink to commentary/progress while running and expand to a compact summary after completion.

## Decisions

- `SESSION_BRIDGE.md` is the continuation source of truth.
- `PLAN.md` tracks project strategy and phase order.
- `TODO.md` tracks tactical work.
- `README.md` is updated as the public-facing project state changes.

## Next Session Checklist

- Build Android development build/APK path.
- Replace placeholder FunctionGemma runner with Android Kotlin implementation when a model artifact/runtime path is available.
- Grow smoke evals from 5 examples to 300 examples.
- Keep updating `SESSION_BRIDGE.md`, `TODO.md`, and `README.md` after meaningful progress.

## Blockers

- No active blocker for Phase 1.

## Commit Log

- `8b11246` - `chore: bootstrap splitmaa workspace`
- `4154bb7` - `docs: record phase zero handoff`
- `ef945c2` - `docs: record github publish`
- `5f96c88` - `feat: add local persistence foundation`
- `4f04d05` - `feat: complete local mvp workflow`
- `f14399f` - `feat: polish mobile expense workflow`
- `bd7e627` - `style: tighten native mobile polish`
