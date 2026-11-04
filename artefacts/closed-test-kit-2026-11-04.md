# Closed test kit: test the new version, then run the closed test hard (4 Nov 2026)

For the owner. Sign-in now works on the Play copy. This file has four parts: what to test, how to get version 3 out,
how to start the closed test today, and how to keep 12+ testers active for 14 days.

## The plan in one line
**Start the closed test today with version 2** (it's already in Play), so Google's review and the 14-day clock start
now. Build version 3 tonight and send it to the same testers as an update. An update doesn't restart the clock.

---

## Part 1. What to test (about 20 minutes)

The phone has version 2. The new views (Your sky, audio lectures, printable sheets) are in version 3, which you
haven't built yet, but they are already live on the **web app**, so test them there first. I checked all three at
phone size today; they work.

### On the phone (version 2, from Play)
| # | Try this | It should |
|---|---|---|
| 1 | Sign out, sign in again with Google | Land on Today |
| 2 | Today | Show the day's Chai cards (empty if none are published that day) |
| 3 | Pods: join or open your pod | Show the chat; Chotu is labelled "· AI" |
| 4 | Practice: open three different games | Each one ends with a finish screen; no timer, score or streak |
| 5 | A mock: answer two questions, then submit | Show your answers with explanations, no rank |
| 6 | Switch to Hindi (Profile or settings) | Text changes to Hindi; cards without Hindi stay in English |
| 7 | Sound | Off until you turn it on; nothing plays by itself |
| 8 | Airplane mode, then reopen | Saved reads and cards still open |
| 9 | Profile → delete account | The option is there (don't press it on your main account) |

### The new views (live on the web now; in the phone app from version 3)
Open https://upsc-pods-production.chotu-aec.workers.dev/app/ on your phone's browser (Chrome) and sign in. Everything
is under **Prep → Practice**, near the bottom. In version 3 of the phone app it's in the same place, and Your sky is on
**Prep → Syllabus**.

**Your sky** (Practice → **Your syllabus map**; scroll a little to "Your sky")
| # | Try this | It should |
|---|---|---|
| 10 | Look at the cards | One dark night-sky card per paper (Prelims, CSAT, GS1–GS4, Essay), in light and dark mode alike |
| 11 | Read a card's top line | Counts in words, like "4 of 7 lit · 1 can use". No percentages anywhere |
| 12 | Tap the GS2 card | The page jumps to the GS2 topic list below, and the GS2 card gets a gold border |
| 13 | Open a GS2 topic, mark it **Met**, come back | One more star is lit on GS2 |
| 14 | Mark the topic next to it as Met too | A gold line now joins the two stars |
| 15 | Leave the page and come back tomorrow | The stars are in exactly the same places |

**Audio lectures** (Practice → **Audio lectures**)
| # | Try this | It should |
|---|---|---|
| 16 | Open the list | 12 talks grouped by subject, each with its minutes |
| 17 | Open one and press Play | Nothing plays until you press Play. "Part 1 of 3" shows, and the parts play one after another |
| 18 | Skip back and forward | Web: the usual audio bar. App v3: **Back 10 s** and **Next part** buttons |
| 19 | Lock the phone for a minute | (Web: may pause. App v3: should keep playing) |
| 20 | Turn on **Read along** | The text of the talk shows |
| 21 | Answer the three quick checks | Each answer shows right or wrong with a reason. Nothing is scored |
| 22 | After all three checks, go back to the list | That talk now says "heard" |

**Printable sheets** (Practice → **Printable sheets**)
| # | Try this | It should |
|---|---|---|
| 23 | Open the list | 40 sheets grouped by subject |
| 24 | Open "Articles to know" | A clean table; on a phone it scrolls sideways inside the box, not the whole page |
| 25 | On a laptop, open a sheet and press **Print** | One tidy page, no menus or buttons on it |
| 26 | Switch to Hindi and open a sheet | The sheet is in Hindi |

**Also new**
| # | Try this | It should |
|---|---|---|
| 27 | Approve anything in the Desk, then open it in the app | It says "Editorial team" |
| 28 | Close the web app fully, reopen it a day later | New content shows without signing out and in |

Note anything odd in one line each (screen, what you did, what happened) and send it to me. A screenshot helps.

---

## Part 2. Build version 3 and send it out (about 20 minutes, tonight)

Version 3 is ready in the project (`versionCode 3`, version name 0.3.0). Same steps as your first release
(`play-store-first-release-mac.md`, steps 1–3):
1. Android Studio → File → **Sync Project with Gradle Files**.
   - Success: "Gradle sync finished" at the bottom. Failure: send me the red text.
2. Delete the old file in `android/app/release/` so you don't upload the wrong one.
3. Build → **Generate Signed App Bundle or APK…** → Android App Bundle → your key (the passwords are yours to type) →
   **release** → Create.
   - Success: "App bundle(s) generated successfully". Failure: send me the message.
4. Play Console → Test and release → **Internal testing** → Create new release → upload `app-release.aab` →
   release notes: *"Your sky, audio lectures and printable sheets."* → Next → Save and publish.
   - Failure: "Version code 3 has already been used". Tell me and I'll raise it.
5. Install it on your phone from Play (it may take up to an hour to show) and run tests 10–26 in the app.
6. If it's fine: Closed testing → Create new release → **Add from library** → version 3 → Start rollout.

---

## Part 3. Start the closed test today (about 30 minutes)

Follow Part B of `play-signin-fix-and-closed-test-mac.md`. In short:
1. **Dashboard first.** Everything under "Set up your app" must be ticked: store listing (text and images in
   `artefacts/play/`), privacy policy, ads (none), **app access** ("Sign in with any Google account. No special access
   needed."), content rating, target audience (18+), data safety, government app (no), financial features (none),
   health (none).
2. **Testers as a Google Group** (easiest way to add people without typing emails):
   - groups.google.com → Create group → name **Aspiran testers**, email `aspiran-testers` → anyone can ask to join →
     Create.
   - Play Console → Closed testing → Testers → **Google Groups** → add `aspiran-testers@googlegroups.com` → Save.
   - People join the group themselves, then use the opt-in link.
3. **Release:** Create new release → Add from library → **version 2** → Start rollout to Closed testing.
   - Success: "In review". Google usually takes a few hours to 3 days the first time.
4. **Copy the opt-in link** from the Testers tab. You'll send it with the message in Part 4.

---

## Part 4. Getting 12+ testers and keeping them (14 days)

Google needs **at least 12 testers opted in for 14 days in a row**. Aim for **20**, because some will drop out. Then
Google asks you questions about the test before production; the log at the end helps you answer them.

### Who to ask
Aspirants you know, your pod members from the web app, coaching friends, family with Android phones. They need an
Android phone and a Gmail account. iPhone users can't join; send them the web app instead.

### Message to send (English)
```text
I'm building Aspiran, a free study app for UPSC aspirants: small study pods, daily current affairs cards,
practice and mocks, in English and Hindi. Can you test it for 14 days? It takes 5 minutes a day.

1. Join this group with your Gmail: https://groups.google.com/g/aspiran-testers
2. Open this link on your Android phone and tap "Become a tester": <OPT-IN LINK>
3. Install Aspiran from the Play Store link on that page and sign in with the same Gmail.

Please keep it installed for 14 days and open it most days. Tell me anything that's confusing or broken.
Thank you!
```

### Message to send (Hindi)
```text
मैं Aspiran बना रहा हूँ: UPSC की तैयारी करने वालों के लिए एक मुफ़्त ऐप। छोटे स्टडी पॉड, रोज़ के करंट अफ़ेयर्स कार्ड,
प्रैक्टिस और मॉक टेस्ट, अंग्रेज़ी और हिंदी में। क्या आप 14 दिन इसे टेस्ट करेंगे? रोज़ बस 5 मिनट लगेंगे।

1. अपने Gmail से यह ग्रुप जॉइन करें: https://groups.google.com/g/aspiran-testers
2. अपने Android फ़ोन पर यह लिंक खोलें और "Become a tester" दबाएँ: <OPT-IN LINK>
3. उसी पेज के Play Store लिंक से Aspiran इंस्टॉल करें और उसी Gmail से साइन इन करें।

कृपया इसे 14 दिन इंस्टॉल रखें और ज़्यादातर दिन खोलें। कुछ उलझन भरा या टूटा लगे तो मुझे बताएँ। धन्यवाद!
```
(If you'd rather say "रही हूँ", change it; I wrote it in the masculine as a default.)

### A small task each day (send one line a day to a WhatsApp group of testers)
| Day | Today's task |
|---|---|
| 1 | Sign in, pick your exam year and subjects |
| 2 | Read today's Chai cards |
| 3 | Join a pod and say hello |
| 4 | Play two practice games |
| 5 | Open Progress → Syllabus and mark three topics you've met |
| 6 | Try one long read in Hindi |
| 7 | Take a short mock |
| 8 | Ask Chotu (the AI buddy) one doubt about a topic |
| 9 | Do a flashcard deck |
| 10 | Open a GS4 case and write a short answer |
| 11 | Look at Your sky in Prep → Syllabus (after the version 3 update) |
| 12 | Listen to an audio lecture (Prep → Practice) |
| 13 | Open a printable sheet (Prep → Practice) |
| 14 | Tell me the one thing you'd change |

Remind people gently. Never ask for ratings or reviews. Google doesn't allow that during a test.

### Feedback log (keep it as you go; Google asks about it)
Write one line per piece of feedback in `artefacts/closed-test-feedback-log.md`: date, tester (first name only),
what they said, what we changed. Send me the lines and I'll fix what I can and keep the log up to date.

---

## After 14 days
Play Console → Dashboard → **Apply for production**. Google asks how you found testers, what feedback you got, and
what you changed. The feedback log answers all three. I'll draft the answers when you get there.
