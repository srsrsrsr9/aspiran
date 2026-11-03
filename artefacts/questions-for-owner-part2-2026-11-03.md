# Aspiran: questions for the owner

Made 3 November 2026. This file goes with `aspiran-new-outputs-part2`. Everything in the bundle is a draft. Nothing has been approved yet.

## 1. What isn't done yet

| Item | Status | What unblocks it |
|---|---|---|
| Sarvam mp3 narration: 191 parts, about 244,000 characters (the rest of A1, all of A2, episodes 13 and 25–35) | Not recorded. Sarvam says "No credits available" for the key we were given. | Top up the Sarvam account, or send a key from the account that already has credits. |
| Hindi for GS full mocks 2 and 3 (B24b) | Not started. The two files were never uploaded. | Upload `prelims-gs1-full-mock-2.json` and `-3.json`, or connect the PC that has the app folder. |

**Already recorded (in `audio-recordings/`):** 40 parts, 45,010 characters. They cover episodes 18–24 in English and Hindi, Freedom struggle 1857–1919 in English and Hindi, and Freedom struggle 1919–1947 in English only. Characters used per file are in `audio-recordings/_characters-used.tsv`.

**B24 status:** only mock 1 has Hindi so far (`aspiran-B24.zip`, in the part 1 bundle).

## 2. Decisions needed

### Printables (P1–P5)
1. **MGNREGA:** the schemes sheet leaves it out because the rural jobs law was being replaced and we couldn't confirm its current name. Should we add it back, and under which name?
2. **Exam-day checklist:** it uses subject `csat` and paper `Prelims`. Keep that, or create a new subject for it?
3. Every date or number is listed in each sheet's `factsToCheck`, including the CPI and GDP base years that changed in 2026.

### CSAT full mocks (B23)
1. **Passages:** the GS mock format has nowhere to put a passage, so we added a top-level `passages` list. Comprehension questions point to their passage, and data questions carry a `table`. Is that format OK for the app?
2. **Node ids:** we guessed `csat-2` to `csat-5` for the non-comprehension sections. Please check them against the topic list.
3. **Decision-making answers:** someone needs to confirm that each keyed answer is the only defensible one.

### Optional-subject packs (B10, B25–B29, B29-rest)
1. **PTGs or PVTGs:** Anthropology uses UPSC's term "PTGs", but the current government term is "PVTGs". Which one should we use?
2. **Geography map question:** there's no node for Paper 2's compulsory map question. Do you want one?
3. **Syllabus titles:** every syllabus title was written from memory. Editors should check them against the current UPSC notification.
4. **Seismic Zone VI:** a revised 2025 BIS code may add Zone VI. If that's confirmed, `geo-p1-04` needs an update.
5. **B29-rest:** Hindi terms and all case names and dates are flagged for the editors. Each pack's manifest also lists `openQuestions`.

### Walk-mode scripts (B08)
1. **Hindi numbers:** the Hindi scripts write numbers as words because they're read aloud, but rule C4 says numbers stay as digits. Keep the words for audio, or switch to digits? The episodes' Hindi voice scripts follow the same words-for-audio approach.

### GS mock Hindi (B24)
1. **Article clause letters:** they follow the Constitution's Hindi text, so 51A(k) is written 51क(ट). Keep that, or use Latin letters?
2. `hiCheck` lists 19 terms for the Hindi editor, such as पंथनिरपेक्ष, the IUCN category names and दोहरी तुलन-पत्र समस्या.

### Already decided
- **B13–B16:** keep the three polity files separate (`pol-polity-1`, `pol-polity-2`, `pol-governance`). B16 keeps its recent items. You confirmed both on 2 November.

## 3. Editor checks

### Audio lectures (A1, A2)
- Each zip's `checks/self-check.json` lists Hindi terms to confirm and facts that may have changed: COP30, the 16th Finance Commission, and the RBI inflation target from 2026.

### Episodes 18–35 (`episodes/BATCH_REPORT-18-35.md`)
The report lists each episode's sources and editor notes. These are the main items:
- **All episodes:** the Hindi is a machine draft and needs the Hindi editor. Re-time the Hindi `.srt` files once the Hindi audio exists.
- **13 Indus Waters:** this topic moves fast, so re-check its status just before release. The August 2026 award text itself wasn't read.
- **23 Peace clause:** check the de minimis and reference-price rules against AoA Article 6.4. India's invocations are from secondary sources only.
- **24 Tribunals:** check the 2021 and 2025 rulings against the judgments.
- **25 DPDP Act:** commencement dates vary by a day between sources. Re-check MeitY's 12-month proposal before release.
- **26 Project Cheetah:** all sources are secondary. The count moves, so the script says "over fifty".
- **27 Governor assent:** all sources are secondary. Check against the 8 Apr 2025 judgment and the 20 Nov 2025 opinion.
- **28 Liquidity corridor:** rates are "as of October 2026". Re-check after the next MPC meeting.
- **29, 30 and 33:** the Constitution text was read from secondary copies, not the Gazette. Also re-check the joint-sitting count.
- **31 El Niño:** the 1997 figure differs between sources, so the script says "about normal".
- **32 Hotspots:** the sanctuary-rights point has only one source. Check it against WLPA sections 33 and 35.
- **34 Balance of payments:** the RBI figures are preliminary. Check the wording on capital vs financial account.
- **35 Revolt of 1857:** check against the NCERT Class 8 and Class 12 chapters.
- **Engine fixes:** they're in `episodes/kit-updates/`. Quiz layout, font size, loudness and validator fixes are listed in the report.

### Earlier batches
- **B06:** some GS4 Hindi terms need checking against UPSC's Hindi syllabus, such as समानुभूति vs सहानुभूति for empathy.
- **B09-rest:** the society term list was rebuilt from scratch. Compare it with the earlier 79 terms.
- **Episodes 15 and 17:** the case holdings come from secondary summaries. Check them against the judgments.
