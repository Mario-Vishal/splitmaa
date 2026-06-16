# Multi-Step Golden Repair Test Prompt 002

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
This is a repair pass for multi_step examples. Follow the schema strictly.
Do not copy wording from examples.
Do not reuse ids from earlier gold_multi examples.

Every line must use:
expected.name = "extract_workflow_intent"
workflowType = "multi_step"

Allowed operationType values in this prompt:
- create_contact
- create_group
- add_group_member
- remove_group_member
- add_expense
- edit_expense
- delete_expense
- settle_up
- change_split

Forbidden old aliases:
- Do not use add_member. Use add_group_member.
- Do not use remove_member. Use remove_group_member.
- Do not use update_expense. Use edit_expense.
- Do not use full_owed. Use full_amount.
- Do not use unequal.
- Do not use amountMinor, amountCents, amount, paidBy, participants, type, group, or contact directly on the operation object.

Strict operation wrapper:
Every operation must be exactly:
{"operationType":"...","args":{...}}

Allowed split shapes:
Equal split:
{"splitType":"equal","participants":[{"refType":"current_user"},{"refType":"name","value":"Sai"}]}

One person owes the full amount:
{"splitType":"full_amount","participant":{"refType":"name","value":"Sai"}}

Allowed reference shapes:
{"refType":"current_user"}
{"refType":"name","value":"Person Name"}
{"refType":"last_result"}
{"refType":"active_pending_workflow"}
{"refType":"record_ref","entityType":"expense","id":"expense_example_123"}

Rules:
- Complete examples must have 2-5 semantic operations.
- Use USD and INR only.
- Use amountText, never amountMinor, amountCents, or floating-point money.
- Use refs, not trusted IDs, unless the user explicitly gives an id-like record reference.
- Never use {"refType":"group"} inside split participants.
- For group split, explicitly list participants from the user message.
- Include realistic hard cases: corrections like "20 sorry 40", not-me paid expenses, full amount owed by one person, add member plus add expense, create contact plus create group, INR rupees, and missing information.
- If critical information is missing, use operations: [] and missingFields.
- The app owns IDs, entity resolution, split math, confirmation, and atomic commit.

Valid examples to follow:
{"id":"gold_multi_repair_example_001","input":"create california house with me Pabba and Sai and add groceries 20 sorry 40 dollars paid by me split all","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"multi_step","confidence":0.88,"currencyHint":"USD","operations":[{"operationType":"create_group","args":{"groupName":"california house","members":[{"refType":"current_user"},{"refType":"name","value":"Pabba"},{"refType":"name","value":"Sai"}],"currency":"USD"}},{"operationType":"add_expense","args":{"groupRef":{"refType":"name","value":"california house"},"description":"groceries","amountText":"40 dollars","currency":"USD","paidBy":{"refType":"current_user"},"split":{"splitType":"equal","participants":[{"refType":"current_user"},{"refType":"name","value":"Pabba"},{"refType":"name","value":"Sai"}]},"category":"groceries","paymentType":"unknown"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_multi_repair_example_002","input":"add Deepak to Goa trip and add coffee 300 rupees paid by me but only Sai owes the full thing","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"multi_step","confidence":0.86,"currencyHint":"INR","operations":[{"operationType":"add_group_member","args":{"groupRef":{"refType":"name","value":"Goa trip"},"member":{"refType":"name","value":"Deepak"}}},{"operationType":"add_expense","args":{"groupRef":{"refType":"name","value":"Goa trip"},"description":"coffee","amountText":"300 rupees","currency":"INR","paidBy":{"refType":"current_user"},"split":{"splitType":"full_amount","participant":{"refType":"name","value":"Sai"}},"category":"food","paymentType":"unknown"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_multi_repair_example_003","input":"create a group and add dinner 40 dollars paid by me but I forgot the group name and who is included","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"multi_step","confidence":0.7,"operations":[],"missingFields":["groupName","participants"],"ambiguities":[]}}}

Generate exactly 25 new JSONL examples.
Use ids exactly like gold_multi_repair_002_001, gold_multi_repair_002_002, etc.
Return JSONL only.
```

