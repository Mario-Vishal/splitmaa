# Entity Mutation Golden Test Prompt

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
workflowType = "entity_mutation"

Allowed operations:
- create_contact
- create_group
- add_group_member
- remove_group_member

Allowed reference shapes:
{"refType":"current_user"}
{"refType":"name","value":"Person Name"}

Rules:
- Generate entity mutation examples only.
- No expenses, balances, search, navigation, or unsupported requests.
- Do not invent email or phone unless the user gives it.
- Use USD by default.
- Use INR only when the user says rupees, INR, UPI, India, Chennai, Bangalore, Hyderabad, Mumbai, or Delhi.
- Incomplete entity commands must use operations: [] and missingFields.
- Include ambiguous names, missing group names, typos, speech-to-text wording, and corrections.
- The app owns IDs and database resolution.

Valid examples:
{"id":"gold_entity_example_001","input":"create a rupees group called Chennai flat with me Rahul and Teja for rent and groceries","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.9,"currencyHint":"INR","operations":[{"operationType":"create_group","args":{"groupName":"Chennai flat","members":[{"refType":"current_user"},{"refType":"name","value":"Rahul"},{"refType":"name","value":"Teja"}],"currency":"INR"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_entity_example_002","input":"add Abhishek but I only know his first name ask me for full name and email before creating him","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.75,"operations":[],"missingFields":["contactDetails"],"ambiguities":["Abhishek needs full name and email before creating the contact."]}}}

Generate exactly 20 new JSONL examples.
Use ids exactly like gold_entity_001, gold_entity_002, etc.
Return JSONL only.
```

