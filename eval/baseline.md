# Baseline — filling the Data safety form by hand

App: `ne-prospi`, an alarm clock. Measured **before** the tool existed,
on the evening of Friday 25 September 2026.

## Result

| Metric | Value |
| --- | --- |
| **Time** | 17 min 57 sec |
| Rows completed | 31 of 31 |
| Data types marked as collected | **11** of 28 |
| Of those, at confidence 1–2 | **6** |
| Share of guesses among "collected" answers | **55%** |

More than half of the affirmative answers were guesses. That is the
problem this tool addresses: not speed, but having to commit to an answer
you do not know while the form still requires one.

### Caveat on the timing figure

The template was simplified — it asked only "collected or not". The real
Play Console form asks follow-up questions for every collected type: the
purpose of collection (up to seven options), whether collection is
required or optional, whether the data is shared with third parties, and
whether processing is ephemeral.

So 18 minutes is a **floor** for the base decision, not the time to fill
the complete form. The submission states it that way.

## Answers

`no` — judged not collected, answered with confidence.
A number — judged **collected**, the value is confidence on a 1–5 scale.

| # | Data type | Recorded |
| --- | --- | --- |
| 1 | Approximate location | 5 |
| 2 | Precise location | 3 |
| 3 | Name | no |
| 4 | Email address | no |
| 5 | User IDs | no |
| 6 | Phone number | no |
| 7 | User payment info | no |
| 8 | Purchase history | no |
| 9 | Health info | no |
| 10 | Fitness info | no |
| 11 | Other in-app messages | 4 |
| 12 | Photos | no |
| 13 | Videos | no |
| 14 | Voice or sound recordings | no |
| 15 | Music files | 3 |
| 16 | Other audio files | no |
| 17 | Files and docs | 2 |
| 18 | Calendar events | 1 |
| 19 | Contacts | no |
| 20 | App interactions | 1 |
| 21 | In-app search history | 2 |
| 22 | Installed apps | 2 |
| 23 | Other user-generated content | no |
| 24 | Web browsing history | no |
| 25 | Crash logs | no |
| 26 | Diagnostics | 2 |
| 27 | Other app performance data | 3 |
| 28 | Device or other IDs | no |

### App-level questions

| # | Question | Recorded |
| --- | --- | --- |
| 29 | Data is encrypted in transit | no |
| 30 | Users can request deletion | no |
| 31 | Practices independently reviewed | 2 |

## Marked as collected — 11 types

| Confidence | Types |
| --- | --- |
| 5 | Approximate location |
| 4 | Other in-app messages |
| 3 | Precise location, music files, other app performance data |
| **2** | **Files and docs, in-app search history, installed apps, diagnostics** |
| **1** | **Calendar events, app interactions** |

The six highlighted rows are the core of the demonstration. For each of
them the form demanded an answer that the developer did not have.

## To check against the tool first

Answers that looked suspect at the time and were worth re-examining — a
disagreement here would be the most interesting result:

- 22, installed apps — not obvious for an alarm clock with no analytics
- 18, calendar events — confidence 1, and the manifest holds no calendar
  permission
- 25, crash logs — marked confidently as **not** collected, even though
  the source makes network calls

## What was missed

See [`comparison.md`](comparison.md) for what the tool found that this
manual pass did not. The gap between the two lists is the evidence of
value.
