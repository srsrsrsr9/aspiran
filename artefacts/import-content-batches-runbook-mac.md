# Bring the made content batches into the live Desk (Mac)

2 Nov 2026. Takes about 2 minutes. You run it because it needs your Desk sign-in key, which Claude must never see.

What it does: sends every file a batch's `checks/manifest-*.json` lists (35 files: pause lines, Chotu's voice sheet,
24 essay topics, 2 term lists, 3 interview banks, the board personas, 3 Sociology notes) to the live Desk as **drafts**.
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
- Success: a line like `35 files from 5 batches → pack brief-2026-11-02`, then a list ending with the number added
  (or "unchanged" on a re-run). It also lists six term lists (polity, economy…) as "not made yet": that's expected.
- Failure "401" or "Sign in": the key was wrong. Run Step 2 again.
- Failure "fetch failed": check the internet connection and run Step 3 again.

## Step 4. Forget the key
```bash
unset EDITOR_TOKEN
```

## Step 5. Look at them
Open https://upsc-pods-production.chotu-aec.workers.dev/desk → Library. New tabs: Pause lines, Chotu's voice,
Essay topics, Term lists, Interview questions, Interview personas, Optional subject notes. Each card shows English and
Hindi side by side, with a ⚑ flag for any facts to check against a source before approving.

Not sent yet: Geography optional notes 3 and 4 (they need small fixes and aren't in a batch's checks file), and the six
term lists still to be made.
