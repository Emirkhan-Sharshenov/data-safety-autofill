# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

IBM Bob 2.0 hackathon project: **Consent** — a Next.js web app that fills Google Play's Data Safety form from Android project code (manifest + gradle + source), with file-and-line evidence for every answer.

Stack (to be scaffolded): **Next.js 15 (App Router), TypeScript, Tailwind CSS**. No database, no auth, no external API calls — everything runs locally. Deployed on Vercel.

## Directory Structure

```
app/               Next.js routes
lib/analyzers/     Analysis logic — pure functions, NO React imports
lib/schema/        Data Safety form schema and types
fixtures/          Android project fixtures for analysis (3 projects)
eval/              Baseline and findings for evaluation
policies/          Google Data Safety documentation (saved locally)
bob_sessions/      Bob task session screenshots (hackathon deliverable)
tools/             PowerShell utility scripts
```

## Commands

```bash
# Screenshot a Bob task session (run AFTER Win+Shift+S on the task summary)
powershell -File tools/new-session-shot.ps1 -Team <name> -Task <N> -Desc <slug>
# Or use the latest screenshot from Pictures\Screenshots:
powershell -File tools/new-session-shot.ps1 -Task <N> -Desc <slug> -FromScreenshotsFolder
# -Team only needs to be passed once; it is remembered in tools/.team
```

After Next.js is scaffolded, standard commands will be:
```bash
npm run dev       # local dev
npx vercel        # deploy (run from repo root)
```

## Critical Architecture Constraints

- `lib/` must be **unit-testable without a browser** — no React imports in analyzers or schema.
- Every analyzer exports `analyze(input): Finding[]`. A `Finding` with no `evidence` entries is **invalid — never emit one**.
- Confidence caps: manifest analyzer → max `'medium'`; only code analyzer can emit `'high'` (it observes real egress).
- Reconciler priority: **code > dependency > manifest**. A manifest-only capability with no code/dependency support resolves to `collected: false`.
- The `foundOnlyThroughDependencies` count in `ReconcilerSummary` is a **first-class field** (headline metric), not a UI derivation.

## Fixtures

Three real Android projects in `fixtures/` — all author-owned, no client data:

| Fixture | What it tests |
|---|---|
| `ne-prospi` | Alarm clock: osmdroid SDK, location + media playback foreground service, exact alarm. Primary fixture for `eval/baseline.md`. |
| `mesh-network` | P2P messenger: `play-services-nearby`, Tink crypto, Bluetooth + Wi-Fi Direct permissions. |
| `project` | Flutter app: split manifests (`main`/`debug`/`debugOptimized`) — tests manifest merging and debug config leaking into release. No gradle files (excluded from repo). |

## Non-obvious Gotchas

- `project/android/` fixture has **no gradle files** — the build.gradle in the source repo contains a hardcoded signing password. Analyzers must handle missing gradle gracefully.
- `ne-prospi` has **two modules** with separate manifests: `app/` and `ne-prospi-android/app/` — both must be merged when analyzing.
- `policies/` is intentionally empty in the repo; Google documentation is saved here manually (Ctrl+S from browser) before running prompt 1.3.
- `bob_sessions/` PNG naming format is `{team}_task{NN}_{desc}_summary.png` — the script enforces this automatically.
- Bob resource budget is **40 Bobcoins total** (solo). Agent mode only for actual code writes; Ask mode for questions. New context between major phases.
- PROMPTS.md contains the full ordered prompt sequence (stages 1–5) — follow it to stay within budget.
