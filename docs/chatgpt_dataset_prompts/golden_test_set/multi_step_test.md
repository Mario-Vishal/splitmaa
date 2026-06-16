# Multi-Step Golden Test Prompt

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
Make examples complex, realistic, messy, and high-quality.
Do not copy wording from examples.

Every line must use:
expected.name = "extract_workflow_intent"
workflowType = "multi_step"

Rules:
- Complete examples must have 2-5 semantic operations.
- Use operations, not internal app tool chains.
- Do not output search_records -> open_record chains.
- Use amountText, never amountMinor, amountCents, or floating-point money.
- Use USD and INR only.
- Use refs, not trusted IDs.
- Never use {"refType":"group"} inside split participants.
- Split participants can only be current_user, name, record_ref, last_result, or active_pending_workflow.
- Every operation must be {"operationType":"...","args":{...}}.
- Include group creation plus expenses, member changes plus expense, multiple expenses, corrections, not-me splits, fully owed splits, and missing information.
- If critical information is missing, use operations: [] and missingFields.
- The app owns IDs, entity resolution, split math, confirmation, and atomic commit.

Valid examples:
{"id":"gold_multi_example_001","input":"create california with me and Pabba and add milk 20 dollars paid by me equal split","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"multi_step","confidence":0.91,"currencyHint":"USD","operations":[{"operationType":"create_group","args":{"groupName":"california","members":[{"refType":"current_user"},{"refType":"name","value":"Pabba"}],"currency":"USD"}},{"operationType":"add_expense","args":{"groupRef":{"refType":"name","value":"california"},"description":"milk","amountText":"20 dollars","currency":"USD","paidBy":{"refType":"current_user"},"split":{"splitType":"equal","participants":[{"refType":"current_user"},{"refType":"name","value":"Pabba"}]},"category":"groceries","paymentType":"unknown"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_multi_example_002","input":"make goa trip with me Sai Deepak add hotel 6000 rupees paid by me split all and cab 900 paid by Sai split me and Sai","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"multi_step","confidence":0.87,"currencyHint":"INR","operations":[{"operationType":"create_group","args":{"groupName":"goa trip","members":[{"refType":"current_user"},{"refType":"name","value":"Sai"},{"refType":"name","value":"Deepak"}],"currency":"INR"}},{"operationType":"add_expense","args":{"groupRef":{"refType":"name","value":"goa trip"},"description":"hotel","amountText":"6000 rupees","currency":"INR","paidBy":{"refType":"current_user"},"split":{"splitType":"equal","participants":[{"refType":"current_user"},{"refType":"name","value":"Sai"},{"refType":"name","value":"Deepak"}]},"category":"travel","paymentType":"unknown"}},{"operationType":"add_expense","args":{"groupRef":{"refType":"name","value":"goa trip"},"description":"cab","amountText":"900","currency":"INR","paidBy":{"refType":"name","value":"Sai"},"split":{"splitType":"equal","participants":[{"refType":"current_user"},{"refType":"name","value":"Sai"}]},"category":"transport","paymentType":"unknown"}}],"missingFields":[],"ambiguities":[]}}}

Generate exactly 25 new JSONL examples.
Use ids exactly like gold_multi_001, gold_multi_002, etc.
Return JSONL only.
```

