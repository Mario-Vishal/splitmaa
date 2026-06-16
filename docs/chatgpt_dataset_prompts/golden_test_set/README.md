# Splitmaa Golden Test Set Prompts

Use these prompts to generate locked evaluation data for FunctionGemma.

Rules:
- Use a fresh ChatGPT chat per prompt file.
- Paste the full prompt exactly.
- Copy only JSONL output into the matching file under `datasets/splitmaa_functiongemma/incoming_test/`.
- Do not mix these examples into train or validation.
- After validation and acceptance, these examples append only to `datasets/splitmaa_functiongemma/test.jsonl`.
- Once promoted, treat `test.jsonl` as locked unless the schema changes.

Target first golden test set:
- 20 entity mutation examples
- 25 expense mutation examples
- 25 multi-step examples
- 20 record lookup examples
- 20 financial answer examples
- 15 clarification response examples
- 10 unsupported examples

