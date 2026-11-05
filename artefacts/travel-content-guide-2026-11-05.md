# Adding content while you're away from the laptop (5 Nov 2026)

**In short:** leave the Mac at home, switched on and plugged in. When a content zip comes back, send it to the
**Desk inbox** from your phone, then tell Claude Code on your phone (Claude app → Code) "new zip in the Desk inbox".
Claude checks it, imports it as drafts, and you approve it in the Desk.

## Before you leave (5 minutes, at the Mac)
1. **Plug the Mac in and leave it on**, with the lid open, or closed with a monitor attached.
2. **Stop it sleeping:** System Settings → Battery (or Energy) → Options → turn on "Prevent automatic sleeping on
   power adapter when the display is off".
3. **Keep the Claude app open**, with this project's session in the sidebar.
4. **Turn on Remote Control** for Claude Code sessions in the Claude app's settings, so you can talk to this session
   from the Claude app on your phone. Claude can switch this on for you if you say yes.
5. On your phone, open the Claude app → **Code**. Check that you can see this Mac's sessions.

## When a content zip comes back
1. In the content Project on your phone, **download the zip**.
2. Open the Desk: https://upsc-pods-production.chotu-aec.workers.dev/desk (later admin.aspiran.in/desk) and sign in.
3. **Library** tab → **Send a content zip to Claude** → pick the zip → **Send to Claude**. The box under the button lists
   what's waiting. The zip stays private: it's stored, never shown to anyone, and never in the app.
4. In the Claude app → Code → this Mac's session, say: **"new zip in the Desk inbox"**.
5. Claude finds the zip from the Desk's log, checks every file with the app's own format checker, imports it as
   **drafts**, and tells you what's waiting and any questions.
6. Approve in the Desk as usual (English, then Hindi).

**Telugu `.te.json` files** don't need Claude: Desk → Library → **Add translation**, pick the files.

## If the Mac is off or asleep
Nothing is lost. Zips wait in the Desk inbox until you're back, and Claude imports them then. Everything else still
works from your phone: the Desk (approve content, publish Chai), Admin, and the Play Console.

## What still needs the laptop
- Building the Android app (Android Studio). The versionCode 7 build waits until you're back.
- Anything typed into Terminal: secrets and the runbooks.

## For Claude (how to pick a zip up)
- Find it: `npx wrangler d1 execute upsc-pods --env production --remote --json --command "SELECT at, actor, target FROM audit WHERE action LIKE 'desk: PUT inbox/%' ORDER BY at DESC LIMIT 10"`
- Fetch it: `npx wrangler r2 object get upsc-pods-backups/<target> --remote --file <scratchpad>/<name>.zip`
  (with `CLOUDFLARE_ACCOUNT_ID` set). Unzip it into its own empty folder, check it, and file it in
  `content/brief/aspiran-content/` as with earlier parts. Then import with the usual runbook, and tell the owner what's
  waiting.
