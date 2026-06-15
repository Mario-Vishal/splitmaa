# Splitmaa TODO

## Current Phase

- [x] FunctionGemma-callable tool definitions.
- [x] Model tool-call argument validation.
- [x] Conversion from model tool calls to validated app actions.
- [x] FunctionGemma parser adapter that consumes runner tool calls.
- [x] Mobile assistant routed through FunctionGemma parser adapter with no runtime fallback.
- [x] Native Android FunctionGemma runner implementation.
- [x] Android dev build with native module.
- [ ] Real device run with `.task` model at `/data/local/tmp/llm/splitmaa_functiongemma.task`.
- [x] Configure local JDK/JAVA_HOME for Android Gradle builds.
- [x] Configure Android platform tools/adb on PATH.

## Completed

- [x] Captured project framing: edge-device LLM system, mobile reference client.
- [x] Documented model-as-action-proposer safety rule.
- [x] Published GitHub repository: https://github.com/Mario-Vishal/splitmaa
- [x] Verified Expo web export with local persistence wiring.
- [x] Built local MVP assistant workflow.
- [x] Polished local MVP UI around Splitwise + Notion direction.
- [x] Improved native mobile density and finance color treatment.
- [x] Added guided create-group execution animation.

## Next Up

- [x] Android development build / APK.
- [ ] Real FunctionGemma native inference on device with model artifact.
- [ ] Full 300-example smoke eval dataset.

## AI Runtime

- [x] Parser interface.
- [x] FakeParser.
- [x] RuleBasedParser.
- [x] FunctionGemmaParser placeholder.
- [x] FunctionGemma tool registry.
- [x] Runner-backed FunctionGemmaParser.

## Eval Pipeline

- [x] Smoke dataset.
- [x] Eval runner.
- [ ] Full eval schema/report files.

## Fine-Tuning

- [ ] Dataset formatter.
- [ ] LoRA and QLoRA training scripts.
- [ ] Export path documentation.

## Mobile Inference

- [x] Android bridge plan.
- [x] iOS bridge plan.
- [x] TypeScript native runner boundary.
- [x] Tool-aware runner input/output types.
- [x] Android MediaPipe native module.
- [x] Mobile wiring to native runner without fallback.

## Floating Assistant

- [x] Collapsed assistant state.
- [x] Expanded chat state.
- [x] Confirmation mode.
- [x] Diagnostics mode.

## Guided Execution Animations

- [x] Execution step model.
- [x] Commentary after confirmation.
- [x] Entity highlight strategy for create-group demo.
- [ ] Slower, richer "magic" animation timing pass.

## Ground Truth Queries

- [x] AsyncStorage local state snapshot.
- [x] Validated local state load/save.
- [ ] Query services.
- [x] Audit logs for confirmed assistant actions.

## Packaging

- [x] Android debug build notes.
- [ ] EAS preview build notes.
- [ ] iOS limitation notes.

## Known Risks

- [ ] Full local FunctionGemma inference is not verified on device yet.
- [x] Java/JDK is configured for Android Gradle compile.
- [x] adb is installed/configured; latest `adb devices` showed no connected device.
- [x] Expo/native package compatibility checked with `pnpm.cmd typecheck`.
- [x] GitHub repository was created and pushed.

## Nice To Have Later

- [ ] Supabase optional sync.
- [ ] Shared demo dataset.
- [ ] Screenshots and demo script.
