# Bring the made content batches into the live Desk (Mac)

2 Nov 2026 (updated in the evening for B01–B22). Takes about 5 minutes. You run it because it needs your Desk sign-in key, which Claude must never see.

What it does: sends all of B01–B22 to the live Desk as **drafts**, in two parts:
- Step 3: 200 files from the batches: pause lines, Chotu's voice, 24 essays, 8 term lists, the interview bank and
  personas, 60 Mains answer skeletons, 24 GS4 cases, GS4 thinkers and terms, 8 CSAT weeks, 20 walk scripts,
  12 welcome-back days, and 6 optionals (syllabus map and topics 1–5 each).
- Step 4: the syllabus notes, 98 in all, including the 70 new ones from B14–B22 (now in English and Hindi), and the mocks.
Nothing goes to aspirants until an English and a Hindi editor approve it. Running it again is safe: unchanged files stay as they are.

Open Terminal (zsh). Run one command at a time.

## Step 1. Go to the server folder
```bash
cd ~/Documents/app/server
```
- Success: no output.
- Failure "no such file or directory": check the project is at `~/Documents/app`.

## Step 2. Type your Desk key (it won't show on screen)
```bash
read -s "EDITOR_TOKEN?Desk key: " && export EDITOR_TOKEN
```
Paste the key you use to sign in to the live Desk (the production one, or your personal staff key), then press Return.
- Success: a new prompt line, nothing printed.
- Failure: if you pressed Return too early, run the command again.

## Step 3. Send the batches
```bash
BASE=https://upsc-pods-production.chotu-aec.workers.dev npm run import:brief -- ../content/brief/aspiran-content
```
- Success: a line like `200 files from 20 batches → pack brief-2026-11-02`, then a long list ending with
  "Imported." Items you already had say "unchanged".
- Failure "401" or "Sign in": the key was wrong. Run Step 2 again.
- Failure "fetch failed": check the internet connection and run Step 3 again.

## Step 4. Send the syllabus notes
```bash
node scripts/syllabus.mjs pack /tmp/aspiran-syllabus && BASE=https://upsc-pods-production.chotu-aec.workers.dev npm run import -- /tmp/aspiran-syllabus
```
- Success: `Pack syllabus-…: 98 reads, 4 mocks`, then "Imported." Notes about sound effects are fine.
- Failure: the same fixes as Step 3.

## Step 5. Forget the key
```bash
unset EDITOR_TOKEN
```

## Step 6. Look at them
Open https://upsc-pods-production.chotu-aec.workers.dev/desk → Library. New tabs: Pause lines, Chotu's voice,
Essay topics, Term lists, Interview questions, Interview personas, Optional subject notes, Optional syllabus maps,
Mains answer skeletons, GS4 cases, GS4 thinkers and terms, CSAT weekly sets, Walk scripts, Welcome-back days, and more
Long reads. Each card shows English and
Hindi side by side, with a ⚑ flag for any facts to check against a source before approving.

Everything made so far is in. Internal security notes sit under a new Prep subject, "Internal security".
