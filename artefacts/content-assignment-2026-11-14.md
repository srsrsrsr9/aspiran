# Content assignment 9, 14 Nov 2026: what assignment 8 left open

**For the owner.** Assignment 8 is checked and ready to import as drafts. These are the gaps it left. Items 1 and 2 are
yours; paste the rest (below the line) into the other AI with the same reference zip as before
(`artefacts/content-reference-part8.zip`).

## Yours

1. **Supreme Court strength: 34 or 38?** The new Polity paths say the Supreme Court (Number of Judges) Amendment Act,
   2026 raised it to 38. Only the Bill's passage (Aug 2026) is confirmed; the Gazette notification is not. The older
   note still says 34. Find the Gazette notice (egazette.gov.in) or tell me to keep 34 until it's confirmed.
2. **UPSC question papers as PDFs.** The other AI can't open upsc.gov.in, so there are no past questions in any of the
   seven new Polity paths, and G5 can't start. Download from upsc.gov.in → Examinations → Previous Question Papers:
   Prelims GS Paper I and CSAT 2011 to 2026, Mains GS1 to GS4 and Essay 2013 to 2024, with the answer keys. Put them in
   one folder and send it with the next batch.

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

### H3. Past-question steps for the seven Polity paths (when the PDFs arrive)

Add the `pyq` step to `gs2-1`, `gs2-3` to `gs2-7` and `pre-4`, word for word from the PDFs, with year, paper and number.

### H4. G4 book map and G8 mocks

As written in assignment 8. Not started.
