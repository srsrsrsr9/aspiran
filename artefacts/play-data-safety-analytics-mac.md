# Play Data safety: what to tick after the analytics update (Android 0.5.8, build 16)

20 Nov 2026. For the owner. Do this in Play Console before (or together with) sending 0.5.8 for review.
Nothing here is typed in Terminal; it is all clicks in the browser. It replaces the "App activity" and adds the
"App info and performance" rows of the table in `artefacts/play/store-listing.md`; everything else there stays.

## Why it changes
From 0.5.8 the app counts studying as codes and numbers: notes and audio opened and finished, practice answers right or
wrong, reviews, mocks (never the score), Mains answers written (word count, never the words), minutes in the pod and how
many messages were sent (never the words, and only to our own server), searches (how many results, never what was
typed), shares, and the Play install link's campaign (utm only). The app already sent screens, taps, crashes and masked
session replays to PostHog. Play wants all of that declared.

## Step 1. Open the form
1. Go to https://play.google.com/console and choose **Aspiran**.
2. Left menu: **Policy and programs → App content**. Find **Data safety** and click **Manage** (or **Start**).
- Success: you see "Data collection and security" as the first page.
- Failure "you don't have permission": you're in the wrong Google account. Switch to the owner account (top right).

## Step 2. Data collection and security (first page)
- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes**
- Which of the following methods of account creation does your app support? **OAuth** (Sign in with Google). If you
  have password sign-in switched on in Admin → Feature flags, also tick **Username and password**.
- Delete account URL: `https://aspiran.in/legal/privacy.html#delete`
- Do you provide a way for users to request that some or all of their data is deleted, without deleting their
  account? **No** (deletion is the whole account).
Click **Next**.

## Step 3. Data types (tick these, leave the rest)
| Section | Tick | Collected or shared |
|---|---|---|
| Personal info | Email address; User IDs | Collected |
| Financial info | Purchase history | Collected |
| Messages | Other in-app messages | Collected |
| Photos and videos | Photos | Collected |
| App activity | **App interactions**; **In-app search history**; Other user-generated content; **Other actions** | Collected |
| App info and performance | **Crash logs**; **Diagnostics** | Collected |
| Device or other IDs | **Device or other IDs** | Collected |

Leave unticked: location, contacts, phone number, name, address, race, health and fitness, calendar, audio, files,
web browsing, installed apps.

Notes on the new ticks:
- **In-app search history**: Play counts "the user searched" as this, even though we keep only how many results came
  back, never the words. Ticking it is the safe answer.
- **Other actions**: "finished a note, a review, a mock" and similar.
- **Device or other IDs**: PostHog gives each install a random id, and the app keeps a random install id for counts.
  It is not the advertising id; we don't read that.
- Shared: answer **No** for every row. PostHog, Firebase, Cloudflare, Cashfree and the answer-marking providers act on
  our behalf, which Play calls "service providers", not sharing.

Click **Next**.

## Step 4. For each ticked type, Play asks four questions
Answer them like this. Play shows one small form per type; the answers repeat.

| Data type | Collected / processed | Required or optional | Why (tick these) |
|---|---|---|---|
| Email address | Collected (kept) | Required | Account management |
| User IDs | Collected (kept) | Required | App functionality; Account management; Analytics |
| Purchase history | Collected (kept) | Optional | App functionality |
| Other in-app messages | Collected (kept) | Optional | App functionality |
| Photos | Processed only ("ephemeral": yes) | Optional | App functionality |
| App interactions | Collected (kept) | **Optional** (Me → Privacy → Usage analytics switches PostHog off) | Analytics; App functionality |
| In-app search history | Collected (kept) | Optional | Analytics |
| Other user-generated content | Processed only ("ephemeral": yes) | Optional | App functionality |
| Other actions | Collected (kept) | Optional | Analytics; App functionality |
| Crash logs | Collected (kept) | Optional | Analytics |
| Diagnostics | Collected (kept) | Optional | Analytics |
| Device or other IDs | Collected (kept) | Optional | Analytics |

"Ephemeral" means Play's question "Is this data processed ephemerally?" → **Yes** only for Photos and Other
user-generated content (answer photos and typed answers are marked and not stored).

Never tick **Advertising or marketing**, **Fraud prevention** or **Personalisation** for any row: we do none of those
with this data.

## Step 5. Save and send
1. Click **Next** to see the preview, check it says "No data shared with third parties", then **Save**.
2. Play shows "Data safety: changes saved". It goes for review with your next release (0.5.8) or by itself.
- Success: App content shows Data safety with a green tick or "In review".
- Failure "your declaration doesn't match your app": usually Device or other IDs or Crash logs is missing. Tick
  both (Step 3) and save again.

## After that
- The privacy policy (https://aspiran.in/legal/privacy.html) already says all of this (updated 20 Nov 2026), so no
  change is needed there.
- Admin → Insights shows PostHog's parts only once you add a read-only PostHog key. That's separate from this form.
  In PostHog: your picture → **Personal API keys** → **Create**, scope **Query: Read**, project Aspiran. Then in
  Terminal, in the `server` folder, run the command below and paste the key when it asks (it isn't shown as you paste).

```bash
npx wrangler secret put POSTHOG_PERSONAL_KEY --env production
```

- Success: "✨ Success! Uploaded secret POSTHOG_PERSONAL_KEY". Insights shows the website cards within a minute.
- Failure "not logged in": run `npx wrangler login` first, then the command again.
