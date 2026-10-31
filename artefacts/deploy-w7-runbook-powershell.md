# Production deploy, PowerShell version (2026-10-24)

This is the same runbook as `deploy-w7-runbook.md`, written for Windows PowerShell 5.1.

- Paste one line at a time.
- Wait for each step to finish before starting the next.
- If a step fails, stop and send me the full output.

## Steps 1–5: run in the server folder

Go to the server folder first:
```powershell
cd "C:\Users\Srinivas Vedantham\Documents\Personal\app\server"
```

### 1. Back up the live database
This file holds members' data. Keep it out of git and out of shared folders.
```powershell
New-Item -ItemType Directory -Force "C:\Users\Srinivas Vedantham\Documents\Personal\app-backups"
npx wrangler d1 export upsc-pods --env production --remote --output="C:\Users\Srinivas Vedantham\Documents\Personal\app-backups\upsc-pods-2026-10-24.sql"
```
- **Success:** wrangler reports the export is done. `Get-Item "C:\Users\Srinivas Vedantham\Documents\Personal\app-backups\upsc-pods-2026-10-24.sql"` shows a file larger than 0 bytes.
- **If it fails:** don't go on to step 2. If the error mentions login or authentication, run `npx wrangler login` and try again.

### 2. Add the new table (room_members, for open pods)
```powershell
npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0005_rooms.sql
```
- **Success:** wrangler reports the queries were executed. The SQL uses `IF NOT EXISTS`, so running it twice is harmless.
- **If it fails:** stop. Nothing has changed yet, and the backup from step 1 is in place.

### 3. Deploy the Worker
```powershell
npm run deploy
```
- **Success:** the output ends with the URL `https://upsc-pods-production.chotu-aec.workers.dev` and a "Current Version ID" line.
- **If it fails:** the old version keeps running, so the live app is unaffected. Send me the output.

### 4. Upload the current-affairs week to the media bucket
```powershell
Get-ChildItem "C:\Users\Srinivas Vedantham\Documents\Personal\app\content\motion\ca\2026-41" -File | ForEach-Object { npx wrangler r2 object put "upsc-pods-media/ca/2026-41/$($_.Name)" --remote --file="$($_.FullName)" }
```
- **Success:** you see 11 "Upload complete" lines: manifest.json, three each of .mp4, .vtt and .jpg, and week.mp4.
- **If it fails:** re-run the same line. Each upload overwrites the file, so repeats are safe.

### 5. Smoke checks
```powershell
$B = "https://upsc-pods-production.chotu-aec.workers.dev"
curl.exe -s "$B/health"
curl.exe -s "$B/ca"
curl.exe -s "$B/ca/2026-41"
curl.exe -s -I "$B/media/ca/2026-41/01-gi-tag.mp4"
```
Use `curl.exe`, not `curl`: in PowerShell 5.1, plain `curl` is a different command.
- **Success:**
  - `/health` answers OK.
  - `/ca` lists week `2026-41` with `"scenes":3`.
  - `/ca/2026-41` shows 3 episodes.
  - The last line shows `HTTP/1.1 200`, `content-type: video/mp4` and `accept-ranges: bytes`.
- **If `/ca` is empty:** the manifest upload in step 4 didn't land, so re-run step 4.
- **If you get "Not found" on /ca:** step 3 didn't deploy, so re-run step 3.

## Step 6: release APK, from the android folder

Fill in the path to your `keystore.properties` first. The build looks in `C:\Users\Srinivas Vedantham\Documents\Personal\upsc-pods-keys\keystore.properties` by default. If yours is there, you can leave out the `-PkeystoreProperties=...` part.
```powershell
cd "C:\Users\Srinivas Vedantham\Documents\Personal\app\android"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
& "C:\Users\Srinivas Vedantham\.gradle\wrapper\dists\gradle-9.8.1-bin\a2l6ltp3k1vth6lwipzm5p2jp\gradle-9.8.1\bin\gradle.bat" :app:assembleRelease "-PkeystoreProperties=<FULL PATH TO keystore.properties>"
```
The repo has no `gradlew` wrapper script, so this calls Gradle directly.
- **Success:** the output ends with `BUILD SUCCESSFUL`, and `app\build\outputs\apk\release\app-release.apk` has today's date.
- **If it fails:**
  - **"Release signing isn't set up":** the path is wrong. Check it, keeping the quotes around the whole `-P...` argument.
  - **Wrong password:** fix the passwords in `keystore.properties`.

Then copy the APK next to the others:
```powershell
Copy-Item "app\build\outputs\apk\release\app-release.apk" "C:\Users\Srinivas Vedantham\Documents\Personal\app\artefacts\apk\upsc-pods-release-2026-10-24.apk"
```
Installing it over the debug build may fail, because the two are signed with different keys. If it does, uninstall the debug app on the phone first.

## Notes
- **Approved scenes:** all three are approved (commit 55fa30b), so the release app shows the week on Prep → Today.
- **Paywall:** Plus scene videos can still be fetched from `/media/ca/...` by anyone who knows the path. The lock is in the app only.
