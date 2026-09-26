# Findings — Data Safety Analysis

_Generated: 2026-09-26T11:43:04.782Z_
_Total pipeline time (both projects): 35 ms_

## ne-prospi

_Analysis time: 23 ms — 2 data types collected, 0 found only through dependencies, 2 need review_

| Data type | Collected | Confidence | Resolved by | Note |
| --- | --- | --- | --- | --- |
| Approximate location | No | Medium | code | needs review |
| Precise location | ✅ Yes | High | code |  |
| Name | No | — | — |  |
| Email address | No | — | — |  |
| User IDs | No | — | — |  |
| Address | No | — | — |  |
| Phone number | No | — | — |  |
| Race and ethnicity | No | — | — |  |
| Political or religious beliefs | No | — | — |  |
| Sexual orientation | No | — | — |  |
| Other info | No | — | — |  |
| User payment info | No | — | — |  |
| Purchase history | No | — | — |  |
| Credit score | No | — | — |  |
| Other financial info | No | — | — |  |
| Health info | No | — | — |  |
| Fitness info | No | — | — |  |
| Emails | No | — | — |  |
| SMS or MMS | No | — | — |  |
| Other in-app messages | No | — | — |  |
| Photos | No | — | — |  |
| Videos | No | — | — |  |
| Voice or sound recordings | No | — | manifest | manifest-only → downgraded |
| Music files | No | — | — |  |
| Other audio files | No | — | — |  |
| Files and docs | No | — | — |  |
| Calendar events | No | — | — |  |
| Contacts | No | — | — |  |
| App interactions | No | — | manifest | manifest-only → downgraded |
| In-app search history | No | — | — |  |
| Installed apps | No | — | — |  |
| Other user-generated content | No | — | — |  |
| Other actions | ✅ Yes | High | code |  |
| Web browsing history | No | — | — |  |
| Crash logs | No | — | — |  |
| Diagnostics | No | — | — |  |
| Other app performance data | No | — | — |  |
| Device or other IDs | No | Medium | code | needs review |

### Summary

| Metric | Value |
| --- | --- |
| Total data types | 38 |
| Collected | **2** |
| Found only through dependencies | **0** |
| Needs review | 2 |
| Analysis time | 23 ms |

## mesh-network

_Analysis time: 11 ms — 2 data types collected, 2 found only through dependencies, 0 need review_

| Data type | Collected | Confidence | Resolved by | Note |
| --- | --- | --- | --- | --- |
| Approximate location | No | — | — |  |
| Precise location | No | — | manifest | manifest-only → downgraded |
| Name | No | — | — |  |
| Email address | No | — | — |  |
| User IDs | No | — | — |  |
| Address | No | — | — |  |
| Phone number | No | — | — |  |
| Race and ethnicity | No | — | — |  |
| Political or religious beliefs | No | — | — |  |
| Sexual orientation | No | — | — |  |
| Other info | No | — | — |  |
| User payment info | No | — | — |  |
| Purchase history | No | — | — |  |
| Credit score | No | — | — |  |
| Other financial info | No | — | — |  |
| Health info | No | — | — |  |
| Fitness info | No | — | — |  |
| Emails | No | — | — |  |
| SMS or MMS | No | — | — |  |
| Other in-app messages | No | — | — |  |
| Photos | No | — | manifest | manifest-only → downgraded |
| Videos | No | — | manifest | manifest-only → downgraded |
| Voice or sound recordings | No | — | — |  |
| Music files | No | — | — |  |
| Other audio files | No | — | — |  |
| Files and docs | No | — | — |  |
| Calendar events | No | — | — |  |
| Contacts | No | — | — |  |
| App interactions | No | — | manifest | manifest-only → downgraded |
| In-app search history | No | — | — |  |
| Installed apps | No | — | — |  |
| Other user-generated content | No | — | dependency |  |
| Other actions | ✅ Yes | Medium | dependency |  |
| Web browsing history | No | — | — |  |
| Crash logs | No | — | — |  |
| Diagnostics | No | — | code |  |
| Other app performance data | No | — | — |  |
| Device or other IDs | ✅ Yes | Medium | dependency |  |

### Summary

| Metric | Value |
| --- | --- |
| Total data types | 38 |
| Collected | **2** |
| Found only through dependencies | **2** |
| Needs review | 0 |
| Analysis time | 11 ms |
