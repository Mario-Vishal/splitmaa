# Expense Mutation Golden Test Prompt

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
workflowType = "expense_mutation"

Allowed operations:
- add_expense
- edit_expense
- delete_expense
- settle_up
- change_split

Rules:
- Use amountText, never amountMinor, amountCents, or floating-point money.
- Use USD and INR only.
- Use dateText/dateIntent for dates; do not resolve actual UTC boundaries.
- Financial writes extract intent only; app handles confirmation and commits.
- Missing amount, payer, participant, target expense, or settlement target must use operations: [] and missingFields.
- Include corrections like "20 sorry 40", typos, "I was not part but I paid", "he owes fully", destructive deletes, and settlement wording.
- The app owns IDs, entity resolution, money math, and confirmation.

Valid examples:
{"id":"gold_expense_example_001","input":"coffee was 20 dollars I paid but I was not part split only between Abhishek and Koushik","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"expense_mutation","confidence":0.88,"currencyHint":"USD","operations":[{"operationType":"add_expense","args":{"description":"coffee","amountText":"20 dollars","currency":"USD","paidBy":{"refType":"current_user"},"split":{"splitType":"equal","participants":[{"refType":"name","value":"Abhishek"},{"refType":"name","value":"Koushik"}]},"category":"food","paymentType":"unknown"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_expense_example_002","input":"delete the dinner expense from last week but ask me before doing it","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"expense_mutation","confidence":0.78,"operations":[{"operationType":"delete_expense","args":{"expenseRef":{"refType":"name","value":"dinner"},"date":{"dateText":"last week","dateIntent":"previous_week"}}}],"missingFields":[],"ambiguities":["The app must require strong confirmation before deleting an expense."]}}}

Generate exactly 25 new JSONL examples.
Use ids exactly like gold_expense_001, gold_expense_002, etc.
Return JSONL only.
```

