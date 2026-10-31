# "Akela Nahi": app video, lyrics and storyboard

Preview only. Nothing here has been posted. The rap and the beat are original. They copy nothing from the reference track, which only set the vibe: a lo-fi Hinglish rap with a chai-stall mood.

- **Length:** 45 seconds, vertical 1080×1920. Cut for Reels, Shorts and the Play Store promo slot.
- **Tempo:** 90 BPM, C# minor. Each line is one bar (2.67 s).
- **Hook:** the chai motif (Sa Re Pa) from the content team's sound kit.
- **Files:**
  - `akela-nahi-preview.mp4`: the captioned cut, with the beat only and no vocals.
  - `akela-nahi-beat.wav`: the beat on its own.
  - `akela-nahi.srt`: the captions.
  - `source/`: the scripts that rebuild all three.

## Still needed before this goes public

1. **A human rapper,** credited and paid under a written agreement. Use no AI voice and no imitation of a known artist. The beat leaves room for vocals from bar 3.
2. **A mix engineer** to replace the synthesised beat if the team wants a richer sound. The current beat is ours, so licensing is clean.
3. **Claim checks:**
   - "Chotu is up all night" holds only if Chotu really is always on. The end card already says Chotu is an AI helper, not a counsellor.
   - The Tele-MANAS number must be test-called.
   - The pod size (eight) must match the product decision. The community drafts say 6 to 8.
4. **Badges:** the community drafts say no leaderboards or streaks. The lyric only says "show up, earn a badge", so it stays safe whichever way the product team decides on leaderboards.

## Lyrics and storyboard

| Bar | Scene on screen | Sung (Hinglish) | Caption (English) |
|---|---|---|---|
| 1 | Night. Moon, hostel windows, two lights on. Beat: keys and the chai motif. | (no vocal) | **11:47 PM.** PG room, Mukherjee Nagar. Lights still on. |
| 2 | Same shot, closer. | (no vocal) | **Teesra attempt.** Third try. Same old room. |
| 3 | A desk lamp over a stack: Laxmikanth, NCERT, PYQs, notes v3. Drums come in. | Teesra attempt, phir se wahi kamra | Third attempt. Same old room. |
| 4 | Phone ringing: "Ghar calling…" | Ghar se phone aaya, har lafz mein sawaal bhara | A call from home. Every word a question. |
| 5 | A cold chai and a clock. | Raat ke baarah baje, chai bhi thandi padi | Midnight. Even the chai went cold. |
| 6 | A blurred phone feed: "AIR 1 ka 16-hour routine", "Topper's SECRET notes". These are the ads we refuse to make. | Feed mein toppers, meri himmat chhoti padi | A feed full of toppers. My nerve felt small. |
| 7 | **Hook.** The screen turns to warm milk. A ring of eight pod members (initials only, never real faces). | Par tu akela nahi, pod hai saath mein | But you're not alone. Your pod is right here. |
| 8 | The ring holds. | Aath log, ek sapna, haath haath mein | Eight people. One dream. Holding on together. |
| 9 | Chotu, the clay kulhad with steam, labelled "Chotu · your AI chai cup". | Pod so gaya? Chotu jaage raat mein | Pod asleep? Chotu is up all night. |
| 10 | Chotu listening. | Doubt ho ya dil bhaari, sun le har baat mein | A doubt or a heavy heart, it listens. |
| 11 | Green screen with chips: Your pod · free, Chotu · free, Honest tools · free, No card needed. | Adda bhi free hai, card ki nahi zaroorat | The adda is free. No card needed. |
| 12 | Same. | Rank ka vaada nahi, bas sachchi sohbat | No rank promises. Just real company. |
| 13 | A "5 days. You showed up." badge, with the pod cheering. | Badge mile haazri pe, pod kare shor | Show up, earn a badge. Your pod cheers. |
| 14 | Today's three: Polity, 10 PYQs, a 20-minute walk. | Aaj ke bas teen kaam, aur nahi koi zor | Just three things today. No pressure. |
| 15 | **Hook out.** The pod ring again. The crew could sing this line. | Akela nahi. Akela nahi. | Not alone. Not alone. |
| 16–17 | End card: UPSC Pods, "Never prep alone.", "Join free · no card needed", and "Your pod, Chotu and the honest tools are free. Go Plus when you're ready to go all in." Fine print covers Chotu as an AI helper, Tele-MANAS 14416, working names, "Not affiliated with UPSC" and "Music and art are original". | (motif rings out) | |

## Why it is built this way

- **Follows strategy/positioning.md.** Community comes first: bars 7 to 10 cover the pod and Chotu, and the free Adda arrives in bar 11. Only Adda items are called free, because Prep features have limits. "Free forever" is not used. "Adda" and "Chotu" are working names until the name test.
- **The paid plan gets one honest line on the end card.** There is no countdown, no "limited offer" and no rank claim. That keeps it within the CCPA coaching-ad and dark-pattern guidelines.
- **Bar 6 names the fear without selling it.** It shows the topper-ad culture as the problem we are the answer to.
- **Regional cuts:** keep the rap in Hinglish and swap the caption line. Telugu and other-language captions can be colloquial, as the user asked.

## Language versions with a guide vocal (11 Oct 2026)

There are five cuts, each 45 seconds with a sung guide vocal and captions:

- `akela-nahi-hinglish.mp4`
- `akela-nahi-english.mp4`
- `akela-nahi-telugu.mp4`
- `akela-nahi-tamil.mp4`
- `akela-nahi-bengali.mp4`

The lyrics for each are in `source/langs/<language>.json`. Each line gives the on-screen text, the text the voice reads, and the English caption.

- **The guide vocal is synthetic.** It uses eSpeak NG, a generic offline voice that imitates no one, and is there for timing and demo only. It sounds robotic.
  - Natural-sounding voice models could not be downloaded because huggingface.co is blocked in this environment.
  - The public versions need human rappers, one per language, credited and paid under written agreements.
- **Every non-English lyric needs a native speaker's check before use:** Telugu, Tamil, Bengali and the Hindi. The Telugu and Tamil are deliberately colloquial.
- **The English, Tamil and Bengali lyrics are new translations.** They keep the same story and scenes: alone, then the pod, then Chotu, then the free Adda.
- **The end card is translated in each version:** "Never prep alone" and "Join free, no card needed". The fine print is in English for now.
- **To rebuild a version,** run these from the `source` folder:
  1. `python3 vocals.py <language>`
  2. `node frames.cjs <language>`
  3. Encode with ffmpeg as in the commands above.
