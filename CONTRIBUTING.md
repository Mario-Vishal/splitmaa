# Contributing

Splitmaa is early. Keep contributions aligned with the core safety rule:

```text
model output -> validation -> confirmation -> deterministic execution -> persistence -> audit log
```

Do not add flows where model output writes directly to state, storage, SQL, or UI.

Useful checks:

```bash
pnpm typecheck
pnpm test
pnpm eval:smoke
```
