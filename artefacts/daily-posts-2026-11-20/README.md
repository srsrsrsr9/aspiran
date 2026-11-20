# Daily posts: Telegram, WhatsApp, Reels and Shorts (20 Nov 2026)

Step 3 of the sales build order. What's built, what you do, and what's in this folder.

## Decisions up front

- **Telegram posts by itself** once you've made the channel and bot (runbook below) and switched on the
  `daily_posts` flag. Until then nothing is sent. The flag is **off**.
- **WhatsApp can't be posted to automatically.** WhatsApp Channels have no posting API at all, and the WhatsApp
  Business (Cloud) API only messages people who opted in, needs Meta Business verification and approved message
  templates, and charges per message. So Admin → **Daily posts** gives you the day's WhatsApp text (one Copy button)
  and the image (Download PNG) to paste into your WhatsApp channel or a broadcast list. About one minute a day.
- **Reels and Shorts are files only.** `reels/calendar.md` is one short a day for 80 days (23 Nov 2026 to
  10 Feb 2027), with a caption file for each post. You upload; nothing here signs in anywhere.

## What goes out each morning

At **07:30 IST**, after the 07:00 Chai (and again each hour until 12:30 if the Chai was late or a send failed):

1. One Telegram message: today's three Chai cards (headline, Hindi headline when there is one, short summary,
   GS paper), each ending with **Test yourself: one tap**, then the **past question of the day**.
2. For a Prelims question with UPSC's official key, a Telegram **quiz poll** right after it (members tap an answer
   and Telegram shows the right one). Mains questions get the word limit and a link to write and mark it.

Rules kept: a **tragic** card is never posted (it stays in the app), nor one marked not shareable; no "AI" label; no
scores, streaks or timers. The past question is the same all day and changes each day, across all approved papers.

Every link opens app.aspiran.in with UTM tags, so Analytics shows where people came from:
`utm_source` = telegram | whatsapp | youtube, `utm_medium` = chai | pyq | footer | shorts, `utm_campaign` = daily-2026-11-20
(or short-011-en for a Short).

Samples (made from **sample data**, not a real day): `samples/2026-11-20/` and `samples/2026-11-21/`, each with
`telegram-preview.html` (open it in a browser), `telegram.html.txt`, `whatsapp.txt` and `image.png`.

## Runbook: set up Telegram (about 10 minutes, on your Mac and phone)

**Step 1. Make the channel (Telegram app on your phone).**
Menu → New Channel → name it "Aspiran: daily Chai for UPSC" → description: "Three current-affairs cards and a past UPSC
question every morning. Free, English and Hindi. app.aspiran.in" → **Public** → link: `aspiran_daily` (or another
free name). Write down the @name.
- Worked: the channel opens and shows t.me/aspiran_daily.
- If the name is taken: try `aspiran_chai` or `aspiranupsc`; any works, you'll type it in Step 5.

**Step 2. Make the bot.** In Telegram, open a chat with **@BotFather** (the blue tick one) → send `/newbot` →
name: `Aspiran Daily` → username: `aspiran_daily_bot` (must end in `bot`). BotFather replies with a **token**
(numbers, a colon, letters). Keep that message open; don't paste the token anywhere else, not even to Claude.
- If the username is taken: try another ending in `bot`.

**Step 3. Make the bot an admin of the channel.** Channel → Edit (pencil) → Administrators → Add Admin → search
`aspiran_daily_bot` → give it only **Post messages** → Save.
- Worked: the bot is listed under Administrators.

**Step 4. Give the server the token.** On your Mac, open Terminal and run:

```bash
cd ~/Documents/app/server
```

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN --env production
```

When it asks, paste the token from BotFather and press Return. Nothing shows while you paste; that's normal.
- Worked: "✨ Success! Uploaded secret TELEGRAM_BOT_TOKEN".
- If it says you're not signed in: run `npx wrangler login`, sign in in the browser, then run the command again.

**Step 5. Save the channel and send a first post by hand.** Open admin.aspiran.in → **Daily posts** → type the
channel's @name (e.g. `@aspiran_daily`) → Save. The line at the top should now say "bot token set". Once today's
Chai is out, press **Post to Telegram now** and check the channel.
- If it says "chat not found": the @name is wrong, or the channel is private. Check Step 1.
- If it says "not enough rights" or "bot is not a member": redo Step 3.

**Step 6. Switch it on.** Admin → Feature flags → tick **Daily posts** → Save. From the next morning it posts at
07:30 IST by itself. Admin → Daily posts shows whether today's went out, or why not.
- To stop: untick the flag. Nothing else changes.

## Every day: WhatsApp (about a minute)

Admin → **Daily posts** → **Copy text** → paste into the WhatsApp channel (or broadcast list) → **Download image
(PNG)** → attach it. If you'd rather post only the image with a short line, the image already carries the
address.

## Reels and Shorts

- `reels/calendar.md`: the plan, a week per section. `reels/calendar.csv`: the same for a spreadsheet.
- `reels/captions/<date>-<number>-instagram-en.txt`: paste as the Instagram caption.
- `reels/captions/<date>-<number>-youtube-en.txt` and `-youtube-hi.txt`: the title and description for YouTube.
- The video is the `.social.mp4` named in the calendar, inside the zip it names in `docs/content/asp/`.
- Suggested times: Hindi Short 12:30, English Short and Reel 18:30 IST. Papers take turns day by day; serious
  shorts get a plain caption with no emoji and are kept off Sundays.
- 80 shorts have a social cut today (numbers 11 to 20 and 31 to 100; numbers 1 to 10 and 21 to 30 aren't in the
  zips). When more zips land, run again (it rewrites the calendar):

```bash
cd ~/Documents/app && node content/tools/reels-calendar.mjs --start 2026-11-23
```

The Hindi YouTube titles use the English title with "(हिंदी)"; if you have Hindi titles, edit the caption files.

## For Claude (how it's built)

- `server/src/posts.ts`: the builder (`buildDailyPost`, `pickPyq`, `postImageSvg`), the Telegram sender and the cron
  step; `index.ts` calls `runDailyPosts` at the POST_SLOTS times. Settings keys `daily_posts` (channel) and
  `daily_posts_log` (last 30 days of sends). Admin routes `posts`, `posts/settings`, `posts/send` (permission `flags`).
- Secret `TELEGRAM_BOT_TOKEN`; tests use `TELEGRAM_API_BASE` for a stand-in. Test: `npm run test:all -- posts`.
- Samples: `node scripts/sample-posts.mjs ../artefacts/daily-posts-2026-11-20/samples/sample-brief.json <out> [day]`.
