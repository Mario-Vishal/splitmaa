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
- Added paste-ready web ChatGPT prompt files under `docs/chatgpt_dataset_prompts/`; each file contains inline instructions and examples, so no local file paths need to be pasted into ChatGPT.
- Validated the first pasted ChatGPT batch: 322 accepted examples and 28 rejected examples.
- Promoted batch 001 into dataset splits: train now has 267 examples, validation has 66 examples, and locked test remains at 3 examples.
- Validated the second pasted ChatGPT batch: 256 accepted examples and 94 rejected examples.
- Promoted batch 002 into dataset splits: train now has 472 examples, validation has 117 examples, and locked test remains at 3 examples.
- Tightened paste-ready prompts for weak batch 002 categories: `multi_step`, `record_lookup`, and `unsupported`.

### Learnings

- The installed Mobile Actions LiteRT-LM model loads on device but returns unusable gibberish for Splitmaa prompts.
- Splitmaa needs a fine-tune from `google/functiongemma-270m-it`, not the Mobile Actions fine-tune.
- SQLite should be the durable app state foundation before adding AI database-query tools.

### Tradeoffs

- Kept Zustand and screen data shape unchanged for this phase; SQLite is hidden behind the existing storage adapter.
- Query helpers currently run over validated `LocalAppState` loaded from SQLite instead of exposing raw SQL repositories to screens.
- AsyncStorage migration leaves the old key untouched for development rollback.
- Dataset files now contain the first promoted clean batch, but final train/validation/test sizes still need more generated and reviewed batches.
- Batch 002 drifted heavily in `multi_step` and `unsupported` examples, mostly by inventing currencies, workflow types, and loose operation shapes; future prompts for those categories need stricter wording or smaller generation chunks.
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
- Generate the next dataset batch by workflow type, validate it locally, and continue growing train toward 1,500+ examples and validation toward 300 examples. Prioritize clean `multi_step`, `record_lookup`, and `unsupported` regeneration.
- Use `docs/FUNCTIONGEMMA_DATASET_PROMPTS.md` as the source prompt library for ChatGPT batch generation.
- Add repository-style SQLite query functions if direct SQL performance becomes necessary.
- Build and install a fresh Android APK after the SQLite dependency change.
- Verify create group, add expense, reset local data, and restart persistence on the physical Android device.

### 2026-06-15 - Dataset Batch 003 Promoted
- Promoted 144 accepted focused examples after tightening weak prompts for `multi_step`, `record_lookup`, and `unsupported`.
- Added 115 examples to `train.jsonl` and 29 examples to `validation.jsonl`; locked test set stayed unchanged.
- Current canonical counts: 587 train, 146 validation, 3 test.
- Rejected 6 `record_lookup` examples because ChatGPT added `amountText` to lookup args, which the strict schema correctly rejects.
- Learning: focused prompt repair improved `multi_step` and `unsupported` to 50/50 validity; `record_lookup` still needs stronger examples that keep search filters separate from mutation amount fields.

### 2026-06-15 - Dataset Batch 004 Promoted
- Promoted 150 accepted examples focused on `expense_mutation`, `financial_answer`, and `clarification_response`.
- Added 120 examples to `train.jsonl` and 30 examples to `validation.jsonl`; locked test set stayed unchanged.
- Current canonical counts: 707 train, 176 validation, 3 test.
- Rejected 0 examples; all three focused prompt files validated cleanly.
- Learning: the strict single-tool prompt works well for these three workflow types when ids are batch-scoped and examples show amountText/dateText boundaries clearly.

### 2026-06-15 - Dataset Batch 005 Promoted
- Promoted 150 accepted examples focused on `entity_mutation`, `record_lookup`, and `multi_step`.
- Added 120 examples to `train.jsonl` and 30 examples to `validation.jsonl`; locked test set stayed unchanged.
- Current canonical counts: 827 train, 206 validation, 3 test.
- Rejected 0 examples; stronger `record_lookup` constraints prevented mutation-style lookup fields.
- Learning: batch-scoped ids and explicit negative field rules are producing clean ChatGPT-generated JSONL for the final single-tool architecture.

### 2026-06-15 - Golden Test Set 001 Partially Promoted
- Validated the first locked golden test batch separately from training data.
- Accepted 90 of 135 examples and appended them only to `test.jsonl`; train and validation were unchanged.
- Current canonical counts: 827 train, 206 validation, 93 test.
- Rejected 45 examples: mostly `multi_step` old operation names (`add_member`, `remove_member`, `update_expense`, `full_owed`) and `financial_answer` unsupported metrics/fields (`person_total`, `expense_total`, `filters`, `categoryRef`).
- Learning: the golden prompts need stricter negative constraints than training prompts because the requested harder examples caused ChatGPT to invent older schema aliases.

### 2026-06-15 - Golden Test Repair 002 Promoted
- Ran a repair-only golden test pass for `multi_step` and `financial_answer`.
- Accepted 45 of 50 examples and appended them only to `test.jsonl`; train and validation were unchanged.
- Current canonical counts: 827 train, 206 validation, 138 test.
- Rejected 5 `multi_step` examples where ChatGPT still used invalid `create_contact` fields (`name`, `currency`) or invalid settlement `counterparty` fields.
- Learning: financial answer is now clean under strict metric/field constraints; multi-step needs one more small repair prompt if we want every category to hit the original target count.

### 2026-06-15 - FunctionGemma Eval Runner Added
- Replaced the old rule-based smoke evaluator with a scorer for the final `extract_workflow_intent` dataset contract.
- Eval runner supports saved prediction JSONL, command-backed model runs, and self-test mode against expected outputs.
- Added report metrics for parseability, schema validity, tool name accuracy, workflow accuracy, operation count/sequence accuracy, missing-fields accuracy, normalized exact intent accuracy, and leaf argument accuracy.
- Self-test over the locked `test.jsonl` set passed at 1.0 for all metrics across 138 examples.
- Reports are generated under `reports/functiongemma_eval/` and ignored by git.

### 2026-06-15 - Desktop Eval Capture CLI Added
- Added `tools/evals/capture_predictions.py` to run the locked eval set through any desktop model command that reads prompts from stdin.
- The capture CLI writes `predictions.jsonl` rows with id, input, raw output, stderr, exit code, and latency for later scoring by `tools/evals/run_eval.py`.
- This keeps the evaluation path independent from the exact desktop LiteRT/FunctionGemma runtime while preserving a stable scoring contract.

### 2026-06-16 - LiteRT-LM Desktop Prompt Runner Added
- Confirmed the official LiteRT-LM Python API supports Linux, macOS, and Windows and installs from PyPI as `litert-lm-api`.
- Installed `litert-lm-api==0.13.1` into the local `.venv`.
- Added `tools/evals/litert_lm_prompt.py`, a one-prompt stdin/stdout wrapper around `litert_lm.Engine(...)` for `.litertlm` desktop inference.
- Added `eval:functiongemma:litert` as a capture shortcut using the local OneDrive Desktop FunctionGemma `.litertlm` model path.
- Runtime check: `mobile_actions_q8_ekv1024.litertlm` loads and responds through the Python API, proving the desktop wrapper works.
- Blocking issue: `functiongemma-270m-ft-mobile-actions_Google_Tensor_G5.litertlm` fails on desktop engine creation with `Input tensor not found`; likely needs a desktop-compatible FunctionGemma `.litertlm` artifact rather than a Google Tensor G5-targeted artifact.

### 2026-06-16 - Fine-Tuning Path Aligned To Official FunctionGemma Guide
- Confirmed Google's FunctionGemma guide uses `google/functiongemma-270m-it`, Hugging Face `transformers`/`datasets`, and TRL `SFTTrainer`.
- Updated the FunctionGemma converter to emit a schema-bearing `tools` entry, closer to the official `messages` + `tools` conversational format.
- Added `tools/finetune/train_functiongemma_sft.py` as the project training entrypoint for GPU/Colab/Kaggle/Vertex environments.
- Updated fine-tuning docs with the official SFT flow and conversion/training commands.

### 2026-06-16 - Windows Training Environment Prepared
- Default Windows Python was 3.14.5, which is too new for reliable PyTorch training wheels.
- Installed local Python 3.12.13 through `uv` and created `.venv-train`.
- Installed CUDA PyTorch `2.11.0+cu128` plus Hugging Face/TRL training dependencies.
- Verified CUDA is available on `NVIDIA GeForce RTX 5070 Ti Laptop GPU`.
- Converted train and validation into FunctionGemma chat/tool-call JSONL artifacts: 827 train examples and 206 validation examples.

### 2026-06-16 - Hugging Face IPv4 Login Workaround Added
- `hf auth login` failed during token verification with `WinError 10054`; plain `curl` also reset unless forced to IPv4.
- Verified `curl -4 https://huggingface.co` succeeds and an IPv4-forced Python request reaches Hugging Face.
- Added `tools/finetune/hf_ipv4_login.py` to log in without exposing the token in shell history and to verify access to `google/functiongemma-270m-it`.
- Updated `train_functiongemma_sft.py` to force IPv4 for Hugging Face downloads by default, with `--no-force-ipv4` as an escape hatch.

### 2026-06-16 - FunctionGemma Checkpoint Downloaded For Local Training
- Hugging Face `snapshot_download` failed on Windows with `WinError 10054` / `httpx.RemoteProtocolError` during metadata requests.
- Added `tools/finetune/hf_ipv4_download.py`, which forces IPv4, uses one worker, disables the symlink warning, and skips `.litertlm` / `.task` artifacts by default for SFT.
- Downloaded and verified the cached `google/functiongemma-270m-it` training checkpoint, including `model.safetensors` at 536 MB.
- Local-only load check passed with `GemmaTokenizer`, `Gemma3ForCausalLM`, and 268,098,176 parameters.
- Next step: start the Windows SFT run from the cached checkpoint with `.venv-train`.

### 2026-06-16 - Windows SFT OOM Guardrails Added
- First Windows SFT attempt reached step 414, then failed during validation with `torch.AcceleratorError: CUDA error: out of memory`.
- Root cause: validation used too much GPU memory on the 12 GB RTX 5070 Ti Laptop GPU, even though training itself had progressed.
- Updated `train_functiongemma_sft.py` to default to train batch size 2, eval batch size 1, loss-only eval, eval accumulation, epoch checkpoint saves, and periodic CUDA cache clears.
- Updated fine-tuning docs with the safer Windows command and fallback knobs: `--batch-size 1` or `--max-length 768` if memory still runs out.

### 2026-06-16 - Lean LoRA Windows Training Path Verified
- Rechecked the assumption that 12 GB VRAM should be enough for FunctionGemma 270M; manual LoRA forward/backward passed and used only a small fraction of available GPU memory.
- Identified two tooling problems rather than a hardware-size problem: TRL's entropy metric materialized full-vocabulary logits, and `datasets.load_dataset(...)` hung in the Windows local environment.
- Reworked `train_functiongemma_sft.py` so the default Windows path is lean PEFT LoRA with local JSONL loading, local snapshot resolution, `bfloat16`, train batch size 1, gradient accumulation 4, and attention-projection LoRA targets.
- Verified `--max-length 1024` one-step training and full validation smoke tests complete without OOM on the RTX 5070 Ti Laptop GPU.

### 2026-06-16 - Colab LoRA Adapter Imported Locally
- Downloaded the Colab-trained LoRA checkpoint zip and extracted it to `outputs/functiongemma-splitmaa-lora-colab`.
- Verified local adapter files are present: `adapter_config.json`, `adapter_model.safetensors`, tokenizer files, and checkpoint state.
- Local load smoke passed with base `google/functiongemma-270m-it` plus the Colab LoRA adapter.
- First generation smoke produced a FunctionGemma special function-call string but showed quality issues: duplicated contacts and repeated `add_expense` operations. Next step is adapter evaluation and dataset/prompt repair before app integration.

### 2026-06-16 - Colab LoRA Adapter Evaluated Against Locked Test Set
- Recorded Colab training metrics from the 8-epoch run: validation loss improved from `0.236966` to `0.116501`, entropy improved from `0.227168` to `0.111142`, and mean token accuracy improved from `0.962181` to `0.978566`.
- Added `tools/evals/hf_peft_predictions.py` to capture predictions from local Hugging Face FunctionGemma plus a PEFT LoRA adapter.
- Extended `tools/evals/run_eval.py` to parse FunctionGemma's native `<start_function_call>call:extract_workflow_intent{...}` output format in addition to JSON tool calls.
- Full locked test result for `outputs/functiongemma-splitmaa-lora-colab`: parseable `0.9638`, schema valid `0.7826`, workflow accuracy `0.4928`, operation sequence accuracy `0.2899`, exact intent `0.0072`, leaf argument accuracy `0.4803`.
- Learning: token-level training metrics looked strong, but workflow-level eval exposed poor semantic routing. The model learned syntax but overuses `multi_step`, `add_expense`, and `provide_missing_field`, and confuses financial operations (`compute_summary`, `compute_total`, `compute_balance`).
- Tradeoff: do not integrate this adapter into the app yet. Next iteration should simplify/slim the tool schema in prompts, add stronger routing contrast examples, consider LoRA `r=16` with MLP targets, and keep the locked test set unchanged.

### 2026-06-16 - Dataset Routing Drift Root Cause Found
- Audited train/validation/test workflow distribution and token lengths after poor adapter eval.
- Dataset size is modest but not the only issue: `train.jsonl` has 827 examples, with `multi_step` overrepresented at 322 examples and `add_expense` appearing 313 times.
- Full FunctionGemma rows are 650-1172 tokens because every example repeats the full tool schema, while the user text is usually only 10-15 words. This weakens the useful signal per training token.
- Found major routing label drift: 189 training examples and 46 validation examples are labeled `multi_step` with zero or one concrete operation. Some examples with IDs like `entity_mutation_batch_002_*` and `clarification_response_batch_002_*` are incorrectly labeled as `multi_step`.
- Added optional `--strict-routing` validation to catch workflow/operation mismatches. Current strict audit reports 279 routing-quality errors: 244 are `multi_step requires at least two concrete operations`.
- Learning: the first adapter did not fail because the language was too natural or because FunctionGemma 270M is too small. It mostly learned a noisy routing distribution where `multi_step` and `add_expense` were overrepresented and sometimes mislabeled.

### 2026-06-16 - Routing Repair Split Generated
- Added `tools/finetune/audit_routing_dataset.py` to split dataset rows into strict-routing clean candidates and bad review files without mutating canonical train/validation/test.
- Generated repair artifacts under `datasets/splitmaa_functiongemma/repair/`: `train.clean.jsonl`, `validation.clean.jsonl`, `test.clean.jsonl`, per-split `routing_bad_*.jsonl`, and `routing_audit_report.json`.
- Clean/bad counts: total `1171` rows -> `892` clean and `279` bad; train `626/201`, validation `152/54`, test `114/24`.
- Suggested repair actions across bad rows: relabel to entity `49`, expense `49`, financial `46`, clarification `45`, lookup `33`; regenerate/discard missing-operation rows `22`; split/relabel workflow rows `21`; add pending event type or regenerate `14`.
- Tradeoff: training on only clean rows reduces volume by about 24%, but it removes the dominant routing noise. Next step is to create corrected train/validation v2 from repair suggestions, while keeping the locked test set unchanged and separately noting known label issues.

### 2026-06-16 - FunctionGemma Dataset V2 Built From Routing Repairs
- Added `tools/finetune/build_routing_repair_v2.py` to construct corrected train/validation splits from strict-clean rows plus deterministic repair suggestions.
- Built `datasets/splitmaa_functiongemma/v2/train.v2.jsonl` and `validation.v2.jsonl` without mutating the original canonical files.
- V2 counts: train `815`, validation `199`, manual-review leftovers `19`. The v2 train distribution is much more balanced: record lookup `136`, multi-step `134`, expense `122`, entity `121`, financial `116`, clarification `116`, unsupported `70`.
- Auto-fixed `236` rows by relabeling obvious single-operation rows and adding missing clarification context where deterministic. Left ambiguous missing-operation and split/relabel rows for manual review.
- Strict validation passes over v2 train and validation. Converted local ignored FunctionGemma files: `train.v2.functiongemma.jsonl` and `validation.v2.functiongemma.jsonl`.

