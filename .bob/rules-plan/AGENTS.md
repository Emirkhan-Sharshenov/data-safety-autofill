# AGENTS.md — Plan Mode Rules

This file provides guidance to agents when working with code in this repository.

## Architectural Constraints (Non-Obvious)

- The three analyzers (manifest / dependencies / code) are intentionally **independent and stateless** — they must not read each other's output; only the reconciler merges their findings.
- Confidence is architecturally bounded: manifest → max `'medium'`; dependencies → max `'medium'`; code → can be `'high'`. This asymmetry is by design and must be preserved in any refactor.
- The dependency analyzer uses an **inline lookup table** (not an external API) mapping known SDK identifiers to the data types they collect, with `sourceUrl` to the SDK's own privacy docs. Any new SDK must be added to this table explicitly or flagged as `needsReview`.
- `foundOnlyThroughDependencies` is a **product requirement**, not a display concern — it must surface as a named field in the reconciler's output type.
- No backend: all analysis runs client-side or at Next.js build time. No database, no server-side auth, no API calls to external services.
- Budget constraint: subagents for the three analyzers are built in **one parallel prompt** (prompt 2.1). Plan tasks to keep Agent-mode usage minimal — prefer Plan+Agent pairs over pure Agent sessions.
- Bobcoin checkpoints: ≤6 by 13:00 Saturday, ≤15 by 16:30, ≤24 by 21:30. If over budget, cut in order: code analyzer → Markdown export → secondary eval fixtures.
