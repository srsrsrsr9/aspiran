# Assignment 8: checks done on import (14 Nov 2026)

## CSAT blind solve (the check G3 left open)

All 180 worked questions in `syllabus/csat.json` (12 notes, 15 each) were answered without seeing the key, then compared.
**180 of 180 agree with the key.** Each CSAT note now also packs as a 15-question practice set
(`mock:<note id>-practice`, labelled "written by us, not from a UPSC paper").

## G2 second-read corrections, copied back into the source notes

The G2 second read fixed these in the topic-path reads. The same wording is now in the source notes (English only; each
changed note's editor flag asks the Hindi editor to bring the Hindi in line).

| Note | Old | New |
|---|---|---|
| pol-syl-fundamental-rights | citizens only: Articles 15, 16, 19, 29 and 30 | Articles 15, 16, 19 and 29 (Article 30 covers all minorities) |
| pol-syl-fundamental-rights | Article 21A, added by the 86th Amendment in 2002 | ... of 2002 and in force from 1 April 2010 |
| pol-syl-amendment-basic-structure | legislative council under Article 169 | ... which also needs a resolution of that state's Assembly passed by a special majority |
| pol-syl-parliament-structure | civil arrest, 40 days before and after a session (shown as Article 105) | a rule from the Code of Civil Procedure (section 135A), not Article 105 |
| pol-syl-parliament-lawmaking | no joint sitting on a Money Bill or an amendment bill | Money Bill: Article 108 excludes it; amendment bill: Article 368 needs each House to pass it separately |
| pol-syl-local-government | Gram Sabha (Article 243A) | Article 243 (the definition) |
| pol-syl-local-government | Members at all levels are directly elected | Seats at all levels are filled by direct election |
| pol-syl-president-vp | a Governor cannot pardon a death sentence | on the standard reading ..., though Article 72(3) keeps the Governor's power to suspend, remit or commute |
| pol-syl-state-executive | The Constituent Assembly chose appointment ... to avoid a rival centre of power | A reason commonly given for appointment ... |
| pol-syl-supreme-court | in every case the Chief Justice must be consulted | for a judge other than the Chief Justice, the Chief Justice of India must always be consulted |
| pol-syl-constitutional-bodies | Joint State PSC: a statutory, not constitutional, body | set up by statute, though Articles 316 to 319 govern its members |
| pol-syl-constitutional-bodies | Attorney General may speak in either House and its committees | ... and in any committee of which the Attorney General is named a member |
| pol-gov-civil-services | Public Service Commissions under Article 315 recruit on merit | Public Service Commissions (Articles 315 and 320) conduct examinations for recruitment |

## Import changes made for this batch

- Facts to check may now be objects (`claim`, `source`, `url`, `opened`, `status`). The desk shows them as sentences,
  unverified ones first.
- Test import on a fresh local server: 134 reads, 18 mocks (12 new CSAT practice sets), 8 topic paths, all drafts.

## Still open (in `artefacts/content-assignment-2026-11-14.md`)

Supreme Court strength 34 or 38; past-question steps (need UPSC PDFs); Hindi for 30 notes and for the CSAT practice
questions; 182 unverified facts; nine notes with no opened sources; G4 book map; G8 mocks.
