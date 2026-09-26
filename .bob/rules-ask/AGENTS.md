# AGENTS.md — Ask Mode Rules

This file provides guidance to agents when working with code in this repository.

## Documentation Context (Non-Obvious)

- `policies/` appears empty in the repo — Google Data Safety documentation is saved there manually (Ctrl+S from browser). It is NOT fetched programmatically.
- `eval/baseline.md` is the ground-truth manual measurement: 18 minutes, 11 data types marked collected, 6 of those were low-confidence guesses (confidence 1–2 out of 5).
- `PROMPTS.md` contains the complete ordered prompt sequence (10 tasks across 5 stages) with Bobcoin budget estimates — consult it before advising on what to build next.
- `fixtures/project` deliberately has no gradle files; the README explains this is because the source repo's build.gradle contained a hardcoded signing password.
- `ne-prospi` is the primary evaluation fixture (used in baseline.md). `mesh-network` and `project` are secondary.
- The headline metric is **"data types found only through third-party SDKs"** — not speed. This distinction is central to the pitch and submission text in `SUBMISSION.md`.
- Google's definition (encoded in the schema): data is only "collected" if it **leaves the device**. A permission that never produces egress = not collected.
