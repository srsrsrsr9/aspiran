# Fact-check part 2 (first pass, 2026-10-11)

Checker: Claude (first pass, needs editor sign-off). Full findings: `part2.json`. No source files were edited.

## Summary

| Scope | Items | Status counts |
|---|---|---|
| A. Packs (n-z folders, excl. quotes/templates/.te.json) | 46 files | ok 32 · fix 8 · check 6 |
| B. Quote bank (`quotes/quotes.json`) | 16 entries | looks-right 6 · fix 6 · unconfirmed 4 · misattributed 0 |
| C. My Path numbers (brief §1.1, §1.2; playbook A10) | 19 claims | confirmed 10 · conflict 7 · unconfirmed 2 |

Files marked **fix**: rank-it-sample, darwin-down-house, should-i-guess-sample, literacy-1951-2011, lamp-off, narrated-classic-sample, story-spine-sample, strategy-corner-sample.
Files marked **check**: basavanna-anubhava-mantapa, narayana-guru-aruvippuram, savitribai-phule-school, patanjali-practice, thinker-lens-sample (duplicate of tirukkural-391, same id), who-am-i-sample.

## Error-level findings in plain English

1. **rank-it/rank-it-sample.json, takeaway.** It says Madhya Pradesh and Maharashtra are "about 4,500 sq km apart". By the file's own figures (308,252 and 307,713) the gap is 539 sq km. Change it to "about 540 square kilometres" in EN and HI.
2. **routine-card/darwin-down-house.json, 9.30 block.** It says Darwin "had a family book read aloud". Francis Darwin says he lay on the sofa while *family letters* were read aloud, and then part of a novel. Fix EN and HI.

## My Path conflicts to resolve before launch

- **Applicants.** CSE 2026 had "over 8 lakh" applicants (about 8.19 lakh), not about 10 lakh. The 5.49 lakh who sat is confirmed (AIR, provisional).
- **Vacancies.** The 4 Feb 2026 notification was reported as **933** (33 PwBD). **1,016** appears in the 15 June Prelims-result coverage, probably a revised figure. 933 is not a stray site's error. Check UPSC's result press note.
- **Year-on-year comparison.** For 2025, 979 was notified and **1,087** was the count reported at the final result (958 recommended). "Fell from 1,087 to 1,016" mixes stages. Notified to notified is 979 to 933.
- **Derived numbers.** 5.49 lakh minus 13,343 is about 5.36 lakh (the brief says 5.3). "1 in 540 finally selected" divides by vacancies, not selections.
- **A10.** "About 24 per 1,000 reached Mains" is confirmed (24.3). "About 2 were finally selected" is premature, because the CSE 2026 final result is not out. Reword it as "about 2 posts per 1,000".
- **Age table.** It omits EWS (6 attempts, 32). PwBD should read 9 attempts (unlimited for SC/ST) and age 42 for General/EWS PwBD. The OBC/SC/ST PwBD ceilings (45/47 vs 42) disagree across secondary sources, so check the notification.

## Risk highlights (not errors)

- lamp-off: the "Breathe in for four, out for six" pace and "Sleep is revision too" are health/effect claims in calm content.
- literacy-1951-2011: the 2011 figures are the provisional ones (74.04/82.14/65.46). The finals are 72.98/80.88/64.63.
- Inline quotes not in the bank: Narayana Guru's "one caste, one religion, one God" and "Ezhava Shiva", and Ambedkar's "heart and soul" (who-am-i).
- Unverified past-question frequency claims: the Basavanna and Narayana Guru takeaways.
- Savitribai: the Fatima Sheikh line should be attributed ("widely credited").
- Patanjali card: it mixes up vairagya with the Gita's "letting go of results".

## Quote-bank fixes

- kahneman-tfs-intro: the line is in Chapter 1 (pp. 23-24), not the Introduction.
- sugarman: the exact axiom is "The **sole** purpose ... the second sentence **of the copy**."
- suntzu 4-15: add the verse number (15). The sentence begins "Thus it is that in war...".
- gita-2-47: Arnold 1885 does not say this. Use Telang (SBE 8, 1882), "Your business is with action alone; not by any means with fruit.", or label it as our rendering.
- tagore: the first edition was India Society 1912 (Macmillan 1913). The Bengali original is from *Naivedya* (1901).
- vivekananda: cite CW vol. 3, "The Vedanta", Lahore, 12 Nov 1897. The English is his gloss on Katha 1.3.14.
- Unconfirmed: kahneman-tfs-38 ("when" vs "while"), fogg (probably the exact "Fogg Maxim #1"), kabir (not traced in a critical edition), basavanna (a Sharana maxim, attributed).
