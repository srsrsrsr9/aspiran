# What a zip of the app folder does NOT carry

Tick these off in order. "Old" = the current Claude account, "new" = the receiving one.

## A. Do before the old account goes (only it can do these)
- [x] **Download the project's shared folder** (done 25 Oct: now in `app\project-files\`) (about 400 MB: `content/`, `community/`, `strategy/`, `research/`,
      `status/`, `deploy/`, `marketing/` videos, `handoff/`, `uploads/`). Much of it is NOT in the PC folder.
      Open the project's Library/files in the Claude app and download, or ask a thread in the old account to
      copy it to the PC in batches.
- [ ] **Export the one page with no local copy:** "UPSC Pods sell-first rework plan"
      (https://claude.ai/artifact/R8HNtGgA8GDs1kqqAXCJXb). Everything else is in `artefacts/`.
- [ ] **Copy the project instructions** (Project settings). Current text: "Keep a local copy of every artefact
      (published pages, docs, plans, reports, designs) in C:\Users\Srinivas Vedantham\Documents\Personal\app\artefacts.
      When a thread publishes or revises an artefact, also save its source file there."
- [ ] **Turn off the old scheduled task** "Weekly AI model watch" (Mondays 08:53 IST), so two accounts don't both run it.
      ("Refresh project status" is already off.)
- [ ] **Claude Docs / Artifacts:** links stay owned by the old account. New edits need republishing from the
      local copies in the new account (new links).

## B. GitHub
- [ ] The app folder is a **local git repo** (branch `master`). No thread pushed it to GitHub; run
      `git remote -v` in the app folder to confirm (no output = local only).
      If you want cloud sessions in the new account to work on the code, create a private repo on GitHub,
      push `master` to it from the PC, then connect GitHub in the new account and install the Claude GitHub app on that repo.
- [ ] Before pushing, confirm `.gitignore` still excludes `keys/`, `.dev.vars`, `*.jks`, `local.properties`,
      `client_secret*.json`, `google-services.json`. (It does today.)
- [ ] The old account's GitHub (`snvaveranda/*` repos) isn't used by this project.

## C. Connectors, environment and network (set up again in the new account)
- [ ] **ElevenLabs:** the old cloud environment injected an `ELEVENLABS_API_KEY` for `api.elevenlabs.io`. In the
      new account, add it as an environment secret/allowed host (or a connector). Rotate the key while you're at it.
- [ ] **Cloud environment network policy:** threads needed outbound access to api.elevenlabs.io, the model
      providers (Groq, Google AI Studio, NVIDIA build, OpenRouter) and the web for research. Recreate it.
- [ ] **Claude Docs connector** (used for the plans and design docs) and **Claude in Chrome** if you used it.
- [ ] **Desktop app on the PC:** sign the Claude desktop app into the new account, then approve the folders again:
      `C:\Users\Srinivas Vedantham\Documents\Personal\app` and (if still needed) `...\Documents\Builds\artha`.
      Remote Control on the PC must also be re-enabled under the new account.
- [ ] **Memory:** was off in the old account, so there's nothing to export. CLAUDE.md + HANDOVER.md replace it.
- [ ] **Skills/plugins:** only the standard built-in skills were enabled; no custom skills to move.

## D. Scheduled task to recreate in the new account
- [ ] **Weekly AI model watch**, Mondays 08:53 IST. Prompt (paste as is): re-read `research/model-watch.md`
      (latest language-routing section); Chotu routes by language (English, Hindi, Telugu) with a primary and a
      fallback each; prefer the newest best model, free where possible; check Gemini (incl. Gemini 4 free tier),
      Groq, OpenRouter, NVIDIA build, Hugging Face trending, Z.ai GLM, Qwen, DeepSeek, Xiaomi MiMo, Kimi, Nemotron,
      Mistral, Sarvam and Indic providers; append a dated "what changed" section; reply in ≤80 words only if a lane
      should switch or a free tier shrinks.

## E. External accounts (not tied to Claude; nothing to move unless the new owner is a different person)
These stay where they are. Only transfer them if someone else is taking over the business.
- [ ] Cloudflare account `aec6050bcd4fc95113accdbaae8d14d3` (Worker, D1, R2, Workers Paid). `npx wrangler login` again on any new PC.
- [ ] Firebase project `upsc-pods` (Google sign-in). Android SHA-1 must match the signing key.
- [ ] Google Play Console and the **`upload.jks` signing key + passwords**. Losing this key blocks app updates. Back it up offline.
- [ ] Cashfree (sandbox keys now; production later). Resend (not created yet). Sarvam (Hindi voice-overs).
- [ ] Model keys: NVIDIA, Groq, Google AI Studio, Anthropic API (Haiku content batches, $4 cap).

## F. Secrets on the PC: move by hand, never through a zip you upload
- `app\keys\`, `app\server\.dev.vars`, `app\android\local.properties`, the `.jks` keystore.
- `app\artefacts\client_secret_585886...apps.googleusercontent.com.json` is an OAuth client file sitting in
  artefacts. It belongs to a different Google Cloud project and isn't used. Move it out of `artefacts` (or delete it)
  before you zip or share that folder.
- Production secrets already set on Cloudflare (`EDITOR_TOKEN`, `MOD_TOKEN`, Cashfree, model keys) stay on
  Cloudflare; nothing to copy. Keep your own record of the editor token for content imports.

## G. When zipping the app folder
- Skip `server/node_modules`, `server/.wrangler*`, `android/build`, `android/.gradle`, `.claude/worktrees`
  (three stale agent worktrees, can be deleted). Keep `.git`.
- After unzipping on a new machine: `cd server; npm install`.

## H. First session in the new account
1. `CLAUDE.md` is already at the app folder root.
2. Create a project, add the project instructions from A, approve the folder, set up C and D.
3. First prompt: "Read CLAUDE.md and artefacts/handover/HANDOVER.md only. Don't scan the repo. Tell me in five lines what's pending."
