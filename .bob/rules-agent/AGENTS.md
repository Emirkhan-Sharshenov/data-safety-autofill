# AGENTS.md — Agent Mode Rules

This file provides guidance to agents when working with code in this repository.

## Coding Rules (Non-Obvious)

- `lib/analyzers/` files must NOT import React or any browser API — they run in unit tests and Next.js server context alike.
- Every `Finding` object **must** have at least one entry in its `evidence` array. Emit nothing rather than an evidenceless finding.
- The `analyze()` function signature is the shared contract across all three analyzers — do not diverge from it.
- `lib/schema/data-safety-schema.ts` is the single source of truth for `dataType` string keys. Analyzers must reference keys from the schema, never invent new strings.
- When a permission exists in the manifest but no egress is found in code or SDK lookup table, resolve to `collected: false` — not `needsReview`.
- The `foundOnlyThroughDependencies` summary field must be computed in `reconcile.ts`, not in the UI layer.
- `fixtures/project` has no `build.gradle` files — dependency analyzer must return an empty/needsReview result when gradle is absent, not throw.
- `ne-prospi` has two manifest files (`app/` and `ne-prospi-android/app/`) — manifest analyzer should accept an array of manifest contents and merge them.

## Test Files

Unit tests for analyzers go co-located or in `__tests__/` alongside the source — vitest is the expected framework (not jest). Tests must run without a browser.
