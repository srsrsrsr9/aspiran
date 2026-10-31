# Prep content and upgrade screen: build note (2026-10-20)

## What was made
- **Content pack `prep-content-2026-10-20`**: 83 items, English and Hindi, all drafts.
  - 8 sectional mock papers of 25 questions each (200 questions): modern history, ancient/medieval and culture, geography, environment, economy, science and tech, polity and governance, world and India.
  - 8 long reads: monetary policy, protected areas, attitude and EI (GS4), Indian monsoon, Gandhian mass movements, Panchayati Raj, India's space programme, cooperative federalism.
  - 67 game and practice pieces across 28 formats (flashcards, answer skeletons, pair-up, two levels, ethics dilemmas, timelines and more).
- **Learn and play** (new Prep tab): every engine piece grouped by format, with subject filters and progress.
- **Plus tools**: weekly Chai test, monthly compilation (printable), revise my misses, mock insights (breakdown, trend, error log).
- **Upgrade screen** (`#upgrade`): real tastes (3 mock questions, 2 weekly-test questions, sample insights), a Free vs Plus table and the existing Plus checkout (`#plus`). No new payment flow.
  - It follows the Plus rules: when the Plus flag is off, everything is open. It stays quiet in result mode, during a pause, after recent care and between 22:30 and 06:00. Offers appear only in Prep.
- **Desk**: "Approve English/Hindi on all N" buttons per pack. Each asks for the editor's name and a confirm.
- **Server**: `content.ts` normalises long reads written in the template shape.

## Where it is
- Pack: `/mnt/project-files/content/prep-content-2026-10-20/` (manifest has SHA-256 for each file).
- App code: `/mnt/project-files/content/prep-content-2026-10-20-app/`, holding `explore.js` and `patch_app.py`. The patch adds imports, routes, the tab and the links to `app.js` and `strings.js`.
- **Copied into the app folder on 2026-10-20**, after the sign-in work finished: `server/public/app/` (app.js, explore.js, strings.js), `server/src/` (content.ts, desk.html) and the pack at `server/content/prep-content-2026-10-20/`. Not deployed yet.

## To bring it live
1. Deploy the server (`npm run deploy` in `server`).
2. Import the pack from `server`: `EDITOR_TOKEN=... BASE=<your site> node scripts/import-pack.mjs content/prep-content-2026-10-20`
3. Have the English and Hindi editors check the items on the desk, then approve them. Only approved items reach members.

## What editors should check first
Everything was written from general knowledge, not copied from past papers. Every fact needs a subject editor.
- **Mocks**: answer keys and explanations, especially statement-count questions ("how many are correct").
- **Figures that change**: the RBI inflation target and band, MPC make-up, protected-area counts, the list of ISRO missions and the space reforms (IN-SPACe, NSIL).
- **Constitutional references**: article numbers, schedule entries and amendment years in the polity and Panchayati Raj pieces.
- **Hindi**: terminology consistency, for example मौद्रिक नीति and संरक्षित क्षेत्र.
- **Political topics**: check that they stay neutral (cooperative federalism, ethics dilemmas).

## Checked in the cloud copy only
- All 83 items pass template validation.
- Imported and approved on a local test server. Learn, Long reads, a reader, the upgrade screen (Plus on and off), the weekly test and insights all render with no script errors.
- Nothing was run on the user's PC.

## All items
| Format | Title |
|---|---|
| acronym-unpack | IUCN, letter by letter |
| answer-skeleton | Essay: a river belongs downstream too |
| answer-skeleton | Census towns and urban governance |
| answer-skeleton | The press and the national movement |
| answer-skeleton | Institutions of cooperative federalism |
| answer-skeleton | Judicial accountability without losing independence |
| answer-skeleton | Disaster management: from relief to preparedness |
| answer-skeleton | Self-help groups and rural financial inclusion |
| answer-skeleton | Integrity in public service |
| assertion-reason | Physical geography of India: assertion and reason |
| assertion-reason | Parliament and amendments: assertion and reason |
| better-answer | Spot the better conclusion |
| better-answer | Spot the better introduction |
| bucket-sort | Direct tax or indirect tax? |
| bucket-sort | Sort the crops by season |
| committee-match | Committees and what they examined |
| directive-word | Six directive words, decoded |
| ethics-dilemma | An unlicensed factory that employs a town |
| ethics-dilemma | A senior's request on a tender |
| ethics-dilemma | A viral video and a constable |
| fill-the-gap | The partition of Bengal |
| flashcards | Buddhist councils and sacred sites |
| flashcards | Indian classical dances at a glance |
| flashcards | Banking and monetary terms to know |
| flashcards | Global environmental conventions at a glance |
| flashcards | Indian rivers and where they rise |
| flashcards | Soils of India: types and traits |
| flashcards | Governors-General and Viceroys: who did what |
| flashcards | Landmark amendments to the Constitution |
| flashcards | Writs and constitutional remedies |
| flashcards | ISRO's launch vehicles, from SLV to SSLV |
| how-many-correct | GST, MPC and Finance Commission: how many correct? |
| how-many-correct | National movement: how many are correct? |
| index-card | Human Development Index, decoded |
| index-card | Global Multidimensional Poverty Index, decoded |
| landmark-case | Kesavananda Bharati and the basic structure |
| landmark-case | Maneka Gandhi and a fair procedure |
| link-web | Water across every Mains paper |
| link-web | Migration across every Mains paper |
| mnemonic | The six Great Mughals in order |
| mock | Ancient, medieval and culture mock 1 |
| mock | Economy sectional mock 1 |
| mock | Environment sectional mock 1 |
| mock | Geography sectional mock 1 |
| mock | Modern India sectional mock 1 |
| mock | India and the world mock 1 |
| mock | Polity and governance mock 2 |
| mock | Science and tech sectional mock 1 |
| odd-one-out | Ancient and medieval India: find the odd one |
| odd-one-out | Rivers, mountains and ecology: spot the odd one |
| pair-up | Temples and the dynasties behind them |
| pair-up | Match the tiger reserve to its state |
| pair-up | Match the strait to what it separates |
| pair-up | Borrowed features of the Constitution |
| rank-it | India's largest states by area |
| read | Monetary policy in India, explained |
| read | India's protected areas and the laws behind them |
| read | Attitude and emotional intelligence for GS4 |
| read | How the Indian monsoon works |
| read | Gandhi's three mass movements, compared |
| read | Panchayati Raj: the 73rd Amendment and after |
| read | India's space programme: rockets, missions, reforms |
| read | Cooperative federalism: institutions and the debate |
| scheme-snapshot | PM Jan Dhan Yojana: banking for all |
| scheme-snapshot | PM-KISAN: income support for farmers |
| story-beats | Vidyasagar and the right to remarry |
| timeline-shuffle | Delhi Sultanate dynasties to the Mughals |
| timeline-shuffle | Company-era Acts in order |
| timeline-shuffle | From the Revolt to the Congress |
| trap-spotter | Environment: laws, reserves and treaties |
| trap-spotter | Spot the trap: Parliament and key offices |
| two-levels | Cash Reserve Ratio, explained twice |
| two-levels | Conflict of interest, explained twice |
| two-levels | Emotional intelligence, explained twice |
| two-levels | Probity, explained twice |
| two-truths | Art and heritage: two truths and a lie |
| two-truths | Everyday science: find the false statement |
| union-state-list | Union, State or Concurrent? |
| versus | Fiscal policy versus monetary policy |
| versus | Lok Sabha versus Rajya Sabha |
| who-am-i | Who am I? Leaders of the national movement |
| word-bank | Essay vocabulary in two languages |
| word-bank | GS4 core values in two languages |
