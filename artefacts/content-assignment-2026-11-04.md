# Content assignment 5, 4 Nov 2026: the next set of jobs for the other Claude account

For the owner. Part 4 came back and is checked by code: 200 practice files, 24 flashcard decks and the Hindi for GS
mocks 2 and 3. All 223 are in the project as **drafts**. One file is held back: the new `pol-sr-bommai-case` has the
same id as the approved Bommai card in the app, and importing it would wipe that approval. The message below asks for
a different case instead.

## Decide first (2 minutes)
These are my suggested answers to its questions. They are already in the message; change any line before you paste.

| Question | Suggested answer |
|---|---|
| Article letter Z as य (243ZD → 243यघ) | Yes, follow the Hindi text of the Constitution. |
| Latin brackets in mock 1 | Yes, bring mock 1 in line with mocks 2 and 3 (job B24c). |
| `factsToCheck` in practice files | Keep it as a top-level list. The app now accepts it and shows it to the editor. |
| Better answer always the longer one | Yes, fix it: the two answers in each pair within about 15% of each other's length. |
| Flashcard facts in the manifest | I moved them into each deck. From now on, put `factsToCheck` inside the deck, as in the X files. |
| Overlap with the app's decks | The reference zip now lists every title the app already has. |
| Tragic topics left out | Right. Keep doing that. |

## Upload with the message
- `artefacts/content-reference-part5.zip` (new, about 100 KB). Inside:
  - `practice-format-samples-2/`: one real file for each of the 18 practice formats in this job
  - `existing-titles.md`: every practice item, flashcard deck and optional topic the app already has, by id and title
  - `mocks/prelims-gs1-full-mock-1.json` for B24c
  - `videos/`: a sample spec (episode 22), and for episodes 18–21 the English and Hindi narration and the claims table
- `artefacts/practice-format-samples.zip`, the first sample zip, again for X-fix.

## Order
Paste the message once. It works through the batches, one zip per batch. Send me the zips as they come. Nothing needs
Sarvam credits this time.

---

## Message: paste into the content Project

```text
Claude Code here. Part 4 is checked by code and in the project as drafts: 223 files, all clean. Thank you.
One file is held back: pol-sr-bommai-case clashes with an approved card of the same id in the app.

Answers to your questions:
- Article letter Z: yes, write it as य (243ZD → 243यघ), as in the Hindi text of the Constitution.
- Latin brackets: yes, bring mock 1 in line with mocks 2 and 3 (job B24c below).
- factsToCheck in practice files: keep it as a top-level list just before "schema". The app accepts it and shows
  it to the editor. Flashcard decks: put factsToCheck inside the deck the same way from now on (I moved F1's in).
- Better answer: yes, make the weaker answer about as long as the stronger one (within about 15%), so length gives
  nothing away (job X-fix below).
- Overlap: existing-titles.md in content-reference-part5.zip lists everything the app already has. Don't repeat a
  topic that is already there in the same format.
- Tragic topics: you were right to leave them out. Keep doing that.

Next jobs. Use content-reference-part5.zip: practice-format-samples-2 has one real file for each new format. Copy its
shape exactly: the same keys in the same order, the same "schema" value, and the same mood and sfx. Also copy
tags.stage/papers and tone. Use review.status "draft" and fill in sources. One file per item:
practice/<format>/<subject-prefix>-<slug>.json, with prefixes pol, eco, geo, env, anc, med, mod, art, sci, ir, soc,
eth (or mains- where the sample uses it). en and hi side by side. Spread topics over the whole Prelims and GS syllabus.

Batches (one zip each, named as below):
X6: who-am-i (20) and bucket-sort (20).
X7: union-state-list (15), fact-or-opinion (15) and rank-it (15). Rank-it only where an official source gives the
    numbers; put every number in factsToCheck with its date.
X8: committee-match (15), scheme-snapshot (15) and index-card (20). Schemes: use the current official name and say
    when it was renamed. Put launch years and current names in factsToCheck. No budget figures.
X9: versus (20), before-after (15) and two-levels (15).
X10: mnemonic (15), acronym-unpack (15), word-bank (10) and directive-word (4: new directive words only, not the six
    in the sample).
X11: story-beats (15), ethics-dilemma (20; GS4, no real people named, no right answer given, as in the sample) and
    link-web (15).
X-fix: (a) the 20 better-answer files from X5: rewrite the weaker answer in each pair so the two are within about
    15% of each other's length. Keep it weaker for the same reason as before. Change nothing else, and keep the ids.
    (b) one new landmark-case file to replace pol-sr-bommai-case: a different Supreme Court case not in
    existing-titles.md, with the holding from the judgment or a reliable law report.
B24c: mocks/prelims-gs1-full-mock-1.json (in the zip). Add the Latin form in brackets the first time each article
    letter appears in Hindi, as in mocks 2 and 3. Change nothing else. List any changed terms in hiCheck.
B31: optionals. The next 5 topics for each of the 6 optionals in the B25 priority order, the same node format as
    B30. existing-titles.md lists the topics already made.
V4: episode specs for 18, 19, 20 and 21. Those videos were made before the spec format existed, so the app can't
    re-render them with the new Sarvam voice. Write one spec each (ep18.spec.json ... ep21.spec.json) in the format of
    videos/sample-ep22.spec.json. The spoken text must match videos/<nn>-<id>.voice.txt word for word, because the
    Sarvam recordings already exist. Split it into sentences and segments the way the sample does. Copy the claims
    from the .claims.md files and add scenes. Run validate_spec.py on each and include its output.
FC1: facts. For each item in section 2 of your part 4 questions file (X1–X5, F1), look it up in the primary source
    (Constitution, Gazette, Supreme Court judgment, RBI, ministry, PIB). If the file is wrong, fix it and add the
    source. Keep the item in factsToCheck either way, because an editor still checks it. Report each item in one line:
    confirmed, fixed or can't confirm.

Rules (as before):
- Original questions. Nothing copied from past papers or coaching material.
- Every fact checked against an official source; anything with a date or number goes in factsToCheck. Use the
  current fact where it changed in 2025 or 2026. Draft laws are never stated as in force.
- No exam predictions, ranks, scores, timers or streaks. Maps schematic, with no national borders.
- Tragic topics (disasters, violence, deaths) stay out of practice games, story beats and dilemmas.
- Hindi: digits on screen, words only in .voice.txt files. Article letters as in the Hindi Constitution, with the
  Latin form in brackets on first mention.
- Run your code checks before zipping: valid JSON; en and hi with the same counts; every answer index in range; no
  id that appears in existing-titles.md or twice across batches. Put the results in checks/self-check.json and a
  manifest.json listing every file, with each file's factsToCheck inside the file itself.
- List anything you need me or the owner to decide in QUESTIONS-FOR-OWNER-part5.md.
```

## What happens next
Send me each zip. I check it by code, fix formats and import it as **drafts**. You or an editor approve it in the
Desk. Nothing is shown as checked until an English and a Hindi editor approve it.
