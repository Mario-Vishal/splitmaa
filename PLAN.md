# Splitmaa Build Plan

## Product Goal

Build an edge-device LLM system where a local function-calling model turns chat or voice commands into safe, validated expense actions on a mobile device. The React Native app is the reference client and showcase surface.

## Architecture

Splitmaa uses a validation-first command pipeline:

```text
input -> compact context -> parser -> validated action -> confirmation -> guided execution -> deterministic state update -> logs
```

The local model is never allowed to directly mutate app state.

## Current Status

The project now has a bootstrapped monorepo, Expo reference client, bottom navigation, core screens, floating assistant, confirmation flow, theme/branding foundation, pure core money/action/parser contracts, FunctionGemma-callable tool definitions, a runner-backed FunctionGemma parser adapter, deterministic action application, AsyncStorage-backed local persistence, smoke evals, and an explicit FunctionGemma runner boundary package.

## Phase Plan

1. Repo setup and source-of-truth docs. Complete.
2. Theme, branding, and animation foundation. Initial foundation complete.
3. Core money, contacts, and insight logic. Initial money/balance layer complete.
4. Action system with Zod validation. Initial action layer complete.
5. Edge runtime contracts and diagnostics. Initial diagnostics contracts complete.
6. Local parsers and FunctionGemma boundary. Rule-based fallback complete; FunctionGemma tool contract and runner-backed parser adapter complete.
7. Local persistence. AsyncStorage MVP complete.
8. Floating assistant UI. Complete for local MVP.
9. Confirmation and guided execution. Confirmation complete; advanced animations pending.
10. Core screens. Complete for local MVP.
11. Eval dataset and runner. Smoke eval complete.
12. Baseline evaluation. Smoke baseline complete.
13. Native model runner boundary. Placeholder package, tool-aware TypeScript types, and mobile adapter wiring complete.
14. Android FunctionGemma runner implementation.
15. Fine-tuning preparation.
16. Fine-tuning execution if justified.
17. Mobile conversion.
18. Real device integration.
19. Diagnostics and performance.
20. Optional Supabase sync.
21. Packaging and open-source polish.

## Preview Instructions

```bash
pnpm install
pnpm mobile:web
```

On Windows PowerShell, use `pnpm.cmd` if needed.

## Testing Instructions

```bash
pnpm typecheck
pnpm test
pnpm --filter mobile exec expo export --platform web --clear
```

## Deployment Instructions

Deployment is not configured yet. Android APK and EAS preview documentation will be added before open-source release.

## Open Questions

- Which Supabase features should remain optional for the first public release?
- Which FunctionGemma Android runtime path should be used first for local inference?
- Which Android device should be the first real-device target?

## Risks

- Native FunctionGemma integration may require device-specific runtime work.
- Fine-tuning should not start until evals expose specific failure modes.
- Mobile distribution must stay honest about what is mocked versus running locally.
