# Splitmaa

Splitmaa means **Split + Gemma**.

Splitmaa is an independent open-source edge-device LLM project demonstrated through a mobile expense assistant. It is not affiliated with Google or the Gemma team.

The project is framed as an AI system first: a small local function-calling model proposes constrained expense actions, the app validates them, asks for confirmation, and only then executes deterministic product updates.

## Current Status

Local MVP is moving into the local-first AI phase.

- Real: pnpm monorepo scaffold, Expo mobile reference client, Splitwise/Notion-inspired Home, Groups, Contacts, and Diagnostics screens, group/contact detail views, compact bottom-sheet assistant, confirmation cards, FunctionGemma-only parser adapter, FunctionGemma-callable tool contracts, Android LiteRT-LM native runner module, Android debug APK build, action schemas, deterministic action application, SQLite local persistence with one-time AsyncStorage migration, audit logs, local query/search/navigation helpers, smoke eval runner, guided create-group execution animation, starter fine-tune dataset tooling, project plan, TODO tracker, and project log.
- Not complete yet: Splitmaa-specific fine-tuned FunctionGemma model, final 1,500-3,000 example training dataset, mobile SQLite adapter unit tests, speech-to-text, Supabase sync.

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
pnpm mobile:android:native
pnpm mobile:ios
pnpm typecheck
pnpm test
pnpm eval:smoke
```

Native Android model testing requires a development build/APK, not Expo Go. The current LiteRT-LM runner loads:

```text
/data/local/tmp/llm/mobile_actions_q8_ekv1024.litertlm
```

During development, push a LiteRT-LM `.litertlm` model with `adb push path/to/model.litertlm /data/local/tmp/llm/mobile_actions_q8_ekv1024.litertlm`.

On Windows with a connected Android device:

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:Path="$env:ANDROID_HOME\platform-tools;$env:Path"
adb shell mkdir -p /data/local/tmp/llm
adb push C:\path\to\model.litertlm /data/local/tmp/llm/mobile_actions_q8_ekv1024.litertlm
adb shell ls -lh /data/local/tmp/llm/mobile_actions_q8_ekv1024.litertlm
```

After pushing the model, open Splitmaa -> Status -> Check model. The status must show `ready` before assistant commands can produce real FunctionGemma tool calls. The app does not fall back to the rule-based parser at runtime.

The Mobile Actions model loads but is not useful for Splitmaa prompts. The fine-tuning path should use base `google/functiongemma-270m-it` with the dataset format in `datasets/splitmaa_functiongemma`.

Speech-to-text is intentionally separate from FunctionGemma. The STT layer should later produce a transcript locally, then pass that text into the same FunctionGemma tool-call pipeline.

To build the Android debug APK locally on Windows:

```powershell
$env:JAVA_HOME='C:\Users\mario\Documents\projects\Splitmaa\.local-tools\jdk17\jdk-17.0.19+10'
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
cd apps\mobile\android
.\gradlew.bat :app:assembleDebug
```

The APK is written to:

```text
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
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
-> FunctionGemma native runner
-> structured tool call
-> schema validation
-> context resolution and ground-truth lookup
-> confirmation card or answer card
-> user approval for mutations
-> guided execution animation
-> deterministic SQLite-backed local state update
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
docs/PROJECT_LOG.md Source of truth for completions, learnings, tradeoffs, and next steps
SESSION_BRIDGE.md  Source of truth for session handoff
PLAN.md            Build plan
TODO.md            Phase tracker
```

## Fine-Tune Dataset Workflow

Canonical staging JSONL lives in:

```text
datasets/splitmaa_functiongemma
```

Prompt templates for generating reviewed batches are tracked in:

```text
docs/FUNCTIONGEMMA_DATASET_PROMPTS.md
```

Validate generated batches:

```bash
python tools/finetune/validate_splitmaa_dataset.py datasets/splitmaa_functiongemma/train.jsonl datasets/splitmaa_functiongemma/validation.jsonl datasets/splitmaa_functiongemma/test.jsonl
```

Convert a validated split to FunctionGemma chat/tool-call JSONL:

```bash
python tools/finetune/convert_to_functiongemma.py datasets/splitmaa_functiongemma/train.jsonl .local-models/splitmaa_train.functiongemma.jsonl
```

## Roadmap

The full roadmap is tracked in [PLAN.md](./PLAN.md), [TODO.md](./TODO.md), and [docs/PROJECT_LOG.md](./docs/PROJECT_LOG.md). The next major phase is building a fresh Android APK with SQLite, verifying local persistence on device, and growing the validated FunctionGemma fine-tune dataset.
