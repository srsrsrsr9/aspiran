# Content assignment 7, 5 Nov 2026: the next round, phone-friendly

For the owner, while travelling. Assignment 6 (`content-assignment-2026-11-04b.md`) is being made now; nothing here
repeats it. Assignment 7 fills the three gaps assignment 6 leaves:

- **The interview:** 300 questions, but only 40 cover home states, which is about one per state.
- **Mains answer skeletons:** only Mains 2025 GS1–GS3 have them (60).
- **Telugu:** the pilot language has no content yet.

**Nothing to upload from the laptop.** Paste the message below into the content Project. For K3, also upload the four
Mains 2024 PDFs (step 1), which you can download on your phone.

## What you do first (5 minutes, on your phone)
1. Download the **Mains 2024** question papers from upsc.gov.in → Examination → Previous Question Papers: General Studies
   Paper I, II, III and IV. Upload the four PDFs to the content Project with the message.
2. If a PDF is a poor scan, leave it out and say which. K3 then skips that paper.

## When a zip comes back
Open the Desk on your phone → **Library** → **Send a content zip to Claude** → pick the zip → **Send to Claude**. Then
tell Claude Code "new zip in the Desk inbox" (see `travel-content-guide-2026-11-05.md`). Claude checks it, imports it as
drafts and tells you what's waiting for approval.

**Telugu files (TE1) come back as `.te.json` files.** You can add those yourself from any phone:
Desk → Library → **Add translation**. Pick all the files at once. A Telugu editor approves them before they show.

---

## Message: paste into the content Project

```text
Claude Code here. Assignment 6 is still with you; carry on with it first. When it's done, here is assignment 7.
Same rules as before (repeated at the end). One zip per batch, named as below.

I2: Interview: home states and union territories. The bank has only 40 "hometown-state" questions.
    10 questions for each of the 28 states and 8 union territories (360 in all), in the shape of
    interview/bank-01.json: id, group "hometown-state", persona, depth (1-3), idkOk, q (en and hi).
    Mix the state's economy, geography, history, culture, a current development, and one "what would you change
    as a district officer here" question. Nothing that ranks states or invites a political opinion on a party.
    Return as bank-04.json (states A-K), bank-05.json (states M-W) and bank-06.json (union territories), 120 each.

I3: Interview: education and hobbies.
    - 20 questions for each common graduation stream: engineering (split into computer science, civil, mechanical,
      electrical), medicine, commerce, law, economics, history, political science, sociology, agriculture,
      science (physics/chemistry/biology), group "education". That's 15 streams, 300 questions.
    - 10 questions for each of the 20 commonest DAF hobbies (reading, cricket, chess, music, cooking, trekking,
      photography, yoga, gardening, blogging, painting, football, badminton, dance, travel, poetry, volunteering,
      quizzing, coding, films), group "hobbies", 200 questions.
    Return as bank-07.json (education) and bank-08.json (hobbies).

K3: Mains 2024 answer skeletons, from the PDFs I upload (GS1, GS2, GS3, GS4). Exactly the shape of
    skeletons/csm-2025-gs1-q01.json. Ids csm-2024-gs1-q01 ... q20, the same for gs2 and gs3, and for GS4 the
    section A questions only (gs4 cases are a separate kind). The question text only from UPSC's paper, en and hi
    as printed. The skeleton is yours: demand of the question, intro options, body points, way forward, with
    every fact in factsToCheck. Skip any paper whose PDF is unreadable and say which.

K4: Mains 2025 GS4 section A skeletons (the questions are in the Mains 2025 transcripts from part 6). Same shape,
    ids csm-2025-gs4-q01 onward.

W1: Thin practice formats. 11 directive-word items (there are 4) and 5 word-bank items (there are 10), in the
    shapes of the samples, on topics not yet covered (check existing-titles.md from part 6).

TE1: Telugu, the pilot language. Translation files for the 12 restart days (restart/) and the 24 flashcard decks
    (practice/flashcards/) you made earlier. One file per item, named <item id>.te.json, in this shape:

    {
      "schema": "upsc-pods/translation@1",
      "lang": "te",
      "pack": { "id": "<item id>", "schema": "<the item's own schema>" },
      "strings": {
        "$.title.en": { "en": "<the English exactly>", "text": "<Telugu>" },
        "$.cards[0].en.front": { "en": "...", "text": "..." }
      }
    }

    Every key is the JSON path of one English string in the item; "en" repeats it exactly so a change in the
    English shows up; "text" is the Telugu. Cover every English string. Constitutional terms in Telugu with the
    English in brackets on first mention, as in the Hindi. Digits on screen. Plain, warm Telugu as spoken by
    an aspirant in Hyderabad or Vijayawada, not textbook Telugu. Return all 36 files in one zip.

Rules (as before):
- Original content. Nothing copied from coaching material. Past papers only from UPSC's own PDFs.
- Every fact checked against an official source; anything with a date or number goes in factsToCheck. Use the
  current fact where it changed in 2025 or 2026. Draft laws are never stated as in force.
- No exam predictions, ranks, scores, timers or streaks. Maps schematic, with no national borders.
- Tragic topics stay out of practice games, story beats and dilemmas, and out of interview "gotcha" questions.
- Hindi: digits on screen, words only in voice files. Article letters as in the Hindi Constitution.
- Run your code checks before zipping: valid JSON; en and hi with the same counts; every answer index in range; no
  id that is in existing-titles.md or used twice; for TE1, every "en" matches the English item exactly. Put the
  results in checks/self-check.json and a manifest.json.
- List anything you need me or the owner to decide in QUESTIONS-FOR-OWNER-part7.md.
```

## What happens next
Each zip goes through the Desk inbox to Claude Code, which checks it by code and imports it as **drafts**. Nothing shows
as checked until an English and a Hindi editor approve it. Telugu also needs a Telugu editor. When I2 and I3 are in, the
interview bank goes from 300 to about 1,160 questions. K3 and K4 add about 75 skeletons.
