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

### Learnings

- The installed Mobile Actions LiteRT-LM model loads on device but returns unusable gibberish for Splitmaa prompts.
- Splitmaa needs a fine-tune from `google/functiongemma-270m-it`, not the Mobile Actions fine-tune.
- SQLite should be the durable app state foundation before adding AI database-query tools.

### Tradeoffs

- Kept Zustand and screen data shape unchanged for this phase; SQLite is hidden behind the existing storage adapter.
- Query helpers currently run over validated `LocalAppState` loaded from SQLite instead of exposing raw SQL repositories to screens.
- AsyncStorage migration leaves the old key untouched for development rollback.
- Dataset files are starter scaffolds only; final train/validation/test sizes still need generated and reviewed batches.
- Complex natural-language commands should use `draft_expense_plan`; the app remains responsible for contact lookup, duplicate disambiguation, missing full-name/email UI, confirmation, split math, and persistence.

### Known Issues

- Real FunctionGemma inference still needs a Splitmaa-specific fine-tuned model.
- Mobile storage tests are not yet implemented with a mocked or test SQLite driver.
- Speech-to-text remains out of scope until tool calling and persistence are stable.

### Next Steps

- Add mobile persistence unit tests around the SQLite adapter.
- Generate dataset batches by tool type, validate them locally, and grow the locked test set carefully.
- Use `docs/FUNCTIONGEMMA_DATASET_PROMPTS.md` as the source prompt library for ChatGPT batch generation.
- Add repository-style SQLite query functions if direct SQL performance becomes necessary.
- Build and install a fresh Android APK after the SQLite dependency change.
- Verify create group, add expense, reset local data, and restart persistence on the physical Android device.
