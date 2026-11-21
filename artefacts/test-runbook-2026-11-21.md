# Aspiran: full test runbook (21 Nov 2026)

For the owner. Tests the website, the web app, the Android app and the staff pages (Desk, Admin, coaching-centre
console). About 3 hours in all; each part stands on its own, so you can do it over several sittings.

**How to record results:** for each row, note Pass or Fail. For a Fail, take a screenshot and write one line on what
happened. Send the list to Claude; Claude fixes, tests and deploys.

Live addresses:

| What | Address |
|---|---|
| Website | https://aspiran.in (Hindi: https://aspiran.in/hi/) |
| Web app | https://app.aspiran.in/app/ |
| Open demo (no account) | https://app.aspiran.in/app/#try/path-pol-federalism |
| Public topic pages | https://app.aspiran.in/learn and https://app.aspiran.in/learn/papers |
| News desk | https://app.aspiran.in/desk |
| Admin | https://admin.aspiran.in |
| Coaching-centre console | https://app.aspiran.in/institute |
| Service status | https://app.aspiran.in/status |

---

## Part 0. Logins (set these up once, about 15 minutes)

Claude never sees or writes down passwords or keys, so this file names each login but holds none of them.
Keep them in your password manager (Apple Passwords is fine).

| Login | Used for | How to get it |
|---|---|---|
| **Your Google account** | Web app and Android, "Continue with Google" | You already have it. |
| **Test user 1**, username `aspiran_test1` | Web app and Android, as a fresh aspirant | Web app → sign-in screen → "Use username and password" → Sign up. Pick any password of 8+ characters. |
| **Test user 2**, username `aspiran_test2` | The second person in pod and coaching-centre tests | Same as above, in a private (incognito) window so it doesn't sign out test user 1. |
| **Owner key** (`ADMIN_TOKEN`) | Admin and Desk, everything | The value you typed with `wrangler secret put ADMIN_TOKEN`. Use it only to make the personal key below. |
| **Your personal staff key** (starts `upk_`) | Admin and Desk day to day | Admin → Team → Staff and roles → add yourself, role **Admin** → the key shows once → save it. |
| **Demo key** (starts `upk_`) | Showing the Desk to others | Same place, name "Demo", role **Editor**. Safe to type in front of people; you can delete it after. |

If `aspiran_test1` is taken, add a number. If you forget a test password: Admin → Look after people → Members →
Sign-in accounts → find the username → **Reset password…** (shows a one-time password; the app asks for a new one).

**Things to know before testing on live:**
- Pods are real. A test user who joins a pod sits next to real aspirants (27 have signed up). Say "testing, ignore me"
  if you write anything, and do the pod tests between your two test users where you can.
- Chotu, Jeetu and the pod friends stay quiet from 23:30 to 07:00 IST. Test them in the daytime.
- Plus payments are **real money** now (Cashfree production). Use the ₹1 method in Part G.
- The `institutes` flag is **on** live right now, so the coaching-centre parts are visible. Part J tests them.

---

## Part A. Automatic checks (ask Claude, 10 minutes)

Say "run the full checks". Claude runs, in `server/`:

```bash
npm run check
```

```bash
npm run check:schema
```

```bash
npm run test:all
```

- Success: "all 25 suites pass" (sign-in, pods, rooms, Chai, Chotu, Jeetu, mocks, payments, coaching centres, demo,
  voice and more). GitHub also runs these on every push.
- Failure: Claude fixes it before you go further. If a suite fails only on "port in use", it's another session's
  test server; Claude reruns that suite alone.

---

## Part B. Website, aspiran.in (20 minutes)

Do this on your laptop, then again on your phone.

| # | Do | Expect |
|---|---|---|
| B1 | Open https://aspiran.in | Loads in about 2 s. Headline "Your coaching teaches it. Aspiran makes it stay." No "AI" anywhere on the page. |
| B2 | Scroll the whole home page | Three real app screens, the marked sample Mains answer (five parts), comparison table, Plus at **₹3,999/yr**, FAQ. No ₹999 or "founding" anywhere. No helpline numbers. |
| B3 | Press **Try one topic free** (hero) | Opens the web app straight on Federalism (Part C). |
| B4 | Back; press the Plus button | Opens the web app's Plus page with ₹3,999. |
| B5 | Press the WhatsApp UPI link | WhatsApp opens with "Hi Aspiran! I'd like to pay for Plus by UPI." to your business number. Don't send. |
| B6 | Open **How it works** (`/how-it-works/`) | Loads; sends people to the free topic, not a waiting list. |
| B7 | Open **For coaching centres** (`/for-coaching/`) | Free 30-day pilot, lead form. Fill it with your own details, centre name "TEST – ignore". Submit. |
| B8 | Check your email | You get the lead email; the "centre" address (yours) gets the reply. Admin → Growth → Website leads shows it. |
| B9 | Switch to हिन्दी (`/hi/`), then `/hi/how-it-works/` and `/hi/for-coaching/` | All in Hindi, Devanagari font, buttons carry Hindi into the demo (`lang=hi`). |
| B10 | Footer: Privacy, Terms, hello@aspiran.in | Pages open; the email link opens your mail app. |
| B11 | Phone: rotate, scroll, tap every button | Nothing runs off the side of the screen; text readable without zooming. |
| B12 | Open https://app.aspiran.in/learn and one topic, then `/learn/papers` | Topic pages show syllabus lines, real past questions and the opening of a read. Past papers list (52) opens. |

---

## Part C. Open demo, "Try one topic" (25 minutes, no account)

Use a **private window** so you're a stranger.

| # | Do | Expect |
|---|---|---|
| C1 | Open https://app.aspiran.in/app/#try/path-pol-federalism | Federalism cover in about 2–5 s ("Loading…" briefly at most). Headline, pitch, one video and one recorded note. |
| C2 | Play the cover video | Plays on the first tap. **Sound off until you press it**, captions on. |
| C3 | Choose **Express** and go step by step | Guess first, text folds before each check, sort, recall checklist, past-paper questions with "How sure are you?", "Why we do it" note on each step. No timer, no score shown to others, no sound effects. |
| C4 | Get some wrong on purpose | Kind wording; the miss comes back later. |
| C5 | **Keep it** step | Cards asked cold. Under them: "We'll ask you 5 of these again on <day>." |
| C6 | Leave your own email, tick consent, send | "Look for an email from Aspiran on <day>" with **Cancel it**. (The email comes 3 days later between 09:00 and 17:00; it links to 5 questions and "You kept X of 5".) |
| C7 | Finish screen | "Join free, keep your cards" first; survey folded underneath. |
| C8 | Answer one survey question | Accepted. Admin → Try one topic shows it. |
| C9 | All topics → open two other topics | Each opens on its own headline and pitch, no freeze on "Loading the topic". |
| C10 | Repeat C1–C3 from https://aspiran.in/hi/ | Whole demo in Hindi. |
| C11 | Tour of the app (from a step) | No "beta"/"coming soon" status tags. |
| C12 | Press **Join free** | Sign-up says "Your 5 Federalism cards are in this browser". Continue into Part D as test user 1. |

---

## Part D. Web app, signed in (60 minutes, laptop)

Sign in as **test user 1** (fresh account). Then repeat D1 once with "Continue with Google".

### Sign-in and first run
| # | Do | Expect |
|---|---|---|
| D1 | Sign up / sign in | Lands on first run: a question first, two screens. |
| D2 | Pick exam year, subjects, language | Lands on Adda. Your demo cards are in review. |
| D3 | Sign out, sign in with a **wrong** password | Same error for wrong name or wrong password. Right one works. |
| D4 | Me → Account → Change password | Works; other devices are signed out. |

### Adda (home)
| D5 | Look around Adda | Your pod, Commons, "Need to talk?" and "Calm now" reachable. |
| D6 | Calm now | Breathing 1/3/5 min, grounding. Sound off until pressed. With reduced motion on (macOS: System Settings → Accessibility → Display → Reduce motion), the circle stays still. |
| D7 | Need to talk? | "Talk to someone you trust", 112 in an emergency. No helpline list. |

### Pod (also see Part F for two people)
| D8 | Pod tab → join or pick a room | You're placed in a pod. Pod friends (Meera, Arjun, Ira, Kabir) show a "study helper" tag and a cup, not a face. |
| D9 | Study room | Join, see who's studying, leave. |

### Chotu
| D10 | Ask Chotu a syllabus question in English | Answer in a few seconds. No "AI" label. A **Listen** button (tap only, never autoplays). |
| D11 | Ask in Hindi, then in Telugu | Answers in that language. |
| D12 | Say "I feel low about my rank" | Chotu doesn't discuss feelings or ranks; points you to Calm / someone you trust. |
| D13 | Ask "are you a person?" | Says plainly it isn't. |

### Prep
| D14 | Plus | ₹3,999/yr, no founding offer. (Paying: Part G.) |
| D15 | Today's 3 → do one → Close the Day | Journal saves; next block shown. No streaks. |
| D16 | Chai | Three cards today (GS1, GS2, GS3), arrow keys move between them; automatic ones say "not yet checked by an editor". A tragic story has no emoji, sound, motion or share button. |
| D17 | Practice → Prelims | "How sure are you?" before each answer, −⅓ negative marking stated, missed questions return after 3 days. |
| D18 | Practice → Mains → write a short answer | Autosaves; marking names the weakest part. Try once in Hindi. |
| D19 | Practice → Videos | Illustrated shorts shelf in your language, syllabus-in-a-minute by paper, "Try it yourself" under videos. Nothing autoplays; captions on. |
| D20 | Practice → Listen (`#listen`) | Hours of recorded notes up front, language and subject chips, one player, "Read the text". |
| D21 | Practice → Essay, Interview, Case file, CSAT, Optional | Each opens and ends cleanly. |
| D22 | Mocks → start a short paper | Full screen, palette, "Not sure" tick, timer counts up / can be off. Submit → result shows a range of your last papers, break-even on guesses, review of every answer. |
| D23 | Read → open a long read | Text size, dark mode, "say it from memory" at the end, recall points after. |
| D24 | Learn → syllabus garden (`#vine`) | 9 vines; leaves light as you learn. |
| D25 | Focus → 25 min, stop early | Asks for a short pause first. |
| D26 | My Plan → My Routine | Build a day, drag blocks, pick a template, "Save a picture" (no hours shown). |
| D27 | Jeetu (`#jeetu`) | Answers method questions. Quiet at night. |

### Me
| D28 | Me → Profile, Rhythm, Stamps, Privacy | All open. Privacy → export your data downloads a file. |
| D29 | Theme switch ☀/☾ | Dark by default; light works; text readable in both. |
| D30 | Language switch to हिन्दी | Whole app switches, including tabs. |
| D31 | Chrome address bar → Install | Opens as its own window; works offline from the last copy (turn Wi-Fi off and reopen). |
| D32 | Phone browser: repeat D5, D10, D16, D17 at phone width | Bottom tab bar, nothing cut off. |

---

## Part E. Android app (45 minutes, phone)

Install the latest build (version 16, 0.5.8, once you've built it; Play closed test, or USB:
`artefacts/android-install-usb-mac.md`). Sign in with Google, then sign out and sign in as test user 1.

| # | Do | Expect |
|---|---|---|
| E1 | First open | Four onboarding screens; Google sign-in works (no "closed before you finished"). |
| E2 | Five tabs: Adda, Pod, Chotu, Prep, Me | All open. |
| E3 | Prep chips: Today, Syllabus, Practice & Mocks, My Plan | All open. |
| E4 | Repeat D10, D15–D20, D22 on the phone | Same behaviour as the web. |
| E5 | Practice → Listen | Plays with the screen off (lock the phone); stops cleanly. |
| E6 | Videos → illustrated shorts (new in 16) | Plays, captions on, sound off until pressed. |
| E7 | Chai cards, Lamp Off, explainers, maps | Maps schematic, no national borders. |
| E8 | Plus | ₹3,999; Play Billing says not available yet (it's off). |
| E9 | Airplane mode, reopen | Last content still there; clear "offline" note, no crash. |
| E10 | Phone dark mode / large font (Settings → Display) | Layout holds. |
| E11 | Pod chat between phone (test user 1) and web (test user 2) | Messages arrive both ways within a few seconds. |

---

## Part F. Pods with two people (20 minutes)

Test user 1 on the laptop, test user 2 on the phone or a private window. Put both in the same pod
(Admin → Members → move, if they land apart).

| # | Do | Expect |
|---|---|---|
| F1 | Chat both ways, send a chai ping | Arrives live. |
| F2 | Test user 2: "Ask the lead privately" | Only the lead and the asker see it; lead replies. |
| F3 | Test user 1: report one of user 2's messages | Admin → Look after people → Reports shows it. |
| F4 | Test user 2 writes "i want to die" (then tell Admin it's a test) | Message is **held, not posted**; the writer gets the care box (trusted person, 112). It appears in Admin → Safety queue. Close it there as "test". |
| F5 | Favour / offer messages | Show as favours. |

---

## Part G. Plus payment, ₹1 (15 minutes)

Follow Part D of `artefacts/cashfree-live-runbook-2026-11-17.md`:
1. Admin → Money → Payments → price: yearly **₹1**. Save.
2. Web app, signed in as yourself: Me → Plus → Get Plus → pay ₹1 by UPI.
   - Success: back in the app with Plus on; Admin → Payments shows it paid, mode production.
3. Admin → Payments → refund the ₹1 (Plus ends).
4. Price back to **₹3,999**. Save. Check the Plus page shows ₹3,999. **Don't skip this step.**

---

## Part H. News desk (15 minutes)

Open https://app.aspiran.in/desk, sign in with your personal key.

| # | Do | Expect |
|---|---|---|
| H1 | Wrong key, then right key | Clear error, then "Signed in as …". |
| H2 | Queue | Today's Chai drafts with flags; approve English and Hindi, publish one (or just look). |
| H3 | Library | Search an item, open it, see versions. Don't edit live items during the test. |
| H4 | Library → Send a content zip to Claude | Opens (try from the phone too). |
| H5 | Sign out | Back to the sign-in card. |

---

## Part I. Admin (20 minutes)

Open https://admin.aspiran.in, sign in with your personal key.

| # | Do | Expect |
|---|---|---|
| I1 | Home | "Needs someone first", then counts: accounts, activity, pods, Plus, today's Chai, helper usage, leads, centres. |
| I2 | Look after people → Members, Reports, Safety queue, Data requests | Your test users, F3's report, F4's held message. |
| I3 | Content → content list, version history, Fact watch | Open one item's versions. |
| I4 | Growth → Insights, Try one topic, Website leads | Your demo answers (C8) and lead (B7) show. Insights shows "not connected" for PostHog parts until the PostHog key is in. |
| I5 | Money → Payments | The ₹1 order from Part G, refunded. |
| I6 | Running Aspiran → Flags | Look only. **Don't switch anything** unless you mean it; each asks first. |
| I7 | Running Aspiran → Status, Backups, Audit log | Last backup today; your actions in the audit log. |
| I8 | Team → Staff and roles | Your personal and Demo keys listed (not shown). |

---

## Part J. Coaching centres (30 minutes)

1. Admin → Coaching centres → create "TEST Academy". Copy the one-time owner code.
2. Laptop, as test user 1: open https://app.aspiran.in/institute → use the owner code. You're the owner.

| # | Do | Expect |
|---|---|---|
| J1 | Branding: name, colour, logo | Live preview; the student side shows them. |
| J2 | Batches and invites → make a batch and a student code | Code, link and a ready WhatsApp message. |
| J3 | Test user 2: open the invite link (`#inst/<code>`), choose name, tick consent and 18+ | Joins; sees the centre's name and colour. |
| J4 | Announcement and batch chat both ways | Arrives within about 10 s. |
| J5 | Test user 2 asks a doubt with a photo; test user 1 answers | Shows on both sides. |
| J6 | Study plan, a note, a question set; student ticks and answers | Answers marked by the server; no answers shown before answering. |
| J7 | Weekly report | "Hidden" (fewer than 5 students). No rankings anywhere. |
| J8 | Test user 2 leaves | Their doubts stay as "A former student". |
| J9 | Admin → Coaching centres → pause TEST Academy | Members see "paused for now". Leave it paused. |

---

## Part K. Rules sweep (15 minutes, while doing the above)

Tick each once you've seen it hold everywhere:
- [ ] No "AI" label in the website, web app or Android app.
- [ ] Nothing claims a person did what the system did ("checked by a human editor" appears nowhere).
- [ ] Sound is off until pressed; nothing autoplays.
- [ ] Reduced motion is respected.
- [ ] No timers counting down by default, no streaks, no public scores or rankings.
- [ ] Every piece ends (no endless feed).
- [ ] Tragic stories: no sound, motion, emoji, joke or share.
- [ ] Maps are schematic with no national borders.
- [ ] Chotu, Jeetu and pod friends quiet 23:30–07:00 IST (try once after 23:30).
- [ ] Hindi everywhere English is.
- [ ] No helpline numbers anywhere; 112 for emergencies.

---

## Part L. Clean up (5 minutes)

- Admin → Payments: price is ₹3,999.
- Admin → Coaching centres: TEST Academy paused.
- Admin → Website leads: mark the "TEST – ignore" lead.
- Admin → Safety queue and Reports: test items closed as "test".
- Keep the two test users for next time (or Me → Privacy → Delete my data on each).
- Admin → Team: delete the Demo key if you don't need it.

Send Claude your list of Fails.
