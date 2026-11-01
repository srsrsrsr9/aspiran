# Aspiran content: what's done and what's left (2 November 2026)

*Project file. Claude Code updates this file. The owner re-uploads it when it changes.*

## Done (checked by Claude Code with code; don't redo)
| Batch | What's done | Files to look at |
|---|---|---|
| B01 | 50 pause lines, Chotu voice sheet | `done-B01-pause-lines.json` (B13 picks its `pauseLineKey` from here), `done-B01-chotu-voice.json` |
| B09 | Society (79 terms: **add 1**), International relations (80) | — |
| B10 Sociology | nodes `soc-p1-03`, `soc-p1-04`, `soc-p1-05` | `done-B10-soc-p1-03.json` … `done-B10-soc-p1-05.json` |
| B10 Geography | nodes `geo-p1-03`, `geo-p1-04` | `done-B10-geo-p1-03.json`, `done-B10-geo-p1-04.json` |
| B11 | 5 personas, 300 interview questions | — |
| B12 | 24 essay topics | `example-essay-b12-essay-08.json` |

## Left to make
Each line is one chat. **Lines in the same group don't depend on each other, so run them at the same time in separate chats.**

**Group 1 (start all at once):**
| Say this | Makes |
|---|---|
| `Make batch B02` | 20 GS1 skeletons |
| `Make batch B03` | 20 GS2 skeletons |
| `Make batch B04` | 20 GS3 skeletons |
| `Make batch B05` | 24 GS4 cases |
| `Make batch B06` | 40 thinkers, 60 terms |
| `Make batch B07` | 8 CSAT weeks |
| `Make batch B08` | 20 walk scripts |
| `Make batch B13` | 12 welcome-back scripts |
| `Make batch B09-rest` | the 6 missing term lists: polity, economy, geography, environment, history, science-technology (80 each); plus 1 more term for society (deliver the whole `terms/society.json` again) |

**Group 2 (syllabus notes, start all at once):** `Make batch B14` … `Make batch B22`, one chat each (9 chats).

**Group 3 (optionals):**
| Say this | Makes |
|---|---|
| `Make batch B10-fix` | Rework the 5 done nodes (the `done-B10-…` Project files); deliver all 5 again. Give the 6 sourceless examples a real source or move each claim to factsToCheck, and rebalance sociology recall kinds (about 3 of each) |
| `Make batch B10 for Sociology, nodes 1-2` | `optionals/sociology/syllabus.json` + nodes 1, 2 |
| `Make batch B10 for Geography, nodes 1-2 and 5` | `optionals/geography/syllabus.json` + nodes 1, 2, 5 |
| `Make batch B10 for PSIR, nodes 1-5` | syllabus + first 5 nodes |
| `Make batch B10 for Anthropology, nodes 1-5` | same |
| `Make batch B10 for History, nodes 1-5` | same |
| `Make batch B10 for Public Administration, nodes 1-5` | same |

Default order for optionals: the first 5 nodes of each, so every optional has a working start. The owner may change it.
After that: the next 5 nodes of each, in the same order.

## Answers to questions earlier chats asked
- Journal: "We don't read it" is true. Journal text stays on the phone and never reaches the server or Chotu.
- Chotu's `who`: 60 words is a cap, not a target.
- Interview bank in several files is fine. Extra `group` and `id` fields are fine.
- Term-list slug `science-technology` is fine.
- Optional `links` may use made-up slugs; Claude Code maps them.
