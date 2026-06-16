# Record Lookup Dataset Prompt

Paste this entire prompt into one ChatGPT chat.

```text
You are generating training data for Splitmaa, an English-only local expense-splitting mobile app.

Return JSONL only.
One JSON object per line.
No markdown.
No code block.
No JSON array.
No explanations.

Every line must use:
expected.name = "extract_workflow_intent"
workflowType = "record_lookup"

Record lookup operations allowed in this chat:
- search_records
- open_record
- list_records
- show_previous
- get_record_metadata

Rules:
- Use search_records for find/search/filter requests.
- Use open_record for open/go to/jump to/navigate/show exact item requests.
- Use list_records when user wants a list from a group or entity type.
- Use show_previous only for previous result set references.
- Use get_record_metadata for "when was this added/created/updated" questions.
- The app owns SQLite lookup, result display, navigation, and highlighting.
- Do not generate expense creation or financial answer examples in this chat.
- Top-level expected.name must always be extract_workflow_intent.

Validated examples to follow:
{"id":"lookup_real_001","input":"search for the milk split with Aravind from last month I just want to see matching expense records not open anything yet","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.88,"operations":[{"operationType":"search_records","args":{"query":"milk","entityTypes":["expense"],"personRef":{"refType":"name","value":"Aravind"},"dateRange":{"dateText":"last month","dateIntent":"previous_calendar_month"},"limit":10}}],"missingFields":[],"ambiguities":[]}}}
{"id":"lookup_real_002","input":"open the Goa Trip group page and highlight the matching group if there are multiple results","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.86,"operations":[{"operationType":"open_record","args":{"entityType":"group","searchQuery":"Goa Trip"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"lookup_real_003","input":"go to Aravind contact because I want to see what he owes me","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.86,"operations":[{"operationType":"open_record","args":{"entityType":"contact","searchQuery":"Aravind"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"lookup_real_004","input":"show me the milk expense with Pabba open that item not just search list","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.84,"operations":[{"operationType":"open_record","args":{"entityType":"expense","searchQuery":"milk"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"lookup_real_005","input":"list all expenses in Goa Trip so I can scan them before opening any one expense","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.84,"operations":[{"operationType":"list_records","args":{"entityType":"expense","groupRef":{"refType":"name","value":"Goa Trip"},"limit":20}}],"missingFields":[],"ambiguities":[]}}}
{"id":"lookup_real_006","input":"show those search results again from the previous milk search don't run a new query","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.82,"operations":[{"operationType":"show_previous","args":{"target":"last_result_set"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"lookup_real_007","input":"when was the dinner expense added I need the created time not the expense date","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.84,"operations":[{"operationType":"get_record_metadata","args":{"entityType":"expense","query":"dinner"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"lookup_real_008","input":"find all grocery splits in rupees from the Chennai flat group","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.84,"currencyHint":"INR","operations":[{"operationType":"search_records","args":{"query":"grocery","entityTypes":["expense"],"groupRef":{"refType":"name","value":"Chennai flat"},"currency":"INR","category":"groceries","limit":10}}],"missingFields":[],"ambiguities":[]}}}
{"id":"lookup_real_009","input":"jump to expense_milk_123 and highlight that exact row after navigation","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.86,"operations":[{"operationType":"open_record","args":{"entityType":"expense","recordRef":{"refType":"record_ref","entityType":"expense","id":"expense_milk_123"},"highlightRef":{"refType":"record_ref","entityType":"expense","id":"expense_milk_123"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"lookup_real_010","input":"show it again I mean the thing we were just discussing but if you don't know what it is ask me","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"record_lookup","confidence":0.7,"operations":[],"missingFields":["targetRecord"],"ambiguities":["The app must know what 'it' refers to before showing it."]}}}

Generate 50 new JSONL examples.
Distribution:
- 20 search_records
- 15 open_record
- 5 list_records
- 5 show_previous
- 5 get_record_metadata

Use ids like lookup_batch_001, lookup_batch_002, etc.
Return JSONL only.
```
