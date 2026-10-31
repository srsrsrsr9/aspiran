# UPSC Pods (Chotu): instructions for Claude

Full context is in `artefacts/handover/HANDOVER.md`; read it only when you need history.

## What this is
UPSC Pods: a community-first study app for UPSC aspirants in India. Small "pods" of aspirants, daily
"Chai" current-affairs cards, practice and mocks, and Chotu, an AI study buddy (labelled "· AI").
English and Hindi first; Telugu is the pilot language.

## Layout
- `server/`: Cloudflare Worker (TypeScript). D1 database `upsc-pods`, R2 buckets `upsc-pods-media` and
  `upsc-pods-backups`, Durable Objects `PodRoom` and `CommonsRoom`, one half-hourly cron. Also serves the
  web app (`server/public/app/`, no build step), the editor desk (`/desk`) and admin (`/admin`).
  `server/README.md` is the reference for everything server-side.
- `android/`: Kotlin and Compose app, package `com.upscpods.app`. Built by the owner in Android Studio.
- `content/`: content packs (JSON per item, `en` and `hi` side by side) and the tools that make them.
  `content/README.md` explains the formats; the prompt kit is in `artefacts/UPSC Pods Prompt Kit/`.
- `focus-extension/`: the browser site-blocker used by Focus blocks.
- `artefacts/`: local copies of every plan, report, runbook and published page. Handover notes in `artefacts/handover/`.
- `project-files/`: a copy of the old Claude project's shared folder (25 Oct 2026): research, strategy,
  community rules and crisis protocol, content drafts, marketing videos, status sheets. Reference only;
  the live code and content are in the folders above. Large (about 400 MB), mostly media.
- `keys/`, `server/.dev.vars`, `android/local.properties`, `*.jks`: secrets. Never read, print, copy or commit.

## Commands (in `server/`)
- `npm run dev` (local), `npm run check` (tsc), `npm test` plus the `test:*` suites (13 in all).
- `npm run deploy` deploys production. Only the owner runs it, from a runbook.
- `npm run import -- <pack folder>` imports a content pack. Everything lands as drafts.

## Standing rules
- Never deploy, push, change a live flag, type a password or approve content. Write a PowerShell 5.1
  runbook (one line at a time, `curl.exe`, success and failure notes per step) in `artefacts/` for the owner.
- Secrets go in with `npx wrangler secret put NAME --env production`, typed by the owner. Never in files or chat.
- Content is always a draft until an English and a Hindi editor approve it. Don't claim content is
  "checked by a human editor" anywhere until that's true.
- Content rules: sound off by default and never autoplays; reduced motion respected; every piece ends;
  no timers, streaks or public scores; TRAGIC tone gets no sound, motion, emoji or joke and isn't shareable;
  maps are schematic with no national borders.
- Chotu and AI pod friends are always labelled AI, quiet from 23:30 to 07:00 IST, never respond to
  feelings, ranks or results. Distress handling follows `community/crisis-protocol.md`.
- The Android app never sells Plus or links to where it's sold (Play Billing is built but off, pending the
  owner's decision). Web payments are Cashfree, still in sandbox.
- Keep a local copy of every artefact you publish or revise in `artefacts/`.
- Write for a non-developer owner: plain words, short replies, decisions up front.
