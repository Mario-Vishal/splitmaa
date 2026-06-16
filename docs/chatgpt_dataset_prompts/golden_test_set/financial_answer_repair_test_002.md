# Financial Answer Golden Repair Test Prompt 002

Paste this entire prompt into a fresh ChatGPT chat.

```text
You are generating locked test data for Splitmaa, an English-only local expense-splitting mobile app.

Return JSONL only.
One JSON object per line.
No markdown.
No code block.
No JSON array.
No explanations.

These examples are for a locked test set, not training.
This is a repair pass for financial_answer examples. Follow the schema strictly.
Do not copy wording from examples.
Do not reuse ids from earlier gold_financial examples.

Every line must use:
expected.name = "extract_workflow_intent"
workflowType = "financial_answer"

Allowed operationType values:
- compute_balance
- compute_total
- compute_summary
- compute_date_window_total

Allowed args keys for every compute operation:
- metric
- personRef
- groupRef
- currency
- dateRange

No other args keys are allowed.

Allowed metric values only:
- total_owed_to_me
- total_i_owe
- net_balance
- total_spent
- person_balance
- group_total

Forbidden metrics and fields:
- Do not use person_total.
- Do not use expense_total.
- Do not use group_balance.
- Do not use group_owed_to_me.
- Do not use filters.
- Do not use categoryRef.
- Do not use descriptionQuery.
- Do not use query.
- Do not use category.
- Do not create search, navigation, or record lookup examples.

Allowed reference shapes:
{"refType":"name","value":"Aravind"}
{"refType":"current_user"}

Rules:
- The model identifies the financial question and filters only.
- The app fetches trusted SQLite data and writes the final English answer.
- Use dateText/dateIntent for relative dates; do not resolve UTC boundaries.
- Use USD and INR only.
- If the user asks to find/open/show a specific record, that is record_lookup, not financial_answer. Do not generate that here.
- Include last month, this month, last year, person balance, group total, total owed to me, total I owe, net balance, total spent, and INR/USD variants.
- For category-like wording such as "groceries total", convert it to metric total_spent with a group/date/currency if available, but do not output categoryRef.
- If there is not enough info to answer, use operations: [] and missingFields.

Valid examples to follow:
{"id":"gold_financial_repair_example_001","input":"how much does Aravind owe me right now in dollars","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.88,"currencyHint":"USD","operations":[{"operationType":"compute_balance","args":{"metric":"person_balance","personRef":{"refType":"name","value":"Aravind"},"currency":"USD"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_financial_repair_example_002","input":"how much did Goa trip cost in rupees last month","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.86,"currencyHint":"INR","operations":[{"operationType":"compute_summary","args":{"metric":"group_total","groupRef":{"refType":"name","value":"Goa trip"},"currency":"INR","dateRange":{"dateText":"last month","dateIntent":"previous_calendar_month"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_financial_repair_example_003","input":"what is my net balance this year in dollars","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.84,"currencyHint":"USD","operations":[{"operationType":"compute_summary","args":{"metric":"net_balance","currency":"USD","dateRange":{"dateText":"this year","dateIntent":"current_calendar_year"}}}],"missingFields":[],"ambiguities":[]}}}

Generate exactly 25 new JSONL examples.
Use ids exactly like gold_financial_repair_002_001, gold_financial_repair_002_002, etc.
Return JSONL only.
```

