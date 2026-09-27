# Тексты для сабмишена

Всё, что видит судья — на английском. Места в `[СКОБКАХ]` заполняются
в воскресенье реальными числами. **Не сдавай с незаполненными скобками.**

---

## Ссылки

- **Приложение:** https://data-safety-autofill.vercel.app
- **Репозиторий:** https://github.com/Emirkhan-Sharshenov/data-safety-autofill
- **Demo Application Platform:** Vercel

Каждый `git push` в `main` автоматически передеплоивает сайт — руками
запускать `vercel` больше не нужно.

---

## Название

Основной вариант: **Consent** — короткое, произносимое, не описывает
механику, а называет суть.

Запасные: `DataSafe`, `Declared`, `SafetyFill`.

---

## Short description

> Fills Google Play's Data safety form from your Android code, with
> file-and-line evidence behind every answer — including the data your
> third-party SDKs collect without telling you.

---

## Problem & Solution Statement

Лимит 500 слов. Черновик ниже — **[ЧИСЛО] слов**, место под результаты есть.

### Problem

Every Android app on Google Play must complete a Data safety form
declaring what user data it collects, whether that data is shared, and
why. The declaration is binding. Inaccurate answers get apps suspended.

The form is hard for a reason that has nothing to do with effort. A
developer knows their own code. They do not know what the libraries
inside their app do. Analytics SDKs, crash reporters, ad networks and
map libraries collect data on their own, and Google explicitly requires
third-party collection to be declared as if it were the developer's own.

I measured this on my own alarm-clock app before building anything.
Answering the core collected-or-not question for 28 data types took 18
minutes. Of the 11 types I marked as collected, 6 were guesses —
confidence 1 or 2 out of 5.

More than half of my affirmative answers were not knowledge. They were
hope.

Speed was never the problem. Certainty was.

### Solution

Consent answers the form from evidence instead of memory.

Three analyzers run in parallel as IBM Bob subagents, each reading a
different kind of proof:

- **Manifest** — which permissions the app holds, and therefore what it
  is capable of touching.
- **Dependencies** — what each third-party SDK collects by default,
  looked up against its own published privacy documentation.
- **Code** — where data actually leaves the device: network calls,
  analytics events, uploads.

A reconciler merges them under Google's own definition: data counts as
collected only when it leaves the device. Code evidence outranks
dependency evidence, which outranks manifest evidence. A permission with
no supporting egress resolves to "not collected".

Every answer carries its proof — file, line, snippet, and one sentence
explaining the call. Nothing is asserted without a citation.

### Results

Of the eleven types I had marked as collected, **nine were false
positives**. The tool resolved all six of my guesses — and in every case
the correct answer was "not collected". It also overturned three answers
I had given confidently. Each was the same mistake: I reasoned from a
permission or a feature, never from evidence that data left the device.

Precision on this app: **9% by hand, 67% for the tool.** Runtime: 27 ms
against 17 minutes 57 seconds.

On my second app, a peer-to-peer messenger, the dependency analyzer found
two data types — Device or other IDs, and Other actions — that appear
nowhere in the app's own source. Both come from `play-services-nearby`.
This is the case Google's policy explicitly covers and the one a developer
cannot reach by reading their own code.

The tool is wrong once, and the repository says so. It reads a
`TelephonyManager` call used to fetch a country code as a device
identifier. There my manual answer was right. That case is documented
rather than quietly fixed, because a tool that only reports its wins is
not one you should trust with a binding legal declaration.

---

## IBM Bob Usage Statement — черновик

⚠️ **Прочитай целиком и поправь всё, за что не готов отвечать на
вопросах.** Это документ о твоей работе, и он сверяется со скриншотами
в `bob_sessions/`.

**Что проверить обязательно:** цифру расхода Bobcoins в предпоследнем
абзаце и последний абзац про другие инструменты — он защищает тебя, но
формулировка должна быть твоей.

```
Bob built this project. I directed it, checked its output against the
repository, and fixed what it got wrong.

/init came first. Bob read the repo and produced AGENTS.md capturing the
architecture rules I had written down — evidence priority, confidence
caps, the two-module fixture. Every later task started with that context
instead of rediscovering it, which is most of why the budget held.

Document understanding built the foundation. I saved Google's Data safety
documentation locally and had Bob turn it into a typed schema: every data
category and type with Google's exact labels, the allowed answers, the
seven collection purposes, each carrying the URL it came from. Where the
two source documents disagreed, Bob flagged the conflict instead of
choosing. That schema became the single contract all three analyzers
share. It cost 0.83 Bobcoins.

Three analyzers were then built as parallel subagents against a shared
Finding contract, each reading a different kind of proof: the manifest for
permissions, the gradle files for third-party SDKs, the Kotlin source for
places where data actually leaves the device. Isolated contexts meant they
could not drift into each other's rules.

What running it on real code caught is the part worth reporting. The first
code analyzer declared that my alarm clock collects photos. Every piece of
evidence it offered pointed at CameraManager.setTorchMode — the app uses
the camera API as a flashlight. It was also asserting collection from API
reads while its own reasoning strings hedged with "may be transmitted".
That contradicted the rule we had just encoded in the schema: Google
counts data as collected only when it leaves the device. I had Bob split
read patterns from egress patterns, narrow the camera rule to capture
APIs, and reserve high confidence for proven egress. The false positive
disappeared. Its unit tests had passed throughout.

The same habit caught two invented details in the README Bob drafted —
data-type names that do not exist in the schema, and a fix it claimed to
have made but had not. Both were corrected before submission. Checking
generated text against the repository, rather than trusting the summary,
is the single practice I would carry to the next project.

Total spend: [ЦИФРА] of 40 Bobcoins, solo, across [ЧИСЛО] tasks. Session
summaries are in bob_sessions/.

Planning, rule research and the written submission materials were done
with a separate assistant; the commit history attributes it. The product
itself — schema, analyzers, reconciler, interface, evaluation — was built
with Bob.
```

---

## Старый каркас (для справки)

```
Bob built this project end to end. [СКОЛЬКО] tasks, all captured in
bob_sessions/.

Document understanding. I saved Google's Data safety documentation
locally and had Bob turn it into a typed schema of the form — every data
category, every question, every allowed answer, each carrying the URL it
came from. [ЧТО ПОЛУЧИЛОСЬ, ЧТО ПРИШЛОСЬ ПРАВИТЬ РУКАМИ]

Parallel subagents. The three analyzers were built as separate subagents
working at the same time against a shared contract. [ЧТО ЗАМЕТИЛ,
ЧЕМ ЭТО ОТЛИЧАЛОСЬ ОТ ОБЫЧНОГО ЧАТА]

Agent mode. [ЧТО ПИСАЛ АГЕНТ, ГДЕ ТЫ ВМЕШИВАЛСЯ]

What I had to correct. [ОБЯЗАТЕЛЬНО НАПИШИ. Судьи видели сотни заявок,
где всё прошло идеально. Честный абзац про то, где Bob ошибся и как ты
это поймал, добавляет доверия ко всему остальному]

Budget. The whole project was built inside the 40 Bobcoin hackathon
allocation. [СКОЛЬКО ПОТРАЧЕНО]
```

---

## Озвучка по фрагментам — для записи в CapCut

Ставь курсор в начало фрагмента, жми Voiceover, читаешь под свою же
картинку. Темп ~2 слова в секунду.

### Фрагмент A — документация Google · 20 слов ≈ 10 сек

> Every Android app on Google Play has to fill in a Data safety form.
> Get it wrong, and your app can be taken down.

### Фрагмент B — baseline.md · 42 слова ≈ 20 сек

> Before I built anything, I filled that form by hand for my own alarm
> clock. It took eighteen minutes. I marked eleven data types as
> collected. Six of those were guesses — I had no idea, but the form
> still required an answer.

### Фрагмент C — comparison.md, таблица · 24 слова ≈ 12 сек

> Then I built Consent, and ran it on the same app.
>
> *(пауза одну секунду)*
>
> Nine of those eleven were wrong. Not because I was careless — because
> I kept confusing permission with collection.

### Фрагмент D — демо · 150 слов ≈ 75 сек на 90 сек картинки

Запас в пятнадцать секунд намеренный: паузы между предложениями нужны,
иначе речь под демо звучит тараторкой.

> Here is the form filled from my mesh messenger. Two data types
> collected. Both found only through a third-party SDK — Google Play
> Services Nearby. Nothing in my own code touches device identifiers.
>
> Every answer carries its proof. File, line, and the actual snippet —
> line thirty-six of build dot gradle.
>
> And it says nothing where it found nothing. Thirty-six types, no
> evidence, no declaration.
>
> Same tool, my alarm clock. Precise location — confirmed. Coordinates
> go to a geocoding service. Yesterday I guessed this with three out of
> five confidence. Now there is a line number.
>
> Where it cannot prove transmission, it says so instead of guessing.
>
> The whole form exports with every citation intact. All of it built
> with Bob — three analyzers running as parallel subagents.

### Фрагмент E — раздел 3f и диаграмма · 55 слов ≈ 27 сек

> The tool is not perfect. It reported my alarm clock collects photos,
> because the app uses the camera API as a flashlight. I caught that by
> running it against real code.
>
> Eighteen minutes became forty-three milliseconds. But speed was never
> the problem. Certainty was.

**Если не влезает** — режь в этом порядке: в E фразу про фонарик до
«It reported my alarm clock collects photos — the camera API is used as
a flashlight», в B предложение про восемнадцать минут (цифра всё равно
прозвучит в E), в D абзац про экспорт.

**Не режь:** «Nine of those eleven were wrong», «found only through a
third-party SDK», «The tool is not perfect».

---

## Текст для озвучки — читать вслух (единым куском)

Примерно 400 слов, ~2:40 при спокойном темпе. Репетируй с секундомером.
Если не укладываешься — режь третий абзац, не демо.

```
Every Android app on Google Play has to fill in a Data safety form. You
declare what data your app collects, whether you share it, and why. Get it
wrong and your app can be taken down.

Before I built anything, I filled that form by hand for my own alarm clock
app. It took eighteen minutes. I marked eleven data types as collected.
Six of those eleven were guesses — I had no idea, but the form still
required an answer.

Then I built Consent, and ran it on the same app.

Nine of those eleven were wrong.

Not because I was careless. Because I kept confusing permission with
collection. The app has a coarse location permission, so I declared coarse
location. It plays an alarm sound, so I declared music files. It can post
notifications, so I declared messages. None of that is collection. Google
counts data as collected only when it leaves the device.

That distinction is what the tool is built around.

[ДЕМО — говоришь поверх экрана]

Here is the form filled from my mesh messenger. Two data types collected.
Both of them found only through a third-party SDK — Google Play Services
Nearby. Nothing in my own code touches device identifiers. I could have
read every line I wrote and never found these.

Every answer carries its proof. File, line, and the actual snippet. This
one points at line thirty-six of build dot gradle.

Three analyzers produce this, running as parallel Bob subagents. One reads
the manifest, one reads dependencies, one reads source code for places
where data actually leaves the device. A reconciler merges them: code
evidence outranks dependencies, dependencies outrank the manifest.

[КОНЕЦ ДЕМО]

The tool is not perfect. It reported my alarm clock collects photos,
because the app uses the camera API as a flashlight. I caught that by
running it against real code and reading the evidence. It also flags a
country-code lookup as a device identifier — there, my manual answer was
right and the tool is wrong. Both are documented in the repository.

Eighteen minutes became forty-three milliseconds. But speed was never the
problem. Certainty was.
```

**Где какие цифры** — если собьёшься, все они в `eval/comparison.md`:
18 минут, 11 отмечено, 6 догадок, 10 ошибок, 2 типа только через SDK, 43 мс.

---

## Сценарий записи — что делать по порядку

### Подготовка, 10 минут

- [ ] Закрыть почту, мессенджеры, лишние вкладки
- [ ] Проверить статус-бар Bob IDE — там виден аккаунт
- [ ] Открыть https://data-safety-autofill.vercel.app, масштаб **125%**
- [ ] Прокликать все десять шагов демо **вхолостую**, без записи
- [ ] Открыть заранее во вкладках: `eval/baseline.md`, `eval/comparison.md`,
      [форма Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
- [ ] OBS: 1920×1080, 30 fps, запись экрана без микрофона
- [ ] Записать 10 секунд, посмотреть: чёткий ли текст, виден ли курсор

### Снимаем пятью отдельными клипами

Не одним куском. Испортил один — переснимаешь десять секунд, а не всё.

| Клип | Длина | Что на экране |
| --- | --- | --- |
| **A** | 12 сек | Документация Google. Сначала абзац про сторонний код (см. ниже), потом раскрыть **Data types** и пролистать таблицу — видно масштаб формы |
| **B** | 28 сек | `eval/baseline.md`, листаешь список ответов. Задержаться на строках с единицами и двойками |
| **C** | 10 сек | `eval/comparison.md`, раздел с итогом. Задержаться на строке «9 of 11 (82%)» |
| **D** | **105 сек** | Демо по хореографии ниже, все десять шагов |
| **E** | 20 сек | `eval/comparison.md` раздел 3f (где инструмент ошибся), потом диаграмма архитектуры |

Клип **D** — главный, на него не жалей дублей. Остальные простые.

### Клип A, подробно

Страница: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en

1. **0–7 сек.** Найди на странице абзац, начинающийся со слов
   «In addition to reviewing how your app collects and shares user data...».
   Он заканчивается фразой **«You must reflect data collection or sharing
   carried out by such third-party code in the Data safety form for your
   app»**. Задержись на нём — это сам Google требует отвечать за чужие
   библиотеки, то есть обоснование всего проекта его же словами.
   Можно выделить эту фразу мышкой.
2. **7–12 сек.** Прокрути ниже до заголовка «Data types and purposes»,
   кликни **Data types** — раскроется длинная таблица категорий. Пролистай
   её пару секунд, чтобы стал виден масштаб.

Поиск по странице: `Ctrl+F` → `In addition to reviewing`.

### Потом голос

Сводишь клипы встык, смотришь получившееся видео и читаешь текст поверх.
Не наоборот. Тогда не нужно попадать словами в клики, а оговорку
переписываешь без потери картинки.

Соответствие: A и B — первые два абзаца, C — «Nine of those eleven answers
were wrong», D — блок демо, E — предпоследний и последний абзацы.

### Сборка и экспорт

- [ ] Смонтировать: A + B + C + D + E
- [ ] Наложить звук
- [ ] **Проверить хронометраж: строго меньше 3:00**
- [ ] Проверить, что демо занимает **не меньше 1:30**
- [ ] Экспорт MP4, H.264, 1080p
- [ ] Посмотреть целиком один раз перед отправкой

### Проверка по правилам

- [ ] MP4, не длиннее 3 минут
- [ ] Минимум 90 секунд работающего решения на экране
- [ ] Закадровый голос есть
- [ ] Видно, как использовался Bob — панель Tasks в клипе D, шаг 10
- [ ] В кадре нет почты, токенов, личной переписки

---

## Хореография демо — 105 секунд

Требование: **минимум 90 секунд работы решения на экране**. Блок озвучки
выше даёт только 45, поэтому показываем больше и говорим медленнее.

Репетируй с секундомером по шагам. Курсор ведёшь плавно — рывки на записи
выглядят нервно.

| № | Время | Что делаешь на экране | Что говоришь |
| --- | --- | --- | --- |
| 1 | 0:00–0:08 | Страница уже открыта на `mesh-network`. Просто держишь кадр | «Here is the form filled from my mesh messenger.» |
| 2 | 0:08–0:20 | Наводишь курсор на три числа в сводке, задерживаешься на фиолетовом | «Two data types collected. Both found only through a third-party SDK.» |
| 3 | 0:20–0:32 | Прокрутка к разделу Collected, курсор на `Device or other IDs` | «Google Play Services Nearby. Nothing in my own code touches device identifiers.» |
| 4 | 0:32–0:45 | Клик по `▸ 1 evidence item`, раскрывается доказательство | «Every answer carries its proof. File, line, and the actual snippet — line thirty-six of build dot gradle.» |
| 5 | 0:45–0:55 | Клик по свёрнутому блоку `36 data types with no evidence found` | «And it says nothing where it found nothing. Thirty-six types, no evidence, no declaration.» |
| 6 | 0:55–1:05 | Переключаешь выпадающий список на `ne-prospi`, жмёшь **Analyze** | «Same tool, my alarm clock.» |
| 7 | 1:05–1:20 | Курсор на `Precise location`, раскрываешь доказательство с `Net.kt` | «Precise location — confirmed. Coordinates go to a geocoding service. Yesterday I guessed this with three out of five confidence. Now there is a line number.» |
| 8 | 1:20–1:30 | Курсор на `needs review`, раскрываешь один из них | «Where it cannot prove transmission, it says so instead of guessing.» |
| 9 | 1:30–1:40 | Клик **Export Markdown**, показываешь скачанный файл | «The whole form exports with every citation intact.» |
| 10 | 1:40–1:45 | Переключаешься в Bob IDE, панель **Tasks** со списком задач | «All of it built with Bob.» |

После десятого шага — обратно на себя или на схему архитектуры, и
последние два абзаца озвучки.

### Что обязательно должно попасть в кадр

- Фиолетовое число «found only via third-party SDK» — суть продукта
- Раскрытое доказательство с именем файла и номером строки
- Панель Tasks в Bob IDE — доказательство использования Bob

### Технические настройки записи

- Разрешение 1920×1080, 30 кадров хватит
- Масштаб страницы **125%** — на маленьком экране судьи мелкий текст нечитаем
- Тёмная тема — она уже стоит, на ней фиолетовое число заметнее
- Курсор крупный, если OBS умеет подсвечивать клики — включи

---

## Сценарий видео — 3 минуты

Жёсткие требования: MP4, максимум 3 минуты, минимум 90 секунд работы
решения на экране, закадровый голос. Судья не смотрит дальше третьей минуты.

| Время | Что на экране | Что говоришь |
| --- | --- | --- |
| 0:00–0:20 | Форма Data safety в Play Console, листаешь | Каждое приложение обязано её заполнить. Ошибёшься — снимут с публикации |
| 0:20–0:45 | Твой `baseline.md`, крупно цифры | Я заполнил её для своего будильника за 18 минут. Из 11 утвердительных ответов 6 были догадками |
| 0:45–2:30 | **Демо.** Выбираешь проект → форма заполняется → раскрываешь доказательство с файлом и строкой | Ведёшь по экрану. Обязательно покажи число «найдено только через зависимости» |
| 2:30–2:50 | Схема архитектуры, три агента | Три субагента Bob работают параллельно, каждый читает свой источник |
| 2:50–3:00 | Итоговые цифры | Что нашлось, чего я не знал |

**Правила записи:**

- Демо — не меньше 105 секунд, чтобы гарантированно перекрыть минимум в 90
- Текст проговори вслух до записи, засеки время
- Закрой почту, токены, статус-бар Bob с аккаунтом
- Пиши голос отдельно на телефон, сводишь при монтаже

---

## Слайды — 7 штук

1. Название, одна строка сути
2. Проблема: форма Data safety и что бывает за ошибку
3. **Твои цифры: 18 минут, 11 ответов, 6 догадок, 55%**
4. Решение: схема с тремя агентами
5. Скриншот интерфейса с раскрытым доказательством
6. Результаты: что нашлось, чего ты не знал
7. Как использовался Bob, сколько монет ушло

Третий слайд — главный. Он единственный, где говорится о реальном
измерении, а не о намерениях.

---

## Чеклист перед отправкой

- [ ] Все `[СКОБКИ]` заполнены
- [ ] Оба текста не длиннее 500 слов
- [ ] Видео не длиннее 3:00, демо не короче 1:30
- [ ] Обложка 16:9
- [ ] Репозиторий публичный, `LICENSE` на месте
- [ ] `bob_sessions/` со скриншотами каждой задачи
- [ ] Ссылка на приложение открывается в режиме инкогнито
