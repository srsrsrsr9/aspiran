# Trailer "Page 42": is every claim true in the app? (14 Nov 2026)

Checked against the web app (`server/public/app/`), the server and the Android app, on branch
`claude/trailer-loop-9a0d9c`. Not deployed and no new Android release: these changes reach people only after the
main session merges and deploys, and after the next Android release.

## The short version

| # | Claim in the trailer | Verdict |
|---|---|---|
| 1 | "Answer first, then look… comes back in a week" | **Fixed in the app; the trailer must change one word.** The real first gap is 3 days, not a week |
| 2 | "How sure are you?" [Sure] [Not sure] before the answer | **Fixed.** It was only in mocks and the Try demo; now on every practice question, web and Android |
| 3 | Reviews at a day, a week, months; mixed topics; "10 to 20 minutes a day. Then it ends." | **True, with two small fixes** (subjects now mixed; the screen says it ends). Suggest "DAYS · WEEKS · MONTHS" |
| 4 | "−⅓ for a wrong answer" | **Fixed.** Now said on Prelims practice and mock papers too |
| 5 | Mains: paper, mark yourself, second opinion beside your marks, rewrite the weakest part, Hindi or English | **Fixed (weakest part now named). The drawn panel needs to change:** the app uses five parts and Below / At / Above, not "Intro / Body / Conclusion" and "6/10 vs 5/10" |
| 6 | Pods: 6 to 8 aspirants, same stage, no ranks | **Partly true; can't be made fully true without an owner decision.** See below |
| 7 | 9 papers, 59 topics, 297 lines; not yet → met → can recall → can use | **True already** |
| 8 | No streaks, no leaderboards, no selection chance | **Fixed.** A Quiz Night room ranking and one Android "days in a row" line are gone |
| 9 | "Try one topic free" at aspiran.in, no account | **True already** |

## Claim by claim

### 1. Answer first, then look
- **What the trailer says:** the real first-run screen, then "this one comes back in a week, just before you'd forget it."
- **What was wrong:** the line was fixed text. The first-run question was never put into the review, and FSRS
  (`fsrs.js`, `Fsrs.kt`) never gives a week first: a right answer comes back in **3 days**, a miss **tomorrow**, then
  about 11, 35, 101 and 269 days for right answers in a row.
- **Fixed (web, `app.js` onboarding):** the answer now goes into the review queue with its real FSRS date, and the line
  says the real gap: "comes back in 3 days" (or "tomorrow" after a miss or "No idea"), "then a little later each
  time". Hindi too.
- **Fixed (Android, `OnboardingScreen.kt`):** the line now says the real gaps ("a right answer in 3 days" / "a miss
  tomorrow, then further out each time"). On Android the first-run question itself does not join the review (the
  Android review holds Chai cards only); the line no longer promises that it does.
- **Trailer change needed:** scene 5a uses a real capture with "in a week". Re-capture after deploy
  (`build/capture-screens.mjs`) so it reads "in 3 days", or blur that line. Nothing is spoken about "a week" there,
  so no voice re-take is needed.

### 2. "How sure are you?"
- **What was there:** mocks had a "Not sure (a guess)" tick; the Try demo asked "How sure?" with three answers. Daily
  Prelims practice, the review and Chai's Exam Corner did **not** ask before the answer, on web or Android.
- **Fixed (web):** `mcqBlock` now shows "Before you look · How sure are you? [Sure] [Not sure]" and only then opens
  the options. That covers Prelims practice, the review, Chai's Exam Corner, the explore drills and the Chai brief
  checks. A wrong answer you were sure of gets one line: "in Prelims that's the costly kind (−⅓). It'll stick now."
  Answers are tallied on the device only (`sureLog`), and You vs. you now uses them with the mock ticks.
- **Fixed (Android):** new `ui/SureFirst.kt` (the same card, English and Hindi) in Prelims practice (which the review
  also uses), Chai's Exam Corner and the Prep question runs (weekly test, revision, tastes). Tally kept on the phone
  (`Calibration`), used by You vs. you.
- **Not covered, by design:** mock papers keep their "Not sure" tick (a full paper with a gate before every question
  would be heavy); the Try demo keeps its three-answer version; video quiz checks on Android are not practice.
- **Trailer:** the drawn card now matches the real one. Re-capture it if you want a real screen.

### 3. Spaced review that ends
- **True already:** FSRS sets every gap; the review takes at most 20 items (`REVIEW_MAX`, web and Android), about
  10 minutes, then shows "That's today's review." The rest waits quietly for tomorrow. No infinite feed.
- **Fixed:** items were in due-date order (all topic checks first). Now they are mixed round-robin across papers
  and topics (`interleave` in `app.js`, `interleaveBy` in `ReviewScreen.kt`). The review screen now says: "Recall
  first, subjects mixed. At most 20 a day, about 10 minutes, then it ends."
- **Trailer note:** the on-screen beats "A DAY · A WEEK · MONTHS" are close but not exact (a miss: 1 day; right
  answers: 3, 11, 35, 101 days). Suggest "DAYS · WEEKS · MONTHS". The narration ("comes back just before you'd forget
  it") is true as it is.

### 4. Prelims negative marking
- **Already true:** the Indian Polity page (Prelims paper: "−⅓ for a wrong answer").
- **Fixed:** Prelims practice (web and Android) now opens with "In the real Prelims a wrong answer costs a third of
  its marks (−⅓ for a wrong answer, 0 if you leave it)… Here nothing is scored." The web mock start screen now adds
  "(−⅓ of the marks, as in Prelims)" after "+2 for a right answer, −0.66 for a wrong one" whenever the marking is a
  third. Android mocks already said "UPSC negative marking" and show the marks per question.

### 5. Mains
- **Already true:** write (on paper is encouraged; Android takes a photo of the sheet), mark it yourself first (five
  parts, Below / At / Above), then the AI second opinion in a table beside your own marks, then one rewrite. Hindi or
  English (the server has a Hindi reading path).
- **Fixed:** the app never named the weakest part. Now the second opinion ends with "Weakest part: Conclusion" (the
  lowest band the second opinion gave, ties broken by your own lower mark, or your own lowest without a second
  opinion) and the button reads "Rewrite the weakest part →"; the rewrite screen says "Rewrite the weakest part:
  …". Web `viewMains`, Android `AnswerStudio.kt`.
- **Can't be made true as drawn:** the drawn panel shows "Intro / Body / Conclusion" and "You 6/10 · Second 5/10".
  The app marks five parts (Directive word, Structure, Content coverage, Examples and data, Conclusion) as Below / At /
  Above, on purpose: no number scores. **Trailer change:** redraw the panel with those parts, for example
  "Structure: You At · Second At", "Examples and data: You At · Second Below", "Conclusion: You Below · Second Below ·
  weakest part", then "Rewrite the weakest part". Jeetu's line stays as it is.

### 6. Pods: 6 to 8, same stage, no ranks
- **True:** a pod holds at most 8 (`POD_CAPACITY = 8`, `community.ts`); matching is by stage, attempts, language and
  study time (the closest pod is same stage and language); thin pods are merged; nobody is ranked.
- **Not true today:**
  1. Pods are not "6 to 8" from the start. A pod opens with 1 or 2 people ("forming") and fills up to 8; 6 to 8 is
     a full pod.
  2. Matched pods are switched off until 500 sign-ups (setting "growth", `rooms.ts`). Until then everyone is in open
     rooms, not pods.
- **Why not fixed:** both are product rules, and switching pods on is a live setting the owner controls. **Trailer
  change, or owner decision:** either say "UP TO 8 ASPIRANTS" on the HUD (and "आठ तक लोग" in the narration, a
  re-take), or keep the trailer and switch matched pods on before it runs (Admin → growth → sign-up threshold).

### 7. The garden
- **True already, on web and Android:** 9 papers (Prelims, CSAT, GS1 to GS4, Essay, the optional, the qualifying
  languages), 59 topic branches and 297 leaves before an optional is chosen (`vine.js` `countsOf`; 287 syllabus lines in
  `syllabus-lines.js` plus the 10 qualifying-language topics; `SyllabusLines.kt` has the same 49 topics and 287
  lines). States are Not yet → Met → Can recall → Can use.
- Note: choosing an optional adds its topics as leaves, so the numbers change for that person.

### 8. No streaks, no leaderboards, no selection chance
- **Searched:** web app, server (notifications, Chotu, emails, pod friends) and Android, for streak, leaderboard,
  selection chance, percentile and similar.
- **Fixed:**
  - **Quiz Night room board** (web and Android Rooms): it showed the top 5 rooms ranked by their shared score. Now
    each person sees only their own rooms' result ("Your room's result is just for your room. No ranks, of people or
    rooms."). The room's Friday announcement (`community.ts`) no longer says "on the room board against the other
    rooms". The server route `/rooms/leaderboard` stays so older Android builds don't break; they still show the top 5
    until people update. It can be retired after the next Android release.
  - **Android Answer Studio** had a Chotu line "N days in a row with a finished answer". Removed, and the days-in-a-row
    count is gone from `AnswerLog.kt`.
- **True already:** no selection chance, rank prediction or percentile anywhere. "Rhythm" says "this isn't a streak".
  The mock "lucky streaks" note in Mock intel is about lucky guesses, not a streak, and stays.

### 9. "Try one topic free"
- **True already:** aspiran.in's buttons ("Try one topic free, no sign-up", in the nav, hero, recall and price
  sections, English and Hindi) open `https://app.aspiran.in/app/…#try`, which works with no account (the public
  route list in `app.js`). Checked live today: `/try` serves the approved topic paths in English and Hindi.

## What the trailer needs (for whoever re-renders it)
1. Scene 5a: re-capture the answered first-run screen after deploy ("comes back in 3 days").
2. Scene 5c: "A DAY · A WEEK · MONTHS" → "DAYS · WEEKS · MONTHS" (suggested).
3. Scene 5d: redraw the second-opinion panel with the real five parts and Below / At / Above; no "6/10".
4. Scene 5f: "6 TO 8 ASPIRANTS" → "UP TO 8 ASPIRANTS" (and the Hindi line), unless matched pods are switched on first.

## Checks run
`npm run check` and `npm run test:all` in `server/`, and `./gradlew -q compileDebugKotlin --offline` in `android/`.
All passed on 14 Nov: tsc and the web syntax check, 17 of 17 test suites, and the Android Kotlin compile. Checked in a browser on a local server: the first-run line says "in 3 days" and puts the question in the review (due 17 Nov); the review asks "How sure are you?" before the options; a wrong answer marked Sure shows the −⅓ line and is tallied on the device.
