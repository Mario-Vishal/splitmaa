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

### 2026-06-16 - Workflow Test Authoring Visualization Added
- Added `docs/workflow-visualization.html` as a standalone interactive reference for manually writing and reviewing FunctionGemma dataset rows.
- The page maps the code schema into workflow routing rules, operation schemas, enum lists, JSONL examples, date handling, `show_previous` semantics, lookup boundaries, and a manual review checklist.
- Flowthis MCP config exists locally at `http://localhost:5373/mcp`, but this Codex session did not expose Flowthis upload tools, so the artifact remains local until a fresh session exposes the Flowthis MCP tools.

### 2026-06-29 - Local Teacher Bakeoff And Dataset Trust Policy
- Tested local Ollama models for Splitmaa dataset generation. Plain `ollama run` caused visible thinking/reasoning leakage even when the prompt requested JSON only.
- Ollama structured API with `format` JSON schema, `stream:false`, `think:false`, and low temperature prevented thinking leakage, but smaller models still invented invalid schema fields.
- Large-model structured bakeoff: `qwen3.5:27b` produced the best candidate row under a strict schema but took about 188 seconds; `gemma4:26b` was faster at about 58 seconds but made a payer error; `gpt-oss:20b` returned an empty strict-schema response; `qwen3-coder:30b` crashed the local Ollama/CUDA runner.
- Decision: local models are candidate generators only, not trusted labelers. Trusted rows must pass schema validation, strict routing, semantic audits, dedupe, and Codex/manual review before promotion.
- Article note: this was the key lesson from synthetic data work. Structured JSON output is necessary but not sufficient; semantic label quality still needs app-specific gates.

### 2026-06-29 - Percentage Splits, Semantic Audit, And V3 Dataset Built
- Extended dataset validation for `splitType: "percentage"` using `allocations` with `participant` refs and `percentText`. The model still outputs text; the app will validate totals and compute money later.
- Relaxed strict routing for incomplete Splitmaa actions: zero-operation rows are allowed when `missingFields` explains the missing information.
- Repaired the locked `test.jsonl` set: added missing `pendingEventType` values, relabeled one multi-member entity command to `multi_step`, and relabeled one three-metric financial summary to `multi_step`.
- Added `tools/finetune/semantic_audit_dataset.py` for high-risk checks around corrections, exclusions, percentage splits, missing amounts, payer extraction, and numeric money fields.
- Added `tools/finetune/build_v3_dataset.py` to build v3 splits from the repaired/v2 base plus Codex-authored high-risk mobile/TTS examples.
- V3 counts: train `1516`, validation `360`, test `296`, total `2172`. V3 input style is intentionally messy-heavy: train `1203` messy / `313` clean, validation `289` messy / `71` clean, test `218` messy / `78` clean.
- V3 split coverage includes `percentage` examples: train `420`, validation `85`, test `84`; long multi-step examples now reach 56 words and 4 operations.
- Validation status: strict dataset validation passes across all `2172` v3 rows; semantic audit passes with zero blocking findings; evaluator self-test over `test.v3.jsonl` passes at `1.0` for all metrics.

### 2026-06-29 - Manual V4 Dataset Policy Started
- Reclassified the script-built `datasets/splitmaa_functiongemma/v3/` split as stress/validator data only, not the trusted final training source.
- Started `datasets/splitmaa_functiongemma/manual_v4/` as the manually authored dataset line, with provenance notes that prohibit template expansion scripts and local-model generation from authoring trusted examples.
- Learning: schema-clean generated rows are useful for tooling, but the training set needs hand-authored variety to avoid repeated sentence shells and brittle routing patterns.
- Tradeoff: the first manual v4 commit is a quality seed, not the full 600-row target. Expansion should continue in reviewed manual batches, with scripts used only for validation, semantic audit, dedupe, conversion, and reporting.

### 2026-06-29 - Manual V4 Batch 2 Added
- Expanded `datasets/splitmaa_functiongemma/manual_v4/` from 53 to 108 manually authored rows: train `77`, validation `16`, test `15`.
- Coverage after batch 2: train has multi-step `18`, expense `18`, entity `10`, lookup `10`, financial `8`, clarification `7`, unsupported `6`.
- Validation status: strict routing passes for all `108` rows; semantic audit reports zero findings.
- Uniqueness status: zero exact duplicate inputs, zero normalized shape duplicates, and zero near-duplicate pairs at the current review threshold.

### 2026-06-29 - Manual V4 Goal Checkpoint At 257 Rows
- Continued manual-only dataset authoring toward the 600-row initial target.
- Current `manual_v4` counts: train `185`, validation `39`, test `33`, total `257`.
- Quality gates pass at this checkpoint: strict routing `257/257`, semantic audit zero findings, exact duplicates zero, normalized shape duplicates zero, near-duplicate pairs zero at the current threshold.
- Remaining to 600-row initial target: `343` manually authored rows.

### 2026-06-29 - Manual V4 Goal Checkpoint At 302 Rows
- Expanded `manual_v4` to train `219`, validation `45`, test `38`, total `302`.
- Quality gates pass at this checkpoint: strict routing `302/302`, semantic audit zero findings, exact duplicates zero, normalized shape duplicates zero, near-duplicate pairs zero at the current threshold.
- Remaining to 600-row initial target: `298` manually authored rows.

### 2026-06-29 - Manual V4 Goal Checkpoint At 350 Rows
- Expanded `manual_v4` to train `257`, validation `50`, test `43`, total `350`.
- Quality gates pass at this checkpoint: strict routing `350/350`, semantic audit zero findings, exact duplicates zero, normalized shape duplicates zero, near-duplicate pairs zero at the current threshold.
- Remaining to 600-row initial target: `250` manually authored rows.

### 2026-06-29 - Manual V4 Goal Checkpoint At 390 Rows
- Expanded `manual_v4` to train `297`, validation `50`, test `43`, total `390`.
- Quality gates pass at this checkpoint: strict routing `390/390`, semantic audit zero findings, exact duplicates zero, normalized shape duplicates zero, near-duplicate pairs zero at the current threshold.
- Remaining to 600-row initial target: `210` manually authored rows.

### 2026-06-29 - Manual V4 Goal Checkpoint At 410 Rows
- Expanded `manual_v4` to train `297`, validation `63`, test `50`, total `410`.
- Quality gates pass at this checkpoint: strict routing `410/410`, semantic audit zero findings, exact duplicates zero, normalized shape duplicates zero, near-duplicate pairs zero at the current threshold.
- Remaining to 600-row initial target: `190` manually authored rows.

### 2026-06-29 - Manual V4 Goal Checkpoint At 462 Rows
- Expanded `manual_v4` to train `325`, validation `76`, test `61`, total `462`.
- Quality gates pass at this checkpoint: strict routing `462/462`, semantic audit zero findings, exact duplicates zero, normalized shape duplicates zero, near-duplicate pairs zero at the current threshold.
- Remaining to 600-row initial target: `138` manually authored rows.

### 2026-06-30 - Manual V4 Initial Seed Target Complete
- Expanded `manual_v4` to the initial manual seed target: train `420`, validation `90`, test `90`, total `600`.
- Quality gates pass at this checkpoint: strict routing `600/600`, semantic audit zero findings, exact duplicate inputs zero, normalized shape duplicate inputs zero, duplicate IDs zero, and near-duplicate pairs zero at threshold `0.78`.
- Fixed the last uniqueness issue by rewriting one short `remove_group_member` test input that had the same sentence shape as a training row.
- Decision: this 600-row split is the trusted manual v4 seed for the next FunctionGemma conversion/eval pass. The older v3 corpus remains stress/validator data only.
- Next step: regenerate FunctionGemma-format train/validation artifacts, run evaluator checks against the locked manual test set, then decide whether to expand manual v4 toward the larger `1,500-1,800` train-row target before the next LoRA run.

### 2026-06-30 - Manual V4 Expanded To 700 Rows
- Expanded `manual_v4` by another 100 hand-authored rows instead of training immediately: train `490`, validation `105`, test `105`, total `700`.
- The added batch focused on harder mobile/TTS-style commands: multi-step group creation with multiple expenses, missing amounts, percentage splits, full-owed phrasing, corrections, excluded participants, settlement wording, lookup/navigation, and unsupported app-boundary requests.
- Quality gates pass at this checkpoint: strict routing `700/700`, semantic audit zero findings, exact duplicate inputs zero, normalized shape duplicate inputs zero, duplicate IDs zero, and near-duplicate pairs zero at threshold `0.78`.
- Learning: the validator caught unsupported schema drift (`aliases`, unsupported financial metrics/query fields) and the duplicate scan caught repeated short sentence shells. Both were repaired before promotion.
- Next step: keep expanding manually in reviewed checkpoints until the train split is large enough for a stronger LoRA run, while preserving validation/test uniqueness.

### 2026-06-30 - Manual V4 Expanded To 800 Rows
- Expanded `manual_v4` by another 100 manually authored rows: train `560`, validation `120`, test `120`, total `800`.
- The new batch continued hard-case coverage across multi-step commands, missing amounts, corrections, percentage splits, full-owed expenses, settlements, search/open/highlight intents, date-window financial questions, clarification replies, and unsupported boundary requests.
- Quality gates pass at this checkpoint: strict routing `800/800`, semantic audit zero findings, exact duplicate inputs zero, normalized shape duplicate inputs zero, duplicate IDs zero, and near-duplicate pairs zero at threshold `0.78`.
- Learning: as the corpus grows, the near-duplicate scan can surface older rows that become too close to newer phrasing. Rewriting those rows before committing keeps the manual set from drifting into repeated shells.
- Next step: continue manual expansion in 100-row checkpoints or pause to run a dry eval only if we want failure-guided authoring before the 1,500+ train-row target.

### 2026-06-30 - Manual V4 Expanded To 1,000 Rows
- Expanded `manual_v4` by 200 manually authored rows: train `700`, validation `150`, test `150`, total `1,000`.
- The batch added more long multi-step examples, missing-amount payer phrasing, percentage and full-amount splits, settlement variants, lookup/open/highlight navigation, financial summaries, clarification replies, and unsupported app-boundary requests.
- Quality gates pass at this checkpoint: strict routing `1,000/1,000`, semantic audit zero findings, exact duplicate inputs zero, normalized shape duplicate inputs zero, duplicate IDs zero, and near-duplicate pairs zero at threshold `0.78`.
- Learning: missing-amount phrases like `no amount paid X` can confuse audits and likely small models; the cleaner pattern is `amount missing payer X`. Lookup rows also need varied navigation wording to avoid repetitive `open X and highlight Y` shells.
- Next step: either continue toward the `1,500-1,800` train-row target or run a dry eval/tooling pass on the 1,000-row corpus before the next large authoring block.

### 2026-06-30 - Manual V4 Dry Eval And Coverage Report
- Froze the exact pre-training manual target at `2,400` rows total: train `1,700`, validation `350`, locked test `350`.
- Added `tools/finetune/report_splitmaa_dataset.py` to generate reproducible JSON and Markdown coverage reports for the manual corpus.
- Generated `dataset_report.json` and `dataset_report.md` for `manual_v4`: current rows `1,000`, remaining rows `1,400`, max input words `38`, max operations `4`.
- Evaluator self-test over `manual_v4/test.jsonl` passes at `1.0` for parseability, schema validity, workflow accuracy, operation sequence accuracy, exact intent, and leaf argument accuracy.
- Coverage learning: the current manual v4 set is intentionally messy-heavy; if we want the earlier 70/30 messy-clean blend, the remaining rows should deliberately add cleaner, well-punctuated English examples while keeping hard workflow semantics.

### 2026-06-30 - Manual V4 Expanded To 1,400 Rows
- Expanded `manual_v4` by another 400 manually authored rows: train `980`, validation `210`, test `210`, total `1,400`.
- The expansion deliberately added cleaner, well-punctuated examples while still covering hard workflows: multi-step group plus expense creation, corrections, missing amounts, full-owed phrasing, percentage splits, exclusions, settlements, lookup/open/highlight intent, date-window financial questions, clarification replies, and unsupported app-boundary requests.
- Quality gates pass at this checkpoint: strict routing `1,400/1,400`, semantic audit zero findings, evaluator self-test over the locked test split at `1.0` for all reported metrics.
- Converted passing train and validation splits into FunctionGemma format: `train.functiongemma.jsonl` has `980` examples and `validation.functiongemma.jsonl` has `210` examples.
- Duplicate review: exact normalized duplicate inputs are zero. Near-duplicate scan at threshold `0.78` reports `7` low-risk pairs, mostly short command shapes such as compact totals, settlements, and simple add-expense commands. High-risk repeated shells found during the run were rewritten before promotion.
- Learning: as the manual corpus gets bigger, the strict validator is necessary but insufficient. The semantic audit caught a payer/name conflict, and the near-duplicate scan caught repeated short-command shapes. Both checks should remain mandatory before future dataset commits.
- Remaining to frozen pre-training target: `1,000` rows total, aiming for train `1,700`, validation `350`, locked test `350`.

### 2026-06-30 - Manual V4 Expanded To 1,500 Rows
- Expanded `manual_v4` by another 100 manually authored rows: train `1,050`, validation `225`, test `225`, total `1,500`.
- The new block added fresh contexts around brunch, hostel mess, dog park, art class, coding meetup, family dinner, music sessions, temple drives, taco nights, and coffee crawls. Coverage again includes multi-step creation, missing amounts, percentage splits, full-owed expenses, settlements, search/open/highlight intent, date-window financial questions, clarification replies, and unsupported app-boundary requests.
- Quality gates pass at this checkpoint: strict routing `1,500/1,500`, semantic audit zero findings, evaluator self-test over the locked test split at `1.0` for all reported metrics.
- Converted passing train and validation splits into FunctionGemma format: `train.functiongemma.jsonl` has `1,050` examples and `validation.functiongemma.jsonl` has `225` examples.
- Duplicate review: exact normalized duplicate inputs are zero. Near-duplicate scan at threshold `0.78` reports `12` low-risk pairs, primarily short lookup/financial command shapes that remain semantically distinct.
- Remaining to frozen pre-training target: `900` rows total, aiming for train `1,700`, validation `350`, locked test `350`.

### 2026-06-30 - Manual V4 Expanded To 1,600 Rows
- Expanded `manual_v4` by another 100 manually authored rows: train `1,120`, validation `240`, test `240`, total `1,600`.
- The block added new everyday contexts around library sales, flat pantry expenses, picnics, hostel laundry, soccer, seminars, food halls, train days, exam prep, and mural days. It continued coverage for multi-step creation, missing amounts, percentage splits, full-owed expenses, corrections, settlements, lookup/open/highlight intent, date-window financial questions, clarification replies, and unsupported app-boundary requests.
- Quality gates pass at this checkpoint: strict routing `1,600/1,600`, semantic audit zero findings, evaluator self-test over the locked test split at `1.0` for all reported metrics.
- Converted passing train and validation splits into FunctionGemma format: `train.functiongemma.jsonl` has `1,120` examples and `validation.functiongemma.jsonl` has `240` examples.
- Duplicate review: exact normalized duplicate inputs are zero. Near-duplicate scan at threshold `0.78` reports `19` low-risk pairs, mostly compact lookup and financial command shapes. A semantic-audit payer conflict and several repeated shells were repaired before promotion.
- Remaining to frozen pre-training target: `800` rows total, aiming for train `1,700`, validation `350`, locked test `350`.

### 2026-06-30 - Manual V4 Frozen Target Complete
- Expanded `manual_v4` to the frozen pre-training target: train `1,700`, validation `350`, locked test `350`, total `2,400`.
- The final expansion added fresh train, validation, and locked-test rows across multi-step group-plus-expense workflows, entity mutations, expense edits/deletes/settlements/split changes, record lookup/navigation, financial answers, clarification replies, and unsupported safety boundaries.
- Quality gates pass at the final checkpoint: strict routing `2,400/2,400`, semantic audit zero findings, evaluator self-test over the locked test split at `1.0` for all reported metrics.
- Converted passing train and validation splits into FunctionGemma format: `train.functiongemma.jsonl` has `1,700` examples and `validation.functiongemma.jsonl` has `350` examples.
- Duplicate review: exact normalized duplicate inputs are zero. The loose near-duplicate scan at threshold `0.78` reports `58` low-risk pairs and no pairs above `0.90`; the remaining pairs are mostly intentionally similar short lookup, financial, and clarification shapes across different entities/currencies.
- Learning: semantic audit stayed valuable even late in the process; it caught a payer-name conflict in a multi-step row before final promotion. Multi-word payer phrases can trigger the current audit heuristic, so rows should either phrase the payer unambiguously or use a single natural reference when the example is not explicitly testing name expansion.
- Next step: train a controlled LoRA run from `google/functiongemma-270m-it` using the final manual v4 FunctionGemma artifacts, then evaluate against the locked manual test split before wiring any fine-tuned model into the app.

### 2026-06-30 - FunctionGemma Training Notebook Progress Dashboard
- Added checkpoint resume support to the FunctionGemma SFT script after the first Windows notebook run reached epoch `1/3` and saved `checkpoint-213`, then failed with only a wrapper `exit code 1` visible in the notebook.
- Added a Splitmaa-specific training progress event stream and notebook renderer so training shows one in-place dashboard-style progress bar instead of raw Hugging Face log dictionaries.
- The dashboard displays step, epoch, percent complete, elapsed time, ETA, train loss, eval loss, gradient norm, learning rate, and lightweight token accuracy from a small number of eval batches.
- Decision: keep token accuracy lightweight because TRL's full entropy/token-accuracy pass previously caused CUDA OOM on the 12 GB Windows GPU.

### 2026-06-30 - First Manual V4 LoRA Result
- Completed the first local Windows LoRA run against `google/functiongemma-270m-it` using manual v4 FunctionGemma artifacts: final checkpoint `checkpoint-639`, epoch `3.0/3.0`, final train loss around `0.1685`, final eval loss `0.1299`, lightweight token accuracy `0.9733`.
- The adapter was saved at `outputs/functiongemma-splitmaa-manual-v4-lora/adapter_model.safetensors`.
- Locked-test evaluation is not acceptable for app wiring yet: parseable rate `0.8543`, schema-valid rate `0.3029`, workflow accuracy `0.5029`, operation sequence accuracy `0.3829`, exact intent accuracy `0.0286`, leaf argument accuracy `0.4312`.
- Learning: the low eval loss and high lightweight token accuracy are misleading because the lean trainer currently computes loss over the whole chat transcript, including repeated prompt/tool schema tokens, instead of masking the prompt and training only on the assistant tool call.
- Learning: the current FunctionGemma tool schema exposes operation `args` as a loose object, while the app validator is strict. This lets the model invent invalid keys and metrics such as `displayName`, `entityType`, `total_amount`, and `balance`.
- Next fix before another serious LoRA run: add assistant-only loss masking and make the model-facing tool schema carry strict operation argument shapes that match the validator.

### 2026-06-30 - Masked Training And Compact Tool Contract Decision
- Implemented assistant-only label masking for the lean local trainer so prompt/tool-schema/user tokens are ignored with `-100` labels and only the assistant tool call contributes to training loss.
- Tried a fully expanded nested operation JSON Schema, but it pushed the prompt to roughly `2.6k-5.4k` tokens before the assistant answer. At `max_length=1024/2048`, that truncates all or most assistant labels, and at much larger lengths it materially increases activation memory on the 12 GB GPU.
- Decision: use a compact model-facing tool contract with strict workflow/operation enums and concise operation arg-key rules in the tool description. Keep app-side validator strict and use eval to reject invented keys.
- Regenerated manual v4 FunctionGemma train/validation artifacts with the compact contract. New prompt lengths are about `984-1033` tokens; full train examples max at `1556` tokens, so the next run uses `max_length=2048` for zero truncation.
- Decision: write the next adapter to `outputs/functiongemma-splitmaa-manual-v4-lora-masked` so it cannot accidentally resume the first bad run.

### 2026-06-30 - Full Fine-Tune Trial Decision
- Reconsidered full fine-tuning for FunctionGemma 270M on the local 12 GB VRAM / 32 GB RAM Windows machine. Full fine-tuning means updating all base model parameters instead of training a small LoRA adapter.
- Decision: try full fine-tuning now that the masking and compact contract issues are fixed. The run uses conservative settings first: `max_length=2048`, `batch_size=1`, `gradient_accumulation_steps=8`, `bf16`, `gradient_checkpointing`, and learning rate `2e-5`.
- The full run writes to `outputs/functiongemma-splitmaa-manual-v4-full-masked` so it cannot resume or overwrite the earlier LoRA experiment.
- Updated evaluation loading so the same prediction script can read either a PEFT adapter directory or a full saved Hugging Face model directory.
- Risk: full fine-tuning may still OOM or overfit despite the small model size because activation memory, optimizer state, CUDA overhead, and Windows/PyTorch behavior matter more than parameter count alone.

### 2026-06-30 - Local Full Fine-Tune OOM At 2048
- The first local full fine-tune attempt failed with CUDA OOM during backward inside Gemma3 rotary embedding recomputation, even with `batch_size=1`, `bf16`, and gradient checkpointing.
- Dataset stats were healthy before the crash: train max full tokens `1556`, max prompt `1033`, max trainable answer tokens `527`, truncated examples `0`, zero-trainable examples `0`.
- Decision: local full fine-tuning should use `max_length=1600`, not `2048`, because `1600` still gives zero truncation for the current dataset while reducing activation memory.
- Updated the full-training notebook output to `outputs/functiongemma-splitmaa-manual-v4-full-masked-len1600` and disabled gradient-checkpoint RNG preservation to reduce overhead.

### 2026-06-30 - Kaggle Full Fine-Tune FP16 Gradient Failure
- Kaggle T4 x2 smoke test reached full fine-tuning correctly: `trainable params: 268,098,176`, `trainable%: 100.0000`.
- The run failed before completing the first step with `ValueError: Attempting to unscale FP16 gradients.` This happened because the script loaded the full trainable base model directly in FP16 and Trainer/Accelerate then tried to use FP16 gradient scaling.
- Decision: split model load dtype from Trainer AMP dtype. For Kaggle T4/P100 full fine-tuning, load trainable weights as `float32` and use Trainer AMP `float16`: `--dtype float32 --amp-dtype float16`.

