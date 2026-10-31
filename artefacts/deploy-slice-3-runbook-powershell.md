# Production deploy: slice 3 addendum, PowerShell 5.1 (2026-10-24)

Slice 2 is already live (the room board and the Plus lock answer on production).

What this adds:
- **Email password recovery** for username accounts. It stays off until you add a mail key.
- **A softer offline gate:** the app stays readable offline.
- **Play Billing for Plus:** built, but the `play_billing` flag stays off.
- **The content drafts:** 30 syllabus notes, 3 CSAT passages, 3 full Prelims GS1 mocks, and the syllabus map for the optionals and language papers.

How to run it:
- Paste one line at a time and wait for it to finish.
- If a step fails, stop and send me the full output.
- Use `curl.exe`, not `curl`.

## Steps 1–4: in the server folder
```powershell
cd "C:\Users\Srinivas Vedantham\Documents\Personal\app\server"
```

### 1. Back up the live database
```powershell
npx wrangler d1 export upsc-pods --env production --remote --output="C:\Users\Srinivas Vedantham\Documents\Personal\app-backups\upsc-pods-2026-10-24-slice3.sql"
```
- **Success:** wrangler says the export is done. The file in `app-backups` is larger than 0 bytes.
- **If it fails:** stop here. If the error mentions login, run `npx wrangler login` and try again.

### 2. New tables (two migrations)
```powershell
npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0006_password_recovery.sql
npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0007_play_purchases.sql
```
- **Success:** wrangler reports the queries ran, once for each file. Both files use `IF NOT EXISTS`, so repeating them is harmless. The Worker would also create these tables on first use.
- **If it fails:** stop. Nothing has changed, and your backup is in place.

### 3. Secrets (optional today)
**Email recovery.** Leave this out and recovery simply stays off: the apps say to write to support, and staff resets still work.

To switch it on:
1. Make a Resend account and verify a domain you own there.
2. Run the first line below and type the key when it asks. Never put it in a file.
3. Run the second line. For the sender, type something like `UPSC Pods <no-reply@your-domain>`, on the domain you verified.
```powershell
npx wrangler secret put RESEND_API_KEY --env production
npx wrangler secret put MAIL_FROM --env production
```
- **Success:** each one prints "Success! Uploaded secret".

**Play Billing.** Don't set anything now. The secret is only needed when you set up Play Console (see owner-and-editor-actions.md). Then you'll run:
`Get-Content -Raw "<path to the service account .json>" | npx wrangler secret put PLAY_SERVICE_ACCOUNT_JSON --env production`

### 4. Deploy the Worker
```powershell
npm run deploy
```
- **Success:** the output ends with `https://upsc-pods-production.chotu-aec.workers.dev` and a "Current Version ID" line.
- **If it fails:** the old version keeps running, so the live app is unaffected. Send me the output.

## Step 5: upload the content drafts, from the app folder
Deploy (step 4) must come first: this deploy is what keeps each mock question's syllabus nodes on import.
```powershell
cd "C:\Users\Srinivas Vedantham\Documents\Personal\app"
node server\scripts\syllabus.mjs check
node server\scripts\syllabus.mjs pack "C:\Users\Srinivas Vedantham\Documents\Personal\app-packs\syllabus-2026-10-24"
cd server
$env:EDITOR_TOKEN = Read-Host "Production editor token"
$env:BASE = "https://upsc-pods-production.chotu-aec.workers.dev"
npm run import -- "C:\Users\Srinivas Vedantham\Documents\Personal\app-packs\syllabus-2026-10-24"
```
- **Success:**
  - `check` lists the three mocks at 100 questions each and reports no problems.
  - `pack` says `30 reads, 4 mocks`.
  - The import ends with `Imported. Approve on the desk`.
- **If the import says 401:** the token is wrong. Run the `Read-Host` line again.
- **If a file fails to upload:** run the import line again. Uploads overwrite, so repeats are safe.

Everything arrives on the desk as a **draft**: the 30 reads, the CSAT set and the three mocks. Release builds don't show any of it until an editor approves each item.

## Step 6: smoke checks
```powershell
$B = "https://upsc-pods-production.chotu-aec.workers.dev"
curl.exe -s "$B/health"
$C = curl.exe -s "$B/config" | ConvertFrom-Json
$C.flags.play_billing
$C.auth.recovery
(curl.exe -s "$B/library" | ConvertFrom-Json).items | Where-Object { $_.id -like "*full-mock*" }
curl.exe -s -H "authorization: Bearer $env:EDITOR_TOKEN" "$B/desk/api/library" | findstr /c:"pre-gs1-full-mock-1"
curl.exe -s -o NUL -w "%{http_code}`n" "$B/media/ca/2026-41/02-el-nino.mp4"
```
- **Success:**
  - `/health` answers `"ok":true`.
  - `$C.flags.play_billing` prints `False`: Play Billing is off.
  - `$C.auth.recovery` prints `False` if you skipped step 3, or `True` if you set both mail secrets.
  - The `/library` line prints **nothing**: the drafts are not public.
  - The desk line prints a long line: the mock is on the desk.
  - The last line prints `403`: the Plus lock still holds.
- **If the `/library` line prints something:** a mock was approved. Check the desk.

To test email recovery, if you set it up: sign in on the web with a username account, then go to Me → Account → Recovery email and add your address. Type the 6-digit code from the email. Sign out, choose "Forgot password?", and follow the link.

## Step 7: release APK, in Android Studio
1. Open `C:\Users\Srinivas Vedantham\Documents\Personal\app\android` in Android Studio. The folder is on `master`, with everything merged.
2. Choose Build → Generate Signed App Bundle or APK → APK, then Next. Pick your `upload.jks` and type its passwords yourself. Choose the `release` variant, then Create.
- **Success:** "APK(s) generated successfully".
- **If it fails:** a wrong password says so plainly. For anything else, send me the Build window's output.

Then copy it:
```powershell
Copy-Item "C:\Users\Srinivas Vedantham\Documents\Personal\app\android\app\release\app-release.apk" "C:\Users\Srinivas Vedantham\Documents\Personal\app\artefacts\apk\upsc-pods-release-2026-10-24-slice3.apk"
```

Play Billing is off in this build. The purchase code is only switched on with `-Pupsc.playBilling=true`, which a normal Android Studio build doesn't pass.

## Notes
- **New permission:** the Play Billing library adds the `com.android.vending.BILLING` permission to the app, even with the flag off. That's normal, and Play Console accepts it.
- **Billing library version:** it's Billing Library 8. Play stops accepting app updates built with version 7 from 1 Nov 2026.
- **The web app:** it caches its whole shell for offline use (cache v15). Visitors get the new version the next time they open it online.
