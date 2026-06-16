# Splitmaa Project Log

This file is the session bridge for implementation status, decisions, tradeoffs, and next steps.

## 2026-06-15

### Completed

- Added SQLite as the mobile local source of truth through `expo-sqlite`.
- Replaced AsyncStorage blob persistence behind the existing mobile storage adapter.
- Added one-time AsyncStorage migration from `splitmaa.localAppState.v1` into `splitmaa.db`.
- Added normalized local tables for metadata, contacts, aliases, groups, group members, expenses, split contacts, splits, settlements, AI action logs, and future activity events.
- Expanded the shared FunctionGemma tool contract to v1 mutation, query, search, navigation, clarification, and unsupported tools.
- Limited v1 currency scope to USD and INR.
- Added local query/search helpers for balances, financial summaries, record search, and open-record navigation.
- Wired assistant read/search/open actions to grounded answers, result cards, app navigation, and record highlighting.
- Added starter fine-tune dataset splits and local validator/converter scripts.
- Added `draft_expense_plan` for complex 2-5 step commands; confirmed plans execute through deterministic child actions.
- Added the FunctionGemma prompt library with few-shot JSONL examples for each planned tool.
- Replaced the model-facing AI contract with one strict `extract_workflow_intent` function.
- Added strict workflow operation schemas for entity, expense, lookup/navigation, financial answer, and clarification-response workflows.
- Added app-owned risk classification, `amountText` normalization, and missing-info vs unsupported handling in the workflow layer.
- Added durable SQLite `workflow_state` and `workflow_audit_logs` tables for pending workflows, guarded commits, and future audit traces.
- Rewrote FunctionGemma dataset schema, prompts, seed examples, validator, and converter around the single workflow-intent function.
- Added a validated realistic reference JSONL file with 70 examples covering the final `extract_workflow_intent` architecture across entity, expense, multi-step, lookup/navigation, financial, clarification-response, and unsupported/adversarial scenarios.
- Split realistic reference examples into per-workflow JSONL files under `datasets/splitmaa_functiongemma/reference_by_type/` so separate ChatGPT chats can generate focused batches without mixed examples.

### Learnings

- The installed Mobile Actions LiteRT-LM model loads on device but returns unusable gibberish for Splitmaa prompts.
- Splitmaa needs a fine-tune from `google/functiongemma-270m-it`, not the Mobile Actions fine-tune.
- SQLite should be the durable app state foundation before adding AI database-query tools.

### Tradeoffs

- Kept Zustand and screen data shape unchanged for this phase; SQLite is hidden behind the existing storage adapter.
- Query helpers currently run over validated `LocalAppState` loaded from SQLite instead of exposing raw SQL repositories to screens.
- AsyncStorage migration leaves the old key untouched for development rollback.
- Dataset files are starter scaffolds only; final train/validation/test sizes still need generated and reviewed batches.
- Complex natural-language commands should use `workflowType: "multi_step"` inside `extract_workflow_intent`; the app remains responsible for contact lookup, duplicate disambiguation, missing full-name/email UI, confirmation, split math, and persistence.
- Existing UI execution still bridges validated workflow intents into current app actions; the durable workflow engine over `workflow_state` is the next implementation layer.

### Known Issues

- Real FunctionGemma inference still needs a Splitmaa-specific fine-tuned model.
- Mobile storage tests are not yet implemented with a mocked or test SQLite driver.
- Persisted workflow engine UI is not complete yet; tables and schemas exist, but pending workflow resume/confirmation tokens are not fully wired.
- Speech-to-text remains out of scope until tool calling and persistence are stable.

### Next Steps

- Add mobile persistence unit tests around the SQLite adapter.
- Implement workflow-state execution services: create workflow rows, resolve entities, emit UI events, confirmation tokens, guarded commit, and audit rows.
- Generate dataset batches by workflow type, validate them locally, and grow the locked test set carefully.
- Use `docs/FUNCTIONGEMMA_DATASET_PROMPTS.md` as the source prompt library for ChatGPT batch generation.
- Add repository-style SQLite query functions if direct SQL performance becomes necessary.
- Build and install a fresh Android APK after the SQLite dependency change.
- Verify create group, add expense, reset local data, and restart persistence on the physical Android device.
