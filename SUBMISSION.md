# РўРµРєСЃС‚С‹ РґР»СЏ СЃР°Р±РјРёС€РµРЅР°

Р’СЃС‘, С‡С‚Рѕ РІРёРґРёС‚ СЃСѓРґСЊСЏ вЂ” РЅР° Р°РЅРіР»РёР№СЃРєРѕРј. РњРµСЃС‚Р° РІ `[РЎРљРћР‘РљРђРҐ]` Р·Р°РїРѕР»РЅСЏСЋС‚СЃСЏ
РІ РІРѕСЃРєСЂРµСЃРµРЅСЊРµ СЂРµР°Р»СЊРЅС‹РјРё С‡РёСЃР»Р°РјРё. **РќРµ СЃРґР°РІР°Р№ СЃ РЅРµР·Р°РїРѕР»РЅРµРЅРЅС‹РјРё СЃРєРѕР±РєР°РјРё.**

---

## РќР°Р·РІР°РЅРёРµ

РћСЃРЅРѕРІРЅРѕР№ РІР°СЂРёР°РЅС‚: **Consent** вЂ” РєРѕСЂРѕС‚РєРѕРµ, РїСЂРѕРёР·РЅРѕСЃРёРјРѕРµ, РЅРµ РѕРїРёСЃС‹РІР°РµС‚
РјРµС…Р°РЅРёРєСѓ, Р° РЅР°Р·С‹РІР°РµС‚ СЃСѓС‚СЊ.

Р—Р°РїР°СЃРЅС‹Рµ: `DataSafe`, `Declared`, `SafetyFill`.

---

## Short description

> Fills Google Play's Data safety form from your Android code, with
> file-and-line evidence behind every answer вЂ” including the data your
> third-party SDKs collect without telling you.

---

## Problem & Solution Statement

Р›РёРјРёС‚ 500 СЃР»РѕРІ. Р§РµСЂРЅРѕРІРёРє РЅРёР¶Рµ вЂ” **[Р§РРЎР›Рћ] СЃР»РѕРІ**, РјРµСЃС‚Рѕ РїРѕРґ СЂРµР·СѓР»СЊС‚Р°С‚С‹ РµСЃС‚СЊ.

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
minutes. Of the 11 types I marked as collected, 6 were guesses вЂ”
confidence 1 or 2 out of 5.

More than half of my affirmative answers were not knowledge. They were
hope.

Speed was never the problem. Certainty was.

### Solution

Consent answers the form from evidence instead of memory.

Three analyzers run in parallel as IBM Bob subagents, each reading a
different kind of proof:

- **Manifest** вЂ” which permissions the app holds, and therefore what it
  is capable of touching.
- **Dependencies** вЂ” what each third-party SDK collects by default,
  looked up against its own published privacy documentation.
- **Code** вЂ” where data actually leaves the device: network calls,
  analytics events, uploads.

A reconciler merges them under one rule that mirrors Google's own
definition: data counts as collected only when it leaves the device. Code
evidence outranks dependency evidence, which outranks manifest evidence.
A permission with no supporting egress resolves to "not collected", with
the reasoning attached.

Every answer carries its proof вЂ” file, line, snippet, and one sentence
explaining the call. Nothing is asserted without a citation.

The headline number is not speed. It is **how many data types were found
only through third-party SDKs** вЂ” the answers a developer could not have
reached by reading their own code.

### Results

[Р—РђРџРћР›РќРРўР¬ Р’ Р’РћРЎРљР Р•РЎР•РќР¬Р•]

- Data types the tool found that I had missed: [Р§РРЎР›Рћ]
- Guesses it resolved into evidenced answers: [Р§РРЎР›Рћ] of my 6 low-confidence answers
- Answers where it disagreed with me: [Р§РРЎР›Рћ] вЂ” [РћР”РќРђ Р¤Р РђР—Рђ Рћ РЎРђРњРћРњ РРќРўР•Р Р•РЎРќРћРњ Р РђРЎРҐРћР–Р”Р•РќРР]
- Runtime: [РЎР•РљРЈРќР”Р«] against 18 minutes by hand

Tested on three of my own Android projects: an alarm clock, a
peer-to-peer mesh messenger, and a Flutter application.

---

## IBM Bob Usage Statement

вљ пёЏ **Р—Р°РїРѕР»РЅСЏРµС‚СЃСЏ РІ РІРѕСЃРєСЂРµСЃРµРЅСЊРµ.** Р’СЂР°С‚СЊ Р·РґРµСЃСЊ РЅРµР»СЊР·СЏ вЂ” СЌС‚Рѕ РґРѕРєСѓРјРµРЅС‚ Рѕ
С‚РѕРј, С‡С‚Рѕ С‚С‹ РґРµР»Р°Р», Рё РѕРЅ РїСЂРѕРІРµСЂСЏРµС‚СЃСЏ РїСЂРѕС‚РёРІ СЃРєСЂРёРЅС€РѕС‚РѕРІ РІ `bob_sessions/`.

РљР°СЂРєР°СЃ, РїРѕ РєРѕС‚РѕСЂРѕРјСѓ РїСЂРѕР№РґС‘С€СЊСЃСЏ:

```
Bob built this project end to end. [РЎРљРћР›Р¬РљРћ] tasks, all captured in
bob_sessions/.

Document understanding. I saved Google's Data safety documentation
locally and had Bob turn it into a typed schema of the form вЂ” every data
category, every question, every allowed answer, each carrying the URL it
came from. [Р§РўРћ РџРћР›РЈР§РР›РћРЎР¬, Р§РўРћ РџР РРЁР›РћРЎР¬ РџР РђР’РРўР¬ Р РЈРљРђРњР]

Parallel subagents. The three analyzers were built as separate subagents
working at the same time against a shared contract. [Р§РўРћ Р—РђРњР•РўРР›,
Р§Р•Рњ Р­РўРћ РћРўР›РР§РђР›РћРЎР¬ РћРў РћР‘Р«Р§РќРћР“Рћ Р§РђРўРђ]

Agent mode. [Р§РўРћ РџРРЎРђР› РђР“Р•РќРў, Р“Р”Р• РўР« Р’РњР•РЁРР’РђР›РЎРЇ]

What I had to correct. [РћР‘РЇР—РђРўР•Р›Р¬РќРћ РќРђРџРРЁР. РЎСѓРґСЊРё РІРёРґРµР»Рё СЃРѕС‚РЅРё Р·Р°СЏРІРѕРє,
РіРґРµ РІСЃС‘ РїСЂРѕС€Р»Рѕ РёРґРµР°Р»СЊРЅРѕ. Р§РµСЃС‚РЅС‹Р№ Р°Р±Р·Р°С† РїСЂРѕ С‚Рѕ, РіРґРµ Bob РѕС€РёР±СЃСЏ Рё РєР°Рє С‚С‹
СЌС‚Рѕ РїРѕР№РјР°Р», РґРѕР±Р°РІР»СЏРµС‚ РґРѕРІРµСЂРёСЏ РєРѕ РІСЃРµРјСѓ РѕСЃС‚Р°Р»СЊРЅРѕРјСѓ]

Budget. The whole project was built inside the 40 Bobcoin hackathon
allocation. [РЎРљРћР›Р¬РљРћ РџРћРўР РђР§Р•РќРћ]
```

---

## РЎС†РµРЅР°СЂРёР№ РІРёРґРµРѕ вЂ” 3 РјРёРЅСѓС‚С‹

Р–С‘СЃС‚РєРёРµ С‚СЂРµР±РѕРІР°РЅРёСЏ: MP4, РјР°РєСЃРёРјСѓРј 3 РјРёРЅСѓС‚С‹, РјРёРЅРёРјСѓРј 90 СЃРµРєСѓРЅРґ СЂР°Р±РѕС‚С‹
СЂРµС€РµРЅРёСЏ РЅР° СЌРєСЂР°РЅРµ, Р·Р°РєР°РґСЂРѕРІС‹Р№ РіРѕР»РѕСЃ. РЎСѓРґСЊСЏ РЅРµ СЃРјРѕС‚СЂРёС‚ РґР°Р»СЊС€Рµ С‚СЂРµС‚СЊРµР№ РјРёРЅСѓС‚С‹.

| Р’СЂРµРјСЏ | Р§С‚Рѕ РЅР° СЌРєСЂР°РЅРµ | Р§С‚Рѕ РіРѕРІРѕСЂРёС€СЊ |
| --- | --- | --- |
| 0:00вЂ“0:20 | Р¤РѕСЂРјР° Data safety РІ Play Console, Р»РёСЃС‚Р°РµС€СЊ | РљР°Р¶РґРѕРµ РїСЂРёР»РѕР¶РµРЅРёРµ РѕР±СЏР·Р°РЅРѕ РµС‘ Р·Р°РїРѕР»РЅРёС‚СЊ. РћС€РёР±С‘С€СЊСЃСЏ вЂ” СЃРЅРёРјСѓС‚ СЃ РїСѓР±Р»РёРєР°С†РёРё |
| 0:20вЂ“0:45 | РўРІРѕР№ `baseline.md`, РєСЂСѓРїРЅРѕ С†РёС„СЂС‹ | РЇ Р·Р°РїРѕР»РЅРёР» РµС‘ РґР»СЏ СЃРІРѕРµРіРѕ Р±СѓРґРёР»СЊРЅРёРєР° Р·Р° 18 РјРёРЅСѓС‚. РР· 11 СѓС‚РІРµСЂРґРёС‚РµР»СЊРЅС‹С… РѕС‚РІРµС‚РѕРІ 6 Р±С‹Р»Рё РґРѕРіР°РґРєР°РјРё |
| 0:45вЂ“2:30 | **Р”РµРјРѕ.** Р’С‹Р±РёСЂР°РµС€СЊ РїСЂРѕРµРєС‚ в†’ С„РѕСЂРјР° Р·Р°РїРѕР»РЅСЏРµС‚СЃСЏ в†’ СЂР°СЃРєСЂС‹РІР°РµС€СЊ РґРѕРєР°Р·Р°С‚РµР»СЊСЃС‚РІРѕ СЃ С„Р°Р№Р»РѕРј Рё СЃС‚СЂРѕРєРѕР№ | Р’РµРґС‘С€СЊ РїРѕ СЌРєСЂР°РЅСѓ. РћР±СЏР·Р°С‚РµР»СЊРЅРѕ РїРѕРєР°Р¶Рё С‡РёСЃР»Рѕ В«РЅР°Р№РґРµРЅРѕ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· Р·Р°РІРёСЃРёРјРѕСЃС‚РёВ» |
| 2:30вЂ“2:50 | РЎС…РµРјР° Р°СЂС…РёС‚РµРєС‚СѓСЂС‹, С‚СЂРё Р°РіРµРЅС‚Р° | РўСЂРё СЃСѓР±Р°РіРµРЅС‚Р° Bob СЂР°Р±РѕС‚Р°СЋС‚ РїР°СЂР°Р»Р»РµР»СЊРЅРѕ, РєР°Р¶РґС‹Р№ С‡РёС‚Р°РµС‚ СЃРІРѕР№ РёСЃС‚РѕС‡РЅРёРє |
| 2:50вЂ“3:00 | РС‚РѕРіРѕРІС‹Рµ С†РёС„СЂС‹ | Р§С‚Рѕ РЅР°С€Р»РѕСЃСЊ, С‡РµРіРѕ СЏ РЅРµ Р·РЅР°Р» |

**РџСЂР°РІРёР»Р° Р·Р°РїРёСЃРё:**

- Р”РµРјРѕ вЂ” РЅРµ РјРµРЅСЊС€Рµ 105 СЃРµРєСѓРЅРґ, С‡С‚РѕР±С‹ РіР°СЂР°РЅС‚РёСЂРѕРІР°РЅРЅРѕ РїРµСЂРµРєСЂС‹С‚СЊ РјРёРЅРёРјСѓРј РІ 90
- РўРµРєСЃС‚ РїСЂРѕРіРѕРІРѕСЂРё РІСЃР»СѓС… РґРѕ Р·Р°РїРёСЃРё, Р·Р°СЃРµРєРё РІСЂРµРјСЏ
- Р—Р°РєСЂРѕР№ РїРѕС‡С‚Сѓ, С‚РѕРєРµРЅС‹, СЃС‚Р°С‚СѓСЃ-Р±Р°СЂ Bob СЃ Р°РєРєР°СѓРЅС‚РѕРј
- РџРёС€Рё РіРѕР»РѕСЃ РѕС‚РґРµР»СЊРЅРѕ РЅР° С‚РµР»РµС„РѕРЅ, СЃРІРѕРґРёС€СЊ РїСЂРё РјРѕРЅС‚Р°Р¶Рµ

---

## РЎР»Р°Р№РґС‹ вЂ” 7 С€С‚СѓРє

1. РќР°Р·РІР°РЅРёРµ, РѕРґРЅР° СЃС‚СЂРѕРєР° СЃСѓС‚Рё
2. РџСЂРѕР±Р»РµРјР°: С„РѕСЂРјР° Data safety Рё С‡С‚Рѕ Р±С‹РІР°РµС‚ Р·Р° РѕС€РёР±РєСѓ
3. **РўРІРѕРё С†РёС„СЂС‹: 18 РјРёРЅСѓС‚, 11 РѕС‚РІРµС‚РѕРІ, 6 РґРѕРіР°РґРѕРє, 55%**
4. Р РµС€РµРЅРёРµ: СЃС…РµРјР° СЃ С‚СЂРµРјСЏ Р°РіРµРЅС‚Р°РјРё
5. РЎРєСЂРёРЅС€РѕС‚ РёРЅС‚РµСЂС„РµР№СЃР° СЃ СЂР°СЃРєСЂС‹С‚С‹Рј РґРѕРєР°Р·Р°С‚РµР»СЊСЃС‚РІРѕРј
6. Р РµР·СѓР»СЊС‚Р°С‚С‹: С‡С‚Рѕ РЅР°С€Р»РѕСЃСЊ, С‡РµРіРѕ С‚С‹ РЅРµ Р·РЅР°Р»
7. РљР°Рє РёСЃРїРѕР»СЊР·РѕРІР°Р»СЃСЏ Bob, СЃРєРѕР»СЊРєРѕ РјРѕРЅРµС‚ СѓС€Р»Рѕ

РўСЂРµС‚РёР№ СЃР»Р°Р№Рґ вЂ” РіР»Р°РІРЅС‹Р№. РћРЅ РµРґРёРЅСЃС‚РІРµРЅРЅС‹Р№, РіРґРµ РіРѕРІРѕСЂРёС‚СЃСЏ Рѕ СЂРµР°Р»СЊРЅРѕРј
РёР·РјРµСЂРµРЅРёРё, Р° РЅРµ Рѕ РЅР°РјРµСЂРµРЅРёСЏС….

---

## Р§РµРєР»РёСЃС‚ РїРµСЂРµРґ РѕС‚РїСЂР°РІРєРѕР№

- [ ] Р’СЃРµ `[РЎРљРћР‘РљР]` Р·Р°РїРѕР»РЅРµРЅС‹
- [ ] РћР±Р° С‚РµРєСЃС‚Р° РЅРµ РґР»РёРЅРЅРµРµ 500 СЃР»РѕРІ
- [ ] Р’РёРґРµРѕ РЅРµ РґР»РёРЅРЅРµРµ 3:00, РґРµРјРѕ РЅРµ РєРѕСЂРѕС‡Рµ 1:30
- [ ] РћР±Р»РѕР¶РєР° 16:9
- [ ] Р РµРїРѕР·РёС‚РѕСЂРёР№ РїСѓР±Р»РёС‡РЅС‹Р№, `LICENSE` РЅР° РјРµСЃС‚Рµ
- [ ] `bob_sessions/` СЃРѕ СЃРєСЂРёРЅС€РѕС‚Р°РјРё РєР°Р¶РґРѕР№ Р·Р°РґР°С‡Рё
- [ ] РЎСЃС‹Р»РєР° РЅР° РїСЂРёР»РѕР¶РµРЅРёРµ РѕС‚РєСЂС‹РІР°РµС‚СЃСЏ РІ СЂРµР¶РёРјРµ РёРЅРєРѕРіРЅРёС‚Рѕ

