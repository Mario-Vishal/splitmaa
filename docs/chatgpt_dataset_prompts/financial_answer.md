# Financial Answer Dataset Prompt

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
workflowType = "financial_answer"

Financial operations allowed in this chat:
- compute_balance
- compute_total
- compute_summary
- compute_date_window_total

Rules:
- The model identifies the question and filters, but the app fetches trusted SQLite data and writes the final English answer.
- Use dateText/dateIntent for relative dates like last month, this month, last year.
- Do not resolve UTC boundaries.
- Use USD and INR only.
- Do not create records in this chat.
- Top-level expected.name must always be extract_workflow_intent.

Validated examples to follow:
{"id":"financial_real_001","input":"how much does Aravind owe me right now in dollars based on current open balances","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.88,"currencyHint":"USD","operations":[{"operationType":"compute_balance","args":{"personRef":{"refType":"name","value":"Aravind"},"currency":"USD"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"financial_real_002","input":"how much do I owe Aravind overall don't create anything just answer from local records","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.88,"currencyHint":"USD","operations":[{"operationType":"compute_balance","args":{"personRef":{"refType":"name","value":"Aravind"},"currency":"USD"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"financial_real_003","input":"what was my total debt last month use calendar month not last thirty days","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.86,"currencyHint":"USD","operations":[{"operationType":"compute_summary","args":{"metric":"net_balance","currency":"USD","dateRange":{"dateText":"last month","dateIntent":"previous_calendar_month"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"financial_real_004","input":"how much did we spend in Goa Trip including every expense in that group","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.88,"currencyHint":"USD","operations":[{"operationType":"compute_summary","args":{"metric":"group_total","groupRef":{"refType":"name","value":"Goa Trip"},"currency":"USD"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"financial_real_005","input":"total amount owed to me in INR across all rupees groups","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.86,"currencyHint":"INR","operations":[{"operationType":"compute_summary","args":{"metric":"total_owed_to_me","currency":"INR"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"financial_real_006","input":"how much do I owe everyone overall right now show the total I owe","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.85,"currencyHint":"USD","operations":[{"operationType":"compute_summary","args":{"metric":"total_i_owe","currency":"USD"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"financial_real_007","input":"net balance for this year so far in dollars","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.84,"currencyHint":"USD","operations":[{"operationType":"compute_summary","args":{"metric":"net_balance","currency":"USD","dateRange":{"dateText":"this year","dateIntent":"current_calendar_year"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"financial_real_008","input":"what did Chennai flat cost last year in rupees previous calendar year please","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.84,"currencyHint":"INR","operations":[{"operationType":"compute_summary","args":{"metric":"group_total","groupRef":{"refType":"name","value":"Chennai flat"},"currency":"INR","dateRange":{"dateText":"last year","dateIntent":"previous_calendar_year"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"financial_real_009","input":"show total spent this month for all groups don't filter by person","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.84,"currencyHint":"USD","operations":[{"operationType":"compute_total","args":{"metric":"total_spent","currency":"USD","dateRange":{"dateText":"this month","dateIntent":"current_calendar_month"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"financial_real_010","input":"how much was milk with Aravind last month I need answer from matching local expenses","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"financial_answer","confidence":0.78,"currencyHint":"USD","operations":[{"operationType":"compute_date_window_total","args":{"metric":"person_balance","personRef":{"refType":"name","value":"Aravind"},"currency":"USD","dateRange":{"dateText":"last month","dateIntent":"previous_calendar_month"}}}],"missingFields":[],"ambiguities":["The app should filter trusted records for milk with Aravind before answering."]}}}

Generate 50 new JSONL examples.
Distribution:
- 15 compute_balance
- 10 compute_total
- 15 compute_summary
- 10 compute_date_window_total

Use ids like financial_batch_004_001, financial_batch_004_002, etc.
Do not reuse ids or wording from earlier batches.
Return JSONL only.
```
