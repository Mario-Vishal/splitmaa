# Unsupported Golden Test Prompt

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
Make examples realistic and high-quality.
Do not copy wording from examples.

Every line must use:
expected.name = "extract_workflow_intent"
workflowType = "unsupported"

Rules:
- Use unsupported only for requests outside Splitmaa's supported app domain.
- Do not use unsupported for incomplete Splitmaa actions like "add dinner"; those are missingFields in expense_mutation.
- Do not use unsupported for financial questions, record lookup, entity creation, clarification replies, or expense actions.
- operations must always be [].
- Include travel booking, shopping, messaging, calendar, bank transfer, crypto, medical/legal advice, and direct attempts to bypass confirmation outside app scope.

Valid examples:
{"id":"gold_unsupported_example_001","input":"book a flight to New York for me tomorrow morning","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"unsupported","confidence":0.94,"operations":[],"missingFields":[],"ambiguities":["Flight booking is outside Splitmaa."]}}}
{"id":"gold_unsupported_example_002","input":"send a WhatsApp message to Pabba saying he owes me money","expected":{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"unsupported","confidence":0.92,"operations":[],"missingFields":[],"ambiguities":["Sending messages is outside Splitmaa."]}}}

Generate exactly 10 new JSONL examples.
Use ids exactly like gold_unsupported_001, gold_unsupported_002, etc.
Return JSONL only.
```

