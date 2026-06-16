# Clarification Response Dataset Prompt

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
workflowType = "clarification_response"

Clarification response operations allowed in this chat:
- select_option
- provide_contact_details
- provide_missing_field
- cancel_pending_workflow

Rules:
- These examples are replies to app-generated UI prompts, not brand-new commands.
- Bind replies to {"refType":"active_pending_workflow"}.
- Use pendingEventType when useful: contact_picker, contact_details_form, missing_field_form, search_result_picker.
- The model should extract ordinal/label/free text only; the app maps it to trusted IDs.
- Do not invent contact IDs.
- Top-level expected.name must always be extract_workflow_intent.

Validated examples to follow:
{"id":"clarification_real_001","input":"the second one use that Abhishek from the options","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.92,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"contact_picker","operations":[{"operationType":"select_option","args":{"selection":{"selectionType":"ordinal","ordinal":2,"rawText":"the second one use that Abhishek from the options"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"clarification_real_002","input":"choose Abhishek Rao not Abhishek Kumar","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.9,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"contact_picker","operations":[{"operationType":"select_option","args":{"selection":{"selectionType":"label","label":"Abhishek Rao","rawText":"choose Abhishek Rao not Abhishek Kumar"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"clarification_real_003","input":"not that one the other Abhishek I picked wrong before","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.84,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"contact_picker","operations":[{"operationType":"select_option","args":{"selection":{"selectionType":"label","label":"the other Abhishek","rawText":"not that one the other Abhishek I picked wrong before"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"clarification_real_004","input":"his full name is Sai Kumar and email is sai@example.com use that for the new contact","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.9,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"contact_details_form","operations":[{"operationType":"provide_contact_details","args":{"displayName":"Sai Kumar","email":"sai@example.com"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"clarification_real_005","input":"amount is 42 dollars for that dinner expense","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.88,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"missing_field_form","operations":[{"operationType":"provide_missing_field","args":{"fieldName":"amount","valueText":"42 dollars"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"clarification_real_006","input":"paid by me and split it with Pabba and Sai","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.86,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"missing_field_form","operations":[{"operationType":"provide_missing_field","args":{"fieldName":"paidBy","valueText":"me"}},{"operationType":"provide_missing_field","args":{"fieldName":"participants","valueText":"Pabba and Sai"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"clarification_real_007","input":"group name should be California apartment use that and continue","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.88,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"missing_field_form","operations":[{"operationType":"provide_missing_field","args":{"fieldName":"groupName","valueText":"California apartment"}}],"missingFields":[],"ambiguities":[]}}}
{"id":"clarification_real_008","input":"cancel this don't save anything I changed my mind","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.9,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"operations":[{"operationType":"cancel_pending_workflow","args":{}}],"missingFields":[],"ambiguities":[]}}}
{"id":"clarification_real_009","input":"go back don't add it I need to check with them first","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.88,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"operations":[{"operationType":"cancel_pending_workflow","args":{}}],"missingFields":[],"ambiguities":[]}}}
{"id":"clarification_real_010","input":"use the first result from the search list and open that one","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.9,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"search_result_picker","operations":[{"operationType":"select_option","args":{"selection":{"selectionType":"ordinal","ordinal":1,"rawText":"use the first result from the search list and open that one"}}}],"missingFields":[],"ambiguities":[]}}}

Generate 50 new JSONL examples.
Use ids like clarification_response_batch_001, clarification_response_batch_002, etc.
Return JSONL only.
```
