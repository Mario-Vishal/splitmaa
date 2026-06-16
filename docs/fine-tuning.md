# Fine-Tuning

Splitmaa fine-tuning follows Google's official FunctionGemma SFT workflow:

```text
canonical JSONL -> FunctionGemma chat/tool-call JSONL -> Hugging Face TRL SFTTrainer -> validation eval -> export -> LiteRT-LM/mobile conversion
```

Official reference:

```text
https://ai.google.dev/gemma/docs/functiongemma/finetuning-with-functiongemma
```

The official guide fine-tunes `google/functiongemma-270m-it` with Hugging Face `transformers`, `datasets`, and TRL `SFTTrainer`. It uses conversational records with `messages` and `tools`; the assistant message contains a `tool_calls` entry.

## Current Contract

- Train from base `google/functiongemma-270m-it`.
- Use one model-facing function: `extract_workflow_intent`.
- Store canonical staging JSONL under `datasets/splitmaa_functiongemma/`.
- Validate every batch with `tools/finetune/validate_splitmaa_dataset.py`.
- Convert accepted splits with `tools/finetune/convert_to_functiongemma.py`.
- Train with `tools/finetune/train_functiongemma_sft.py` in Colab, Kaggle, Vertex, or another GPU environment.

The dataset trains workflow routing, strict operation extraction, names/references instead of IDs, `amountText`/`dateText`, missing information vs unsupported requests, and clarification replies such as "the second one."

## Prepare Data

Validate canonical splits:

```powershell
python tools\finetune\validate_splitmaa_dataset.py datasets\splitmaa_functiongemma\train.jsonl datasets\splitmaa_functiongemma\validation.jsonl datasets\splitmaa_functiongemma\test.jsonl
```

Convert train and validation to FunctionGemma chat/tool-call JSONL:

```powershell
python tools\finetune\convert_to_functiongemma.py datasets\splitmaa_functiongemma\train.jsonl datasets\splitmaa_functiongemma\train.functiongemma.jsonl
python tools\finetune\convert_to_functiongemma.py datasets\splitmaa_functiongemma\validation.jsonl datasets\splitmaa_functiongemma\validation.functiongemma.jsonl
```

## Train

Install dependencies in a GPU environment:

```bash
pip install torch tensorboard transformers datasets accelerate evaluate trl peft protobuf sentencepiece
```

Login to Hugging Face after accepting the `google/functiongemma-270m-it` license:

```powershell
.venv-train\Scripts\python.exe tools\finetune\hf_ipv4_login.py
```

This project uses the helper above because the normal `hf auth login` may fail on Windows networks where `huggingface.co` resolves through a broken IPv6 route. The helper stores the token through `huggingface_hub.login(...)` and verifies access to `google/functiongemma-270m-it`.

If model download stalls or fails with `WinError 10054` / `RemoteProtocolError`, pre-download the model with the IPv4 helper:

```powershell
.venv-train\Scripts\python.exe tools\finetune\hf_ipv4_download.py --repo-id google/functiongemma-270m-it
```

The helper disables the Windows symlink warning, forces IPv4 by default, and downloads with one worker to avoid flaky parallel HEAD requests.
It also skips `.litertlm` / `.task` artifacts by default because Hugging Face SFT training needs the `transformers` checkpoint files, not mobile runtime artifacts.

Run training:

```powershell
.venv-train\Scripts\python.exe tools\finetune\train_functiongemma_sft.py `
  --train datasets\splitmaa_functiongemma\train.functiongemma.jsonl `
  --validation datasets\splitmaa_functiongemma\validation.functiongemma.jsonl `
  --output-dir outputs\functiongemma-splitmaa-sft `
  --trainer-backend lean `
  --training-mode lora `
  --batch-size 1 `
  --eval-batch-size 1 `
  --gradient-accumulation-steps 4 `
  --epochs 8 `
  --max-length 1024 `
  --local-files-only
```

Default Windows training settings use a lean local LoRA path:

- learning rate: `5e-5`
- epochs: `8`
- train batch size: `1`
- eval batch size: `1`
- gradient accumulation steps: `4`
- LoRA rank: `8`
- LoRA alpha: `16`
- LoRA target modules: attention projections by default
- optimizer: `adamw_torch_fused`
- eval strategy: `epoch`
- save strategy: `epoch`
- packing: `false`
- dtype: `bfloat16`

The Windows path intentionally avoids Hugging Face Datasets for the lean trainer because `datasets.load_dataset(...)` hung in the local environment. It also avoids TRL's extra token entropy/accuracy metric path, which materialized full-vocabulary logits and caused VRAM spikes. Manual and scripted smoke tests passed on the 12 GB RTX 5070 Ti Laptop GPU at `--max-length 1024`, including a full validation pass.

Full fine-tuning is not the recommended local Windows path. For this project, use LoRA first; merge/export later after the adapter is validated.

## Evaluate

Before and after training, evaluate against the locked test set:

```powershell
python tools\evals\run_eval.py --dataset datasets\splitmaa_functiongemma\test.jsonl --predictions reports\functiongemma_eval\baseline_predictions.jsonl --report reports\functiongemma_eval\baseline.json
```

The test set is intentionally not used for training.

## Export

After choosing a checkpoint, export/convert for LiteRT-LM or mobile using the current Google AI Edge conversion path. Do not fine-tune a `.litertlm` artifact directly; train the Hugging Face FunctionGemma model, then convert the selected result.
