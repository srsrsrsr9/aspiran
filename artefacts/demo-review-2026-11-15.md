# Does the demo help sell? Review of 15 Nov 2026

The live site and demo, reviewed on 15 Nov 2026 after the same-day fixes. Two reviewers worked separately: a UX reviewer who walked the live pages in a browser, and a marketing reviewer who traced the funnel and its tracking. Nothing was changed, deployed or switched on. Screenshots are in `artefacts/demo-review-2026-11-15/`.

## Verdict: partly

The demo now shows off where it counts. The Federalism route is good teaching: guess first, a short read, the Governor's desk game, real past questions with "how sure?", a Mains plan, and cards you keep. The Hindi version reads naturally. The video and audio work, nothing plays by itself, and captions are on. **But the demo sells at the wrong moments.** The site promises "Federalism, start to finish, in about 20 minutes", then opens a list of eight topics. A visitor from the Hindi site lands in English. At the finish, the Join button sits under a seven-question survey and a contact form: about 4½ phone screens down. "Join free" then opens a generic sign-up screen that asks the website's quiz question again and never says "your cards come with you". And you can't yet measure where people stop.

**The three changes that would matter most:**
1. **Make the finish screen ask for the sign-up first.** Put "Join free, keep your 9 cards" and one line on the real library size straight after "You can now". Move the survey below it, shorter. When a visitor arrives from the demo, the sign-up screen should say their progress comes with them and skip the quiz question. *(small to medium)*
2. **Send visitors straight into Federalism, in their language.** Link every site "Try" button to Federalism's cover, say "about 15 minutes", and carry Hindi from the Hindi site through the demo and sign-up. Also give Federalism's cover a recorded note about Federalism: today it plays one about Constitutional bodies. *(small)*
3. **Measure the funnel.** Record "step reached", "finished" and the finish-screen Join click. Give demo rows the same ID as the app, and keep which site button was clicked. *(medium)*

---

## Part 1: UX findings (ranked)

### 1. The finish screen buries the sign-up under the survey
- **What I saw:** On Federalism's finish screen, the first big button after "You can now" is "Carry on into the whole topic". Next come two side doors, then "Tell us honestly": six questions, a 0–10 scale and a contact form, then "Send my answers". Only then does "Join free, no card needed" appear, about 2,550 px down on a laptop and about 4.7 screen-heights down on a phone. The "Join free" strip that sits under every other step is **not** on the finish screen. The two orange buttons, "Send my answers" and "Join free", sit one above the other. (Screenshots 07, 08, 16.)
- **Why it matters:** This is the moment of highest goodwill: the visitor has just learned something. Most will stop at "Send my answers", or leave before scrolling. The survey's Plus question also lists different Plus features ("every mock paper, mock insights … weekly Chai test and monthly compilation") from the site's price block ("unlimited answer marking and rewrites, all mocks, essays, more Chotu"). And the contact box says "when the full app opens", which suggests the app isn't open yet when Join works today.
- **Change:** Order the finish screen as: "You can now" → **Join block** ("Join free, keep your 9 cards" plus one honest numbers line) → "Carry on into the whole topic" → side doors → survey, folded under "Tell us honestly (2 min, optional)". Make the survey's Plus line match the site. Change "when the full app opens" to "when something you asked for is built".
- **Size:** small.

### 2. "Join free" leads to a cold sign-up screen
- **What I saw:** Join opens the general first screen, "Remember what you read. … One question first", with the same Preamble question the website asked. Nothing says the visitor just finished Federalism, or that their cards come along. (Screenshot 09.)
- **Why it matters:** It feels like starting over, right at the point of commitment.
- **Change:** When the visitor arrives from the demo, skip the question and show: "Your Federalism cards come with you. Continue with Google." Keep the rest of the screen.
- **Size:** small to medium.

### 3. The first 10 seconds: a list where the site promised Federalism
- **What I saw:** The site hero is clear and strong ("What you read in October is gone by March."). The line under the button says "One whole topic, Federalism, start to finish, in about 20 minutes". The button opens "Try one topic", a list of eight long syllabus titles. Federalism is marked "Start here" and is clearly the right choice. Federalism's cover then says "Express · 15 min" and "Whole topic · 75 min". (Screenshots 01, 02, 03.)
- **Why it matters:** One extra decision, and a small broken promise, before any value. Once on Federalism's cover, the headline "Learn one UPSC topic properly. Judge us by it." works well.
- **Change:** Link the site straight to Federalism's cover and keep "All topics" there. Reword the site line to "about 15 minutes". (Same as marketing finding 1.)
- **Size:** small.

### 4. Bug: Federalism's "hear it" note is about another topic
- **What I saw:** On Federalism's cover, "Listen" plays "Constitutional bodies: CAG, UPSC, Finance Commission", a 7-minute AI-voice note. Constitutional bodies' cover has the same note. (Screenshots 03, 10.)
- **Steps to reproduce:** Open https://app.aspiran.in/app/#try/path-pol-federalism and look at "See it and hear it". Then open "All topics" → Constitutional bodies. Both covers play the same note.
- **Why it matters:** On the "Start here" topic, the one recording a visitor might play isn't about the topic. It is also 7 minutes, not a quick taste.
- **Change:** Use a Federalism note if one exists. If not, label it honestly ("From the Polity notes: Constitutional bodies") or play a 1–2 minute clip.
- **Size:** small.

### 5. Video and audio: they work, but need two taps and take a lot of space
- **What I saw:**
  - Tapping the video poster loads the player, and a second tap plays it. Nothing autoplays.
  - Captions are on by default and readable (screenshot 04). The video is 41 seconds.
  - On a phone, the portrait poster is about 490 px tall: more than half the screen. The audio player sits under it, about 1.7 screens down.
  - In Hindi, the video's title is translated, but the poster text and captions stay English. There is only an English caption track.
  - The Hindi audio is a separate recording ("Kunal"), which is good.
- **Why it matters:** Two taps feels broken to some people. A big poster pushes the audio out of sight.
- **Change:**
  - Start playback on the first tap. The tap itself is consent, so sound still never autoplays.
  - On phones, show the video and audio as two compact cards side by side, or the poster at about 60% height.
  - Add Hindi captions to the cover videos when they are made. That is an assignment for the owner.
- **Size:** small (captions: medium, owner's content).

### 6. Bug: the Hindi site opens the demo in English
- **What I saw:** From https://aspiran.in/hi/ on a phone, "एक टॉपिक मुफ़्त आज़माएँ, बिना साइन-अप" opened the topic list in English. The list has no language switch. "Home" goes back to the English site. After switching to हि on a topic, the Hindi is good: natural, everyday Hindi with common English words (topic, Express, PYQ), which suits aspirants. (Screenshots 12, 13, 14, 15.)
- **Steps to reproduce:** In a browser set to English, open aspiran.in/hi/ and tap the Try button. The list reads "Try one topic", in English.
- **Change:** Pass `lang=hi` in the Hindi site's links and use it first. Add the EN/हि switch to the list. Point "Home" at /hi/ when the visitor is in Hindi. (Same as marketing finding 2.)
- **Size:** small.

### 7. Lines that contradict each other on the cover
- **What I saw:** Federalism's cover says "No AI writes or marks anything here; the two optional videos use a synthetic voice". The block just above it has an AI-voice audio note. It also says "Your study answers stay on this phone" on a laptop, and "Chai is optional but recommended", which a newcomer won't understand.
- **Why it matters:** Small cracks in an honesty-first brand.
- **Change:** "No AI writes or marks anything here. The videos and recorded notes use AI voices." Say "on this device". Drop the Chai line from the cover, or explain it.
- **Size:** small.

### 8. Too many feedback asks
- **What I saw:** In Federalism's 9-screen Express route, "Quick one (optional)" appears on steps 2, 5, 6 and 7. The finish screen then has seven more questions. Each step's question is polite and small.
- **Why it matters:** Together they make the demo feel like a research study, not a product.
- **Change:** One quick question per route, on the step you most want to learn about, plus the short finish survey below the Join block.
- **Size:** small.

### 9. Reading load
- **What I saw:**
  - Express screens are mostly fine. Federalism's step 2 is about 300 words.
  - Constitutional bodies' step 2 is about 450 words ("about 4 min").
  - In Federalism's Whole route, three screens run 550–680 words. These are the Centre's reach, Money, and Forums and disputes. On a phone each is three to four screens of scrolling.
- **Why it matters:** For a judge-us demo, long reads are where visitors leave. The Whole route is the deep end, but it should still feel light.
- **Change:** Split the long screens in two, with a "Remember:" line or a one-question check between them. The Whole route already has two "A good place to stop" breaks, which are good.
- **Size:** medium.

### 10. Navigation: mostly good; two gaps
- **What I saw:**
  - Home, All topics, the back-to-topic link, and Back/Next all work.
  - Your place is kept: reopening Federalism returned to where I had stopped.
  - Starting the Whole route after Express carried my earlier answers.
  - The topic list doesn't mark finished topics.
  - The web address stays the same on every step, so the phone's back gesture probably leaves the topic rather than going back one step. I didn't test this on a real phone.
  - On a phone, the step header wraps onto two lines (stages on one, EN/हि on the next). The home link is a bare "⌂" with no word.
- **Change:**
  - Add a tick and "done" to finished topics on the list.
  - Make the back gesture go back one step.
  - Label the home icon.
- **Size:** small (back gesture: medium).

### 11. The join strip: quiet and helpful, but the same everywhere and missing at the end
- **What I saw:** Each step has the same strip under it: "Free preview · Join free for the whole library: 2,000+ questions, 250+ short videos, 19 hours of audio, and a pod of your own. Join free →". It isn't pushy. On a laptop it often sits under the sticky Back/Next bar until you scroll. It doesn't appear on the finish screen.
- **Change:** Keep it quiet on most steps. Make it specific at three moments:
  - after the past-question tally: "2,000+ more like these";
  - on the "kept" card: "these cards come with you";
  - on the finish screen.
- **Size:** small.

### 12. The other seven topics are a step down
- **What I saw:** Constitutional bodies has a generic cover ("One topic, start to finish…"). Its Express route has 6 screens, a long read, a sorting game and three practice Mains questions written by the team. It has no past-paper step, no video in the route and no survey. Its finish screen does show Join above the fold, because there is no survey. (Screenshots 10, 11.)
- **Change:** Give each cover a one-line promise like Federalism's. Once there are tracking numbers, decide whether to show only the strongest three or four topics in the list.
- **Size:** small (cover lines); medium (content).

### 13. The Mains step stops at planning
- **What I saw:** The site's main promise is "has you write and mark real answers". The demo's Mains step is a two-minute plan, compared with a model plan. Neither the self-marking nor the "AI second opinion" appears, even as a picture.
- **Why it matters:** The Plus headline feature is never seen before the paywall.
- **Change:** On the Mains step, add a short, labelled example: a sample answer with its self-marking checklist and an "AI second opinion · AI" note beside it. This is a static example, not a live AI call.
- **Size:** medium.

**What works well (keep it):**
- Federalism's cover headline.
- "Guess first" with friendly explanations.
- The Governor's desk game (screenshot 06).
- Real past questions with "how sure?".
- "You can now:" outcomes on the finish screen.
- AI clearly labelled everywhere.
- No timers or scores.
- Nothing autoplays.
- Good Hindi.

**Not covered:** I didn't open the GST vote game or the "What else is in the app" tour side door. I walked the Whole route's screen list (19 screens: videos on screens 3 and 8; games on 5, 9 and 11; past questions on 15; Mains on 17) but didn't play every screen. No real phone was used; the phone checks used a 375 px browser.

---

## Part 2: Marketing findings (ranked)

### 1. The site's promise and the first demo screen don't match
- **Saw:** The site says "One whole topic, Federalism, start to finish, in about 20 minutes". Every Try button opens the list of eight topics. The demo then says "Express · 15 min" and "Whole topic · 75 min".
- **Why:** Doubt in the first five seconds, and an extra choice before any value.
- **Change:** Deep-link every Try button to `#try/path-pol-federalism` and say "about 15 minutes".
- **Size:** small.

### 2. Bug: Hindi visitors get English
- **Saw:** The Hindi site's links carry no language, and the demo picks its language from the browser. Sign-up also ignores the Hindi chosen in the demo.
- **Steps to reproduce:** See UX finding 6. Then tap हि and "मुफ़्त जुड़िए →": sign-up is in English.
- **Why:** Hindi-medium aspirants are a core audience, and this feels like bait.
- **Change:** Add `lang=hi` to the Hindi links and have the demo and sign-up honour it.
- **Size:** small.

### 3. You can't see the funnel end to end
- **Saw:**
  - The site and the app use the same PostHog project.
  - The site gives every page load a new anonymous ID and passes nothing to the app, so site visitors can't be followed into the demo.
  - Moving between demo steps records nothing.
  - The finish-screen "Join free" sends nothing. Only the strip's Join is counted.
  - Demo feedback rows use their own ID, which can't be linked to sign-ups.
  - The server keeps `utm_source` but drops `utm_medium`, so you lose which site button was clicked.
  - Admin → "Try one topic" is a raw list with a CSV download, not a funnel.
- **Why:** Without these numbers you can't tell which fix pays off.
- **Change:** See the table in Part 3.
- **Size:** medium.

### 4. Seven of the eight topics are thinner, and only Federalism asks for feedback
- **Saw:** The other topics have a 6-step Express route, no past-paper step, no game on the route, no cover promise and no finish survey. Yet the list says "Each has a 15-minute route and a whole-topic route".
- **Why:** Visitors who skip "Start here" see a weaker demo, and you hear nothing from them.
- **Change:** Most visitors skip the list once finding 1 is fixed. On the list, show Federalism large and the others as "More Polity topics". Put a two-question survey on every finish screen.
- **Size:** small to medium.

### 5. The library's size barely shows
- **Saw:** The numbers appear only in the repeated join strip. The website shows none.
- **Check one number:** the demo says "180+ recorded notes", but the counts given for this review were 150 notes and 19.9 hours of audio. If 180+ counts recordings, say "recordings".
- **Why:** The visitor doesn't see how much more there is at the moments that matter.
- **Change:** Show honest numbers at three places:
  - the site hero: "2,033 practice questions · 254 short videos · 20 hours of audio · 11 past papers · Hindi and English";
  - after the past-question tally: "2,000+ more like these";
  - the finish screen.
- **Size:** small.

### 6. Free vs Plus: clear on the site, missing in the demo
- **Saw:** The site's price block is clear. The demo never mentions Plus, and its strip says "the whole library" is free, while the site's free tier is "3 answers marked a week, 1 mock a month".
- **Why:** That could read as a bait-and-switch later.
- **Change:** One calm line on the finish screen only: what's free forever, and what Plus adds and costs (₹9,999/yr; ₹999 for the first 300). No countdown. Paying by WhatsApp/UPI looks informal next to ₹9,999, so say a receipt comes by email, if it does.
- **Size:** small.

### 7. The join moment doesn't say what you keep
- **Saw:** Sign-up repeats the site's Preamble question. The demo cards do carry over, but the Join button doesn't say so.
- **Change:** "Join free, keep your 9 cards". Skip the question for visitors who arrive from the demo.
- **Size:** small to medium.

### 8. Trust signals: honest, but under-used
- **Saw:** The site is candid about being new: "no toppers to show you", SnapSkill LLP, Mohali, and "Things you will never see here". AI is labelled everywhere.
- **Honest additions:**
  - On the site, show the real "what others said" counts (once 20+ people have answered) and the "You asked, we did" lines.
  - A named founder line with a photo.
  - "UPSC asked Federalism at least 11 times in five Prelims papers".
  - A one-minute screen recording of the demo.
- **Wording check:** the closed-topic message "This topic opens once an editor has checked it." implies the open topics were checked by an editor, which the house rules say not to claim yet. Suggest "This topic isn't open yet."
- **Size:** small.

### 9. The site's other pages are tracked less
- **Saw:** /how-it-works uses the same `utm_medium` for both of its buttons and sends no `cta` click event.
- **Change:** Copy the home page's click tracking to /how-it-works and give each button its own label.
- **Size:** small.

**Where visitors are likely to drop off, in order:**
1. The topic list (a choice instead of the promised topic).
2. Long reading screens.
3. The finish screen, where the survey stands in front of Join.
4. The sign-up screen (a quiz question again, no "you keep your progress").

**How others run a free preview (general terms):**
- Language-learning apps commonly let you start a lesson with no account, then ask you to sign up once you have made progress, framed as "save your progress". Aspiran already keeps progress; it only needs to say so at the Join button.
- Large Indian test-prep platforms commonly gate even free tests behind a phone number and follow up with calls. Aspiran's no-account, no-phone demo is a real difference. Say it next to the Try button.

**Marketing verdict: partly sells.** The hook is sharp and honest, and the Federalism demo backs it with real learning. The hand-off fumbles the promise, hides the library's size and the free-vs-Plus picture, and can't yet be measured.

---

## Part 3: Can you measure each funnel step today?

| Step | Tracked today? | How | Gap |
|---|---|---|---|
| Site visit | Yes | PostHog page view on aspiran.in | Every page load counts as a new visitor (memory-only ID), so visitors are overcounted and site paths break |
| Try clicked | Yes, home page only | PostHog `cta` event, with which button (hero, recall, price, end) | Not on /how-it-works. Language is only in the page address |
| Demo opened | Yes | PostHog "try" page view (signed out); the server stores `source = site` on the first open | Can't be linked to the site visit. `utm_medium` is dropped on the server |
| Topic started | Partly | Demo feedback table (`try_feedback`): a `route` row, express or full | Not in PostHog. Opening a topic cover without picking a route isn't recorded |
| Step 3 reached | No | Only if the visitor answers that step's optional question | Record a "step reached" event on every step |
| Finished | No | Only the Federalism survey answers, if sent | Record "finished" for every topic and route |
| Join clicked | Partly | `join / strip` row, from the strip only | The finish-screen "Join free" sends nothing |
| Signed in | Yes | Server `signup` event; PostHog links the person at sign-in | Can't be tied back to demo rows or the site visit |

**The fix, in one list:**
1. Record "step reached" and "finished" events.
2. Count the finish-screen Join.
3. Put the app's own ID on demo feedback rows.
4. Keep `utm_medium` on the server.
5. To join the site and the app, pass the site's PostHog ID in the Try link and start the app's PostHog with it. Update the privacy page wording to match.

After that, PostHog can show the whole line, site visit → signed in, as one funnel. *(medium)*

All recommendations stay within the standing rules: no timers, streaks or public scores; AI labelled; no human-editor or rank claims; nothing autoplays.

## Screenshots (`artefacts/demo-review-2026-11-15/`)
01 site hero (laptop) · 02 topic list · 03 Federalism cover · 04 cover video playing, captions on · 05 Express step 1 · 06 Governor's desk game · 07 finish screen, top · 08 finish screen, bottom: Join under the survey · 09 Join lands on the sign-up screen · 10 Constitutional bodies cover, same audio · 11 Bodies finish, no survey · 12 Hindi site (phone) · 13 Hindi site opens the English list (phone) · 14 Federalism cover in Hindi (phone) · 15 Governor's desk in Hindi (phone) · 16 finish screen in Hindi (phone)
