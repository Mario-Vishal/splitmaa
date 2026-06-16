# FunctionGemma Evaluation

Splitmaa evaluates FunctionGemma as a workflow intent extractor, not as a chat model.

The locked evaluation set is:

```text
datasets/splitmaa_functiongemma/test.jsonl
```

The evaluator checks:

- output can be parsed as one `extract_workflow_intent` tool call
- output passes the strict Splitmaa workflow schema
- `workflowType` matches expected
- operation sequence matches expected
- `missingFields` matches expected
- expected argument leaves match actual values
- normalized exact intent matches, ignoring telemetry fields such as `confidence`, `locale`, `workflowVersion`, `modelVersion`, `clientVersion`, and `ambiguities`

## Self-Test The Scorer

This proves the evaluator is wired correctly by scoring expected outputs against themselves.

```powershell
pnpm.cmd eval:functiongemma:self
```

Expected result for a healthy scorer is `1.0` on all metrics.

## Score Saved Predictions

Use this when model outputs are captured from Android, a desktop runner, or a fine-tuning environment.

```powershell
python tools\evals\run_eval.py `
  --dataset datasets\splitmaa_functiongemma\test.jsonl `
  --predictions path\to\predictions.jsonl `
  --report reports\functiongemma_eval\baseline.json
```

Prediction rows must include the matching `id` and one output field:

```json
{"id":"gold_multi_001","rawOutput":"{\"name\":\"extract_workflow_intent\",\"arguments\":{...}}","latencyMs":321}
```

Accepted output field names:

- `actual`
- `actualToolCall`
- `toolCall`
- `rawToolCall`
- `output`
- `text`
- `rawOutput`

The scorer also accepts FunctionGemma's native special-call text, for example:

```text
<start_function_call>call:extract_workflow_intent{schemaVersion:<escape>1.0<escape>,...}<end_function_call>
```

The parser normalizes that native format into the same `{"name":"extract_workflow_intent","arguments":...}` shape before scoring.

## Capture Predictions From A Desktop CLI

Use this when you have any desktop model command that reads a prompt from stdin and prints the raw model response to stdout.

```powershell
python tools\evals\capture_predictions.py `
  --dataset datasets\splitmaa_functiongemma\test.jsonl `
  --model-command "your-model-command --model C:\path\to\model" `
  --output reports\functiongemma_eval\baseline_predictions.jsonl
```

Then score the captured file:

```powershell
python tools\evals\run_eval.py `
  --dataset datasets\splitmaa_functiongemma\test.jsonl `
  --predictions reports\functiongemma_eval\baseline_predictions.jsonl `
  --report reports\functiongemma_eval\baseline.json
```

Useful capture flags:

- `--limit 10` for a quick smoke run.
- `--resume` to continue a partially captured file.
- `--timeout-seconds 300` for slow model startup.
- `--include-prompt` to store prompts in the prediction file while debugging.

## Capture With LiteRT-LM Python

Install the official LiteRT-LM Python package into the local project venv:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install litert-lm-api
```

Run one prompt through a `.litertlm` model:

```powershell
"hello" | .venv\Scripts\python.exe tools\evals\litert_lm_prompt.py `
  --model C:\Users\mario\OneDrive\Desktop\functiongemma-270m-ft-mobile-actions_Google_Tensor_G5.litertlm `
  --cache-dir .cache\litert-lm
```

Capture the locked test set:

```powershell
python tools\evals\capture_predictions.py `
  --dataset datasets\splitmaa_functiongemma\test.jsonl `
  --model-command ".venv\Scripts\python.exe tools\evals\litert_lm_prompt.py --model C:\Users\mario\OneDrive\Desktop\functiongemma-270m-ft-mobile-actions_Google_Tensor_G5.litertlm --cache-dir .cache\litert-lm" `
  --output reports\functiongemma_eval\litert_predictions.jsonl `
  --timeout-seconds 300
```

The `cache-dir` should be inside the repo or another writable local folder. Avoid writing runtime cache files next to models in OneDrive.

Current local note: `mobile_actions_q8_ekv1024.litertlm` loads with the LiteRT-LM Python runtime, but it is not the Splitmaa FunctionGemma target. `functiongemma-270m-ft-mobile-actions_Google_Tensor_G5.litertlm` currently fails on desktop engine creation with `Input tensor not found`, so baseline eval needs a desktop-compatible FunctionGemma `.litertlm` artifact.

Then score:

```powershell
python tools\evals\run_eval.py `
  --dataset datasets\splitmaa_functiongemma\test.jsonl `
  --predictions reports\functiongemma_eval\litert_predictions.jsonl `
  --report reports\functiongemma_eval\litert_baseline.json
```

## Capture With Hugging Face PEFT Adapter

Use this for a LoRA adapter trained from `google/functiongemma-270m-it` before it is merged/exported to a mobile runtime.

```powershell
.venv-train\Scripts\python.exe tools\evals\hf_peft_predictions.py `
  --adapter outputs\functiongemma-splitmaa-lora-colab `
  --output reports\functiongemma_eval\colab_lora_predictions.jsonl `
  --max-new-tokens 768
```

Then score:

```powershell
.venv-train\Scripts\python.exe tools\evals\run_eval.py `
  --dataset datasets\splitmaa_functiongemma\test.jsonl `
  --predictions reports\functiongemma_eval\colab_lora_predictions.jsonl `
  --report reports\functiongemma_eval\colab_lora.json `
  --failure-limit 200
```

Current Colab LoRA checkpoint result over the locked 138-example test set:

- parseable: `0.9638`
- schema valid: `0.7826`
- workflow accuracy: `0.4928`
- operation sequence accuracy: `0.2899`
- exact intent accuracy: `0.0072`
- leaf argument accuracy: `0.4803`

This checkpoint is not production-ready. It learned the function-call syntax but still over-routes to `multi_step`, overuses `add_expense` / `provide_missing_field`, and confuses financial operations such as `compute_summary`, `compute_total`, and `compute_balance`.

## Score A Command Runner

Use this once a CLI model runner exists. The command receives the prompt on stdin and prints the raw model output to stdout.

```powershell
python tools\evals\run_eval.py `
  --dataset datasets\splitmaa_functiongemma\test.jsonl `
  --model-command "your-model-command --flags" `
  --report reports\functiongemma_eval\baseline.json
```

## Report Outputs

Reports are generated under:

```text
reports/functiongemma_eval/
```

They are intentionally ignored by git. Commit datasets, prompts, and evaluator code; keep local model reports as reproducible artifacts unless a specific report needs to be attached to an issue or release note.
