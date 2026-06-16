# Splitmaa FunctionGemma Dataset Schema

Source files use canonical staging JSONL. Each line is one JSON object:

```json
{"id":"create_group_001","input":"create a group called California add Sai and Deepak","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.91,"currencyHint":"USD","operations":[{"operationType":"create_group","args":{"groupName":"California","members":[{"refType":"name","value":"Sai"},{"refType":"name","value":"Deepak"}],"currency":"USD"}}],"missingFields":[],"ambiguities":[]}}}
```

Rules:

- English only.
- Currencies are `USD` and `INR` only.
- One expected tool call per example: `extract_workflow_intent`.
- No markdown, no JSON arrays, no comments inside JSONL files.
- The model outputs names and natural references, not trusted database IDs, unless the ID came from trusted pending UI context.
- The model outputs `amountText` and `currency`; the app converts to minor units.
- The model outputs `dateText` and `dateIntent`; the app resolves timezone-aware UTC boundaries.
- Incomplete Splitmaa actions use `missingFields`, not `unsupported`.
- Out-of-domain requests use `workflowType: "unsupported"`.
- Search/navigation/display are semantic operations. The app may internally query SQLite, display result cards, navigate, and highlight.

Model-facing function:

- `extract_workflow_intent`

Workflow types:

- `entity_mutation`
- `expense_mutation`
- `multi_step`
- `record_lookup`
- `financial_answer`
- `clarification_response`
- `unsupported`

Operation types:

- Entity: `create_contact`, `create_group`, `add_group_member`, `remove_group_member`
- Expense: `add_expense`, `edit_expense`, `delete_expense`, `settle_up`, `change_split`
- Lookup/UI: `search_records`, `open_record`, `list_records`, `show_previous`, `get_record_metadata`
- Financial: `compute_balance`, `compute_total`, `compute_summary`, `compute_date_window_total`
- Clarification: `select_option`, `provide_contact_details`, `provide_missing_field`, `cancel_pending_workflow`

Reference shapes:

```json
{"refType":"current_user"}
{"refType":"name","value":"Pabba"}
{"refType":"record_ref","entityType":"expense","id":"expense_123"}
{"refType":"last_result"}
{"refType":"active_pending_workflow"}
```

Example multi-step command:

```json
{"id":"multi_step_001","input":"create a group called california and add me and pabba and add milk equal split of 20$","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"multi_step","confidence":0.91,"currencyHint":"USD","operations":[{"operationType":"create_group","args":{"groupName":"california","members":[{"refType":"current_user"},{"refType":"name","value":"pabba"}],"currency":"USD"}},{"operationType":"add_expense","args":{"description":"milk","amountText":"20$","currency":"USD","groupRef":{"refType":"name","value":"california"},"paidBy":{"refType":"current_user"},"split":{"splitType":"equal","participants":[{"refType":"current_user"},{"refType":"name","value":"pabba"}]},"category":"groceries","paymentType":"unknown"}}],"missingFields":[],"ambiguities":[]}}}
```

Clarification response example:

```json
{"id":"clarification_response_001","input":"the second one","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.92,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"contact_picker","operations":[{"operationType":"select_option","args":{"selection":{"selectionType":"ordinal","ordinal":2,"rawText":"the second one"}}}],"missingFields":[],"ambiguities":[]}}}
```

Validation command:

```powershell
python tools/finetune/validate_splitmaa_dataset.py datasets/splitmaa_functiongemma/train.jsonl datasets/splitmaa_functiongemma/validation.jsonl datasets/splitmaa_functiongemma/test.jsonl
```

The local validator is the source of truth before examples move into train, validation, or locked test files.

Validated realistic reference examples live at:

```text
datasets/splitmaa_functiongemma/reference_realistic_examples.jsonl
datasets/splitmaa_functiongemma/reference_by_type/entity_mutation_examples.jsonl
datasets/splitmaa_functiongemma/reference_by_type/expense_mutation_examples.jsonl
datasets/splitmaa_functiongemma/reference_by_type/multi_step_examples.jsonl
datasets/splitmaa_functiongemma/reference_by_type/record_lookup_examples.jsonl
datasets/splitmaa_functiongemma/reference_by_type/financial_answer_examples.jsonl
datasets/splitmaa_functiongemma/reference_by_type/clarification_response_examples.jsonl
datasets/splitmaa_functiongemma/reference_by_type/unsupported_examples.jsonl
```

Use the per-type files as the few-shot source when generating new ChatGPT batches in separate chats. They intentionally use only the final single top-level tool name, `extract_workflow_intent`.
