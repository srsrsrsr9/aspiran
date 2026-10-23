# UI/UX guide (from the UI/UX research thread)

Treat the 4 brief changes as defaults unless the user overrules them. Hold the Chotu rename until the user decides; keep "Chotu · AI" for now.

## Four changes to the brief
1. No countdown and no streak at the top of Today. Replace it with a private weekly rhythm (below). The countdown becomes an opt-in in My Path, shown as a date ("Prelims 2027: 23 May"), never red.
2. In Close the Day, "What slipped?" becomes "What got in the way?" (Hindi: किस चीज़ ने रोका?).
3. The pod-lead check-in after low moods is opt-in. The user picks who is told (pod lead, buddy or nobody), and that person never sees the mood itself.
4. "Chotu" may read as classist (the word is used for child tea-stall workers), so it should be tested with about 10 users.

## 1. Today screen
- Order from top: greeting, Today's 3, pod strip, live room (only while one is live), Close the Day (collapsed). No more than 4 blocks on a 360x640 dp screen. One filled button per screen.
- Exactly 3 tasks: (1) Today's Chai, 5 cards, about 7 min; (2) 5 Prelims questions, about 5 min; (3) 1 Mains answer of 150 words, about 20 min. The user can swap a task but never add a fourth. Part-time mode swaps task 3 for a 5-minute outline.
- Progress reads "1 of 3 done" with a segmented accent-colour bar. Never red, never a percentage.
- When all 3 are done: "You're done for today. Really. The rest of the evening is yours." No "do more" prompts after that.
- At night with tasks left: "2 of 3 is a real day." plus a one-tap "Move to tomorrow?". Never the word "missed".
- After 20:00, Close the Day moves to the top. After 23:00 add "Sleep is part of the prep too."
- Weekly rhythm: 7 neutral dots against a weekly target the user picks (3-7, default 5), resetting Monday. Any one task, Chai Card, or Close the Day (even mood-only) counts as showing up. 2 automatic rest days a week. Pause mode up to 14 days, no reason asked. It's private and lives in Close the Day and My Path, not in the header.
- The pod strip shows presence, not performance: avatars and one line, e.g. "Aman shared an answer · 9:12". It never shows who finished. "Send a chai ping" goes to the whole pod, at most once a day, never naming anyone.
- No upsells on Today.

## 2. Chai Cards
- 5 a day (4-6 on heavy news days), about 6-8 min total, ending on "That's today's Chai ☕" with no "load more". The archive lives in Practice.
- Each card has 6 zones in a fixed order:
  1. Lens chips, at most 4: GS paper, topic, Prelims/Mains/Both, static link
  2. Headline of 12 words or fewer, starting with a verb, no "!"
  3. Summary of 60-90 words, sentences of 20 words or fewer, glossary terms dot-underlined
  4. "Why this matters for UPSC": 2-3 bullets, at least one naming a static concept
  5. Exam Corner, collapsed: 1 MCQ or Mains prompt, 3 key facts, a previous-year-question link
  6. Trust footer, always visible: sources, "Summary drafted by AI from these sources · Checked by <editor>, <date> ✓", and "Spot a mistake? Tell us"
- One card per screen, with a "Next card →" button and tappable progress dots. Swipe is only a shortcut (WCAG 2.5.1). No auto-advance. "See all 5" opens an overview.
- "Save for revision" on every card. Saved cards and wrong MCQs come back in task 2 at about day 3, 10 and 30.
- Facts come only from attached source text, and an editor approves every card, with separate English and Hindi editors. Previous-year links come only from a verified database; otherwise the card says "No direct PYQ".
- Tone tag on every card: LIGHT, NEUTRAL, SERIOUS or TRAGIC. Chotu adds one joke only on LIGHT cards, only if the joke carries the exam fact, and on at most 1 in 5 cards. TRAGIC cards drop all emoji and add "This one is heavy. It's okay to skip it."
- No photos by default, about 3 KB per card, and the day's pack under 40 KB compressed.

## 3. Close the Day
- One full screen, not a sheet. Four optional inputs, under 90 seconds:
  - What got done? (chips pre-filled from today's tasks)
  - What got in the way? (Tired, Family, Work, Phone, Felt low, Nothing - good day)
  - One small thing for tomorrow, with an optional morning, afternoon or night chip
  - Mood, as words not emoji: Heavy, Low, Okay, Good, Light / भारी, उदास, ठीक, अच्छा, हल्का
- "Keep private" is the default, and mood is never shared. Entries are encrypted on the phone with the line "Only you can see this." Delete or export takes 2 taps or fewer.
- It ends with "Day closed. You showed up. That counts." and nothing below it.
- "Heavy" mood shows an inline line, never a modal: "Rough day. Want to talk to someone?" with pod/buddy and Tele-MANAS 14416.
- Next morning, Today shows the plan back: "You planned: 20 min reading, morning."

## 4. Safety and Chotu
- "Need to talk?" / "किसी से बात करनी है?" is reachable in 2 taps from anywhere (overflow menu, My Path). It offers tap-to-dial for Tele-MANAS 14416 and 1-800-891-4416, plus buddy, pod lead and 112. Never a red SOS button on Today.
- On-device matching for distress phrases in Hindi, English and Hinglish runs on posts and Close the Day text. A match shows the writer a private support sheet and alerts a human moderator. The bot never replies.
- Result-day mode lasts 72 hours: no upsells, no wins posts, Chotu off, and Today shrinks to one card ("Whatever happened, you're more than a roll number.").
- Chotu is always labelled "Chotu · AI", with no human photo, no claimed feelings and no guilt lines. It never responds to distress, never predicts rank or odds, and never gives advice on quitting. Chat defaults to Quiet (speaks only when asked), with about 15 turns per session.
- Check against India's 2023 dark-pattern guidelines. Declines say "Not now", privacy choices get equal visual weight, and nothing about streaks is sold. The data-protection (DPDP) consent screen comes before any question about attempt, age or mood. 18+ only.
- Ask for notification permission only after the first Close the Day, with an explainer first. One reminder a day at a time the user picks, plus pod messages. Quiet hours 23:30-07:00.

## 5. Visual system (Compose)
- Fixed brand colours, dynamic colour off.
- Light theme: primary #8D4F01, primaryContainer #FFDCC0, tertiary #14696B, surface #FFF8F3, onSurface #201B17.
- Dark theme: primary #FFB876, surface #18120D, onSurface #E9E1DB.
- Never use #B8732A for buttons (it fails contrast with white). Fallback palette: indigo #4755B7 with marigold.
- Red only for real errors. Every status pairs an icon with a word: ✓ Done, ○ To do, – "Skipped, that's okay".
- Type: Martel 400/700, bundled, for reading text; the system sans for UI.
  - Reading text 17 sp, line height 27 (English) and 29 (Hindi). Titles 20 sp. Nothing under 12 sp.
  - Devanagari line height at least 1.6x, with LineHeightStyle.Trim.None.
  - Test at 200% font size in Hindi.
- Spacing on a 4 dp grid with a 16 dp gutter. Flat cards, 12 dp corners, no shadows.
- Touch targets 48 dp minimum, 56 dp for the main actions.
- Motion: MotionScheme.standard(), 150-300 ms, no confetti, shimmer or looping animation. Respect the system "remove animations" setting.
- 5 tabs, labels always shown, a dot badge on Pod only.

## 6. Bilingual
- App language and reading language are separate settings, using AppCompat per-app locales, so the Activity must be an AppCompatActivity.
- One language per card, with a "हिंदी में पढ़ें / Read in English" chip. Never mix the two in one summary.
- Hindi is written natively in simple Hindustani, with the official term once in brackets. Hinglish only in Chotu's lines and pod chat.
- Numbers use lakh/crore grouping, with a no-break space before units ("₹ 499", "20 मिनट").

## 7. Performance
- Download 12 MB or less. Cold start 1.5 s or less, using Baseline Profiles.
- Today opens from the local Room cache and never waits on the network.
- Prefetch overnight on Wi-Fi while charging. If that hasn't run by 06:30, fetch a text-only pack on mobile data.
- About 150 KB a day of data, 40 KB in data-saver mode.
- Drafts autosave every 5 s.

## 8. Measure
- Main metric: days closed per user per week (target 3 or more). Also track Chai stacks finished (target 60% or more).
- Don't optimise for time in app or streaks.
- Testing: 3 rounds of 5 users, each round including Hindi-medium users and phones under ₹12k.

## Before shipping
Test-dial the helplines, have a lawyer check data-law dates, have a Hindi-medium aspirant review all Hindi copy, and verify the facts on the sample card. The research thread has the full reports and Compose Theme, Color and Type code.
