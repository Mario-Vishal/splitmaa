# Fine-Tuning

Splitmaa has pivoted from FunctionGemma-native tool-call training to Qwen JSON-output training.

Current workflow:

```text
canonical Splitmaa JSONL
-> Qwen chat JSONL where assistant content is compact JSON
-> Hugging Face chat SFT
-> generation eval against locked test rows
-> merge/quantize only after eval passes
```

## Current Decision

- Primary candidate: `Qwen/Qwen2.5-0.5B-Instruct`.
- Backup candidate: `Qwen/Qwen3-0.6B`.
- Archived path: `google/functiongemma-270m-it`.
- Keep one model-facing logical call: `extract_workflow_intent`.
- Keep the existing canonical dataset source shape:

```json
{"id":"...","input":"...","expected":{"name":"extract_workflow_intent","arguments":{}}}
```

The dataset does not need a source-schema rewrite for Qwen. The compatibility change is only the training serialization: Qwen sees normal chat messages and learns to emit the expected JSON object as assistant text.

## Why Pivot

FunctionGemma is still conceptually aligned with local function calling, but the measured Splitmaa path failed the generation gates:

- Base FunctionGemma was not usable for Splitmaa without tuning.
- LoRA and full fine-tune runs had reasonable loss but poor free-generation eval.
- A one-row FunctionGemma overfit reached teacher-forced token accuracy `1.0` but still produced malformed free generation.
- Root cause: the native FunctionGemma function-call serializer places nested `args` before `operationType`, so the model has to generate a long nested object before the operation discriminator.
- Qwen2.5-0.5B passed the same one-row and 20-row gates more cleanly using strict JSON assistant output.

## Prepare Data

Validate canonical manual v4 splits:

```powershell
.\.venv-train\Scripts\python.exe tools\finetune\validate_splitmaa_dataset.py --strict-routing `
  datasets\splitmaa_functiongemma\manual_v4\train.jsonl `
  datasets\splitmaa_functiongemma\manual_v4\validation.jsonl `
  datasets\splitmaa_functiongemma\manual_v4\test.jsonl
```

Convert to Qwen chat SFT JSONL:

```powershell
pnpm dataset:qwen:manual-v4
```

Equivalent direct commands:

```powershell
.\.venv-train\Scripts\python.exe tools\finetune\convert_to_json_chat.py `
  datasets\splitmaa_functiongemma\manual_v4\train.jsonl `
  datasets\splitmaa_functiongemma\manual_v4\train.qwen.jsonl

.\.venv-train\Scripts\python.exe tools\finetune\convert_to_json_chat.py `
  datasets\splitmaa_functiongemma\manual_v4\validation.jsonl `
  datasets\splitmaa_functiongemma\manual_v4\validation.qwen.jsonl
```

Check token compatibility:

```powershell
pnpm report:qwen:manual-v4
```

At `max_length=2048`, current manual v4 Qwen chat artifacts have zero truncation.

## Train

Install training dependencies in `.venv-train`:

```powershell
.\.venv-train\Scripts\python.exe -m pip install torch tensorboard transformers datasets accelerate evaluate trl peft protobuf sentencepiece
```

Run the Qwen preset:

```powershell
pnpm train:qwen:manual-v4
```

The preset expands to:

```powershell
.\.venv-train\Scripts\python.exe tools\finetune\train_qwen_json_sft.py
```

Default Qwen training settings:

- base model: `Qwen/Qwen2.5-0.5B-Instruct`
- train: `datasets/splitmaa_functiongemma/manual_v4/train.qwen.jsonl`
- validation: `datasets/splitmaa_functiongemma/manual_v4/validation.qwen.jsonl`
- output: `outputs/qwen25-05b-splitmaa-manual-v4-lora`
- training mode: LoRA
- LoRA rank: `16`
- LoRA alpha: `32`
- dtype: `float32`
- AMP: disabled
- max length: `2048`
- epochs: `3`
- batch size: `1`
- gradient accumulation: `8`

Use LoRA while iterating. Full fine-tuning Qwen2.5-0.5B is possible in larger environments, but it is not the right next step until generation eval is strong.

## Evaluate

Capture predictions:

```powershell
pnpm eval:qwen:manual-v4:capture
```

Score predictions:

```powershell
pnpm eval:qwen:manual-v4
```

The locked manual test set remains canonical staging JSONL, not Qwen chat JSONL, because the evaluator compares generated JSON against `expected`.

Minimum before app wiring:

- schema-valid rate `>= 0.95`
- workflow accuracy `>= 0.85`
- operation sequence accuracy `>= 0.80`
- no systematic invented trusted IDs
- no systematic prose after JSON

## Export

After choosing a checkpoint:

1. Merge LoRA into the base model.
2. Run full locked-test generation eval again.
3. Quantize for mobile, probably Q4 first.
4. Package as an optional local AI model download, not inside the base app binary.

Expected mobile model pack size for Qwen2.5-0.5B:

- raw model: about `953 MB`
- Q4 quantized model pack: roughly `300-400 MB`
- app plus model installed size: roughly `450-650 MB`

## Archived FunctionGemma Path

FunctionGemma artifacts and docs stay in the repo for audit/history and article material. Do not delete them yet. The active training path is Qwen JSON output unless a future bakeoff reverses the decision.
