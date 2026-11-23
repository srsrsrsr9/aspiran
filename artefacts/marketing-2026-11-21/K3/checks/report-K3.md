# Report K3: Website words

Written 20 to 21 Nov 2026. Status: draft, for the owner's check before it goes live.

## Checks run before zipping

A code check ran over every file in this batch: every JSON parses; every text field has `en` and `hi`; ids are unique; every `answerIndex` points at an option; every source is an object with a URL and an opened date; on-screen lines are 42 characters or fewer and no Hindi line ends on a postposition; none of the words or claims the brief bans (section 0 rules 5 and 9, Track K "Never" list). Result: passed. The only hits were lines that say the app has no ranks, streaks or leaderboards, which were kept on purpose.

## What was made, and judgement calls

## What I made
- `web.json` (batch K3, channel web): 5 hero options (pain, headline, subhead, CTA "Try the free demo"), 3 "how it works" steps, 10 FAQs, the Plus page. Every text field has en and hi; Hindi written fresh for a Hindi-medium reader, not translated line by line.
- `preview.md`: every piece in en then hi, with character counts for headline (≤ 60) and subhead (≤ 140).

## Judgement calls
- Refund/cancel FAQ not written: the policy is unknown, so a general "how to cancel" line was not safe. Replaced with "Why does Aspiran keep asking me things I already studied?" (spaced recall). Policy question is in the file-level `factsToCheck`.
- Offline/phone use left out entirely: not confirmed.
- Mains marking described only as "marked in the app" with rewrite; no criteria, no person, no named checker.
- Plus page lists every feature from the brief's feature list under "What Plus includes" and says only that "the free demo lets you try the app first". The free/paid split is in `factsToCheck`.
- No price reductions mentioned anywhere (the brief says there are none); price lines say "the same for everyone".
- Feature names in Hindi are written in Devanagari (डेली चाय, छोटू, पॉड, फ़ोकस ब्लॉक); brand names Aspiran and Plus stay in Latin script.
- Hero 5 uses "₹2 lakh" for coaching cost, taken from the owner's brief as a felt pain, not from an opened source; flagged in `factsToCheck`.

## Not verified (all in factsToCheck, none stated as fact beyond the brief)
- Exact demo contents; free vs Plus split.
- That the app's recall scheduler widens gaps after correct answers.
- That changeable facts show a "last read" date to users (FAQ 7).
- That the app has no leaderboards, public scores or streaks (FAQ 10, Plus page).
- Wording "pod friends are not real people" (FAQ 8).
- Refund/cancel policy; offline use.

No sources were needed: the copy states no law, number, office-holder or scheme beyond product facts and the ₹3,999 price.

## Facts to check (10)

- Refund and cancellation policy for Plus (web.json): Policy not known; no FAQ written on it (replaced by the spaced-recall FAQ). Add an FAQ once the owner confirms the policy.
- Whether the app works offline (web.json): Not confirmed; offline use left out of all copy.
- Coaching can cost ₹2 lakh (web.json): Figure comes from the owner's brief as a felt pain, not from a source we opened; confirm the owner is happy to show it on the home page.
- Recall items return after a gap that grows with each correct answer (web.json): This is how spaced recall works in general; confirm the app's scheduler behaves this way before publishing.
- Exact contents of the free demo, and which features are free and which need Plus (web.json): Not stated in the brief; the FAQ stays generic until the owner confirms the split.
- How marking works in the app (criteria shown, typed or photo answers) (web.json): Brief says only 'marking and rewrite'; the FAQ avoids any detail beyond that.
- Changeable facts in the app carry a 'last read' date (web.json): Follows the sourcing rule (opened date on every source); confirm this date is visible to users before publishing.
- Pod friends are not real people and pods are made of real aspirants (web.json): Brief says pod friends are study helpers, not members; confirm wording 'not real people' and that pods hold real aspirants.
- No leaderboards, public scores or streaks in the app (web.json): Owner's rules ban them in content; confirm the product has none before stating it.
- Whether every listed feature is part of Plus, and which features the free demo includes (web.json): The brief lists the app's features but not the free/paid split; the page lists features under Plus only and says nothing about what is free.
