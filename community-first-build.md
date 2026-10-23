# Community-first build log

The spec is in `strategy/community-first-spec.md` (approved 11 Oct 2026). This file records what was built,
what's stubbed and what's left, so the paused "App brainstorm and build" thread can pick up from here.

Nothing has been committed or pushed anywhere, and no API keys were added.

## Status

| Part | Server | Web app | Android |
|---|---|---|---|
| 1. Five tabs (Adda · Pod · Chotu · Prep · Me), adda/prep palettes, first run | – | done | done |
| 2. Adda home, Free Shelf, honest tools | season, commons | done | done (Commons sitting is web-only) |
| 3. Pods: states, Monday match, merge, Commons, quiet rule, @Chotu, goal, quiz, thanks | done, tested | done | done |
| 4. Chotu v2: chips, kulhad, host schedule, memory notes | host schedule done, tested | done | done |
| 5. Staged profiling | /members/profile (4 fields only, delete clears), tested | done | done |
| 6. Stamp book, mock band, season | season and mock band done, tested | done | done (mock papers and the band added 12 Oct) |
| 7. Plus (flag `plus`, off; test mode only) | done, tested | done | info screen only, not sold on Android |
| Result-day mode (was designed, not in code) | done, tested | done | done |
| Report a Chotu reply (Play AI-content rule) | `/chotu/report`, tested | done | done |

## Server (done)

New files in `server/src`:
- `community.ts`: pod joining with honest summaries, Monday batch match, daily merge of forming pods 7+ days old,
  pod states (forming 1-2, small 3-5, full 6-8, quiet after 5 days without a human post), the 14-day private
  stay/move choice, Chotu's host schedule, the Commons summary, the community season, admin metrics, jobs.
- `commons.ts`: `CommonsRoom` Durable Object, presence only (no chat). Rooms: Library Hall · Hindi,
  Library Hall · English, Night Owls, Working professionals.
- `plus.ts`: Plus in test mode only, behind the `plus` flag (off by default). Free limits, offers only on the
  Prep surface at listed moments, the never-list in `offerBlocked()`, trial, test purchase, cancel, Gift Plus,
  scholarships, and a counter for offers shown on forbidden surfaces.
- `results.ts`: result-day mode (admin sets result days; 72 hours from the start of each day, IST).
- `anonymise.ts`: swaps pod names for Member A, B... before an @Chotu question leaves the pod.

Changed:
- `pod.ts`: kinds `chotu` and `quiz`; host gate (none 23:30-07:00, at most 2 a day, claimed rituals left
  alone); weekly goal (lead sets, everyone adds to one bar); Pod Quiz Night with one shared pod score;
  🙏 thanks; newcomer welcome; quiet prompt; @Chotu (distress check first, max 20 replies a pod a day);
  `/moved`, `/stay-or-move`, `/stats`; erasure also removes thanks and quiz answers.
- `index.ts`: one half-hourly cron that dispatches by IST time (free-plan friendly); `/chotu` checks the
  free cloud allowance only when Plus is on and the app sends a member id; `/config` carries result days.
- `admin.ts`: `GET community`, `POST jobs/run`, `GET/POST results`.
- `staff.ts`: `plus` flag (default off); tables `entitlements`, `usage`, `gifts`, `scholarships`;
  columns `members.stage/attempt_band/lang/time_band`, `pods.state/opens_on/last_human_at/quiet_asked_at/merged_into`.
- `wrangler.jsonc`: `COMMONS` binding and migration v2; crons `["0,30 * * * *"]`.
- The old 13:00 / 18:00 / 21:30 daily ritual posts are gone (they'd break the 2-posts-a-day rule);
  those rituals live in Prep now. See the README schedule table.

Tests (`server/test`):
- `smoke.mjs`: fixed the duplicate `back`; the Chai post check is skipped during quiet hours; a restore
  assertion was checking a message the test itself had hidden (now checks a visible one, and that the hidden
  one stays hidden).
- `community.mjs` (new): 20 checks across pods, merge, stay/move, host schedule, goal, quiz, thanks, claims,
  @Chotu distress and name-swapping, Commons, season, Plus and result-day mode.
- Run against a local server: `npx wrangler dev --port 8790 --persist-to .wrangler-test --var EDITOR_TOKEN:<any>`
  (load `schema.sql` into that state first), then `EDITOR_TOKEN=<same> BASE=http://127.0.0.1:8790 node test/community.mjs`.

## Web app (done, checked in the browser against the local test server)

`server/public/app`:
- `app.js`: five tabs (Adda default · Pod · Chotu · Prep · Me) with Prep's sub-tabs (Today's 3 · Chai · Practice ·
  Mocks · Read · Focus · My Plan); `data-space` = adda (warm) or prep (cool); Calm and Need to talk always one tap
  away (side rail, and a small bar on phones). First run is language → 18+ and consent → nickname → Meet Chotu → Adda.
- Adda: Chotu's host line, pod card with the shared goal, the Commons (real numbers only, none under 10), the
  community season counter, Today's 3 link, Free Shelf, thinker of the week. No prices or locks anywhere in it.
- Free Shelf (works with no account): Attempt Compass, Cost of a Year, 5-source maps, thinker, routine builder, Calm.
- Pod v2: "Forming · n of 8" with the Monday it opens, ritual calendar, one goal bar, Pod Quiz Night with the shared
  score, 🙏, Catch me up (made on the device), @Chotu hint, private stay-or-move card, reconnect after a merge.
- The Commons: rooms you can sit in (presence only), with a focus block.
- Chotu: Talk/Prep/Plan chips, kulhad with steam by tone, always "Chotu · AI". Distress check on the device first;
  only this chat's non-care turns are sent, never Close the Day, mood, journal, nickname or stage. Notes you
  approve (max 10) are sent only if Smarter Chotu is on. Off in result week apart from one line. Each reply has
  Report. A gentle hand-off to the pod after 15 Talk turns.
- Me: Profile (each field with its source, where it's kept, and Delete; Chotu's notes), Rhythm (dots, no streaks),
  Stamp book (5 families, none lost), Privacy (pause, Smarter Chotu, result-day mode, download, delete), Plus.
- `profile-db.js` (IndexedDB), `kulhad.js`, `honest.js` are new; `sw.js` caches them (shell v6).
- Staged questions: one a day, in context (pod: stage, attempts, study time; Today's 3 in week one: target year,
  medium, working; Mains: optional; Compass: when to look again; My Plan: goal, hardest part); never after 2 skips.
- Prep → Mocks: opt-in anonymous band after a full paper; with Plus on, full papers use the monthly allowance.
- Plus cards only on Prep screens (mock result, Chotu Prep when out of cloud turns), with an equal "Not now".

## Android (done, built as a debug APK and checked on the emulator)

`android/app/src/main/java/com/upscpods/app`:
- `MainActivity.kt`: five tabs (Adda default · Pod · Chotu · Prep · Me); Prep holds Today's 3, Practice and My Plan
  in the cool palette (`PrepSpace`). "Need to talk?" sits in the top bar on every tab. Stamp toasts.
- First run (`OnboardingScreen.kt`): language → 18+ and consent → nickname → Meet Chotu (kulhad, chai-time nudge).
  The old long questionnaire is gone; the rest is asked one question at a time.
- `AddaScreen.kt`: host line, pod card, Commons numbers (sitting in a room is web-only for now), season counter,
  Today's 3 link, Free Shelf (Attempt Compass, Cost of a Year, 5-source maps, thinker), calm card in result week.
- `PodScreen.kt`: "Forming · n of 8" header with the Monday it opens, moved-after-merge note, goal bar, Pod Quiz Night,
  study room, 🙏 thanks, @Chotu, private stay-or-move card, result-day gate.
- `ChotuScreen.kt` (additive only; the download fix and Groq fallback are untouched): Talk/Prep/Plan chips, kulhad
  badge, Report and "Remember this" on every reply, quiet card in result week, pod hand-off after 15 Talk turns.
- `MeScreens.kt`: Profile (field, source, where kept, Delete, which also clears the server copy), Stamp book,
  Rhythm (dots, no streaks), Privacy (Smarter Chotu, result-day mode, what leaves the phone), Plus (test mode,
  information only), My Path (settings).
- New data: `StagedProfile.kt` (fields, notes, stamps, ask-once-a-day), `Community.kt`, `Honest.kt`, `ServerPolicy.kt`,
  `Kulhad.kt`. Room schema unchanged (one new query).
- Emulator check (12 Oct, Medium Phone API 37, against the local test server): first run, all five tabs, Pod v2,
  the Commons and season numbers and the Attempt Compass all work, with no crashes left. Fixed along the way:
  - a crash when the Adda asked the server before one was set (`Community.kt` now builds requests only after that);
  - the host line no longer mentions "your pod" to someone without one, and the Commons says when it can't reach
    the server instead of "Checking…" forever;
  - My Path had shown a persona card ("Attempt 1st · starting out") made from defaults the person never gave. It's
    gone; answers live in Me → Profile. The Me settings page is called My Path, so older hints still point right;
  - "1 cards" in the Chai post (server `desk.ts`).
- Free Shelf tools now open on the warm background (was plain grey).

## Tests (12 Oct)
- `npx tsc --noEmit`: clean. `smoke.mjs`, `chotu.mjs`, `community.mjs` against the local server: all pass.
- `:app:assembleDebug`: builds (`android/app/build/outputs/apk/debug/app-debug.apk`).
- `:app:assembleRelease` with no keys: stops with the "Release signing isn't set up. Missing: …" message.

## Deployment items (done)

1. Android release build: `DEFAULT_SERVER` BuildConfig field in `android/app/build.gradle.kts`, placeholder
   `https://app.example-domain.in` with a comment. Debug has no preset and keeps the typed server (http allowed);
   release uses the default when nothing valid is typed and refuses http (`data/ServerPolicy.kt`, My Path shows why).
2. Focus extension: `focus-extension/config.js` holds `APP_ORIGINS` (the one setting); `manifest.json` matches
   `https://app.example-domain.in/*` next to `*.workers.dev` and localhost; `bridge.js` checks the origin; README
   explains the two places to change.
3. Release signing: `signingConfigs.release` reads `storeFile`, `storePassword`, `keyAlias`, `keyPassword` from
   `keystore.properties` outside the repo (default `../../upsc-pods-keys/keystore.properties`, or
   `-PkeystoreProperties=`), or from `UPSC_KEYSTORE_*` env vars. A release build without them stops with a message
   naming what's missing (checked). `.gitignore` (root, android, server) covers `*.jks`, `*.keystore`,
   `keystore.properties`, `local.properties`, `.dev.vars`, `server/models/*.litertlm`. No keystore or password
   was created. Steps are in `android/README.md`.
4. Report on each Chotu message, web and Android: sends the message id, a reason and that one reply to
   `/chotu/report` (the safety queue). No chat history.

## Stubbed or not built

- Commons "Ask the seniors", "Chai talk" threads and "Live tonight": not built (rooms are presence-only).
- Floating leads and opt-in buddy pairs across forming pods: not built.
- Web has no AI answer feedback yet, so the "third free feedback" Plus moment can't fire on web.
- The Rhythm-week-4, notification-day, Mains-sprint and Compass Plus moments exist on the server but aren't shown
  anywhere yet (kept off on purpose until the founder decides).
- Android: sitting in a Commons room, Chai talk and the Calm screen are web-only
  (Need to talk is one tap away in the top bar). Plus isn't sold in the Android app.
- Real payments: none. Purchases, gifts and invoices are test mode only, labelled TEST.

## Welcome in eleven languages and "Request your language" (12 Oct)

The founder asked for a home page and splash that welcome people in every language, with the app itself staying in
English and a prominent way to ask for more languages. Gujarati and Odia were added to the list.

- **Languages:** English, Hindi, Hinglish, Telugu, Tamil, Bengali, Marathi, Kannada, Malayalam, Gujarati, Odia.
  Malayalam, Gujarati and Odia are new in `server/src/vendor/pods-templates.cjs`, `langs.ts` and `community.ts`, all
  with status `planned`. None of them has translations. The core content stays English, and existing Hindi is kept.
- **Web welcome** (`server/public/app/welcome.js`, CSS in `index.html`): the first onboarding step is a welcome scene.
  Greetings in all 11 languages rise like steam from Chotu's kulhad, one every 2 seconds in a 22-second loop. It is
  pure CSS. With reduced motion the greetings sit still around the cup. Screen readers get a plain list with each
  greeting tagged by language. The Adda header shows one greeting a day. Noto Sans for each script loads from Google
  Fonts only on these screens. To keep every request on our own domain, self-host the woff2 files.
- **Android splash:** Android 12+ shows `drawable/splash_kulhad.xml`, a 1-second animated icon (the cup settles and
  steam rises) on the Adda cream, or dark brown at night (`values-v31/themes.xml`). Older versions show a plain cream
  window. A member's cold start then gets a short in-app welcome (`LaunchWelcome` in `ui/Welcome.kt`): today's
  greeting over the kulhad for 1.3 s, 0.7 s with reduced animations, and a tap skips it. Onboarding opens with the
  same rising-greetings scene.
- **Request your language:** this appears on the web onboarding language step, in Me (web and Android, Me → Request
  your language) and in the Adda's daily-greeting link. Tap a language to count it, tap again to withdraw. There is
  an optional "I'd help translate" tick.
  - `POST /languages/request {device, lang, on?, helper?}`. `/config` lists `requestable` (9 codes, not en/hi).
  - Table `lang_requests (lang, who, helper, at)` with one row per device per language. `who` is
    SHA-256 of a random device id that is separate from the member id. No name, email or member id is stored.
  - Android queues taps made offline and sends them on the next launch. Deleting data clears them.
  - Admin console → Languages → "Requested by members": requests, last 7 days and helpers, most requested first
    (`GET /admin/api/language-requests`, staff).
- **NEEDS NATIVE-SPEAKER CHECK:** every non-English greeting, romanisation and native language name in
  `welcome.js`, `ui/Welcome.kt`, `LanguageRequests.kt`, `requests.ts` and the vendor `LANGS` was written without a
  native speaker. Each greeting has `checked: null` until someone checks it. None of them is verified.
- **Tests:** `tsc` is clean. smoke, chotu, community and the new `test/languages.mjs` (`npm run test:languages`:
  validation, one count per device, the helper tick, withdrawing, admin auth and order, no raw device ids) all pass
  against a local server. Web: checked in the browser at desktop and phone width, with reduced motion, and through
  the request and onboarding flows. Android: the debug APK was rebuilt and checked on the emulator (splash icon, the
  launch welcome, the onboarding welcome and request card, an offline request syncing later, Me → Request your
  language).

## Mock papers on Android (12 Oct)

The founder said "Do these two": mock papers on Android, and the Gemma model setup.

**Mocks** (Prep → Mocks, the cool Prep palette, content in English):
- `data/Mocks.kt` (new): reads approved `mock` items from the cached `/library`, so the list opens offline. It also
  builds a quick mock from Chai-card questions and the starter bank (up to 25 questions, needs 10 or more). The paper
  in progress, the history (last 100), the last paper's answers and any fetched bands are kept in `files/mocks/`.
  Writes go to a temp file first, so a paper survives the app being killed.
- `ui/MockScreens.kt` (new):
  - The list shows the papers, a "Paper in progress" card, your range over the last five papers, and past papers. The
    newest one opens its answers.
  - The start dialog gives the rules.
  - The paper runs full screen: system bars hidden, screen kept on, one question at a time. Tap an option again to
    clear it. Each question has "Not sure (a guess)" and "Come back to this". The palette is behind a "Questions"
    button. The timer can be hidden (it shows again in the last 5 minutes). Submit asks to confirm, and the paper
    submits itself at zero.
  - Back or "Leave" asks before stepping out. The clock keeps running on wall time, so after the app is closed or
    killed the paper reopens where it was, and it submits at once if time ran out.
  - The result shows the score (UPSC marking: GS1 +2 / -0.66), right/wrong/left counts, the range band, the guess
    line against break-even and weak topics. Review has Wrong · Skipped · All filters, each question with your answer,
    the correct one and the explanation.
- Band: the same opt-in card as the web, for full papers only and not in result week. It sends only the paper id and
  the percent to `/mocks/band` (`Community.mockBand`). Offline it says it couldn't reach the server and keeps the
  result. Like the web, one band per paper per day.
- As on the web, the paper starts a focus block (`Focus.start`), so blocked apps stay closed until you submit. With
  Plus on, a full paper uses the monthly allowance (`/plus/use`); if it's used up, a plain message appears. Nothing is
  sold. A wrong Chai-card question in a quick mock comes back in Prelims revision. Delete my data clears mocks too.
  Practice → "Learn and play" no longer lists mock items. The Prep chips scroll sideways now that there are four.
- Checked on the emulator against a local server with a 12-question, 3-minute test paper. I added that paper to the
  local test database and removed it afterwards. Checked: start, answer, guess and come-back marks, the palette,
  force-stopping the app mid-paper and resuming, auto-submit at zero, a score of 0.68 = 2 − 2×0.66, the band
  ("not enough people yet"), the answer review, the list and the quick mock offline in airplane mode, submitting
  offline, and the band's offline message.

**Gemma setup:**
- The two files are in `Downloads`, not `server\models\`: `gemma-4-E2B-it.litertlm` (2,588,147,712 bytes) and
  `gemma-4-E4B-it.litertlm` (3,659,530,240 bytes). Their SHA-256 values match `src/chotu.ts`.
- `server\.dev.vars` didn't exist. It now holds one line, `MODEL_FILES_URL=http://127.0.0.1:8788`, and no keys.
- With `npm run models` pointed at Downloads (`MODEL_DIR`) for the check, `GET /models` listed both Gemma models and
  a Range request returned 206. The emulator (Medium Phone API 37) has 4.1 GB RAM, below Gemma's minimum (5 GB for E2B,
  7.5 GB for E4B), so the app correctly offers no on-phone download there. The download itself still needs testing on a
  phone with 6 GB or more (or an AVD with more RAM).

**Tests:** `tsc` clean; smoke, chotu, community and languages all pass on a fresh local server; `:app:assembleDebug`
builds. Building from a terminal on this PC needs `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\gsock`, because
Gradle fails with "Unable to establish loopback connection" when the temp path has a space in it. Android Studio is
unaffected.

## Hugging Face models, sample mock paper, My Path corrections, publish attempt (12 Oct, evening)

The founder said "yes for HF", "Add them [the language rap videos] and publish the updated app with all the work
done so far", "yes to mock paper as well" and "My path number too is a yes", and saved
`content/mock-paper-sample.json` and `content/my-path-corrections.md`.

**1. Gemma from Hugging Face (done, tested).** `src/chotu.ts` passes the official files along when neither
`MODEL_FILES_URL` nor R2 has them: `litert-community/gemma-4-E2B-it-litert-lm` and `gemma-4-E4B-it-litert-lm`,
pinned to commits that are byte-identical to `main` (so the SHA-256 checks hold even if `main` moves). Range and
resume are kept, only our own headers reach the phone (nothing names or links Hugging Face), and the phone still
only talks to our server. Priority: `MODEL_FILES_URL`, then R2, then Hugging Face. `npm run test:models`
(`test/models-hf.mjs`) passes against a local server with no `MODEL_FILES_URL`: both Gemma models listed, HEAD sizes
right, a Range request returns 206 with the right `content-range` and no Hugging Face headers. Nothing goes to R2.

**2. "Akela Nahi" videos (done, all 11).** The founder saved them in `content/` ("language videos are also saved
to app/content folder"); copied to `server/public/videos/` and served as static files (45 s, portrait 720x1280,
about 1.05 to 1.26 MB each, 12.6 MB for all 11): English, Hindi, Hinglish, Telugu, Tamil, Bengali, Marathi, Kannada, Malayalam, Gujarati,
Odia.
- **Lyrics: NEEDS NATIVE-SPEAKER CHECK.** Every non-English video was written and voiced without a native speaker
  (ElevenLabs). The list in `public/app/videos.js` and `ui/RapVideo.kt` has `checked: null` for each; set the
  checker's name once one has watched it.
- Captions: the lyrics are burned into each video in its own script with an English line under them, so the words
  are always on screen. There's no separate subtitle file.
- "Watch in your language" card on the Adda, after the host card. Web (`videos.js`, `app.js`): picks the pod's
  language, else the first language the member asked for, else English, and says "Kannada isn't ready yet, so
  this is in ..." if needed. Chips to switch, and the choice is remembered. `<video>` with controls, never autoplay,
  `preload="none"` on mobile data or Data Saver (nothing fetched until Play). Android (`ui/RapVideo.kt`): Hindi
  readers get Hindi, else the first requested language, else English. Nothing is loaded until "Play (45 seconds)"
  is pressed, on any network, with a "you're on mobile data: about 1 MB" note. It plays from the pod server's
  `/videos/`.
- Size: the first copies were 1080x1920 (2.2 to 2.6 MB). The founder re-exported all 11 at 720x1280 and replaced
  them in `server/public/videos/` (checked: 720x1280, 45.3 s, picture and sound, set up to play while
  downloading). `content/` still holds the 1080p originals; they are not served. No video is inside the Android
  app or the web app's offline copy; a phone downloads only the one video that is played.
- Checked in the browser: Telugu member gets Telugu, the file loads (45.3 s, no autoplay), and at 375px
  there's no sideways scroll. Service worker shell cache is now v9.

**3. Sample mock paper (done, tested; a draft until an editor approves it).**
- Pack `server/content/mock-sample-2026-10-12/` (manifest + `mocks/polity-sectional-mock-1.json`, a copy of
  `content/mock-paper-sample.json`). Import: `npm run import -- content/mock-sample-2026-10-12`, then approve on the
  desk. The paper's own `review.status` is "draft" ("needs an editor check for EN and HI before publishing"), so it
  arrives as a draft like every pack item and shows in Mocks only after an editor approves English (and Hindi).
- `normalizeMock` in `src/content.ts` (on import and on desk edits) turns the template shape (stem, statements,
  ask, options, why, one `answer`) into the apps' shape: statements numbered "1.", "Statement I:" for the
  two-statement format ("कथन I" in Hindi), already-labelled lists kept as they are; answer index and explanation
  kept in both languages; topics from the syllabus node ("Fundamental Rights", "Federalism"...); suggested
  `minutes` = 1.2 a question (36); the standard "not an official UPSC paper" note. Papers already in the apps'
  shape pass through untouched, and re-importing doesn't convert twice.
- Per-paper timer: `"timer": {"default": "off", "counts": "up"}` is honoured on web and Android. The card says
  "about 36 min suggested, no countdown"; the start rules say there's no countdown and you submit when done; the
  timer starts off and can be switched on to count up ("12:04 so far"); the paper never submits itself (web: the
  focus block ending doesn't submit it and the tab title shows no countdown; Android: no end time, and "Paper in
  progress" says "no countdown"). The focus block for such a paper lasts three times the suggested time (at least
  60 min). Every paper without `timer` behaves exactly as before.
- `npm run test:mocks` (`test/mocks.mjs`): upload, import, conversion (30 questions, en + hi, answers and
  explanations kept, numbering, labelled lists untouched, no editor flags), off `/library` as a draft, ships after
  approval with the timer, Hindi waits for a Hindi editor, re-import keeps one copy, clean-up. Passes.
- Checked in the browser against a local server: the card, the start dialog, statements on their own lines,
  "Timer off" → switch on → counting up, submit and the result. Android compiles in the debug build; not run on
  the emulator this time.

**4. My Path corrections (done).** From `content/my-path-corrections.md`:
- Attempt Compass, web (`honest.js`, `app.js`) and Android (`Honest.kt`, `AddaScreen.kt`): PwBD upper age is 42
  for General/EWS (and at least 42 for all). For OBC-PwBD (45 vs 42) and SC/ST-PwBD (47 vs 42) it now says "Check
  the UPSC notification: sources differ..." and marks each year past 42 "check the UPSC notification" instead of
  stating it as open. EWS (6 attempts, 32) and PwBD attempts (9 for General/EWS/OBC, unlimited for SC/ST) were
  already right. Source line: "UPSC CSE 2026 notification (4 Feb 2026), upsc.gov.in · as of 12 Oct 2026".
- Cost of a Year has no exam figures (only your own costs); nothing to change.
- No app copy carries applicant or vacancy figures. The only copy repeating them was the funnel in
  `build-overview.html`: now over 8 lakh applied (about 8.19 lakh; 8 to 10 lakh a year), 5.49 lakh sat Prelims
  (provisional), 933 vacancies notified, later revised to about 1,016, about 1 vacancy per 540 to 590 who sat,
  vacancies are not selections (2025: 958 recommended against 1,087), final CSE 2026 result due 2027.
- There is no separate landing page in this folder: the website is the web app at `/app/`.

**5. Publish (stopped at the Cloudflare login).**
- Before publishing: `tsc` clean; `smoke`, `chotu`, `community`, `languages` and `mocks` all pass on a fresh local
  server; `models` passed against Hugging Face. Android `:app:assembleDebug` builds
  (`android/app/build/outputs/apk/debug/app-debug.apk`, 12 Oct 20:28) with Gradle 9.8.1 from `~/.gradle` and
  Android Studio's JDK (there's no `gradlew` in the folder).
- `npx wrangler whoami`: not logged in. Nothing was created or deployed: no D1, R2 or KV, no schema applied, no
  workers.dev URL. The release server address in `build.gradle.kts` still holds the placeholder. The Focus
  extension manifest already matches `https://*.workers.dev/*`; the exact address goes into `APP_ORIGINS` in
  `focus-extension/config.js` once it exists.
- No upload keystore (`Personal/upsc-pods-keys/` is absent, no `UPSC_KEYSTORE_*` variables), so no release AAB.
- Secrets the founder must set (none are set; never paste them in chat): `EDITOR_TOKEN`, `MOD_TOKEN`,
  `ADMIN_TOKEN` (the owner key), `GROQ_API_KEY`.

## Founder to-do

- Set real result days before each UPSC result: admin console → Feature flags → Result days (form added 12 Oct;
  same as `POST /admin/api/results`). Dates come from the UPSC calendar and What's New pages.
- Plus stays off until you switch the `plus` flag on. Payments need a provider and keys you add yourself.
- Release Android and the Focus extension now point at `https://upsc-pods-production.chotu-aec.workers.dev`
  (12 Oct). If a custom domain is bought, change `android/app/build.gradle.kts` and
  `focus-extension/config.js` + `manifest.json` again.
- Create the upload keystore yourself (steps in `android/README.md`), keep it and its passwords outside the repo,
  and back them up.
- Initialise git before committing; `.gitignore` files are ready.
- Have native speakers check the 10 non-English greetings and the native language names (see the welcome
  section), and fill in `checked` in `welcome.js` and `ui/Welcome.kt`.
- Decide whether to self-host the Noto fonts instead of loading them from Google Fonts.
- Optional: move `gemma-4-E2B-it.litertlm` and `gemma-4-E4B-it.litertlm` from `Downloads` into `server\models\`
  for offline local testing. Deployed, nothing needs uploading: the server passes the Hugging Face files along.
- Test the Chotu on-phone download on a real phone with 6 GB or more RAM.
- Watch Admin → Languages → "Requested by members" to choose which language to build next.
- Log in to Cloudflare yourself (`npx wrangler login`), set the four secrets, then ask for the deploy to be re-run
  (steps in `server/README.md` → Deploy).
- Create the upload keystore (`android/README.md` → Release signing), then build the AAB and upload it in Play Console.
- Have an editor check the sample GS2 Polity mock paper (EN and HI) and approve it on the desk.
- Have a native speaker watch each "Akela Nahi" video (10 languages besides English) before launch.
