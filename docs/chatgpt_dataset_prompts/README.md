# ChatGPT Dataset Prompts

These files are paste-ready for web ChatGPT. Each file contains:

- the full task instructions
- the allowed workflow type
- the allowed operation types
- 10 inline realistic examples
- the exact generation request

Use one separate ChatGPT chat per file:

- `entity_mutation.md`
- `expense_mutation.md`
- `multi_step.md`
- `record_lookup.md`
- `financial_answer.md`
- `clarification_response.md`
- `unsupported.md`

Do not paste local file paths into ChatGPT. Open the relevant file, copy the entire prompt, paste it into ChatGPT, and save the returned JSONL locally under `datasets/splitmaa_functiongemma/incoming/`.
