# Splitmaa Architecture

Splitmaa is an edge-device LLM system, not just a mobile app.

The mobile app is the reference client for a local command runtime:

```text
User text / voice transcript
-> compact product context
-> local parser or FunctionGemma boundary
-> structured function call or query intent
-> schema validation
-> context resolution
-> ground-truth retrieval
-> confirmation card or answer card
-> user approval for mutations
-> guided execution animation
-> deterministic state update
-> audit log and diagnostics
```

## Model As Action Proposer

The model proposes constrained actions. It does not execute app operations, write to storage, generate SQL, or mutate state directly.

Every mutation must pass through:

1. JSON/function-call parsing.
2. Schema validation.
3. Business validation.
4. Context resolution.
5. User confirmation.
6. Deterministic execution.
7. Audit logging.

## Mobile Reference Client

React Native and Expo provide the mobile showcase surface. TypeScript owns UI, action schemas, validation, diagnostics, and orchestration. Native Android/iOS code will own real model loading and inference when implemented.

## Current Limitations

- No real FunctionGemma mobile inference yet.
- Rule-based parser exists only as a narrow fallback.
- AsyncStorage local persistence exists for MVP snapshots.
- Smoke eval runner exists; full eval dataset is not complete.
- FunctionGemma runner package exists as an unavailable placeholder, not real inference.
