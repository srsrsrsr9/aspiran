# Aspiran (formerly UPSC Pods; Chotu): instructions for Claude

Start with `artefacts/handover/SESSION-2026-10-31.md` (latest decisions and the pending list). Older context is in
`artefacts/handover/HANDOVER.md`; read it only when you need history. The brand is now **Aspiran** (https://aspiran.in);
code and older docs still say "UPSC Pods" until the rename lands. The project lives on the owner's Mac.

## What this is
UPSC Pods: a community-first study app for UPSC aspirants in India. Small "pods" of aspirants, daily
"Chai" current-affairs cards, practice and mocks, and Chotu, an AI study buddy (labelled "· AI").
English and Hindi first; Telugu is the pilot language.

## Layout
- `server/`: Cloudflare Worker (TypeScript). D1 database `upsc-pods`, R2 buckets `upsc-pods-media` and
  `upsc-pods-backups`, Durable Objects `PodRoom` and `CommonsRoom`, one half-hourly cron. Also serves the
  web app (`server/public/app/`, no build step), the editor desk (`/desk`) and admin (`/admin`).
  `server/README.md` is the reference for everything server-side.
- `android/`: Kotlin and Compose app. Play id `in.aspiran.app` (code package stays `com.upscpods.app`). Built by the owner in Android Studio.
- `content/`: content packs (JSON per item, `en` and `hi` side by side) and the tools that make them.
  `content/README.md` explains the formats; the prompt kit is in `artefacts/UPSC Pods Prompt Kit/`.
- `focus-extension/`: the browser site-blocker used by Focus blocks.
- `artefacts/`: local copies of every plan, report, runbook and published page. Handover notes in `artefacts/handover/`.
- `project-files/`: a copy of the old Claude project's shared folder (25 Oct 2026): research, strategy,
  community rules and crisis protocol, content drafts, marketing videos, status sheets. Reference only;
  the live code and content are in the folders above. Large (about 400 MB), mostly media.
- `keys/`, `server/.dev.vars`, `android/local.properties`, `*.jks`: secrets. Never read, print, copy or commit.

## Commands (in `server/`)
- `npm run dev` (local), `npm run check` (tsc and a syntax check of the web app), `npm run test:all` (all 17 suites, each on its own
  fresh local server; `npm run test:all -- auth rooms` for some), `npm run check:schema` (the database files against what the server creates).
  GitHub runs all three on every push that touches `server/`.
- `npm run deploy` deploys production. Claude runs it (owner decided 1 Nov 2026) after `npm run check` and the tests pass,
  applies any new migrations first, then checks the live pages. The owner still publishes Android releases.
- `npm run import -- <pack folder>` imports a content pack. Everything lands as drafts.

## Standing rules
- Never change a live flag or type a password. For anything the owner must run (secrets, Play Console,
  Android releases), write a macOS Terminal (zsh) runbook (one command at a time, success and failure notes per step) in `artefacts/`.
- Commit locally and push to GitHub (`origin` = github.com/srsrsrsr9/aspiran) at sensible checkpoints. Never commit secrets.
- Secrets go in with `npx wrangler secret put NAME --env production`, typed by the owner. Never in files or chat.
- Content publishing (owner decided 14 Nov 2026): Claude imports content and switches it on as approved by default,
  unless the owner says otherwise for a batch. Approvals are recorded as "Aspiran (owner publish)". Fix known errors
  before publishing. Still don't claim content is "checked by a human editor" anywhere until that's true.
- Content rules: sound off by default and never autoplays; reduced motion respected; every piece ends;
  no timers, streaks or public scores; TRAGIC tone gets no sound, motion, emoji or joke and isn't shareable;
  maps are schematic with no national borders.
- Chotu and AI pod friends are always labelled AI, quiet from 23:30 to 07:00 IST, never respond to
  feelings, ranks or results. Distress handling follows `community/crisis-protocol.md`.
- Plus is sold both in the Android app via Google Play Billing (owner decided 31 Oct; built, still off until the Play
  account and product are ready) and on the web via Cashfree (still sandbox). ₹9,999/yr; ₹999 for the first 300.
- Keep a local copy of every artefact you publish or revise in `artefacts/`.
- Status page: https://claude.ai/artifact/1jENbW7xHRqPTYw1B4zjVF (source `artefacts/status/aspiran-status.html`). When work
  changes what's done, pending, content coverage, the website or the teaching-plan build, edit the file, update its date,
  and republish with the Artifact tool, passing that URL as `url` (read it first). Commit the file with the work.
- The owner makes all content, videos included (2 Nov 2026). Claude checks, formats, imports and publishes it, and puts
  new content needs in the owner's assignment (`artefacts/content-assignment-*.md`). Claude's own focus: pedagogy, app builds,
  website, marketing and the quality of the whole user journey.
- Write for a non-developer owner: plain words, short replies, decisions up front.
