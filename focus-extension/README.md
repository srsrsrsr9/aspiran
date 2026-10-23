# UPSC Pods Focus (Chrome and Edge extension)

Closes distracting sites while a focus block or mock paper runs in the UPSC Pods web or desktop app,
and keeps daily limits (for example, 30 minutes of YouTube a day). Everything stays in this browser.

## Add it
1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on Developer mode.
3. Click Load unpacked and pick this `focus-extension` folder.
4. Reload the UPSC Pods app. Focus should say "Focus extension connected".

## How it works
- The app passes its Focus settings to the extension: the blocklist, the daily limits and the pause length.
  It does this through `bridge.js`, which runs only on pages carrying the app's marker.
- During a block, a blocked site opens a calm page instead. That page shows the time left, "Back to studying",
  and, after a short pause (10 seconds by default), "Open for 5 minutes".
- A daily limit counts only the minutes a limited site is the active tab of a focused window while you're
  using the computer. Once the minutes are used, the site closes until midnight.
- Nothing is sent anywhere. Settings and minutes live in `chrome.storage.local`.

## Deployed app
The bridge runs on `localhost`, `127.0.0.1`, `*.workers.dev` (including the live app,
`https://upsc-pods-production.chotu-aec.workers.dev`). To add a custom domain later, edit two places, then
reload the extension in `chrome://extensions`:
1. `config.js`: the `APP_ORIGINS` list (the origins the bridge will talk to).
2. `manifest.json`: the same domain in `content_scripts.matches`, as `https://your-domain/*`.

Chrome only injects scripts on sites listed in the manifest, so both are needed.

For the Chrome Web Store, it would need a privacy policy and a justification for `<all_urls>`, which it uses
to redirect blocked sites. Publishing it is a separate step and hasn't been done.
