# Financial Answer Golden Test Prompt

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
Make examples realistic, messy, and high-quality.
Do not copy wording from examples.

Every line must use:
expected.name = "extract_workflow_intent"
workflowType = "financial_answer"

Allowed operations:
- compute_balance
- compute_total
- compute_summary
- compute_date_window_total

Rules:
- The model identifies question and filters only.
- The app fetches trusted SQLite data and creates the final English answer.
- Use dateText/dateIntent for relative dates; do not resolve UTC boundaries.
- Use USD and INR only.
- Do not create records, navigate, or open records.
- Include last month, this month, last year, person totals, group totals, total owed to me, total I owe, net balance, and query-vs-lookup boundary cases.

Valid examples:
{"id":"gold_financial_example_001","input":"how much did I owe Aravind last month use previous calendar month not last 30 days","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.86,"currencyHint":"USD","operations":[{"operationType":"compute_date_window_total","args":{"metric":"person_balance","personRef":{"refType":"name","value":"Aravind"},"currency":"USD","dateRange":{"dateText":"last month","dateIntent":"previous_calendar_month"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_financial_example_002","input":"total amount owed to me in rupees across everything right now","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.86,"currencyHint":"INR","operations":[{"operationType":"compute_summary","args":{"metric":"total_owed_to_me","currency":"INR"}}],"missingFields":[],"ambiguities":[]}}}

Generate exactly 20 new JSONL examples.
Use ids exactly like gold_financial_001, gold_financial_002, etc.
Return JSONL only.
```

