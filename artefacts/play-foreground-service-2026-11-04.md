# Play Console: Foreground service permissions (4 Nov 2026)

**Update, same day: no longer needed.** The app no longer uses a foreground service (versionCode 6, 0.4.1). Upload
the new bundle; once it's the only one on any track, Play stops asking. If the page still shows, click Discard and
leave it until version 6 is up. The notes below are kept for the record.

**Why Play is asking:** the app uses `FOREGROUND_SERVICE_DATA_SYNC` for one job: downloading offline Chotu's
AI model (a Gemma file of a few GB). The person starts the download themselves by tapping Download on the
consent card in the Chotu tab. While it runs, a silent notification shows "Downloading Chotu · <size> · <n>%",
so the download isn't cut off when the person leaves the app. Nothing else uses it: no backups and no sync.

## What to fill in

1. **Untick "Backing up, restoring".** The app doesn't back anything up, so that answer would be wrong.
2. **Tick "Other"** (under Network processing) and paste this into the box:

   > The user taps Download to get Chotu, the app's offline AI study assistant. The model file is several gigabytes,
   > so the download runs as a foreground service with a visible progress notification. This lets it finish if the
   > user leaves the app, and it can be resumed if the network drops. It runs only after the user taps Download,
   > uses Wi-Fi only unless they choose mobile data, and stops when the file has finished downloading.

3. **Video link:** a 30–60 second screen recording, uploaded to YouTube as **Unlisted**, with the link pasted in.
4. Click **Save**.

## Recording the video (on your Android phone, with the closed-test build installed)

1. Pull down Quick Settings → **Screen record** → start it, with sound off.
2. Open Aspiran → **Chotu** tab → tap **Download** on the card, then allow notifications if asked.
3. Press Home to leave the app, pull down the notification shade, and show the "Downloading Chotu … %" notification.
4. Wait a few seconds so the percentage visibly goes up, then reopen the app.
5. Stop the recording.
6. Upload it to YouTube: Create → Upload video → Visibility **Unlisted** → copy the link.

If the download starts and ends too quickly to show, turn off Wi-Fi first and choose "Use mobile data instead",
or just record the first 20–30 seconds. Showing the progress notification while you're outside the app is what matters.
