# ADR 0002: AsyncStorage for MVP Local Persistence

## Status

Accepted

## Context

Splitmaa needs to work locally before Supabase sync, SQLite, native model integration, or packaging work. The app must be easy to preview and should not require backend configuration for early demos.

## Decision

Use AsyncStorage as the first local persistence layer for a validated `LocalAppState` snapshot.

The mobile app loads from `splitmaa.localAppState.v1`, validates the parsed JSON with core Zod schemas, and falls back to seed data if storage is missing or invalid.

## Consequences

- The app can persist demo state immediately on device/web preview.
- The storage model is simple and easy to reset.
- AsyncStorage is not the final data layer for complex sync, migrations, or large datasets.
- SQLite or Supabase can be added later behind repository interfaces without changing the core action safety rule.
