# Clarification Response Golden Test Prompt

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
workflowType = "clarification_response"

Allowed operations:
- select_option
- provide_contact_details
- provide_missing_field
- cancel_pending_workflow

Rules:
- These are replies to app-generated UI prompts, not brand-new commands.
- Always bind replies to {"refType":"active_pending_workflow"}.
- Use pendingEventType when useful: contact_picker, contact_details_form, missing_field_form, search_result_picker.
- The model extracts ordinal, label, or free text only.
- The app maps selections to trusted IDs.
- Do not invent contact IDs or record IDs.
- Include "the second one", "not that one", contact details, amount answers, participant answers, and cancel/go back replies.

Valid examples:
{"id":"gold_clarification_example_001","input":"use the second Abhishek from the list not the first one","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.92,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"pendingEventType":"contact_picker","operations":[{"operationType":"select_option","args":{"selection":{"selectionType":"ordinal","ordinal":2,"rawText":"use the second Abhishek from the list not the first one"}}}],"missingFields":[],"ambiguities":[]}}}
{"id":"gold_clarification_example_002","input":"cancel this don't save anything I changed my mind","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"clarification_response","confidence":0.9,"pendingWorkflowRef":{"refType":"active_pending_workflow"},"operations":[{"operationType":"cancel_pending_workflow","args":{}}],"missingFields":[],"ambiguities":[]}}}

Generate exactly 15 new JSONL examples.
Use ids exactly like gold_clarification_001, gold_clarification_002, etc.
Return JSONL only.
```

