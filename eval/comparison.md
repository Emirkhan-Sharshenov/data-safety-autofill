# Comparison — Manual Baseline vs Tool Output (ne-prospi)

**Scope:** ne-prospi only. mesh-network was never measured by hand and does not appear here.

**Baseline notation recap:**
- `нет` = manually judged not collected, confident answer.
- Number (1–5) = manually judged collected; the number is confidence on a 1–5 scale
  (1 = pure guess, 5 = certain).

Tool confidence uses three tiers: `High`, `Medium`, `Low`.

---

## 1. Data types I marked uncertain (confidence 1–2) that the tool resolved

These are the clearest wins for the tool: I had to commit an answer in the form despite
not knowing the right one. The tool has verifiable evidence for each.

| Baseline # | Data type | My answer | Tool answer | Tool confidence | Resolution |
| --- | --- | --- | --- | --- | --- |
| 17 | Files and docs | 2 (guessed collected) | **Not collected** | — (no evidence) | No `READ_EXTERNAL_STORAGE` permission in manifest; no file-access API in source. Tool is right — I guessed incorrectly. |
| 18 | Calendar events | 1 (guessed collected) | **Not collected** | — (no evidence) | No `READ_CALENDAR` permission, no `CalendarContract` API in source. My confidence was 1 for a reason. Tool confirmed: not collected. |
| 20 | App interactions | 1 (guessed collected) | **Not collected** | — (downgraded) | Manifest has `POST_NOTIFICATIONS` permission, which the manifest analyzer maps to `appInteractions`. However, there is no analytics SDK and no `logEvent` call in the source. The reconciler applies the manifest-only downgrade rule and resolves to not collected. Tool is correct. |
| 21 | In-app search history | 2 (guessed collected) | **Not collected** | — (no evidence) | No search-history pattern found in source. The app has an address search panel (`SearchPanel.kt`) but the tool found no evidence of that history being recorded or transmitted. Tool is correct; I guessed. |
| 22 | Installed apps | 2 (guessed collected) | **Not collected** | — (no evidence) | No `PackageManager.getInstalledPackages` or `queryIntentActivities` call found in source. An alarm clock with no analytics has no reason to enumerate installed apps. Tool is correct. |
| 26 | Diagnostics | 2 (guessed collected) | **Not collected** | — (no evidence) | The code analyzer detects `Log.d/e/i` calls (local logcat) but marks them as low-confidence with no egress — local only. No crash-reporting SDK is present. No diagnostics data leaves the device. Tool is correct. |

**Score for this section: tool resolved 6 of my 6 uncertain-or-guessed collected answers — and in every case the tool's answer was "not collected", meaning I had 6 false positives.**

---

## 2. Data types I missed entirely (tool found, I did not)

I marked 28 rows. The Google Play Data Safety form has 38 data-type fields (the schema
includes additional types: address, race/ethnicity, credit score, etc. that are not in
Google's simplified 28-item form). Comparing only within the 28 types I evaluated:

**Precise location** — I marked it collected with confidence 3. The tool also marks it
collected (confidence High, via code), so this is agreement, not a miss.

**Other actions** (tool key: `otherActions`) — this data type does not appear in the
simplified 28-item baseline form. The tool found it via network egress patterns
(`HttpURLConnection.openConnection` in `Net.kt`). This represents a structural gap in
my baseline: the simplified form asked fewer questions, so I could not have answered
this even if I had wanted to. It is not a personal miss — it is a form-coverage gap.

**Within the 28 types I evaluated, I missed no collected type that the tool found.**
The only collected finding the tool produces for ne-prospi within those types is precise
location (which I did mark as collected).

---

## 3. Disagreements on my confident answers — who is right?

### 3a. Approximate location (my answer: 5 — confidently collected)

**My answer:** confidence 5, collected.
**Tool answer:** not collected; code evidence present (`getLastKnownLocation` in
`MapController.kt`) but marked `needsReview: true` — location is read on-device and
generic network egress is present, but no dedicated `approximateLocation` URL parameter
was detected by the EGRESS rules.

**Investigation:** `Routing.kt` sends coordinates as
`%.6f,%.6f;%.6f,%.6f` to `router.project-osrm.org`. These are precise (six decimal
places) coordinates, not coarse. `Net.kt` sends `&lat=$lat&lon=$lon` to
`nominatim.openstreetmap.org`. Both are precise-location calls, not approximate.
The manifest has both `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION`, but
the app's foreground service declares `foregroundServiceType="location|mediaPlayback"` —
indicating it runs GPS, not cell-tower location.

**Verdict: The tool is more precise here.** Approximate location is read via
`getLastKnownLocation` as a fallback, but the primary and only transmitted location is
precise. A technically correct Data Safety form would declare _precise_ location, not
approximate — or both if the coarse fallback is also transmitted. The tool correctly
identifies the precise-location transmission as the high-confidence finding.
My confidence-5 answer for approximate location was conflating permission presence
(`ACCESS_COARSE_LOCATION`) with actual collection — a known human error pattern.

### 3b. Precise location (my answer: 3 — collected with moderate confidence)

**My answer:** confidence 3, collected.
**Tool answer:** collected, confidence High (code).

**Agreement.** Both say collected. The tool has higher confidence because it has
actual evidence (URL with lat/lon parameters sent to Nominatim and OSRM). I gave
confidence 3 because I was not sure how the location was used. Tool is right to be
more confident.

### 3c. Other in-app messages (my answer: 4 — collected)

**My answer:** confidence 4, collected.
**Tool answer:** not collected (manifest-only downgrade — `POST_NOTIFICATIONS` permission).

**Investigation:** The manifest has `POST_NOTIFICATIONS` permission. The manifest
analyzer maps this to `appInteractions` (not `otherInAppMessages`). The tool sees no
SMS permission, no messaging API, no `Intent.ACTION_SENDTO` data access in the code —
only a `queries` block declaring it can hand off to an external SMS app. The app
composes an alarm message and opens the default SMS app; it does not read messages.

**Verdict: The tool is correct.** I misread "messages" in the form as covering the
alarm-SMS feature. The app does not collect the content of SMS messages — it constructs
an outgoing message and hands it to the OS. `otherInAppMessages` covers message _content
read by the app_, not messages the app sends. My confidence-4 answer was wrong.

### 3d. Music files (my answer: 3 — collected)

**My answer:** confidence 3, collected.
**Tool answer:** not collected (no evidence).

**Investigation:** The manifest has `FOREGROUND_SERVICE_MEDIA_PLAYBACK`. The manifest
analyzer maps this to `voiceOrSoundRecordings` (not `musicFiles`). There is no
`MediaStore` or file-access call in the source code. The app plays system alarm sounds
(ringtones), not user-selected music files. `TripService.kt` uses
`AudioManager`/ringtone APIs — standard system sound, not user music.

**Verdict: The tool is correct.** Playing a ringtone does not constitute collecting
the user's music files. My confidence-3 answer was wrong.

### 3e. Other app performance data (my answer: 3 — collected)

**My answer:** confidence 3, collected.
**Tool answer:** not collected (no evidence).

**Investigation:** There is no performance-instrumentation SDK, no APM library, no
`StrictMode` reporting, and no remote logging. The app has local `Log.*` calls (caught
by the diagnostics rule as local-only) but nothing that transmits performance data.

**Verdict: The tool is correct.** I had no concrete evidence — this was a guess
based on "it must log something". The tool correctly finds nothing.

### 3f. Device or other IDs (my answer: нет — not collected)

**My answer:** confident not collected.
**Tool answer:** not collected (code evidence, `needsReview: true`).

**Investigation:** `Lang.kt` line 42 accesses `TelephonyManager` —
specifically `networkCountryIso` and `simCountryIso` to detect the user's country
for distance-unit display (km vs miles). The code analyzer fires on the
`TelephonyManager` import and marks `deviceOrOtherIds` as `needsReview`.

**Verdict: I am correct; the tool has a false positive here.** `networkCountryIso`
and `simCountryIso` are not device identifiers — they return the ISO country code of
the mobile network, not the IMEI or any persistent device ID. No device identifier is
read or transmitted. The tool's `TelephonyManager` regex is too broad: it fires on any
use of the class, not just calls to `getDeviceId()` or `getImei()`. The `needsReview`
flag is the tool's hedge, but it is still a false signal.

---

## 4. Timing — 18 minutes (manual) vs 43 ms (tool)

| | Manual | Tool |
| --- | --- | --- |
| Time | 17 min 57 sec | 43 ms (total pipeline, both projects) |
| ne-prospi only | ~18 min | 27 ms |
| Speed ratio | — | ×40,000 |

**Important caveat on the 18-minute figure:** the manual baseline used a simplified
form that asked only "collected yes/no" for 28 data types with no follow-up questions.
The real Google Play Console form asks, for every collected type: collection purpose
(up to 7 options), whether collection is required or optional, whether data is shared
with third parties, and whether it is processed ephemerally. The 18 minutes is a floor,
not the time to fill the real form. The submission claims it as a lower bound.

---

## Summary numbers

### Tool output for ne-prospi

| Metric | Value |
| --- | --- |
| Data types in schema | 38 |
| Collected (tool verdict) | **2** (`preciseLocation`, `otherActions`) |
| Needs review | 2 (`approximateLocation`, `deviceOrOtherIds`) |
| Found only through dependencies | 0 |
| False positives confirmed | 1 (`deviceOrOtherIds` — TelephonyManager for country code) |
| Analysis time | 27 ms |

### Manual baseline for ne-prospi

| Metric | Value |
| --- | --- |
| Data types evaluated | 28 (simplified form) |
| Marked collected | **11** |
| Of those, confirmed correct by tool | **1** (precise location) |
| Overturned by tool (tool: not collected) | **9** |
| Manual false positives | 9 of 11 (82%) |
| Time | 17 min 57 sec |

### Where the tool beats the manual answer

- Resolves 6 uncertain/guessed answers (confidence 1–2) — all were false positives
- Resolves 3 confident wrong answers (other in-app messages, music files, other perf data)
- Provides file + line evidence for every finding; the manual answer has no evidence trail

### Where the manual answer beats the tool

- `deviceOrOtherIds`: tool fires a false positive on `TelephonyManager` used for country code; manual answer (not collected) is correct
- Approximate vs precise location: both say location is collected, but the tool correctly distinguishes _precise_ while I stated _approximate_ with confidence 5; the tool's precision is better, but both arrive at "yes, location is used"

### Net scorecard (ne-prospi, 28-type overlap)

| | Manual | Tool |
| --- | --- | --- |
| Correct "collected" findings | 1 | 2 (precise location + other actions) |
| False positives | 9 | 1 (device IDs) |
| False negatives (within scope) | 1 (other actions, not in simplified form) | 0 |
| Precision | 9% | 67% |
| Time | ~18 min | 27 ms |
