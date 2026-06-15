# Splitmaa FunctionGemma Dataset Schema

Source files use canonical staging JSONL. Each line is one JSON object:

```json
{"id":"create_group_001","input":"create a group called California add Sai and Deepak","expected":{"name":"create_group","arguments":{"groupName":"California","memberNames":["Sai","Deepak"],"currency":"USD"}}}
```

Rules:

- English only.
- Currencies are `USD` and `INR` only.
- One expected tool call per example.
- No markdown, no JSON arrays, no comments inside JSONL files.
- Mutation tools should include enough arguments for deterministic app execution.
- Read/search/navigation tools should return the intended tool call, not a natural-language answer.
- Grounded answer examples use trusted app-provided result payloads in `arguments`.

Supported tool names:

- `create_group`
- `create_contact`
- `add_expense`
- `settle_up`
- `draft_expense_plan`
- `query_balance`
- `query_financial_summary`
- `search_records`
- `open_record`
- `show_search_results`
- `clarification_required`
- `unsupported_request`

`draft_expense_plan` is for complex multi-step commands only. It contains 1-5 operations, and each operation must be one of `create_group`, `create_contact`, `add_expense`, or `settle_up`. Use `clarification_required` instead when a required group name, amount, payer, participant, or duplicate-contact choice is missing.

The local validator in `tools/finetune/validate_splitmaa_dataset.py` is the source of truth before examples move into train, validation, or locked test files.
