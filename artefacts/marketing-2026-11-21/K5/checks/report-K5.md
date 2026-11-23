# Report K5: Google Play store listing

Written 20 to 21 Nov 2026. Status: draft, for the owner's check before it goes live.

## Checks run before zipping

A code check ran over every file in this batch: every JSON parses; every text field has `en` and `hi`; ids are unique; every `answerIndex` points at an option; every source is an object with a URL and an opened date; on-screen lines are 42 characters or fewer and no Hindi line ends on a postposition; none of the words or claims the brief bans (section 0 rules 5 and 9, Track K "Never" list). Result: passed. The only hits were lines that say the app has no ranks, streaks or leaderboards, which were kept on purpose.

## Changed at final check

- Removed a duplicate copy of the 8 screenshot captions from the flat items list, so every id is unique.

## What was made, and judgement calls

## What I made
- `play.json` (batch K5, channel google-play): short description, full description, 8 screenshot captions (each names the screen it should show, from the feature list), and a "what's new" template. en and hi.
- `preview.md`: each piece as it will look, with Unicode code-point counts.

## Counts (limit)
- Short description: en 79, hi 70 (80).
- Full description: en 1,521, hi 1,592 (4,000). Plain text, CAPS section heads, "•" bullets, no Markdown, no emoji.
- Captions: all 23 to 29 (30).
- What's new: en 146, hi 138 before slots are filled (500). Slots are {{change_1}}, {{change_2}}, {{change_3}} only; closing line is fixed and calm.

## Judgement calls
- No superlative or ranking claims (which Play policy bans), no user counts, results or ranks. Only price stated: Plus ₹3,999 a year; demo free.
- Offline use, device requirements and refund policy left out (unknown); listed in `factsToCheck`.
- Free/paid feature split not stated; listed in `factsToCheck`.
- "No ranks, leaderboards or public scores" is stated as product behaviour; flagged for confirmation.
- Hindi section heads use plain words, not Sanskritised; "spaced recall" kept in brackets once after अंतराल पर दोहराव.

## Facts to check (4)

- Offline use and device requirements (play.json): Not confirmed; left out of the listing.
- Refund and cancellation policy for Plus (play.json): Not known; the listing says nothing about it.
- Which listed features are free and which need Plus (play.json): Not stated in the brief; the listing does not split them.
- No leaderboards or public scores in the app (play.json): Confirm against the product before the listing goes live.
