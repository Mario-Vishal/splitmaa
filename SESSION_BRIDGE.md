# Splitmaa Session Bridge

This file is the source of truth for continuing Splitmaa across Codex sessions. Update it after each meaningful phase, commit, tradeoff, or blocker.

## Project Identity

- Name: Splitmaa
- Meaning: Split + Gemma
- Framing: edge-device LLM system with a mobile expense assistant as the reference client.
- Core safety rule: model output proposes actions; validated app code executes actions only after confirmation.

## Current Phase

Polished local MVP complete. Current phase: FunctionGemma real-device inference testing. Runtime assistant commands must not fall back to the rule-based parser.

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
- 2026-06-15: Refined guided execution with dynamic member commentary and a one-shot group detail reveal animation.
- 2026-06-15: Added FunctionGemma-callable tool contracts in `@splitmaa/core`: tool definitions, Zod argument validation, and conversion from model tool calls into validated app actions.
- 2026-06-15: Updated the FunctionGemma runner boundary to accept tool definitions and optionally return typed tool calls.
- 2026-06-15: Wired `functionGemmaParser` to call a tool-aware runner, validate typed/raw tool calls, and convert them into app actions.
- 2026-06-15: Routed the mobile assistant store through the FunctionGemma parser adapter.
- 2026-06-15: Implemented the Android native FunctionGemma runner as an Expo module using MediaPipe GenAI `LlmInference` with `com.google.mediapipe:tasks-genai:0.10.27`.
- 2026-06-15: Wired mobile to `createNativeFunctionGemmaRunner()` with model path `/data/local/tmp/llm/splitmaa_functiongemma.task`; missing native module/model now returns unsupported instead of falling back.
- 2026-06-15: Removed runtime fallback to the rule-based parser from the FunctionGemma adapter and mobile store.
- 2026-06-14: Installed/configured local Temurin JDK 17 under `.local-tools/jdk17` and verified Android SDK/platform-tools.
- 2026-06-14: Fixed native Android packaging by moving MediaPipe OpenCL `uses-native-library` declarations under the module manifest `<application>`.
- 2026-06-14: Switched PNPM to hoisted node linking for Windows Android native builds, removing unused Reanimated and Gesture Handler dependencies that were triggering avoidable CMake work.
- 2026-06-14: Verified `pnpm.cmd typecheck`, `pnpm.cmd test`, `pnpm.cmd eval:smoke`, and `gradlew.bat :app:assembleDebug`; debug APK produced at `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

## Learnings

- PowerShell blocks `pnpm` and `npm` `.ps1` shims in this environment. Use `pnpm.cmd` and `npm.cmd`.
- `gh auth status` reported an invalid saved token, but `gh repo create` still succeeded for `Mario-Vishal`.
- Expo's current scaffold selected SDK `~56.0.11`, React `19.2.3`, and React Native `0.85.3`.
- Expo web preview for this SDK also needs `react-dom`, `react-native-web`, and `@expo/metro-runtime`.
- Expo native additions are pinned through `expo install`: AsyncStorage and SVG.
- `@react-native/metro-config` needed a direct `0.85.3` pin to satisfy React Native peer dependencies.
- Expo autolinking detects `@splitmaa/functiongemma-runner` and `expo.modules.splitmaafunctiongemma.SplitmaaFunctionGemmaModule`.
- React Native 0.85 native builds on Windows hit CMake path limits with PNPM's isolated `.pnpm/...` layout. Use hoisted PNPM linking for this repo.
- Expo prebuild rewrites app `android`/`ios` scripts to native run commands; restore the Expo Go scripts after prebuild when needed.
- Local Gradle build uses `.local-tools/jdk17/jdk-17.0.19+10`; Android Studio's JDK 21 caused a Gradle/toolchain compatibility error in this repo.
- `adb` is available from the Android SDK, but no Android device was connected during the latest check.

## Tradeoffs

- Start with a small, honest Expo reference client instead of trying to complete native model integration during setup.
- Native FunctionGemma requires a development build/APK; Expo Go cannot load the native module.
- Use a root-level `SESSION_BRIDGE.md` instead of burying handoff notes in docs so future sessions load project state quickly.
- Use AsyncStorage for MVP local persistence rather than SQLite or Supabase so the app remains easy to preview.
- Persist validated `LocalAppState` snapshots first; add repositories/query services once the assistant workflow is ready.
- Keep the MVP local and honest: Android native runner code exists, but real inference is unverified until a compatible `.task` model is on a physical device.
- Prioritize a calm finance UI: fewer visible chat messages, stronger debt summary, tappable cards, and detail views over a generic chatbot layout.
- Prefer native app density over website spacing: compact headers, short subtitles, filled surfaces, and fewer full-width controls.
- Assistant should stay compact and utilitarian; avoid filler messages and obvious explanatory copy.
- Do not add predefined prompt chips unless they are explicitly requested; use placeholder hints instead.
- Guided assistant execution should shrink to commentary/progress while running and expand to a compact summary after completion.
- Do not use the rule-based parser as runtime fallback. FunctionGemma is responsible for language understanding; TypeScript owns tool definitions, validation, deterministic execution, and auditability.
- Build the FunctionGemma tool surface before APK packaging so the native runner has stable functions to call.
- Use `node-linker=hoisted` for this Windows workspace so Android CMake sees short `node_modules/<package>` paths.
- Remove unused native UI libraries when they are not powering the current app; Reanimated and Gesture Handler added native build cost without active usage.

## Decisions

- `SESSION_BRIDGE.md` is the continuation source of truth.
- `PLAN.md` tracks project strategy and phase order.
- `TODO.md` tracks tactical work.
- `README.md` is updated as the public-facing project state changes.

## Next Session Checklist

- Install/run the Android debug APK that includes `@splitmaa/functiongemma-runner` on a physical Android device.
- Push a MediaPipe-compatible `.task` model to `/data/local/tmp/llm/splitmaa_functiongemma.task`.
- Test the command path on a physical Android device and inspect diagnostics/model readiness behavior.
- Grow smoke evals from 5 examples to 300 examples.
- Keep updating `SESSION_BRIDGE.md`, `TODO.md`, and `README.md` after meaningful progress.

## Blockers

- No Android device is currently visible to `adb devices`.
- No compatible `.task` model file exists in the repo yet. Real inference requires a MediaPipe `.task` model at `/data/local/tmp/llm/splitmaa_functiongemma.task`.

## Commit Log

- `8b11246` - `chore: bootstrap splitmaa workspace`
- `4154bb7` - `docs: record phase zero handoff`
- `ef945c2` - `docs: record github publish`
- `5f96c88` - `feat: add local persistence foundation`
- `4f04d05` - `feat: complete local mvp workflow`
- `f14399f` - `feat: polish mobile expense workflow`
- `bd7e627` - `style: tighten native mobile polish`
- Latest - `fix: enable android native debug build`
