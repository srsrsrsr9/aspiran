# UPSC Pods server (Cloudflare Worker)

Runs pod chat, study rooms, the daily rituals, the news desk and the moderation queue.
Phones run Chotu themselves; the server never sees a member's questions to Chotu.

## Run it on your PC (no Cloudflare account needed)

Needs Node 20 or newer. In this `server` folder:

```
npm install
npm run db:init
```

Create a file called `.dev.vars` here, next to `.dev.vars.example`, and type two long random
passwords of your own (it is git-ignored and never leaves your PC):

```
EDITOR_TOKEN=<your own long random text>
MOD_TOKEN=<a different long random text>
```

Then start it:

```
npm run dev
```

Optional: to let the desk's Author tab write drafts with Claude, add a third line with your own
Anthropic key, `ANTHROPIC_API_KEY=...`, to the same `.dev.vars`, then switch it on in /admin → AI → "Write
library drafts". Without a key the Author tab works by copy and paste, so nothing else needs it.
On Cloudflare the key goes in with `npx wrangler secret put ANTHROPIC_API_KEY`, never in a file.

- Editor desk: http://localhost:8787/desk (sign in with the EDITOR_TOKEN you typed).
- Test everything: in a second terminal, set `EDITOR_TOKEN` to the same value and run `npm test`.
- Run a cron by hand: `curl "http://localhost:8787/__scheduled?cron=0+0+*+*+*"` (the news fetch).

## Content packs (Chai cards, explainers, games, sounds)

A content pack is a folder with a `manifest.json` (every file listed with its SHA-256), like
`content/preview-2026-10-10`. Importing never publishes anything: cards land in the editor queue
and everything else in the desk's Library tab, all as drafts.

With the server running, in a second terminal (EDITOR_TOKEN is the value you typed into `.dev.vars`):

```
npm run import -- content/preview-2026-10-10
```

Or on the desk: Library → Import pack → pick the folder.

Then on the desk:
- Queue: the pack's Chai cards, with drawings, chips and takeaways. Approve English and Hindi, then Publish.
- Library: the explainer, timeline, Match the Article, quiz night, Map Chai, Number Sense, Myth vs Fact,
  Two Sides, Lamp Off, the two soundscapes, and the playful kinds: Scratch and reveal, Stamp trail,
  Chai stall radio, Snap together, Domino effect, Then and now and Postcards. Approve English to show it in the app; Hindi shows only
  after a Hindi editor approves it too. Any edit clears both approvals.
- Write something new: "Write a card" on the Queue, or pick a kind under Library → Start a draft.
  Upload a drawing or sound there to get a `/media/...` link to paste into the draft.

Phones pick up approved items from `/library` the next time the app opens.
Sound effects: the pack's `audio/sfx/sfx.json` lists them by id. Items name them by role
("stamp": "sfx/stamp"), and the import resolves each to its files, gain and loop flag, so phones never
need the list. Tragic items get no sound. Drafts written on the desk use the newest imported sound library.

The 30 template types (trap spotter, flashcards, bucket sort, versus and the rest) run on nine
engines: choose, sort, order, match, reveal, steps, compare, link web and fill the gap. The import and
every desk edit turn each one into its engine's shape (`play` in the item, see `src/engines.ts`), so the
app needs one player per engine. A new type on an existing engine only needs a case in `toPlay`.
"Start a draft" for these types copies the newest item of the same type with every text emptied.

Drafts a model wrote from a source text (`_generated/`) import too, flagged "check every fact against
the source". `templates/`, `tools/`, `jobs/` and `share/` are for writers and are skipped. If the
content library stamped C2PA data into SVGs or .m4a files, the import removes it before checking.

The reel (`reels/`) is a social-media video export and isn't imported; share PNGs are drawn on the phone.

Mock papers (kind `mock`). The import also takes papers written from the mock-paper template (stem, statements,
ask, options, why, one shared `answer`) and turns them into the apps' shape (`normalizeMock` in `src/content.ts`).
A paper with `"timer": {"default": "off", "counts": "up"}` never counts down on web or Android: the timer starts
off, can be switched on to count up, `minutes` is only the suggested time, and the paper never submits itself.
Papers without `timer` keep the countdown. The sample GS2 Polity paper is a pack of its own:
`npm run import -- content/mock-sample-2026-10-12`, then approve it on the desk (`npm run test:mocks` checks it).

Quotes (kind `quote`, Library → Start a draft → Quotes): text, author, source, chapter and the exact
edition, plus the moment it's for (night, if-then, know-yourself, monday, finish, exam-trap). Approving a
quote means an editor checked it word for word against that edition. Nothing is seeded.

## Writing new items: the desk's Author tab

One screen, "paste and pick":
1. Paste a source (a PIB note, a chapter, your own notes) or drop a PDF.
2. Pick up to three content types. The desk suggests some from the text.
3. With a Claude key: **Generate**. Without one: **Get the prompts**, copy each into Claude, and paste the
   reply back. Either way you get a draft.
4. The draft shows every text side by side: English, Hindi, and any pilot language. Fix a line in place
   and press Save changes. Lines that changed in English show which translations are now stale.
5. Approve each language with its own button. Approval needs your name and the right role.

Translations beyond Hindi: "Translate" (with a key) or "Copy translate prompt" and paste the reply back,
or add a translation file the content team made (`<item>.te.json`, schema `upsc-pods/translation@1`) under
Library → "Or one translation file". Pack imports attach these files automatically. A translation always
lands as a draft for that language's editor. Library → "Open in Author" opens any item side by side.

The prompts, schemas and checks are the content team's own (`src/vendor/`). When they publish a new
bundle, copy it in with `node scripts/sync-templates.mjs <bundle.json> [pods-templates.js]` and restart.

## Languages

English and Hindi are written inside every item. Other languages are added per item and approved per item.
In /admin → Languages each language is **Off**, **Pilot** (desk only) or **Live** (members see it).
A language can go live only when it has:
- an active staff member with the Language editor role for that language (/admin → Staff), and
- at least 5 distress phrases, in the script and in Roman letters, marked reviewed by a named reviewer.

Distress phrases count for safety as soon as they're saved, even in pilot. The web app's own words
(menus, buttons, the help box) are in `public/app/strings.js`; copy the `en` block to add a language.
These are instructions and helper text, so other languages use an everyday spoken tone; study content stays formal. The Hindi and Telugu strings there are drafts that need a native speaker's check. Fonts are Noto.
Telugu is the pilot: seven sample translations are in the library, and five more attach once their
English items are imported. News cards stay English and Hindi for now.

## Pod leads

The first member to join a pod is its lead. "Ask the lead privately" (`ask_lead`) reaches only the lead
and the asker, and the lead answers with `lead_reply`. Guardian checks these notes too. Private notes come
back in history only to the two people in them. Favours and offers are ordinary messages with
`kind: "favour"` or `"offer"`. To change a lead: `POST /mod/api/pods/<podId>/lead {memberId, name}`.
`node test/smoke.mjs` (with EDITOR_TOKEN set) covers all of this.

## Web and desktop app

The server also serves a web app at `/app/` (files in `public/app/`, no build step). It works for anyone
who'd rather not use the phone, and it's built for long sessions on a laptop. It uses the same cards,
editor checks, practice questions, library and pods as the phone.

- Today's 3 and Close the Day. The journal is encrypted in the browser with a key that can't be exported.
- Chai cards, with arrow keys to move between them.
- Practice: Prelims (missed questions come back after 3 days) and Mains with autosave.
- Mock papers: timed, full screen, with UPSC negative marking (GS1 is +2 / -0.66, CSAT is +2.5 / -0.83),
  a "Not sure" tick and a question palette.
  - Results show the last five papers as a range (playbook A8), whether your guesses beat break-even,
    and a review of every answer.
  - Papers come from the `mock` kind on the desk, which needs at least 10 questions with explanations.
    A quick mock is also built from checked Chai questions and the starter bank once there are 10 or more.
- Long reads (`read` kind on the desk): a reader with adjustable text size and a dark mode.
  At the end it asks you to "say it from memory" before showing the recall points.
- Focus blocks (25, 50, 90 or custom minutes). Stopping early asks for a short pause first.
  The site blocking comes from `../focus-extension`.
- Pod chat, chai pings, the study room, favours and private notes to the pod lead. Guardian and reports work as on the phone.
- Calm now (`#calm`): slow breathing (1, 3 or 5 minutes, 4 in and 6 out), double sighs and a 5-4-3-2-1
  grounding exercise. The helpline always comes first. Sound is off until you press it: calm tones (two
  close notes, one per ear, generated in the browser, headphones note shown) or soft noise, at a capped
  low volume, with no health claims. The circle follows the breath and stays still under reduced motion.
  Nothing is logged. It's linked from Today, the help box, a Heavy or Low day in Close the Day, and the
  end of a focus block. Approved `calm-script@1` items from the library appear after the built-in ones.
- My Routine (`#routine`, from My Path): build a day from blocks (study 25/50/90, revision, mock, walk,
  meals, family, wind-down, sleep and more), anchor them ("after lunch") or give them a time, reorder by
  dragging or with the arrows, and pick rest days. Templates for a full-time aspirant, someone studying
  around a job, a repeater, someone at home with caring duties, and exam month. Today's 3 go into the
  study blocks, and Today shows the next block. A Sunday review asks two questions and suggests one
  change. No scores or streaks. "Save a picture" draws the shape of the day without any hours. Approved
  `routine-card@1` items show under "Borrow from others", each with what not to copy.
- Languages: the reading language list comes from /config, so a language appears once it's live.

### Try one topic (`#try`, open to visitors)

One whole syllabus topic, start to finish, with no account: a topic path (`aspiran/topic-path@1`, source files in
`content/topic-paths/`, packed by `node scripts/syllabus.mjs pack` with the notes and mocks). The first is Federalism
and Centre–state relations. Steps: guess first, five short reads with a check after each, sort the three lists, say it
from memory, eight real Prelims PYQs with a "how sure?" tick (answers checked against `content/pyq/pyq.json` by
`syllabus.mjs check`), three situations, plan a Mains answer (our skeleton opens only after you plan yours), keep it
(eight cards go into the review queue and the topic goes on the syllabus map as Met), finish. No timers, scores
only private, no sound. Progress stays in the browser.

- `GET /try` lists approved paths; `GET /try/<id>` serves one, with Hindi only once a Hindi editor approves it.
- Nothing shows to visitors until an English editor approves it on the desk. Editors can walk a draft at
  `/app/#try/<id>?preview` (it asks for the desk key).
- `npm run test:try` checks the gate.

Locally, open http://localhost:8787/app/. To use it as a **desktop app**, open it in Chrome or Edge and
choose Install (the address-bar icon, or My Path → Install). It then opens in its own window, with shortcuts
to Focus, Mock papers and Chai, and works offline from the last copy. No separate desktop codebase is needed.

`GET /practice/questions?days=90` returns the Exam Corner MCQs from published (editor-approved) briefs,
plus the starter bank the phone bundles.

## Connect the phone

1. Phone and PC on the same Wi-Fi. Find the PC's address with `ipconfig` (IPv4, e.g. 192.168.1.10).
2. In the app: My Path → Pod server → `http://192.168.1.10:8787` → Save and connect.
3. Windows may ask to allow Node through the firewall the first time: allow on private networks.

Only debug builds can talk to plain `http://`. Release builds need the deployed `https://` address.

## The schedule (one half-hourly cron)

Cloudflare's free plan allows few cron strings, so one cron (`0,30 * * * *`) runs every half hour and
`scheduled()` in `src/index.ts` runs whatever is due at that IST time:

| IST            | Job |
|----------------|-----|
| 05:30 daily    | Fetch feeds, draft cards into the editor queue; daily backup; merge forming pods 7+ days old; refresh pod states (quiet for 14 days → each member is asked privately to stay or move) |
| 06:00 Monday   | The weekly batch match: forming pods merge, into small pods with room where possible |
| 07:00 daily    | Publish what the editors approved, then the Chai post in every pod |
| Mon 08:00      | Chotu suggests the pod's week goal (skipped if the lead set one) |
| Tue, Thu 19:00 | Answer hour |
| Fri 20:00      | Pod Quiz Night (5 MCQs from the week's Chai, one shared pod score) |
| Sun 18:00      | Wins of the week |
| every tick     | Welcome nudge if a newcomer waited 2 hours without a hello from the lead; one prompt after 5 quiet days |

Every Chotu post in a pod goes through the pod's host gate: none from 23:30 to 07:00 IST, at most 2 a day,
never about one member, and a ritual a member claimed is left to them. The old 13:00 / 18:00 / 21:30 daily
ritual posts are gone; those rituals live in Prep now. Run any job by hand from the admin console API:
`POST /admin/api/jobs/run {"job":"match|merge|states|host|chai","at":"<ISO time>"}`.
The old cron strings still work by hand with `/__scheduled?cron=...`.

Nothing reaches members until an editor approves it on the desk. Editors have 05:30 to 07:00
to review, or can press Publish on the desk themselves.
English and Hindi are approved separately, by their own editors.

## Feeds

- RBI press releases: working.
- PIB: off. It refuses requests from a bot that names itself honestly; we don't disguise ours.
  Needs PIB's permission, or reading individual ministry pages instead.
- PRS: off. The feed address was a 404; find the current one before turning it on.

Watch the server log for "fetched 0 items": feed addresses change without notice.

## Chotu: the on-phone model and the cloud fallback

**On-phone model.** Phones download Chotu's model from this server, never straight from Hugging Face, so no
account or token is involved. Locally the files sit in `server/models/` and a small file server hands
them out with resumable downloads:

1. Download the file(s) below into `server/models/` (same file names). Both are Apache-2.0 and ungated.
2. In `.dev.vars`, set `MODEL_FILES_URL=http://127.0.0.1:8788`.
3. Run `npm run models` in a second terminal, next to `npm run dev`.
4. Check `http://127.0.0.1:8787/models`: each file you placed should be listed. A file with the wrong size is left out.

| File | Size | SHA-256 | From |
|---|---|---|---|
| `gemma-4-E4B-it.litertlm` (optional, phones with 8 GB RAM or more) | 3,659,530,240 bytes | `0b2a8980ce155fd97673d8e820b4d29d9c7d99b8fa6806f425d969b145bd52e0` | https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/2eee7ac325f20eb8c9ac1d0e972f7c84663062da/gemma-4-E4B-it.litertlm |
| `gemma-4-E2B-it.litertlm` (phones with 5 GB RAM or more; smaller phones use Chotu online) | 2,588,147,712 bytes | `181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c` | https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1/gemma-4-E2B-it.litertlm |

Deployed, leave `MODEL_FILES_URL` unset. Nothing needs uploading: when R2 doesn't hold a file, the server
passes the official Hugging Face file along (`litert-community/gemma-4-E2B-it-litert-lm` and
`gemma-4-E4B-it-litert-lm`, pinned to the commits in the table, which are byte-identical to `main` as of
12 Oct 2026), keeping Range so downloads resume. The phone still only ever talks to this server, sends
nothing to Hugging Face and checks the SHA-256 before keeping the file. Order: `MODEL_FILES_URL`, then R2
(`upsc-pods-media`, `models/<file name>`, if you ever upload them), then Hugging Face. The list and checksums
live in `src/chotu.ts`. Test the pass-through with `npm run test:models` against a server started without
`MODEL_FILES_URL` (see the top of `test/models-hf.mjs`).

**Cloud Chotu (until launch).** Phones without the on-phone model ask `POST /chotu`, which answers on Groq
(`openai/gpt-oss-120b`, falling back to `openai/gpt-oss-20b`). Put your own key in `.dev.vars` as
`GROQ_API_KEY=` (or `npx wrangler secret put GROQ_API_KEY --env production`). It goes through the same
admin switches and daily caps as the other AI ("Chotu (cloud)" in /admin, AI usage). Only metadata is
logged, never the chat. Distress is checked on the phone and again here; a match never reaches the model.
The system prompt is `src/chotu-prompt.txt`. Test with `node test/chotu.mjs`.

## AI on the server (public news only)

Locally there is no AI: stories go into the queue as headline-and-link cards marked
"AI draft unavailable", and the notes library falls back to word matching. To try the
real drafting and embeddings you need your own Cloudflare account. Sign in on this PC:

```
npx wrangler login
npm run dev:ai
```

## Admin console

Open http://localhost:8787/admin. The first time, sign in with your owner key: `ADMIN_TOKEN`
if you've added one to `.dev.vars` yourself, otherwise `EDITOR_TOKEN`. Then go to **Staff and
roles** and make a personal key for each person. A key is shown once; only its hash is stored.
Approvals made with a personal key carry that person's name. Shared keys (`EDITOR_TOKEN`,
`MOD_TOKEN`) still work but must type a name to approve.

| Role | Can |
|---|---|
| Admin | everything, including staff, flags, AI controls, data requests and backups |
| Editor | write and approve English content, publish, announcements, AI usage |
| Hindi editor | write content and approve Hindi |
| Moderator | reports, safety queue, members (pause chat, move, remove) |
| Pod lead | view analytics |

Sections: overview, content and version history (any version can be restored as a draft),
moderation, safety queue (escalating needs a note saying who it went to; "Send care" posts
helplines privately), members, data requests (DPDP export and erasure), AI usage and controls
(master switch, per-purpose switches, daily caps, model and temperature), analytics (daily
counts only, no identities), feature flags, announcements, status and incidents, staff, backups
and the audit log. Every change is in the audit log; keys and message text never are.

**Feature flags** are enforced by the server, so they work on old app versions too. Turning
pod chat off closes every open chat.

**Announcements** show as a banner in the web app and can also be posted in every pod, which
reaches the Android app. Real push notifications need your own FCM or Web Push keys; not set up.

**Public endpoints:** `/status` (and `/status.json`), `/config` (flags and announcements for the
apps), `/consent`, `/privacy/export` and `/privacy/delete` (a member's own data, by member id).

**Backups** go to the `upsc-pods-backups` R2 bucket every day (last 30 kept), or on demand.
Restoring takes a fresh backup first and erases again anyone who asked to be deleted since.
Staff, audit log, settings and data requests are never overwritten. Pod chat history is not in
backups; in production also rely on D1 Time Travel.

In production, put Cloudflare Access in front of `/admin*` as well as the keys.

## Deploy

```
npx wrangler login
npx wrangler d1 create upsc-pods
```

Put the `database_id` it prints into `env.production` in `wrangler.jsonc`, then:

```
npx wrangler d1 execute upsc-pods --remote --env production --file=schema.sql
npx wrangler secret put EDITOR_TOKEN --env production
npx wrangler secret put MOD_TOKEN --env production
npx wrangler secret put ADMIN_TOKEN --env production
npx wrangler r2 bucket create upsc-pods-media
npx wrangler r2 bucket create upsc-pods-backups
npm run deploy
```

`secret put` asks you to type the value; it is stored by Cloudflare, not in any file.

On the Cloudflare website instead: paste `schema-console.sql` (not `schema.sql`) into the D1 Console. The console
joins everything into one line, so the `--` comments in `schema.sql` would swallow the rest. It is the same schema
without comments; regenerate it if `schema.sql` changes.
Never put keys or tokens in this folder, in chat, or in the app.
