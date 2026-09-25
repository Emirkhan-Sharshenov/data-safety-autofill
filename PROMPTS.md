# Промпты для Bob — по порядку

Вставляй как есть. Промпты на английском намеренно: Bob работает с ним
стабильнее, и половина текста потом переедет в README.

**Правила на всю субботу:**

- Перед дорогим промптом — сначала **Plan mode**, потом Code. План дешевле,
  чем агент, ушедший не туда.
- **Новый контекст** между этапами. Длинная история дорожает.
- После каждого промпта — **скриншот сессии**:
  `powershell -File tools/new-session-shot.ps1 -Task N -Desc краткое_описание`
- Смотри процент в Settings → General после каждого этапа.

---

## Этап 1 — фундамент (~6 Bobcoins)

### 1.1 Контекст проекта

Просто команда, без промпта:

```
/init
```

Сгенерит `AGENTS.md`. Дальше Bob не будет переразбирать проект каждый раз.

📸 `-Task 1 -Desc init_agents_md`

---

### 1.2 Каркас

**Mode: Agent**

```
Create a Next.js 15 app (App Router, TypeScript, Tailwind) at the repo root,
alongside the existing fixtures/, eval/, policies/ and tools/ folders. Do not
move or modify those folders.

Structure:
  app/                    Next.js routes
  lib/analyzers/          analysis logic, pure functions, no React imports
  lib/schema/             Data Safety form schema and types
  fixtures/               already exists, Android projects to analyse

Requirements:
- No database, no auth, no external API calls. Everything runs locally.
- lib/ must be unit-testable without a browser.
- Add a single page at / that renders "Data Safety Autofill" and nothing else
  for now.
- Add a .gitignore entry for .next and node_modules if not already present.

Keep it minimal. I will add features in later tasks.
```

Потом сразу задеплой на Vercel, **не откладывая**:

```bash
npx vercel
```

📸 `-Task 2 -Desc project_scaffold`

---

### 1.3 Document understanding — схема формы

Самый важный промпт этапа. Сначала сохрани страницы документации в
`policies/` (Ctrl+S из браузера), потом:

**Mode: Agent**

```
Read the Google Play Data safety documentation I saved in policies/.

Produce lib/schema/data-safety-schema.ts exporting a typed, exhaustive
representation of the Data safety form:

1. Every data category and every data type inside it, with the exact labels
   Google uses.
2. For each data type: which questions must be answered (collected, shared,
   processing is ephemeral, required or optional) and the allowed values.
3. The full list of collection purposes Google defines.
4. The app-level questions (encryption in transit, deletion requests,
   independent security review).

For every entry include a `sourceUrl` field pointing at the specific
documentation page it came from, and a short `definition` field in Google's
own terms describing what counts as that data type.

Critical rule to encode explicitly in the types and document in a comment:
data that an app accesses but never sends off the device does NOT count as
collected. Model this so an analyzer can distinguish "permission present"
from "data leaves the device".

Do not invent categories. If the documentation is ambiguous, add a
`needsReview: true` flag rather than guessing.
```

📸 `-Task 3 -Desc document_understanding_schema` ← **ключевая сессия, не пропусти**

---

## Этап 2 — анализаторы (~12 Bobcoins)

Здесь запускаешь **три субагента параллельно**. Это то, что гайд называет
сильной заявкой, и это надо показать в видео.

### 2.1 Три агента разом

**Mode: Agent.** Один промпт, три подзадачи:

```
Spawn three subagents to work in parallel. Each writes one analyzer in
lib/analyzers/ and must not modify the others' files.

Shared contract — every analyzer exports:

  analyze(input): Finding[]

  type Finding = {
    dataType: string        // must match a key in lib/schema/data-safety-schema.ts
    collected: boolean
    shared: boolean
    confidence: 'high' | 'medium' | 'low'
    reasoning: string       // one sentence, plain English
    evidence: { file: string; line: number; snippet: string }[]
  }

A Finding with no evidence entries is invalid. Never emit one.

Subagent A — lib/analyzers/manifest.ts
  Input: AndroidManifest.xml contents.
  Map permissions and foreground service types to the data types they make
  possible. Because a permission alone does not prove collection, every
  finding from this analyzer caps confidence at 'medium' and must say in
  reasoning that it indicates capability, not confirmed collection.

Subagent B — lib/analyzers/dependencies.ts
  Input: build.gradle / build.gradle.kts / libs.versions.toml contents.
  Maintain a lookup table mapping well-known Android SDKs to the data they
  collect by default. Cover at minimum: Firebase Analytics, Crashlytics,
  Google Play Services Ads, Google Play Services Location, Google Sign-In,
  OkHttp, Retrofit, osmdroid, Room, WorkManager.
  For each entry record what it collects and a sourceUrl to that SDK's own
  privacy documentation. Mark anything not in the table as needsReview.

Subagent C — lib/analyzers/code.ts
  Input: a list of source files.
  Find where data actually leaves the device: network calls, analytics
  events, logging to remote sinks, file uploads. Report the data type being
  sent. This is the only analyzer allowed to emit confidence 'high', because
  it observes real egress.

Write unit tests for each analyzer against fixtures/ne-prospi.
```

📸 три скриншота: `-Task 4 -Desc analyzer_manifest`, `-Task 5 -Desc analyzer_dependencies`, `-Task 6 -Desc analyzer_code`

---

### 2.2 Сведение результатов

**Mode: Agent**

```
Write lib/analyzers/reconcile.ts.

Input: findings from all three analyzers.
Output: one answer per data type in the schema, ready to fill the form.

Rules:
- Code evidence wins over dependency evidence, which wins over manifest
  evidence. A manifest capability with no supporting code or dependency
  evidence resolves to "not collected" with a note explaining why.
- Keep every contributing finding attached to the final answer so the UI can
  show the full evidence trail.
- Produce a top-level summary: total data types collected, how many were
  found only through dependencies (developer would likely miss these), and
  how many need manual review.

That "found only through dependencies" number is the headline metric of the
whole project. Make it a first-class field, not something derived in the UI.

Add unit tests covering: conflicting evidence, manifest-only capability, and
a dependency-only finding.
```

📸 `-Task 7 -Desc reconciler`

---

## Этап 3 — веб-интерфейс (~6 Bobcoins)

**Mode: Agent**

```
Build the UI on the existing Next.js page.

Flow:
1. User pastes AndroidManifest.xml and build.gradle contents into two text
   areas, or picks one of the bundled fixtures from a dropdown.
2. On submit, run the analyzers and reconciler.
3. Render the filled Data safety form, grouped by category.

For every answer show: the value, the confidence, the one-sentence reasoning,
and an expandable evidence list with file, line and snippet.

Above the form show the summary bar: X data types collected, Y found only
through third-party SDKs, Z need review. Make Y visually prominent — it is
the point of the product.

Add an export button producing a Markdown file of the completed form.

Design: clean, readable, works in light and dark. No login, no backend calls.
Pre-load fixtures/ne-prospi as the default so the page is never empty.
```

📸 `-Task 8 -Desc web_ui`

Задеплой и проверь ссылку с телефона — судья может открыть её где угодно.

---

## Этап 4 — доказательства (~4 Bobcoins)

**Mode: Agent**

```
Create eval/ tooling that produces the numbers for my submission.

1. Run the full pipeline over all three projects in fixtures/ and write
   eval/findings.md: a table per project of data types found, split by which
   analyzer found them.

2. I have a manual baseline in eval/baseline.md, filled in by hand before
   this tool existed, with a confidence column. Write eval/comparison.md
   comparing my manual answers against the tool's output:
   - data types I marked uncertain that the tool resolved
   - data types I missed entirely
   - data types I got right that the tool disagrees with (these matter most,
     investigate each one)
   - time: my recorded minutes versus the tool's runtime

Do not flatter the tool. If my manual answer was better, say so plainly in
the table. A comparison that only shows wins is not credible to judges.
```

📸 `-Task 9 -Desc evaluation`

---

## Этап 5 — упаковка (~6 Bobcoins, воскресенье)

### 5.1 README на английском

```
Rewrite README.md in English for hackathon judges. Structure:

1. One-sentence description of what this does.
2. The problem: filling Google Play's Data safety form by hand, why it is
   slow, and why third-party SDKs make it error-prone.
3. The solution and how it works, with the architecture.
4. Results: the real numbers from eval/comparison.md. No rounding up.
5. How IBM Bob was used to build it.
6. How to run it locally, plus the live URL.

Keep it under 800 words. Judges skim.
```

### 5.2 Диаграмма архитектуры

```
Generate a Mermaid diagram of the pipeline: inputs, the three parallel
analyzers, the reconciler, the UI. Save it to docs/architecture.md and embed
it in the README. Keep it readable at a glance — this goes on a slide.
```

### 5.3 Черновик Bob Usage Statement

⚠️ Это черновик. **Перепиши своими словами** — статья о том, как ты
использовал Bob, и врать в ней нельзя.

```
Draft an IBM Bob Usage Statement, 500 words maximum, describing how Bob was
used to build this project. Base it strictly on what actually happened in
this repository: the tasks, the subagents, the document understanding step.
Use my task history as the source. Do not claim features I did not use.
Mark with [CHECK] any sentence you are not certain about.
```

📸 `-Task 10 -Desc readme_and_docs`

---

## Если монеты кончаются раньше времени

Режь в этом порядке:

1. Субагент C (анализ кода) — самый дорогой, а манифест плюс зависимости
   дают основную ценность
2. Экспорт в Markdown
3. Третий и второй проекты в eval — хватит одного `ne-prospi`

Не режь: document understanding, сведение результатов, веб-интерфейс,
сравнение с baseline. Это скелет.
