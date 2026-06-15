# Splitmaa Architecture

Splitmaa is an edge-device LLM system, not just a mobile app.

The mobile app is the reference client for a local command runtime:

```text
User text / voice transcript
-> compact product context
-> FunctionGemma native runner
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

React Native and Expo provide the mobile showcase surface. TypeScript owns UI, action schemas, validation, diagnostics, and orchestration. Native Android code owns real model loading and inference for the current Android path.

## Current Limitations

- Real FunctionGemma mobile inference is implemented but not yet verified on device with a compatible `.task` model.
- Rule-based parser exists only for isolated tests/evals, not runtime fallback.
- AsyncStorage local persistence exists for MVP snapshots.
- Smoke eval runner exists; full eval dataset is not complete.
- FunctionGemma runner package includes an Android MediaPipe native module; iOS is not implemented.
