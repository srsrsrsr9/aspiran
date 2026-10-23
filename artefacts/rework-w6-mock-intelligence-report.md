# W6 Mock Intelligence: build report (2026-10-23)

Branch `rework/slice-1`, committed locally. Nothing was pushed or deployed.

## What it is
This is a new section at the top of **Prep → Mock insights**. It has five readings, all worked out on the phone from the mock history and the error log:

1. **Where you're getting lucky**: right answers that were "Not sure" ticks or second tries (passed over, then answered later), by topic, over the last 5 papers.
2. **Where you're stuck**: topics answered in at least 3 of the last 5 papers that are up no more than 5 points and still under 70%.
3. **Negative marking**: marks lost to wrong answers over the last 5 papers, the break-even guess rate for that paper's marking, and your own "Not sure" hit rate.
4. **Revision list**: the 10 syllabus nodes with the most marks in play. Each error-log question counts its mark plus the penalty, each skipped question its mark, and each lucky right answer half a mark. Tapping a row opens Syllabus at that paper, with the topic first and already open.
5. **Progress band**: a chart of up to the last 10 papers with the low–high band and the average of the last 5, and the latest score highlighted.

**Free users:** the negative-marking card is open, and the other four are blurred behind a pill reading "🔒 Unlock with Plus · ₹9,999 a year". In quiet times the pill reads just "🔒 Plus". The blur hides placeholder bars only, so none of the real data is in the locked UI. With no history yet, the section shows a sample with a **SAMPLE DATA** chip.

## Files
- **New:** `data/MockIntel.kt` (the engine) and `ui/MockIntelScreen.kt` (the cards, the lock and the sample).
- **Edited:**
  - `data/Mocks.kt`: records "shaky" answers per topic, and which questions were passed over.
  - `ui/MockScreens.kt`: marks a question as passed over when you leave it blank.
  - `data/Prep.kt`: the keyword subject rules are now a shared `subjectByWords`. Library behaviour is unchanged.
  - `ui/PrepScreens.kt`: the section is wired into InsightsScreen.
  - `ui/PrepHome.kt`: Syllabus can now open with one topic focused.
  - `MainActivity.kt`: the link from the revision list to Syllabus, and a debug-only Plus switch.

## Checks
- `:app:assembleDebug` builds cleanly.
- The server is unchanged by W6. All 11 suites and `npm run check` passed on the pricing commit just before.
- I ran it on an emulator with the 5 seeded SAMPLE papers and 10 sample error-log questions. Screenshots are in `w6-screens/`:
  - w4: free view
  - w5–w8: member view
  - w9: a revision row opening Syllabus GS1 with "Physical geography" open

## Caveats
- "Answered fast after skipping" isn't measured, because per-question time isn't recorded. Questions you passed over and came back to count as second tries instead.
- Papers taken before this build have no shaky data, so the lucky card only fills from new mocks onward.
- The debug Plus switch works in debug builds only: `shared_prefs/debug.xml` with `plus=true`. I removed it from the emulator afterwards.
- Showing a price inside the Play app is a policy grey area (flagged under W8).
