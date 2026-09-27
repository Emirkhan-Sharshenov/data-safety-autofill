# Architecture — Consent Pipeline

```mermaid
flowchart LR
    %% Inputs
    AP["Android Project\n(manifest · gradle · Kotlin)"]
    GD["Google Data Safety\nDocumentation"]

    %% Schema
    SCH["lib/schema\nTyped data-type keys"]

    %% Analyzers (parallel)
    MA["Manifest Analyzer\nreads: AndroidManifest.xml\nproduces: permission evidence"]
    DA["Dependency Analyzer\nreads: build.gradle\nproduces: SDK evidence"]
    CA["Code Analyzer\nreads: Kotlin sources\nproduces: egress evidence ★high"]

    %% Reconciler
    REC["Reconciler\ncode › dependency › manifest"]

    %% Outputs
    FF["Filled Form\n+ file:line evidence"]
    MD["Markdown Export"]

    GD --> SCH
    AP --> MA & DA & CA
    SCH --> MA & DA & CA
    MA & DA & CA --> REC
    REC --> FF
    REC --> MD
```

Each finding is backed by at least one `evidence` entry (file path + line
number), so every answer on the form is traceable to a specific line of
source code or configuration.

**Evidence priority rule.** When multiple analyzers detect the same data
type, the reconciler trusts the most direct signal: real egress found in
Kotlin source takes precedence over an SDK lookup in `build.gradle`, which
in turn takes precedence over a declared permission in the manifest. A
manifest-only signal with no supporting code or dependency resolves to
`collected: false`, never `needsReview`.
