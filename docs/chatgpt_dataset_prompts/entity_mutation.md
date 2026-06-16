# Entity Mutation Dataset Prompt

Paste this entire prompt into one ChatGPT chat.

```text
You are generating training data for Splitmaa, an English-only local expense-splitting mobile app.

Return JSONL only.
One JSON object per line.
No markdown.
No code block.
No JSON array.
No explanations.

Every line must use this top-level tool name:
extract_workflow_intent

Every line must use this shape:
{"id":"unique_id","input":"natural user command","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.0,"operations":[],"missingFields":[],"ambiguities":[]}}}

Entity operations allowed in this chat:
- create_contact
- create_group
- add_group_member
- remove_group_member

Reference shapes:
{"refType":"current_user"}
{"refType":"name","value":"Person Name"}

Rules:
- Generate entity_mutation examples only.
- Do not generate expenses, balances, searches, navigation, or unsupported examples.
- Use USD by default unless the user says rupees, INR, UPI, India, Chennai, Bangalore, Hyderabad, Mumbai, or Delhi.
- For incomplete entity commands, return operations: [] and missingFields.
- Do not invent emails or phone numbers unless the user gave them.
- Use realistic names, longer mobile phrasing, typos, corrections, and speech-to-text style.
- Top-level expected.name must always be extract_workflow_intent.

Validated examples to follow:
{"id":"entity_real_001","input":"create a new group called California apartment and add me, Pabba, Sai Kumar and Deepak because we are going to track rent groceries and utilities in dollars","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.91,"currencyHint":"USD","operations":[{"operationType":"create_group","args":{"groupName":"California apartment","members":[{"refType":"current_user"},{"refType":"name","value":"Pabba"},{"refType":"name","value":"Sai Kumar"},{"refType":"name","value":"Deepak"}],"currency":"USD"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"entity_real_002","input":"make a rupees group named Hyderabad flatmates with me Manasa Teja and Rahul for rent and electricity going forward","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.9,"currencyHint":"INR","operations":[{"operationType":"create_group","args":{"groupName":"Hyderabad flatmates","members":[{"refType":"current_user"},{"refType":"name","value":"Manasa"},{"refType":"name","value":"Teja"},{"refType":"name","value":"Rahul"}],"currency":"INR"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"entity_real_003","input":"save a new contact Abhishek Reddy email abhishek.reddy@example.com phone 4085551122 I will add him to the road trip later","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.9,"operations":[{"operationType":"create_contact","args":{"displayName":"Abhishek Reddy","email":"abhishek.reddy@example.com","phone":"4085551122"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"entity_real_004","input":"add Nithya to Bangalore trip she joined late but don't add any expense right now just the member","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.87,"operations":[{"operationType":"add_group_member","args":{"groupRef":{"refType":"name","value":"Bangalore trip"},"member":{"refType":"name","value":"Nithya"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"entity_real_005","input":"remove Kiran from the old flatmates group because he moved out no expense change only remove member","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.86,"operations":[{"operationType":"remove_group_member","args":{"groupRef":{"refType":"name","value":"old flatmates"},"member":{"refType":"name","value":"Kiran"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"entity_real_006","input":"creat grp called office lunch crew add vishal abhishek koushik and maria sorry make the group name Friday office lunch","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.86,"currencyHint":"USD","operations":[{"operationType":"create_group","args":{"groupName":"Friday office lunch","members":[{"refType":"name","value":"vishal"},{"refType":"name","value":"abhishek"},{"refType":"name","value":"koushik"},{"refType":"name","value":"maria"}],"currency":"USD"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"entity_real_007","input":"add Sai but I don't know which Sai yet I need to enter full name and email before you create the contact","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.76,"operations":[],"missingFields":["contactDetails"],"ambiguities":["Sai needs full name and email before creating the contact."]}}}
{"id":"entity_real_008","input":"create a group with me abhishek vishal and koushik for our california trip but I forgot the group name ask me first","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.74,"operations":[],"missingFields":["groupName"],"ambiguities":[]}}}
{"id":"entity_real_009","input":"new person Priya Narayanan priya.n@example.com she is from the Goa trip and I want her available as contact","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.9,"operations":[{"operationType":"create_contact","args":{"displayName":"Priya Narayanan","email":"priya.n@example.com"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"entity_real_010","input":"add Omar and Chen to project dinner group only membership update no money entry now","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"entity_mutation","confidence":0.84,"operations":[{"operationType":"add_group_member","args":{"groupRef":{"refType":"name","value":"project dinner"},"member":{"refType":"name","value":"Omar"}}},{"operationType":"add_group_member","args":{"groupRef":{"refType":"name","value":"project dinner"},"member":{"refType":"name","value":"Chen"}}}],"missingFields":[],"ambiguities":[]}}}

Generate 50 new JSONL examples.
Distribution:
- 20 create_contact
- 20 create_group
- 5 add_group_member
- 5 remove_group_member

Use ids exactly like entity_batch_005_001, entity_batch_005_002, etc.
Do not reuse ids or wording from earlier batches.
Return JSONL only.
```
