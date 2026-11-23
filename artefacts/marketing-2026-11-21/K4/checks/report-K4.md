# Report K4: Email series after the demo

Written 20 to 21 Nov 2026. Status: draft, for the owner's check before it goes live.

## Checks run before zipping

A code check ran over every file in this batch: every JSON parses; every text field has `en` and `hi`; ids are unique; every `answerIndex` points at an option; every source is an object with a URL and an opened date; on-screen lines are 42 characters or fewer and no Hindi line ends on a postposition; none of the words or claims the brief bans (section 0 rules 5 and 9, Track K "Never" list). Result: passed. The only hits were lines that say the app has no ranks, streaks or leaderboards, which were kept on purpose.

## Changed at final check

- Day 3 fallback question on Indian Standard Time: replaced a Wikipedia source with NCERT Contemporary India I, ch. 1 (opened 20 Nov 2026): 82°30'E through Mirzapur.

## What was made, and judgement calls

## What I made
- `email.json` (channel email): 5 emails (day 0, 3, 7, 14, 30). Each has subject (≤ 50), preheader (≤ 90), greeting with `{{first_name}}` plus `greetingFallback`, body (84 to 128 words), one link to aspiran.in with utm_source=email, utm_medium=email, utm_campaign=k4-demo, utm_content=d00/d03/d07/d14/d30, cta, signoff, and a footer with "Stop these emails: {{unsubscribe_url}}". Only those two merge tokens are used.
- Day 3: `body` is the text before the questions, `questions` is the merge block `{"source": "demo-session", "count": 5}` (with a `fallbackIntro` line), `bodyAfterQuestions` is the text after (its words count toward the 80 to 150 range). Answers go at the end of the email. `fallbackQuestions` holds 5 quiz items from shorts.json with ids, options and answerIndex unchanged: 097 rivers q1, 063 panchayats q2, 078 budget q1, 099 IST q1, 065 CAG q1. Sources turned into objects from the shorts' own source strings (opened dates as given there).
- Day 7 explains spaced recall plainly. Day 14 is Mains answer writing with marking and rewrite. Day 30 names Plus at ₹3,999 a year once, says the demo stays open, no pressure, no countdown.
- `preview.md`: each email in en and hi as it will look, with counts.

## Could not verify (in factsToCheck)
- Whether demo answers are stored per person (decides merge block vs fallback).
- That the demo includes questions, a note and a marked answer (day 0 describes this).
- That the free demo stays open after 30 days and that Plus includes every feature listed on day 30.

## Judgement calls
- Fallback questions picked for clean one-line "why" text (no "the video says") and settled facts only.
- The 078 source URL is the article page named in the short's source string (constitutionofindia.net/articles/article-112-annual-financial-statement/).
- Day 30 says "fifth and final email in this short series" so readers know the series ends; it is not framed as urgency.

## Facts to check (3)

- The demo includes a few questions, one note and a marked answer. (email.json): The day 0 email describes what they did in the demo; adjust if the demo's contents differ.
- Whether demo answers are stored per person so the merge block can pull 5 of them. (email.json): If not, the fallbackQuestions set and fallbackIntro line are used instead.
- That the free demo stays available after a month, and that Plus includes every feature listed. (email.json): The day 30 email says both; confirm with the product team.
