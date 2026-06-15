# Fine-Tuning

Fine-tuning is intentionally not complete.

The project should only fine-tune FunctionGemma after:

- action schemas stabilize
- parser prompts stabilize
- eval coverage is meaningful
- baseline failure modes are measured

Target future path:

```text
dataset -> baseline eval -> failure analysis -> LoRA/QLoRA experiment -> validation eval -> export -> mobile conversion
```
