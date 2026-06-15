# Testing

Initial testing commands:

```bash
pnpm typecheck
pnpm test
```

The first real tests should cover pure domain logic in `packages/core` before UI workflows are expanded.

Current verification baseline:

```bash
pnpm typecheck
pnpm test
pnpm --filter mobile exec expo export --platform web --clear
```
