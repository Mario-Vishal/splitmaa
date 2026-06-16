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

