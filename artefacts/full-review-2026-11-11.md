# Aspiran: full review, 11 Nov 2026

Three parts: marketing funnel, code, learning outcomes. Each starts with the verdict.

**How this was done.** I walked the live website (desktop and phone), the live web app as a visitor, read the server
code closely (sign-in, payments, Plus, website routes, answer marking), scanned the web app and Android code, measured
the content, and read live counts from the database (read-only). The type check passes. I did **not** re-run the 17
server test suites: each needs a hand-started local server with its own settings (last recorded pass: 8 Nov). I did not
run the Android app on a device.

## The numbers that frame everything (live, 11 Nov)

| What | Count |
|---|---|
| Website leads saved | 3 (2 left a number or email) |
| Visitors who chatted with Chotu on the site | 1 |
| App first opens | 48 |
| Finished onboarding | 27 |
| Signed up | 26 events, 24 accounts (17 seen in the last 7 days) |
| Members in a pod | 6 |
| Chai cards read | 5 |
| Daily Chai briefs ever published | **0** |
| Mains answers ever marked | **0** |
| Payments | 0 |

Nobody has yet gone through one full learning loop in the product. So every judgement below about "does it work" is
about the design, not about results.

---

## 1. Marketing: is the funnel aiding conversion?

**Verdict: no. Not because the page is weak, but because the funnel isn't joined up and isn't measured.** Keep the
brand, the voice and the interactive "rooms". Rebuild the *structure* fresh: a short home page with one real action,
and public content that search can find.

### What's wrong, most important first

1. **The only action is a waiting list, for a product that is already open.** Every button says "Save my seat". Nothing
   on aspiran.in links to the web app, the Play test, or a demo. A visitor who is convinced has nowhere to go. A lead
   who leaves a number gets no automatic reply.
2. **You can't see the funnel.** The analytics ID in the website is empty (`BaseLayout.astro`, `UMAMI_WEBSITE_ID = ''`).
   Nobody knows how many people visit, how far they scroll, or where they leave.
3. **The best conversion asset isn't live.** "Try one topic" (Federalism, no account) was merged on 8 Nov but the live
   app is still the older version (`try.js` returns 404; live cache is v34, the repo is v35).
4. **The page is 17 rooms and about 21,500 pixels long, and leads with the product's metaphor, not the aspirant's
   problem.** The hero is "The whole UPSC syllabus. Every line of it." and a garden. "Never prep alone" is in room 8.
   The price is in room 15. Most phone visitors will never reach either.
5. **No proof.** No person behind it, no editor named, no real screenshot of the app, no sample of a marked answer from
   a real user, no aspirant's words. For an unknown brand asking ₹9,999, trust is the missing piece, and the long page
   spends its length on explanation, not on trust.
6. **Promises the product doesn't keep today.** Each one is a refund request or a bad review waiting:
   - "The daily review and Chai" in Free: no Chai has ever been published.
   - "Hindi and English from day one: notes, practice and answer feedback": Hindi answer marking isn't built.
   - "₹999 for the first 300": Cashfree is still in sandbox, so nobody can buy.
   - "A small pod of 6 to 8 aspirants at your stage": 6 people are in pods in total.
   - "on the wall of every Aspiran pod": flagged in the earlier review, still there.
   - Chotu's website script still says "a map of stars" and "the website will say when it opens".
   - The public status page says "Some parts are having trouble" every day, because the brief is "late".
7. **Search can't find you.** The site is three pages (home, privacy, terms). Aspirants search for things like
   "federalism PYQ", "UPSC syllabus GS2", "polity notes Hindi". You hold 114 long reads, 579 past questions and 228
   one-minute syllabus videos, all behind sign-in.
8. **The app's address looks untrustworthy.** Sign-in and payment happen on `upsc-pods-production.chotu-aec.workers.dev`.
   The move to `app.aspiran.in` is built and waiting on DNS.
9. **In the app, 44% leave before finishing onboarding** (48 first opens, 27 finished). The first screen is the garden,
   then six teaching ideas, then eleven welcome languages, then sign-in. Value comes after all of that.

### What I'd do

Fresh structure, same brand. In this order:

1. **Switch on analytics and deploy the open demo.** One day of work. Without these, every other change is a guess.
2. **New short home page (five screens):**
   - Headline on the problem ("What you read in October is gone by March" / "Never prep alone").
   - One line on what it is. Main button: **"Try one topic free, no sign-up"**. Second button: "Get the app".
   - The Preamble recall trick (rooms 1 to 3 squeezed into one). It is the best thing on the page.
   - One real marked answer, and who is behind Aspiran (a face, a name, the editors).
   - Price and a short FAQ.
3. **Move the 17 rooms to "How Aspiran teaches"**, linked from the home page. It's good work; it's a second-visit page.
4. **Every lead gets an instant reply** (WhatsApp or email) with the app link. Today it only lands in a table.
5. **Open content for search:** a page per syllabus line (297), past questions by topic, the 228 videos on YouTube,
   each ending in "try this topic". This is the growth engine; ads for a ₹9,999 product from an unknown brand won't pay.
6. **Fix or remove the six promises above.** Publish the Chai daily before saying "daily".
7. **In the app, let people do one thing before sign-in** (one recall question or the demo), and cut the first-run
   screens to one.

On price: don't change it now. ₹9,999 sits where test series with human evaluators sit, and Plus is AI marking. Until
there is proof (real users, real improvement), the ₹999 founding price is the real price. Treat the first 300 as paid
research, not revenue.

---

## 2. Code review

**Verdict: the server is carefully written, better than most early products. The risk is not sloppy code. It's four
money bugs to fix before real payments, and a shape (three hand-synced apps, hard-to-run tests) that makes every
feature cost double.**

### Fix before taking real money

| # | Where | Problem | What happens |
|---|---|---|---|
| 1 | `server/src/payments.ts:187`, `:85`, `:160` | A failed payment marks the order "failed". A later success on the same order is ignored, because paid is only set from "created". Cashfree lets people retry inside one order. | Someone's UPI fails, they retry, the money goes through, and they don't get Plus. |
| 2 | `server/wrangler.jsonc:50`, live flags | The Plus switch is **on** in production while Cashfree is in **sandbox**. A sandbox payment grants a real year (not marked as test). | If the sandbox keys are set, anyone can get Plus with Cashfree's test card. I can't see secrets, so please confirm. One entitlement exists and no payment does. |
| 3 | `server/src/payments.ts:66` | Founding seats count only *paid* orders. Many people can start checkout at ₹999 at once. | More than 300 can buy at ₹999. Each extra seat costs ₹9,000. |
| 4 | `server/src/plus.ts:62`, `server/src/pod.ts:131` | The first person to open a pod is its lead, and a lead of a pod of 3 gets Plus free, with no end date. | Three Google accounts make a free ₹9,999 product. Fine if it's a choice; today it's an accident. |
| 5 | `server/src/play.ts` (noted in the file) | Play refunds aren't read. | A refunded Play buyer keeps Plus until someone ends it by hand. |

### Smaller things

- **Username sign-in is on in production** (`password_login: true`), though the notes say it was switched off on 2 Nov.
- **`/web/lead` has no rate limit** (`server/src/web.ts:191`), only a hidden field for bots. It can be flooded.
- **A new account can adopt any unlinked member id it is given** (`server/src/auth.ts:124`). Low risk now that sign-in
  is required, but old anonymous ids exist.
- **No content-security header** on the app, Desk or Admin pages. HTML is escaped properly where I looked, so this is
  a second lock, not an open door.
- **No error reporting from the apps.** The web app has about 20 silent `catch` blocks; when something breaks for a
  user, nobody is told.
- **The Android release has the server address baked in** (`android/app/build.gradle.kts:88`). After the domain move,
  the old address must keep working for old installs.

### The shape problems (these cost more than the bugs)

1. **Every feature is built twice, sometimes three times.** Web app, Android app, and the website each carry their own
   copy of the syllabus, the garden, the review schedule. The notes say "keep in step" in six places. For 24 users,
   this is the biggest drain on build time.
2. **The web app is one 4,000-line, 305 KB file** with no tests. It works, but each change risks something far away.
3. **Android has 93 files, 23,600 lines, and two tests (65 lines).** No view-models; state lives in the screens and in
   47 direct uses of saved preferences. It has never been checked on a device by me, and both emulators here are broken.
4. **Tests exist but can't be run with one command.** Seventeen suites, each needing a local server started a
   particular way. No automatic run on push. "Deploy after the tests pass" depends on a manual ritual being done right.
5. **The database shape lives in three places:** `schema.sql`, the migrations folder, and code that creates and alters
   tables while running (`staff.ts`). They can drift.
6. **Far more is built than is used.** About 40 content kinds and 37 practice formats, for a product where nobody has
   yet had an answer marked.

### Worth keeping as it is

Sign-in gate that rewrites the member id server-side; Google token checked properly; signed Cashfree webhook with an
amount check; one-time grants; distress check before any AI call; audit log; daily backup; content caps; clear comments
that explain *why*.

### If I did the code again

- **One client, not three.** The web app as an installable app, wrapped for Play (a Trusted Web Activity). Native
  Android only for what needs it (offline AI, Focus blocks), later. This alone would roughly halve build time.
- **A small build step and tests for the web app**, split into files by screen.
- **One test command and an automatic run on every push**, with a staging copy of the server.
- **One source for the database shape** (migrations only).
- **Build a feature only when the content and a user for it exist.**

---

## 3. Learning outcomes: does it help someone crack UPSC?

**Verdict: the method is right, and better than what coaching sells. But today the product could not carry an aspirant
through, and nobody could tell whether it's working. It's a strong retention and practice layer with a thin course
underneath and no proof loop.**

### What the exam needs, and where Aspiran stands

| What clears UPSC | Aspiran today |
|---|---|
| Cover a huge syllabus from standard sources | **Thin.** 98 syllabus notes, about 168,000 words: roughly one textbook. An aspirant reads ten to fifteen times that. The map has 297 lines; most have no deep material behind them. |
| Keep it for a year | **Strong.** Recall first, spaced review (FSRS), "Met / Can recall / Can use". This is the real edge. |
| Prelims: past-paper patterns, elimination, negative marking, speed | **Partly.** Five Prelims papers (2018, 2019, 2021, 2023, 2025) as drafts needing an editor's check against the PDFs; 2026 is missing. Sure/not-sure tracking is very good. Five full mocks. |
| CSAT: qualify | **Fine for now.** Two mocks, eight weekly sets. |
| Mains: about 180 handwritten answers across nine papers, fast | **Right loop, unproven marker.** Write, self-mark, AI marks, rewrite is the right design. But marking runs on free AI models that swap when one is busy, was never compared with a real evaluator's marks, and doesn't do Hindi. Zero answers marked so far. |
| Optional: 500 of 1,750 Mains marks | **Very thin.** Six subjects, a handful of notes each. This is where ranks are decided. |
| Current affairs, 12 to 18 months | **Not running.** The design (few cards, tied to syllabus, "Keep for Mains") is excellent. Zero days published. |
| Interview | A reasonable start. Not urgent. |
| Stay sane and keep going for 1 to 3 years | **Strong in design** (pods, no streaks, calm). But pods need people: 6 so far. |

### The five real gaps

1. **Facts.** All the content is AI-written and time-sensitive. The expert check on the one flagship topic
   (Federalism) found **nine wrong or outdated facts**, including the Finance Commission and GST. One confidently wrong
   fact in Prelims costs marks; it also costs trust. Two editors can't re-check 1,000+ items every time the law changes.
2. **Nobody knows where they stand.** UPSC is a relative exam with a cutoff. "You vs. you" is kind, but an aspirant
   also needs "would this mock clear last year's cutoff?" in private. That's not a leaderboard; it's honesty.
3. **Exam pressure is mostly absent.** The house rule is no timers. The exam is 100 questions in 120 minutes and 20
   answers in three hours. Timed mocks exist; timed *answer writing* and a full Mains paper day should too, clearly
   marked as "exam mode".
4. **The marker is unproven.** Before selling "unlimited answer marking", take 50 answers already marked by a real
   evaluator and compare. If the AI's bands don't match, the Plus promise is hollow.
5. **It doesn't yet say what it is.** A full course, or a companion to Laxmikanth, Spectrum and the NCERTs? The site
   implies the first; the content supports the second.

### What would I do if I did it all over again

**Be the companion, not the course.** One sentence: *"You read the standard books. Aspiran makes sure you keep it, can
use it in an answer, and don't do it alone."* Then build narrow and deep:

1. **One loop, for one group, done fully.** Say: GS2 Polity plus daily Chai, for aspirants writing Prelims 2027.
   Every Laxmikanth chapter mapped to its syllabus line; recall questions and all past questions for each; three
   Mains questions each with a human-checked model answer. Nothing else until this group uses it weekly.
2. **Publish the Chai every single day.** It's the daily reason to open the app, and 94 drafts are waiting.
3. **Recruit the first 50 by hand into real pods** and run them like a cohort, with you in the room. Learn what they
   actually use. The pod is the hardest thing to copy and the least tested.
4. **Prove the marker, then sell it.** The 50-answer comparison in English, then Hindi.
5. **A fact-freshness system.** Every item carries its sources and a "check again by" date; a weekly job lists what
   has gone stale after a budget, a judgment or an amendment.
6. **Private "where do I stand":** mock score against the last five years' cutoffs.
7. **Measure learning, not usage.** Three numbers per cohort: share of topics at "Can recall" after 30 days, the gap
   between self-marks and AI marks over time, and how many are still active at week 8. If those move, the marketing
   writes itself.
8. **Optionals last**, one subject at a time, with a subject expert, or say plainly that Aspiran doesn't cover them.

---

## If only five things get done

1. Publish the Chai daily, starting tomorrow (owner, 10 minutes a morning).
2. Switch on website analytics and deploy "Try one topic"; make it the main button.
3. Fix the payment bugs (1 to 4) before Cashfree goes to production; check the sandbox question today.
4. Remove or fix the six promises the product doesn't keep.
5. Pick the one loop and the first 50 people, and stop building new kinds of things until they use it every week.
