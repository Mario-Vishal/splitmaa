# FunctionGemma Dataset Prompts

Use these prompts in ChatGPT web to generate Splitmaa canonical staging JSONL. Generate one batch at a time, save it to a temporary `.jsonl` file, validate it locally, then manually review before appending to train/validation/test.

Validation command:

```powershell
python tools/finetune/validate_splitmaa_dataset.py datasets/splitmaa_functiongemma/train.jsonl datasets/splitmaa_functiongemma/validation.jsonl datasets/splitmaa_functiongemma/test.jsonl
```

## Master Prompt

```text
You are generating training data for Splitmaa, an English-only local expense-splitting mobile app.

Return JSONL only.
One JSON object per line.
No markdown.
No code block.
No JSON array.
No explanations.

Each line must use this exact shape:
{"id":"unique_id","input":"natural user command","expected":{"name":"tool_name","arguments":{}}}

Supported currencies: USD and INR only.
Supported language: English only.
Amount fields must be integer cents:
$18.50 = 1850
18 dollars = 1800
INR 900 = 90000
900 rupees = 90000

Supported tools:
create_group
create_contact
add_expense
settle_up
draft_expense_plan
query_balance
query_financial_summary
search_records
open_record
show_search_results
clarification_required
unsupported_request

Use realistic mobile assistant phrasing.
Include clean commands, casual commands, mild typos, missing punctuation, speech-to-text style phrasing, and correction phrases.
Do not invent tools.
Do not include EUR, GBP, crypto, bank sync, cloud sync, invoices, or non-expense product features.
Do not resolve database duplicates in the model output. Use clarification_required when the user must choose which duplicate person or provide missing contact details.
```

## create_group

```text
Generate 50 JSONL examples for create_group.

Tool shape:
{"name":"create_group","arguments":{"groupName":"string","memberNames":["string"],"currency":"USD or INR"}}

Rules:
- Use this tool only when the group name and at least one member are present.
- Include "You" only when the user explicitly says me/myself/I should be in the group.
- Use USD by default unless the user says INR, rupees, India, Chennai, Bangalore, Hyderabad, Mumbai, Delhi, or UPI context.
- Keep memberNames at 8 people or fewer.
- Use ids like create_group_batch02_001.

Few-shot examples to follow:
{"id":"create_group_example_001","input":"create a group called California add Sai and Deepak","expected":{"name":"create_group","arguments":{"groupName":"California","memberNames":["Sai","Deepak"],"currency":"USD"}}}
{"id":"create_group_example_002","input":"make Goa Trip with me Priya Alex and Rahul","expected":{"name":"create_group","arguments":{"groupName":"Goa Trip","memberNames":["You","Priya","Alex","Rahul"],"currency":"USD"}}}
{"id":"create_group_example_003","input":"start an INR group Chennai roommates with Kiran and Nithya","expected":{"name":"create_group","arguments":{"groupName":"Chennai roommates","memberNames":["Kiran","Nithya"],"currency":"INR"}}}
{"id":"create_group_example_004","input":"new group called office lunch add vishal, abhishek, koushik","expected":{"name":"create_group","arguments":{"groupName":"office lunch","memberNames":["vishal","abhishek","koushik"],"currency":"USD"}}}
{"id":"create_group_example_005","input":"make a trip grp named Vegas weekend with me and aravind","expected":{"name":"create_group","arguments":{"groupName":"Vegas weekend","memberNames":["You","aravind"],"currency":"USD"}}}
{"id":"create_group_example_006","input":"create bangalore flat group for me sai deepak and vinay in rupees","expected":{"name":"create_group","arguments":{"groupName":"bangalore flat","memberNames":["You","sai","deepak","vinay"],"currency":"INR"}}}
{"id":"create_group_example_007","input":"add group dinner gang members are annie bob clara","expected":{"name":"create_group","arguments":{"groupName":"dinner gang","memberNames":["annie","bob","clara"],"currency":"USD"}}}
{"id":"create_group_example_008","input":"creat group called nyc stay with ravi and neha","expected":{"name":"create_group","arguments":{"groupName":"nyc stay","memberNames":["ravi","neha"],"currency":"USD"}}}
{"id":"create_group_example_009","input":"group called Hyderabad rent: me, Manasa, Teja","expected":{"name":"create_group","arguments":{"groupName":"Hyderabad rent","memberNames":["You","Manasa","Teja"],"currency":"INR"}}}
{"id":"create_group_example_010","input":"setup a group named project team add Chen, Maria, Omar","expected":{"name":"create_group","arguments":{"groupName":"project team","memberNames":["Chen","Maria","Omar"],"currency":"USD"}}}

Return JSONL only.
```

## create_contact

```text
Generate 50 JSONL examples for create_contact.

Tool shape:
{"name":"create_contact","arguments":{"displayName":"string","email":"optional email","phone":"optional phone"}}

Rules:
- Use this when the user is adding exactly one contact and gives enough identifying info.
- Do not invent email or phone.
- If the user asks to add many contacts, use draft_expense_plan with create_contact operations.
- Use ids like create_contact_batch02_001.

Few-shot examples to follow:
{"id":"create_contact_example_001","input":"add Aravind as a contact","expected":{"name":"create_contact","arguments":{"displayName":"Aravind"}}}
{"id":"create_contact_example_002","input":"save Sai with email sai@example.com","expected":{"name":"create_contact","arguments":{"displayName":"Sai","email":"sai@example.com"}}}
{"id":"create_contact_example_003","input":"add Deepak phone 5551239876","expected":{"name":"create_contact","arguments":{"displayName":"Deepak","phone":"5551239876"}}}
{"id":"create_contact_example_004","input":"new person koushik","expected":{"name":"create_contact","arguments":{"displayName":"koushik"}}}
{"id":"create_contact_example_005","input":"create contact for Vishal Kumar vishal.kumar@example.com","expected":{"name":"create_contact","arguments":{"displayName":"Vishal Kumar","email":"vishal.kumar@example.com"}}}
{"id":"create_contact_example_006","input":"add abishek sorry Abhishek Reddy","expected":{"name":"create_contact","arguments":{"displayName":"Abhishek Reddy"}}}
{"id":"create_contact_example_007","input":"put Priya in my contacts","expected":{"name":"create_contact","arguments":{"displayName":"Priya"}}}
{"id":"create_contact_example_008","input":"cn you add nithya as person","expected":{"name":"create_contact","arguments":{"displayName":"nithya"}}}
{"id":"create_contact_example_009","input":"save Rahul S rahul.s@example.com 4085550199","expected":{"name":"create_contact","arguments":{"displayName":"Rahul S","email":"rahul.s@example.com","phone":"4085550199"}}}
{"id":"create_contact_example_010","input":"add my roommate Teja","expected":{"name":"create_contact","arguments":{"displayName":"Teja"}}}

Return JSONL only.
```

## add_expense

```text
Generate 50 JSONL examples for add_expense.

Tool shape:
{"name":"add_expense","arguments":{"groupName":"optional string","description":"string","amountCents":integer,"currency":"USD or INR","paidByName":"string","participantNames":["string"],"splitType":"equal","category":"food|transport|groceries|travel|housing|utilities|other","paymentType":"cash|card|upi|venmo|unknown","expenseDate":"optional ISO string"}}

Rules:
- Use only equal split.
- For "I paid" or "paid by me", paidByName is "You".
- For "I was not part of it but I paid", exclude "You" from participantNames.
- For "he owes completely", participantNames contains only that person.
- Understand corrections like "20 sorry 40 dollars" and use the final corrected amount.
- Use ids like add_expense_batch02_001.

Few-shot examples to follow:
{"id":"add_expense_example_001","input":"add 18 dollars for milk paid by me split with Aravind","expected":{"name":"add_expense","arguments":{"description":"milk","amountCents":1800,"currency":"USD","paidByName":"You","participantNames":["You","Aravind"],"splitType":"equal","category":"groceries","paymentType":"unknown"}}}
{"id":"add_expense_example_002","input":"add INR 900 for cab paid by Sai split with me and Deepak","expected":{"name":"add_expense","arguments":{"description":"cab","amountCents":90000,"currency":"INR","paidByName":"Sai","participantNames":["You","Deepak"],"splitType":"equal","category":"transport","paymentType":"unknown"}}}
{"id":"add_expense_example_003","input":"coffee was 20$ I paid but split only Abhishek and Koushik not me","expected":{"name":"add_expense","arguments":{"description":"coffee","amountCents":2000,"currency":"USD","paidByName":"You","participantNames":["Abhishek","Koushik"],"splitType":"equal","category":"food","paymentType":"unknown"}}}
{"id":"add_expense_example_004","input":"biryani 30 dollars to abhishek he owes me fully","expected":{"name":"add_expense","arguments":{"description":"biryani","amountCents":3000,"currency":"USD","paidByName":"You","participantNames":["abhishek"],"splitType":"equal","category":"food","paymentType":"unknown"}}}
{"id":"add_expense_example_005","input":"vegas weekend car and gas 20 sorry 40 dollars paid by me split me Ravi and Neha","expected":{"name":"add_expense","arguments":{"groupName":"vegas weekend","description":"car and gas","amountCents":4000,"currency":"USD","paidByName":"You","participantNames":["You","Ravi","Neha"],"splitType":"equal","category":"transport","paymentType":"unknown"}}}
{"id":"add_expense_example_006","input":"Goa Trip dinner 60 paid by Priya split with me alex priya","expected":{"name":"add_expense","arguments":{"groupName":"Goa Trip","description":"dinner","amountCents":6000,"currency":"USD","paidByName":"Priya","participantNames":["You","alex","priya"],"splitType":"equal","category":"food","paymentType":"unknown"}}}
{"id":"add_expense_example_007","input":"add 1200 rupees groceries paid by me using upi split with Rahul and Teja","expected":{"name":"add_expense","arguments":{"description":"groceries","amountCents":120000,"currency":"INR","paidByName":"You","participantNames":["You","Rahul","Teja"],"splitType":"equal","category":"groceries","paymentType":"upi"}}}
{"id":"add_expense_example_008","input":"hotel was $240 on my card split between me Sai Deepak and Vinay","expected":{"name":"add_expense","arguments":{"description":"hotel","amountCents":24000,"currency":"USD","paidByName":"You","participantNames":["You","Sai","Deepak","Vinay"],"splitType":"equal","category":"travel","paymentType":"card"}}}
{"id":"add_expense_example_009","input":"rent 2100 dollars paid by Alex split me and Alex","expected":{"name":"add_expense","arguments":{"description":"rent","amountCents":210000,"currency":"USD","paidByName":"Alex","participantNames":["You","Alex"],"splitType":"equal","category":"housing","paymentType":"unknown"}}}
{"id":"add_expense_example_010","input":"add uber 15.75 paid by me venmo split with Maria","expected":{"name":"add_expense","arguments":{"description":"uber","amountCents":1575,"currency":"USD","paidByName":"You","participantNames":["You","Maria"],"splitType":"equal","category":"transport","paymentType":"venmo"}}}

Return JSONL only.
```

## settle_up

```text
Generate 50 JSONL examples for settle_up.

Tool shape:
{"name":"settle_up","arguments":{"fromName":"string","toName":"string","amountCents":integer,"currency":"USD or INR","paymentType":"cash|card|upi|venmo|unknown","settlementDate":"optional ISO string"}}

Rules:
- "paid me" means fromName is that person and toName is "You".
- "I paid Sai" means fromName is "You" and toName is "Sai".
- Use corrected final amount if the user self-corrects.
- Use ids like settle_up_batch02_001.

Few-shot examples to follow:
{"id":"settle_up_example_001","input":"record that Deepak paid me 25 dollars","expected":{"name":"settle_up","arguments":{"fromName":"Deepak","toName":"You","amountCents":2500,"currency":"USD","paymentType":"unknown"}}}
{"id":"settle_up_example_002","input":"I paid Sai 12.50 on venmo","expected":{"name":"settle_up","arguments":{"fromName":"You","toName":"Sai","amountCents":1250,"currency":"USD","paymentType":"venmo"}}}
{"id":"settle_up_example_003","input":"Rahul settled 900 rupees by upi","expected":{"name":"settle_up","arguments":{"fromName":"Rahul","toName":"You","amountCents":90000,"currency":"INR","paymentType":"upi"}}}
{"id":"settle_up_example_004","input":"mark priya paid alex 40 dollars","expected":{"name":"settle_up","arguments":{"fromName":"priya","toName":"alex","amountCents":4000,"currency":"USD","paymentType":"unknown"}}}
{"id":"settle_up_example_005","input":"teja gave me 500 cash","expected":{"name":"settle_up","arguments":{"fromName":"teja","toName":"You","amountCents":50000,"currency":"INR","paymentType":"cash"}}}
{"id":"settle_up_example_006","input":"paid back Abhishek 20 sorry 30 dollars","expected":{"name":"settle_up","arguments":{"fromName":"You","toName":"Abhishek","amountCents":3000,"currency":"USD","paymentType":"unknown"}}}
{"id":"settle_up_example_007","input":"kiran sent 14 bucks","expected":{"name":"settle_up","arguments":{"fromName":"kiran","toName":"You","amountCents":1400,"currency":"USD","paymentType":"unknown"}}}
{"id":"settle_up_example_008","input":"settle up I gave Nithya INR 300","expected":{"name":"settle_up","arguments":{"fromName":"You","toName":"Nithya","amountCents":30000,"currency":"INR","paymentType":"unknown"}}}
{"id":"settle_up_example_009","input":"vishal paid me through card 55 dollars","expected":{"name":"settle_up","arguments":{"fromName":"vishal","toName":"You","amountCents":5500,"currency":"USD","paymentType":"card"}}}
{"id":"settle_up_example_010","input":"mark 100 rs from manasa to me","expected":{"name":"settle_up","arguments":{"fromName":"manasa","toName":"You","amountCents":10000,"currency":"INR","paymentType":"unknown"}}}

Return JSONL only.
```

## draft_expense_plan

```text
Generate 50 JSONL examples for draft_expense_plan.

Tool shape:
{"name":"draft_expense_plan","arguments":{"operations":[],"summary":"optional short summary"}}

Allowed operations inside operations:
{"type":"create_group","groupName":"string","memberNames":["string"],"currency":"USD or INR"}
{"type":"create_contact","displayName":"string","email":"optional email","phone":"optional phone"}
{"type":"add_expense","groupName":"optional string","description":"string","amountCents":integer,"currency":"USD or INR","paidByName":"string","participantNames":["string"],"splitType":"equal","category":"food|transport|groceries|travel|housing|utilities|other","paymentType":"cash|card|upi|venmo|unknown"}
{"type":"settle_up","fromName":"string","toName":"string","amountCents":integer,"currency":"USD or INR","paymentType":"cash|card|upi|venmo|unknown"}

Rules:
- Use this for complex multi-step commands with 2-5 operations.
- Max 5 operations.
- Max 8 people per operation.
- If a required group name is missing, output clarification_required instead of this tool.
- Do not resolve duplicate contacts here; use clarification_required if the user asks to choose between duplicates.
- For "I was not part but I paid", paidByName is "You" and participantNames excludes "You".
- For "he owes completely", participantNames contains only that person.
- For "group split", participantNames should include all known group members from the command.
- Understand corrections like "20 dollars sorry 40 dollars" and use the final amount.
- Use ids like draft_plan_batch02_001.

Few-shot examples to follow:
{"id":"draft_plan_example_001","input":"create road trip with me Abhishek Vishal Koushik and add coffee 20 dollars paid by me split only Abhishek and Koushik","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_group","groupName":"road trip","memberNames":["You","Abhishek","Vishal","Koushik"],"currency":"USD"},{"type":"add_expense","groupName":"road trip","description":"coffee","amountCents":2000,"currency":"USD","paidByName":"You","participantNames":["Abhishek","Koushik"],"splitType":"equal","category":"food","paymentType":"unknown"}],"summary":"Create road trip and add coffee split between Abhishek and Koushik."}}}
{"id":"draft_plan_example_002","input":"make Goa Trip with me Alex Priya then add dinner 60 paid by me group split and cab 30 paid by Alex split me and Alex","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_group","groupName":"Goa Trip","memberNames":["You","Alex","Priya"],"currency":"USD"},{"type":"add_expense","groupName":"Goa Trip","description":"dinner","amountCents":6000,"currency":"USD","paidByName":"You","participantNames":["You","Alex","Priya"],"splitType":"equal","category":"food","paymentType":"unknown"},{"type":"add_expense","groupName":"Goa Trip","description":"cab","amountCents":3000,"currency":"USD","paidByName":"Alex","participantNames":["You","Alex"],"splitType":"equal","category":"transport","paymentType":"unknown"}],"summary":"Create Goa Trip and add dinner plus cab expenses."}}}
{"id":"draft_plan_example_003","input":"create Chennai flat group with me Rahul Teja and add rent 30000 rupees paid by me split all and utilities 2400 paid by Rahul split all","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_group","groupName":"Chennai flat","memberNames":["You","Rahul","Teja"],"currency":"INR"},{"type":"add_expense","groupName":"Chennai flat","description":"rent","amountCents":3000000,"currency":"INR","paidByName":"You","participantNames":["You","Rahul","Teja"],"splitType":"equal","category":"housing","paymentType":"unknown"},{"type":"add_expense","groupName":"Chennai flat","description":"utilities","amountCents":240000,"currency":"INR","paidByName":"Rahul","participantNames":["You","Rahul","Teja"],"splitType":"equal","category":"utilities","paymentType":"unknown"}],"summary":"Create Chennai flat and add rent and utilities."}}}
{"id":"draft_plan_example_004","input":"new group office lunch with Sai Deepak add biryani 30 dollars to Sai he owes fully and coke 12 split Sai and Deepak","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_group","groupName":"office lunch","memberNames":["Sai","Deepak"],"currency":"USD"},{"type":"add_expense","groupName":"office lunch","description":"biryani","amountCents":3000,"currency":"USD","paidByName":"You","participantNames":["Sai"],"splitType":"equal","category":"food","paymentType":"unknown"},{"type":"add_expense","groupName":"office lunch","description":"coke","amountCents":1200,"currency":"USD","paidByName":"You","participantNames":["Sai","Deepak"],"splitType":"equal","category":"food","paymentType":"unknown"}],"summary":"Create office lunch and add biryani and coke."}}}
{"id":"draft_plan_example_005","input":"add contacts Nithya and Kiran then make Bangalore trip with me Nithya Kiran","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_contact","displayName":"Nithya"},{"type":"create_contact","displayName":"Kiran"},{"type":"create_group","groupName":"Bangalore trip","memberNames":["You","Nithya","Kiran"],"currency":"INR"}],"summary":"Add Nithya and Kiran, then create Bangalore trip."}}}
{"id":"draft_plan_example_006","input":"create nyc stay with me Omar Chen add hotel 240 paid by Omar split all and subway 18 paid by me split Chen only","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_group","groupName":"nyc stay","memberNames":["You","Omar","Chen"],"currency":"USD"},{"type":"add_expense","groupName":"nyc stay","description":"hotel","amountCents":24000,"currency":"USD","paidByName":"Omar","participantNames":["You","Omar","Chen"],"splitType":"equal","category":"travel","paymentType":"unknown"},{"type":"add_expense","groupName":"nyc stay","description":"subway","amountCents":1800,"currency":"USD","paidByName":"You","participantNames":["Chen"],"splitType":"equal","category":"transport","paymentType":"unknown"}],"summary":"Create nyc stay and add hotel and subway."}}}
{"id":"draft_plan_example_007","input":"make vegas weekend with Ravi Neha and me add car and gas 20 sorry 40 dollars paid by me group split","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_group","groupName":"vegas weekend","memberNames":["Ravi","Neha","You"],"currency":"USD"},{"type":"add_expense","groupName":"vegas weekend","description":"car and gas","amountCents":4000,"currency":"USD","paidByName":"You","participantNames":["Ravi","Neha","You"],"splitType":"equal","category":"transport","paymentType":"unknown"}],"summary":"Create vegas weekend and add corrected car and gas expense."}}}
{"id":"draft_plan_example_008","input":"create groceries group with me Manasa Teja add milk 120 rupees paid by me split Teja only and veggies 300 paid by Manasa split all","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_group","groupName":"groceries","memberNames":["You","Manasa","Teja"],"currency":"INR"},{"type":"add_expense","groupName":"groceries","description":"milk","amountCents":12000,"currency":"INR","paidByName":"You","participantNames":["Teja"],"splitType":"equal","category":"groceries","paymentType":"unknown"},{"type":"add_expense","groupName":"groceries","description":"veggies","amountCents":30000,"currency":"INR","paidByName":"Manasa","participantNames":["You","Manasa","Teja"],"splitType":"equal","category":"groceries","paymentType":"unknown"}],"summary":"Create groceries and add milk and veggies."}}}
{"id":"draft_plan_example_009","input":"for project team add Chen Maria Omar group and record pizza 45 paid by Maria split all plus Omar paid me 10","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_group","groupName":"project team","memberNames":["Chen","Maria","Omar"],"currency":"USD"},{"type":"add_expense","groupName":"project team","description":"pizza","amountCents":4500,"currency":"USD","paidByName":"Maria","participantNames":["Chen","Maria","Omar"],"splitType":"equal","category":"food","paymentType":"unknown"},{"type":"settle_up","fromName":"Omar","toName":"You","amountCents":1000,"currency":"USD","paymentType":"unknown"}],"summary":"Create project team, add pizza, and record Omar settlement."}}}
{"id":"draft_plan_example_010","input":"creat group weekend food with annie bob clara add brunch 75 paid by annie split all and coffee 9.50 paid by me bob owes all","expected":{"name":"draft_expense_plan","arguments":{"operations":[{"type":"create_group","groupName":"weekend food","memberNames":["annie","bob","clara"],"currency":"USD"},{"type":"add_expense","groupName":"weekend food","description":"brunch","amountCents":7500,"currency":"USD","paidByName":"annie","participantNames":["annie","bob","clara"],"splitType":"equal","category":"food","paymentType":"unknown"},{"type":"add_expense","groupName":"weekend food","description":"coffee","amountCents":950,"currency":"USD","paidByName":"You","participantNames":["bob"],"splitType":"equal","category":"food","paymentType":"unknown"}],"summary":"Create weekend food and add brunch and coffee."}}}

Return JSONL only.
```

## query_balance

```text
Generate 50 JSONL examples for query_balance.

Tool shape:
{"name":"query_balance","arguments":{"personName":"optional string","currency":"USD or INR","dateRange":{"startDate":"optional ISO string","endDate":"optional ISO string"} optional}}

Rules:
- Use this for direct person balance questions.
- If the question asks totals, spending, group totals, last month, or last year, prefer query_financial_summary.
- Use ids like query_balance_batch02_001.

Few-shot examples to follow:
{"id":"query_balance_example_001","input":"how much does Aravind owe me","expected":{"name":"query_balance","arguments":{"personName":"Aravind","currency":"USD"}}}
{"id":"query_balance_example_002","input":"do I owe Sai anything","expected":{"name":"query_balance","arguments":{"personName":"Sai","currency":"USD"}}}
{"id":"query_balance_example_003","input":"balance with Rahul in rupees","expected":{"name":"query_balance","arguments":{"personName":"Rahul","currency":"INR"}}}
{"id":"query_balance_example_004","input":"what is my open balance","expected":{"name":"query_balance","arguments":{"currency":"USD"}}}
{"id":"query_balance_example_005","input":"how much do I owe Priya","expected":{"name":"query_balance","arguments":{"personName":"Priya","currency":"USD"}}}
{"id":"query_balance_example_006","input":"whats alex owe me rn","expected":{"name":"query_balance","arguments":{"personName":"alex","currency":"USD"}}}
{"id":"query_balance_example_007","input":"show Kiran balance INR","expected":{"name":"query_balance","arguments":{"personName":"Kiran","currency":"INR"}}}
{"id":"query_balance_example_008","input":"am i settled with Deepak","expected":{"name":"query_balance","arguments":{"personName":"Deepak","currency":"USD"}}}
{"id":"query_balance_example_009","input":"how much is pending with manasa","expected":{"name":"query_balance","arguments":{"personName":"manasa","currency":"INR"}}}
{"id":"query_balance_example_010","input":"abhishek balnce please","expected":{"name":"query_balance","arguments":{"personName":"abhishek","currency":"USD"}}}

Return JSONL only.
```

## query_financial_summary

```text
Generate 50 JSONL examples for query_financial_summary.

Tool shape:
{"name":"query_financial_summary","arguments":{"summaryType":"total_owed_to_me|total_i_owe|net_balance|total_spent|person_balance|group_total","personName":"optional string","groupName":"optional string","currency":"USD or INR","dateRange":{"startDate":"optional ISO string","endDate":"optional ISO string"} optional}}

Rules:
- Use this for totals, date windows, group spending, net balance, total owed, total I owe.
- Use dateRange for "last month", "last year", named months, or explicit date windows.
- Use ids like query_summary_batch02_001.

Few-shot examples to follow:
{"id":"query_summary_example_001","input":"what was my total debt last month","expected":{"name":"query_financial_summary","arguments":{"summaryType":"net_balance","currency":"USD","dateRange":{"startDate":"2026-05-01T00:00:00.000Z","endDate":"2026-05-31T23:59:59.999Z"}}}}
{"id":"query_summary_example_002","input":"how much did I owe Aravind last month","expected":{"name":"query_financial_summary","arguments":{"summaryType":"person_balance","personName":"Aravind","currency":"USD","dateRange":{"startDate":"2026-05-01T00:00:00.000Z","endDate":"2026-05-31T23:59:59.999Z"}}}}
{"id":"query_summary_example_003","input":"how much did we spend in Goa Trip","expected":{"name":"query_financial_summary","arguments":{"summaryType":"group_total","groupName":"Goa Trip","currency":"USD"}}}
{"id":"query_summary_example_004","input":"total amount owed to me in INR","expected":{"name":"query_financial_summary","arguments":{"summaryType":"total_owed_to_me","currency":"INR"}}}
{"id":"query_summary_example_005","input":"how much do I owe overall","expected":{"name":"query_financial_summary","arguments":{"summaryType":"total_i_owe","currency":"USD"}}}
{"id":"query_summary_example_006","input":"net balance for 2025","expected":{"name":"query_financial_summary","arguments":{"summaryType":"net_balance","currency":"USD","dateRange":{"startDate":"2025-01-01T00:00:00.000Z","endDate":"2025-12-31T23:59:59.999Z"}}}}
{"id":"query_summary_example_007","input":"show total spent this June","expected":{"name":"query_financial_summary","arguments":{"summaryType":"total_spent","currency":"USD","dateRange":{"startDate":"2026-06-01T00:00:00.000Z","endDate":"2026-06-30T23:59:59.999Z"}}}}
{"id":"query_summary_example_008","input":"what did Chennai flat cost last year in rupees","expected":{"name":"query_financial_summary","arguments":{"summaryType":"group_total","groupName":"Chennai flat","currency":"INR","dateRange":{"startDate":"2025-01-01T00:00:00.000Z","endDate":"2025-12-31T23:59:59.999Z"}}}}
{"id":"query_summary_example_009","input":"how much am I ahead with Sai","expected":{"name":"query_financial_summary","arguments":{"summaryType":"person_balance","personName":"Sai","currency":"USD"}}}
{"id":"query_summary_example_010","input":"spent total in vegas weekend from march 1 to march 5","expected":{"name":"query_financial_summary","arguments":{"summaryType":"group_total","groupName":"vegas weekend","currency":"USD","dateRange":{"startDate":"2026-03-01T00:00:00.000Z","endDate":"2026-03-05T23:59:59.999Z"}}}}

Return JSONL only.
```

## search_records

```text
Generate 50 JSONL examples for search_records.

Tool shape:
{"name":"search_records","arguments":{"query":"string","entityTypes":["contact|group|expense|settlement|activity_log"],"personName":"optional string","groupName":"optional string","currency":"optional USD or INR","category":"optional food|transport|groceries|travel|housing|utilities|other","dateRange":"optional dateRange","limit":10}}

Rules:
- Use this when the user asks to find, search, list, or locate records.
- Use entityTypes based on what they are searching.
- Use personName/groupName filters when present.
- Use ids like search_records_batch02_001.

Few-shot examples to follow:
{"id":"search_records_example_001","input":"search for milk split with Aravind","expected":{"name":"search_records","arguments":{"query":"milk","entityTypes":["expense"],"personName":"Aravind","limit":10}}}
{"id":"search_records_example_002","input":"find cab expenses with Sai","expected":{"name":"search_records","arguments":{"query":"cab","entityTypes":["expense"],"personName":"Sai","category":"transport","limit":10}}}
{"id":"search_records_example_003","input":"show dinner records in Goa Trip","expected":{"name":"search_records","arguments":{"query":"dinner","entityTypes":["expense"],"groupName":"Goa Trip","category":"food","limit":10}}}
{"id":"search_records_example_004","input":"look for Abhishek contact","expected":{"name":"search_records","arguments":{"query":"Abhishek","entityTypes":["contact"],"limit":10}}}
{"id":"search_records_example_005","input":"find rent payments","expected":{"name":"search_records","arguments":{"query":"rent","entityTypes":["expense","settlement"],"category":"housing","limit":10}}}
{"id":"search_records_example_006","input":"search the thing where Omar paid me","expected":{"name":"search_records","arguments":{"query":"Omar","entityTypes":["settlement","activity_log"],"personName":"Omar","limit":10}}}
{"id":"search_records_example_007","input":"find all grocery splits in rupees","expected":{"name":"search_records","arguments":{"query":"grocery","entityTypes":["expense"],"currency":"INR","category":"groceries","limit":10}}}
{"id":"search_records_example_008","input":"where is car and gas entry","expected":{"name":"search_records","arguments":{"query":"car and gas","entityTypes":["expense"],"category":"transport","limit":10}}}
{"id":"search_records_example_009","input":"search created actions for group","expected":{"name":"search_records","arguments":{"query":"group","entityTypes":["activity_log"],"limit":10}}}
{"id":"search_records_example_010","input":"find nyc stay group","expected":{"name":"search_records","arguments":{"query":"nyc stay","entityTypes":["group"],"limit":10}}}

Return JSONL only.
```

## open_record

```text
Generate 50 JSONL examples for open_record.

Tool shape:
{"name":"open_record","arguments":{"entityType":"contact|group|expense|settlement|activity_log","recordId":"optional string","searchQuery":"optional string","highlightRecordId":"optional string"}}

Rules:
- Use this when the user asks to open, go to, jump to, navigate to, or show a specific record page.
- Use searchQuery when the exact id is not known.
- Do not invent recordId unless the input explicitly contains one.
- Use ids like open_record_batch02_001.

Few-shot examples to follow:
{"id":"open_record_example_001","input":"open the Goa Trip group","expected":{"name":"open_record","arguments":{"entityType":"group","searchQuery":"Goa Trip"}}}
{"id":"open_record_example_002","input":"go to Aravind contact","expected":{"name":"open_record","arguments":{"entityType":"contact","searchQuery":"Aravind"}}}
{"id":"open_record_example_003","input":"show me the milk expense","expected":{"name":"open_record","arguments":{"entityType":"expense","searchQuery":"milk"}}}
{"id":"open_record_example_004","input":"jump to expense_dinner","expected":{"name":"open_record","arguments":{"entityType":"expense","recordId":"expense_dinner","highlightRecordId":"expense_dinner"}}}
{"id":"open_record_example_005","input":"open settlement from Omar","expected":{"name":"open_record","arguments":{"entityType":"settlement","searchQuery":"Omar"}}}
{"id":"open_record_example_006","input":"take me to Chennai flat","expected":{"name":"open_record","arguments":{"entityType":"group","searchQuery":"Chennai flat"}}}
{"id":"open_record_example_007","input":"open abhishek page","expected":{"name":"open_record","arguments":{"entityType":"contact","searchQuery":"abhishek"}}}
{"id":"open_record_example_008","input":"show the car and gas item","expected":{"name":"open_record","arguments":{"entityType":"expense","searchQuery":"car and gas"}}}
{"id":"open_record_example_009","input":"navigate to last assistant action about dinner","expected":{"name":"open_record","arguments":{"entityType":"activity_log","searchQuery":"dinner"}}}
{"id":"open_record_example_010","input":"open record group_goa","expected":{"name":"open_record","arguments":{"entityType":"group","recordId":"group_goa","highlightRecordId":"group_goa"}}}

Return JSONL only.
```

## show_search_results

```text
Generate 50 JSONL examples for show_search_results.

Tool shape:
{"name":"show_search_results","arguments":{"resultSetId":"string","highlightRecordId":"optional string"}}

Rules:
- Use this only when the user refers to an existing result set by id, such as "those results", "the previous results", or a visible resultSetId.
- If no resultSetId is explicit or inferable from the user phrasing, use search_records instead.
- Use ids like show_results_batch02_001.

Few-shot examples to follow:
{"id":"show_results_example_001","input":"show search_results_001 again","expected":{"name":"show_search_results","arguments":{"resultSetId":"search_results_001"}}}
{"id":"show_results_example_002","input":"open the previous result list resultSet milk_2026_06","expected":{"name":"show_search_results","arguments":{"resultSetId":"milk_2026_06"}}}
{"id":"show_results_example_003","input":"show those results and highlight expense_dinner","expected":{"name":"show_search_results","arguments":{"resultSetId":"previous_results","highlightRecordId":"expense_dinner"}}}
{"id":"show_results_example_004","input":"bring back result set cab_matches","expected":{"name":"show_search_results","arguments":{"resultSetId":"cab_matches"}}}
{"id":"show_results_example_005","input":"show list search_42","expected":{"name":"show_search_results","arguments":{"resultSetId":"search_42"}}}
{"id":"show_results_example_006","input":"display previous_results highlight contact_abhi","expected":{"name":"show_search_results","arguments":{"resultSetId":"previous_results","highlightRecordId":"contact_abhi"}}}
{"id":"show_results_example_007","input":"go back to dinner_results","expected":{"name":"show_search_results","arguments":{"resultSetId":"dinner_results"}}}
{"id":"show_results_example_008","input":"show the saved results groceries_june","expected":{"name":"show_search_results","arguments":{"resultSetId":"groceries_june"}}}
{"id":"show_results_example_009","input":"pull up resultSetId group_search_7","expected":{"name":"show_search_results","arguments":{"resultSetId":"group_search_7"}}}
{"id":"show_results_example_010","input":"show previous search list and highlight group_goa","expected":{"name":"show_search_results","arguments":{"resultSetId":"previous_results","highlightRecordId":"group_goa"}}}

Return JSONL only.
```

## clarification_required

```text
Generate 50 JSONL examples for clarification_required.

Tool shape:
{"name":"clarification_required","arguments":{"question":"string","missingFields":["string"]}}

Rules:
- Use this when required details are missing or ambiguous.
- Use this when duplicate contacts need user selection.
- Use this when the user names a person who is missing and the app needs full name/email from UI before continuing.
- Do not invent emails, full names, group names, amounts, payers, or participants.
- Use ids like clarification_batch02_001.

Few-shot examples to follow:
{"id":"clarification_example_001","input":"add dinner","expected":{"name":"clarification_required","arguments":{"question":"How much was dinner, who paid, and who should it be split with?","missingFields":["amountCents","paidByName","participantNames"]}}}
{"id":"clarification_example_002","input":"create a group with me abhishek and koushik","expected":{"name":"clarification_required","arguments":{"question":"What should I name this group?","missingFields":["groupName"]}}}
{"id":"clarification_example_003","input":"add coffee to Abhishek","expected":{"name":"clarification_required","arguments":{"question":"How much was the coffee and who paid?","missingFields":["amountCents","paidByName"]}}}
{"id":"clarification_example_004","input":"split 40 dollars","expected":{"name":"clarification_required","arguments":{"question":"What was the expense for, who paid, and who should it be split with?","missingFields":["description","paidByName","participantNames"]}}}
{"id":"clarification_example_005","input":"use Abhishek for this expense but there are two Abhisheks","expected":{"name":"clarification_required","arguments":{"question":"Which Abhishek should I use for this expense?","missingFields":["contactDisambiguation"]}}}
{"id":"clarification_example_006","input":"add new person Sai but ask for his details","expected":{"name":"clarification_required","arguments":{"question":"Please enter Sai's full name and email address.","missingFields":["displayName","email"]}}}
{"id":"clarification_example_007","input":"record payment from Priya","expected":{"name":"clarification_required","arguments":{"question":"How much did Priya pay and who did she pay?","missingFields":["amountCents","toName"]}}}
{"id":"clarification_example_008","input":"add group expense for car","expected":{"name":"clarification_required","arguments":{"question":"Which group, how much was car, and who paid?","missingFields":["groupName","amountCents","paidByName"]}}}
{"id":"clarification_example_009","input":"add milk split with him","expected":{"name":"clarification_required","arguments":{"question":"Who does 'him' refer to, how much was milk, and who paid?","missingFields":["participantNames","amountCents","paidByName"]}}}
{"id":"clarification_example_010","input":"make it INR","expected":{"name":"clarification_required","arguments":{"question":"Which pending expense or group should I update to INR?","missingFields":["targetRecord"]}}}

Return JSONL only.
```

## unsupported_request

```text
Generate 50 JSONL examples for unsupported_request.

Tool shape:
{"name":"unsupported_request","arguments":{"reason":"string"}}

Rules:
- Use this for tasks outside Splitmaa's local expense, group, contact, balance, search, and navigation scope.
- Keep reason short and product-specific.
- Use ids like unsupported_batch02_001.

Few-shot examples to follow:
{"id":"unsupported_example_001","input":"write me a poem about expenses","expected":{"name":"unsupported_request","arguments":{"reason":"I can help with Splitmaa groups, contacts, expenses, balances, searches, and navigation."}}}
{"id":"unsupported_example_002","input":"book a flight to Goa","expected":{"name":"unsupported_request","arguments":{"reason":"I cannot book travel; I can only manage local Splitmaa expense data."}}}
{"id":"unsupported_example_003","input":"connect my bank account","expected":{"name":"unsupported_request","arguments":{"reason":"Bank connections are outside this local-only Splitmaa flow."}}}
{"id":"unsupported_example_004","input":"send money to Sai now","expected":{"name":"unsupported_request","arguments":{"reason":"I cannot send money; I can only record settlements after they happen."}}}
{"id":"unsupported_example_005","input":"make a spreadsheet for taxes","expected":{"name":"unsupported_request","arguments":{"reason":"I can search and summarize Splitmaa records, but I cannot create tax spreadsheets."}}}
{"id":"unsupported_example_006","input":"translate this to french","expected":{"name":"unsupported_request","arguments":{"reason":"Splitmaa supports English expense commands only."}}}
{"id":"unsupported_example_007","input":"what is bitcoin price today","expected":{"name":"unsupported_request","arguments":{"reason":"Market prices are outside Splitmaa's local expense scope."}}}
{"id":"unsupported_example_008","input":"delete my gmail messages","expected":{"name":"unsupported_request","arguments":{"reason":"I can only work with local Splitmaa data."}}}
{"id":"unsupported_example_009","input":"order biryani for me","expected":{"name":"unsupported_request","arguments":{"reason":"I cannot place orders; I can record food expenses after they happen."}}}
{"id":"unsupported_example_010","input":"sync all this to cloud","expected":{"name":"unsupported_request","arguments":{"reason":"Cloud sync is not part of this local Splitmaa assistant flow."}}}

Return JSONL only.
```

## Mixed High-Noise Batch

```text
Generate 100 JSONL examples across all supported tools.

Distribution:
- 10 create_group
- 10 create_contact
- 15 add_expense
- 10 settle_up
- 15 draft_expense_plan
- 10 query_balance
- 10 query_financial_summary
- 10 search_records
- 5 open_record
- 5 clarification_required or unsupported_request

Rules:
- Include common typos: creat, expnse, splitit, balnce, recieved, thru, ppl, grp.
- Include speech-to-text phrasing and run-on sentences.
- Include correction phrases: "sorry", "actually", "no I mean", "not 20 make it 40".
- Include "I was not part of it but I paid" cases.
- Include "he owes completely" cases.
- Include missing-info examples that correctly use clarification_required.
- Do not generate invalid JSON.
- Do not include markdown.
- Use ids like mixed_noise_batch02_001.

Return JSONL only.
```
