# Record Lookup Golden Test Prompt

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
workflowType = "record_lookup"

Allowed operations:
- search_records
- open_record
- list_records
- show_previous
- get_record_metadata

Rules:
- Use search_records for find/search/filter requests.
- Use open_record for open/go to/jump/navigate/show exact item requests.
- Use list_records when user wants a list from a group or entity type.
- Use show_previous only for previous result set references.
- Use get_record_metadata for "when was this added/created/updated" questions.
- Do not create records or compute financial answers.
- The app owns SQLite lookup, result display, navigation, and highlighting.
- Lookup operations must never include amountText, amountMinor, amountCents, paidBy, split, participants, paymentType, or mutation-style fields.
- If the user says "find the $20 milk expense", put "$20 milk" in query or use currency only if needed; do not add amountText.
- Use only USD or INR if currency is present.
- For get_record_metadata args, only use entityType, recordRef, and query. Never use metadataFields.
- For open_record args, only use entityType, recordRef, searchQuery, and highlightRef. Never use personRef or groupRef.

Valid examples:
{"id":"gold_lookup_example_001","input":"find the 20 dollar milk expense with Aravind but don't open it yet","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.86,"operations":[{"operationType":"search_records","args":{"query":"20 dollar milk","entityTypes":["expense"],"personRef":{"refType":"name","value":"Aravind"},"currency":"USD","limit":10}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_lookup_example_002","input":"when was the Goa Trip group created show me the created time","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.84,"operations":[{"operationType":"get_record_metadata","args":{"entityType":"group","query":"Goa Trip"}}],"missingFields":[],"ambiguities":[]}}}

Generate exactly 20 new JSONL examples.
Use ids exactly like gold_lookup_001, gold_lookup_002, etc.
Return JSONL only.
```

