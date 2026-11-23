# Report K1: A month of posts (launch kit)

Written 20 to 21 Nov 2026. Status: draft, for the owner's check before it goes live.

## Checks run before zipping

A code check ran over every file in this batch: every JSON parses; every text field has `en` and `hi`; ids are unique; every `answerIndex` points at an option; every source is an object with a URL and an opened date; on-screen lines are 42 characters or fewer and no Hindi line ends on a postposition; none of the words or claims the brief bans (section 0 rules 5 and 9, Track K "Never" list). Result: passed. The only hits were lines that say the app has no ranks, streaks or leaderboards, which were kept on purpose.

## Changed at final check

- Day 4: the Purna Swaraj source was a Wikipedia page; replaced by NCERT Themes in Indian History III, Theme 13 (opened 21 Nov 2026), which states the Lahore session and 26 January 1930.
- Day 16: the biosphere-reserve zones rested on Wikipedia and a coaching site; replaced by UNESCO's Man and the Biosphere page (opened 20 Nov 2026), which says the transition area is where communities live and work.
- Day 18: removed the line on the Muslim League's 73 seats (only a Wikipedia source) from all three channels, en and hi together.

## Note

Days 1 to 15 and 16 to 30 were written in two halves and merged here. In the half notes below, days 16 and 18 are described before the fixes listed above.

## What was made, and judgement calls

## What was made
- telegram.json, whatsapp.json, instagram.json: 15 items each (days 16 to 30), batch "K1", wrapper as in BRIEF.md plus `"part": "days 16-30"`.
- Mix kept to the fixed plan: recall 17, 20, 23, 25, 28, 30; did-you-know 18, 22, 26, 29; method 16 (past papers first), 21 (plan from the syllabus), 27 (1-3-7-21 recall gaps, given as a suggestion); product 19 (pods and pod friends), 24 (past papers with UPSC's keys, then flashcards).
- Reels: illustrated shorts only, all from 051 to 100, none repeated: 100, 059, 057, 089, 063, 078, 072, 065, 096, 060, 070, 095, 097, 058, 086. No syllabus videos used. All NEUTRAL.
- Every try-this is an existing quiz item from the paired short (keys unchanged; `tryThis.sourceItem` gives the item id). en and hi quiz text copied from shorts.json.
- Price not mentioned on any day (left for days 1 to 15 if needed). Day 30 closes the month calmly, with no teaser.

## Checks run (python3 -I)
- All three JSON files parse; 45 unique ids; every answerIndex points at one of 4 options and matches the letter in the answer line.
- Every post 600 characters or fewer in both languages (Telegram max 528; WhatsApp and Instagram bodies were shortened on 8 days to fit).
- Hooks: at most 2 lines, each 42 characters or fewer; no Hindi line ends on की/का/के/में/से/को/पर/ने; no English line ends on an article.
- Telegram poll: questions under 300 and options under 100 characters.
- Banned-word scan over every field, using the full list in BRIEF.md and prompt-part1-K.md: clean. (One Hindi pattern flagged only a false hit inside a longer word.)

## Not verified / judgement calls
- Day 16: the transition-zone fact rests on two secondary sources (Wikipedia, Drishti IAS) carried over from short 100. Listed in factsToCheck; a UNESCO MAB or MoEFCC page should replace them.
- Days 17 and 25: short 059 and 060 cite constitutionofindia.net without an article URL, so the source url is the site's home page.
- Day 18: the Muslim League's 73 seats comes from Wikipedia (secondary), as in short 057.
- No new web sources were opened; every fact comes from the paired short's sources (opened dates are those read dates).
- Day 19 (pods): kept to what the feature list says (small study group; pod friends are study helpers, not members). No claim about what pods or pod friends do beyond that.
- Day 24: says "revise what you missed with flashcards a few days later". This does not claim the app moves missed questions into flashcards automatically; if it does, the line can be made more concrete.
- Hindi uses "यूपीएससी" in Devanagari and the UPSC-style option letters (a) to (d) in both languages.
- Diagrams in Mains answers were not used as a method topic (only three method days in this half).

## Facts to check (0)

None.
