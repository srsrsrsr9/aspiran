# Runbook: switch on Chotu's and Jeetu's voices (macOS Terminal, zsh)

One command. Do it **after** the main session says the voices branch is deployed. Until you do, the Listen button
simply doesn't show anywhere, and nothing else changes.

You need: the Fish Audio API key (it is in your Mac's Keychain as `fish-audio-api-key`, account `aspiran`; you can
also copy it from fish.audio → API keys).

## Step 1. Give the live server the key

Open Terminal and run these two lines, one at a time:

```bash
cd ~/Documents/app/server
```

```bash
npx wrangler secret put FISH_AUDIO_API_KEY --env production
```

It asks: `Enter a secret value:`. Paste the key and press Return. Nothing shows while you paste; that's normal.

- **Success looks like:** `✨ Success! Uploaded secret FISH_AUDIO_API_KEY`. The server picks it up within a minute.
- **If it says you're not logged in** (`You are not authenticated` or a browser window opens): run
  `npx wrangler login`, approve in the browser, then run the `secret put` line again.
- **If it says `Worker "upsc-pods" not found` or asks to create a new Worker:** answer **no**, check that the first
  line (`cd ~/Documents/app/server`) worked, and run the `secret put` line again.
- **If you pasted the wrong thing:** just run the same line again with the right key; it replaces the old one.

## Step 2. Check it (no Terminal needed)

1. Open https://admin.aspiran.in → **AI usage**. The "AI voices (Fish Audio)" card should say **On**.
   - If it says "Off: no FISH_AUDIO_API_KEY secret": wait a minute and reload; if still off, redo step 1.
2. On that card press **Make the scripted lines now**. It should answer something like "30 made, 0 already kept".
   (Between 23:30 and 07:00 IST Jeetu's lines wait; press it again in the morning.)
   - If it says some **failed**: the key is probably wrong or the credits have run out. Check fish.audio → Billing,
     then redo step 1 with a fresh key.
3. Open https://app.aspiran.in → Me → Rhythm. Under the dots, tap **Listen · AI voice** next to "No. Drink your chai."
   You should hear Jeetu.

## To switch the voices off again
Admin → **Feature flags** → switch off **voice**. The button disappears from both apps at their next open. (Your
decision to make in Admin; Claude never changes a live flag.)
