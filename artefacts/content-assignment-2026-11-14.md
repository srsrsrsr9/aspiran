# Content assignment 9, 14 Nov 2026: what assignment 8 left open

**For the owner.** Assignment 8 is live (published 14 Nov). These are the gaps it left. Paste everything below the line
into the other AI with the same reference zip as before (`artefacts/content-reference-part8.zip`).

## Settled on 14 Nov (nothing for you to do)

1. **Supreme Court strength is 38.** Ordinance gazetted 16 May 2026; the Act got assent on 11 Aug 2026, in force from
   16 May. Every note now says 38, and the daily fact watch will catch the next change.
2. **UPSC papers.** Claude downloads them from upsc.gov.in directly, so you don't need to. Prelims 2022 GS1 is in (with
   UPSC's key); the others follow. For H3, Claude sends the other AI the past questions as text.

---

## Brief for the AI building this

Same rules, formats, checks and manifest as assignment 8. Hand back one zip per batch, `aspiran-H<n>.zip`.

### H1. Hindi for what has none (do first)

- 30 notes have no Hindi: all 8 Economy notes (`eco-syl-*` in `syllabus/economy.json`), 6 Environment, 8 Geography,
  8 Modern History. Add `hi` exactly as the other notes have it.
- The 12 CSAT notes' `worked` questions and `passages` have no Hindi. Add `hi` to each worked question
  (`{q, options, solution}`) and to each passage (`{text}`). Use the terms UPSC's own Hindi CSAT paper uses.
- Ten Polity notes had English corrected on 14 Nov (list in `checks/G2-corrections-applied.md`). Make the Hindi say
  the same.

### H2. Open the sources for the unverified facts

- 182 facts across the notes are `"status": "unverified"`. Open the primary source for each and either fill
  `source`, `url`, `opened` and set `"status": "verified"`, or correct the fact.
- Start with the nine rescue-pass notes, which have no opened source at all: electoral reforms; IMF, World Bank and WTO;
  other countries' policies; budget process; deficits and FRBM; fiscal federalism; industrial policy; infrastructure
  sectors; infrastructure investment models. Time-sensitive first: 2025 US tariffs, CBAM dates, labour codes in force
  from 21 Nov 2025, MSME limits from April 2025, the 129th Amendment Bill.

### H3. Past-question steps for the seven Polity paths

Add the `pyq` step to `gs2-1`, `gs2-3` to `gs2-7` and `pre-4`, word for word from the past questions Aspiran sends
as text (from UPSC's own papers), with year, paper and number.

### H4. G4 book map and G8 mocks

As written in assignment 8. Not started.
