# News desk and Admin redesign, Mac Terminal (zsh), 1 Nov 2026

What this deploys:
1. **A clear sign-in screen** on the News desk (`/desk`): the desk now opens on a "Sign in" card. If the box is empty you
   see "Type or paste your key first." A wrong key gets a plain explanation, not "Wrong or missing key." Once you're in,
   the top bar shows who you are and a Sign out button. A personal key approves in its own name. With a shared key
   (the owner key) a name box appears for approvals.
2. **Clear messages** on the desk and in Admin: green for done, red for a problem (it stays until you close it), and
   "working…" while something slow runs. They're in plain words, never raw code.
3. **Coverage**: a new **Coverage** tab on the desk, also at the top of **Admin → Content**. It lists every paper and
   syllabus topic, the same ones aspirants see in the app's Syllabus tab. For each topic it shows how many items exist,
   how many have English in the app, how many are waiting, and the same for Hindi. A label says
   **Nothing yet / Drafts only / Hindi behind / In the app**, and "Only rows that need work" hides the finished topics.

Nothing else changes: same addresses, same keys, same permissions. No database change.

Checked on the Mac before this runbook:
- type check passes;
- all 15 server test scripts pass (1 Nov, on fresh local test servers);
- both pages checked in the browser at desktop and phone width: sign-in (empty, wrong and right key), sign-out,
  error and success messages, and the Coverage tab with imported sample packs.

How to run it: open **Terminal**, paste one line at a time, and wait for each to finish. If a step fails, stop and send
Claude the full output.

---

## Step 1. Check the server code

### 1a. Go to the server folder
```bash
cd ~/Documents/app/server
```
- Success: no output.

### 1b. Type check
```bash
npm run check
```
- Success: ends with no errors (no lines starting with `src/`).
- Failure: send Claude the output and stop.

## Step 2. Deploy

You approve this deploy by running it.

### 2a. Deploy
```bash
npm run deploy
```
- Success: ends with "Deployed upsc-pods-production" and a list of triggers.
- Failure: send Claude the output. Nothing changes on the live server if the deploy fails.

## Step 3. Look at it

### 3a. Open the desk
```bash
open https://upsc-pods-production.chotu-aec.workers.dev/desk
```
- Success: a "Sign in to the News desk" card. Paste your key and press Sign in. The top bar then says
  "Signed in as …".
- Then open **Coverage**. Red "Nothing yet" rows are the gaps to fill first.

### 3b. Open Admin
```bash
open https://upsc-pods-production.chotu-aec.workers.dev/admin
```
- Success: "Sign in to Admin". After signing in, **Content** shows the same coverage table at the top.

## If something looks wrong
Roll back to the previous version. This puts the old desk and admin back:
```bash
npx wrangler rollback --env production
```
- Success: "Successfully rolled back". Then send Claude a screenshot of what looked wrong.
