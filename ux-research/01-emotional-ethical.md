# 01: Emotional, behavioural and ethical UX for the UPSC community app

*Research slice prepared 10 October 2026, for an Android-native (Kotlin + Jetpack Compose) bilingual app. First build slice: the Today screen with Chai Cards and the nightly Close the Day ritual.*

**How to read this.** Every claim carries a source URL or is tagged **[Inference]**. Facts that change (helpline numbers, regulatory dates) are tagged **[Verify before launch]**. Each topic follows the same pattern: **(a) principles and evidence**, **(b) what it means for these users**, **(c) testable build rules**. Each rule names the persona it mainly protects. Hindi copy is a starting draft: a native Hindi-medium aspirant (an "Arjun") must review it before release **[Inference]**.

**Who we are designing for.** Most users are in their 20s and in year 1 to 6 of a multi-year attempt. Some study alone in Mukherjee Nagar or Old Rajinder Nagar, some back home in a Tier-3 town. They carry loneliness, shame, fear of failure and family pressure, and both money and age limits are running out. Many are Hindi-medium or bilingual and use mid- or low-end Android phones on patchy data. The **23:30 guilt spiral** is the worst emotional hour of the day (brief §3.3). Years of coaching marketing have taught them to distrust hype, and they bond over dark humour about aspirant life. Persona names come from the brief:

| Persona | One-line reminder |
|---|---|
| **Arjun** | Small-town, Hindi-medium, family's pooled money; fear of wasting it |
| **Meera** | Urban English-medium, attempt 2; fear of being average, comparison-prone |
| **Rahul** | Working professional, 2-4 h/day; guilt about never doing enough |
| **Sana** | Woman aspirant; marriage-timeline pressure, safety, male-coded spaces |
| **Vikram** | Long-haul repeater (attempts 4-6); identity collapse, shame, fatigue |
| **Kavya** | Tier-3, online-only; fears missing "hub knowledge", low-end phone, patchy data |

---

## 1. Emotional design, calm technology and designing for stressed minds

### 1(a) Principles and evidence

- **Norman's three levels.** *Visceral* covers first impressions and appearance. *Behavioural* covers the experience of use and how well the thing works. *Reflective* covers what you think afterwards, including what the product says about you. People weight the three levels differently, and a beautiful product that fails in use still gets rejected (Norman, "Emotional Design", https://jnd.org/emotional-design/). For an app used in a fragile state, the reflective level matters most: "what does using this app say about me?" Possible answers range from "I'm a serious, calm aspirant" to "I'm someone who keeps failing a streak" **[Inference]**.
- **Calm technology.** Mark Weiser and John Seely Brown at Xerox PARC coined "calm technology" in 1995. Amber Case's eight principles are summarised at https://www.caseorganic.com/post/principles-of-calm-technology:
  1. Technology should require the smallest possible amount of attention.
  2. It should inform and create calm.
  3. It should make use of the periphery.
  4. It should amplify the best of technology and the best of humanity.
  5. It can communicate, but doesn't need to speak.
  6. It should work even when it fails.
  7. The right amount of technology is the minimum needed to solve the problem.
  8. It should respect social norms.
- **Humane design.** Center for Humane Technology principles, as summarised by LogRocket: empowerment, inclusivity, transparency, *finite design* (bounded experiences with a clear end), and respect for time and attention, for example by matching notifications to their importance (https://blog.logrocket.com/ux-design/humane-design-ux/).
- **Stress shrinks cognitive bandwidth.** Mani, Mullainathan, Shafir and Zhao (Science, 2013) found that financial worry measurably reduced cognitive function. Thinking about money problems imposed a load comparable to losing a night's sleep (Princeton summary: https://princeton.edu/news/2013/08/29/poor-concentration-poverty-reduces-brainpower-needed-navigating-other-areas-life). Arjun and Vikram, with money draining away, are the scarcity case.
- **Cognitive load and choice.** Hick's law says decision time grows with the number of options. Miller's "7±2" and later work on working memory say that people under load can hold less in mind. Nielsen heuristic #8 (aesthetic and minimalist design) says every extra unit of information competes with the relevant units (https://www.nngroup.com/articles/ten-usability-heuristics/).
- **Tone that reassures.** In a Nielsen Norman Group tone study, a warm, casual, *non-joking* hospital tone reassured stressed users more than a formal one. Trust explained about 52% of willingness to recommend, against about 8% for friendliness (https://www.nngroup.com/articles/tone-voice-users/).

### 1(b) What it means for this app

The brief's Today mockup opens with "227 days to Prelims 2027" and a 🔥 streak count. For Vikram (attempt 5, age 31), a countdown is not a "calm fact". It is a second countdown sitting on top of his age limit. For Meera, the fire icon turns the screen into a scoreboard. The visceral layer should feel like a quiet library desk at 7 a.m., not an exam hall, and the reflective layer should say *"I showed up as a person"*, not *"I'm behind"* **[Inference]**. The 23:30 slot is when Rahul gets home from work with 40 minutes and a guilty conscience. Close the Day must take less effort than doom-scrolling, or it will lose **[Inference]**.

### 1(c) Build rules

| # | Do / Don't | Persona |
|---|---|---|
| 1.1 | **Do** limit Today to **3 task cards maximum** plus at most one Chai Card above the fold, on a 360×640 dp viewport. No horizontal carousels on Today. | Arjun, Kavya (low bandwidth, low-end screens) |
| 1.2 | **Don't** show an exam countdown on Today by default. Put "Days to Prelims" in My Path as an **opt-in** setting, in neutral text colour, never red, never animated. Default copy if enabled: "Prelims 2027: 23 May" (a date, not a count). Hindi: "प्रीलिम्स 2027: 23 मई". | Vikram, Meera |
| 1.3 | **Do** use one accent colour (chai amber *or* indigo) at no more than about 10% of screen area. No colour carries a "failure" meaning: Material 3's `error` role is reserved for real system errors such as a failed upload, never for a missed task. | All, especially Meera |
| 1.4 | **Do** keep motion calm: transitions ≤300 ms, no confetti, no shaking, and respect the system "Remove animations" setting (`Settings.Global.ANIMATOR_DURATION_SCALE == 0` → static UI). | Kavya (old phones), anxious users |
| 1.5 | **Do** make every screen work offline or degrade gracefully: cache today's 3 tasks and Chai Cards at first open. Close the Day saves locally and syncs later, with copy like "Saved on your phone. Will sync when you're online." / "फ़ोन में सेव हो गया। नेट आने पर सिंक होगा।" (Case principle 6: work even when it fails.) | Kavya, Arjun |
| 1.6 | **Do** finish the day: when the 3 tasks are done, Today shows an *end state* ("That's today. Rest is part of the plan." / "आज के लिए इतना काफ़ी। आराम भी प्लान का हिस्सा है।") and **no** "do more" suggestions. (Finite design.) | Rahul, Vikram |
| 1.7 | **Don't** put more than one primary (filled) button on any screen (NN/g heuristic #8; Hick's law). | All |
| 1.8 | **Do** write UI copy at a reading level a Class-10 student can follow in either language, with sentences ≤15 words. Test with 5 Hindi-medium users before release. | Arjun |

---

## 2. Habit and ritual without dark patterns

### 2(a) Principles and evidence

- **Fogg Behaviour Model (B = MAP).** Behaviour happens when Motivation, Ability and a Prompt converge at the same moment. Fogg's Tiny Habits method makes the behaviour very small, anchors it to an existing routine, and adds an immediate "celebration" so the habit feels good (https://agilebrandguide.com/wiki/models/fogg-behavior-model-bmap/). Practical consequence: when motivation is low, as at 23:30, increase *ability* (make the task smaller). Don't escalate the prompt.
- **The Hooked model and its critique.** Eyal's loop runs trigger → action → *variable reward* → investment. Eyal's own "Manipulation Matrix" asks whether the maker would use the product themselves and whether it materially improves users' lives (https://www.mindtheproduct.com/hooked-make-products-influence-people/). Variable rewards are slot-machine mechanics, which is wrong for anxious users who need predictability **[Inference]**. Use a *predictable* reward instead: the same calm closing line every night.
- **Self-determination theory (SDT).** Wellbeing and durable motivation depend on autonomy, competence and relatedness. Peters, Calvo and Ryan's METUX framework applies SDT to technology design and provides validated scales (https://selfdeterminationtheory.org/topics/application-technology/; https://selfdeterminationtheory.org/metux-scales/). Hanus and Fox (2015) found that students in a course with mandatory badges and a leaderboard reported *lower* intrinsic motivation and satisfaction and got *lower* final exam scores. The likely mechanisms were social comparison and loss of autonomy (summary: https://www.smhp.psych.ucla.edu/pdfdocs/gamil.pdf).
- **Streak psychology.** Duolingo reports that a 7-day streak goes with a 3.6× higher chance of course completion, and that loss aversion keeps learners going. It also says losing a streak can lower motivation and make some learners avoid challenges. Raising the maximum number of held streak freezes to two increased DAU by 0.38% without increasing missed lessons (https://blog.duolingo.com/duolingo-streak-research/).
- **Broken streaks and the "what-the-hell" effect.** Silverman and Barasch ("On or Off Track", *Journal of Consumer Research*) found that a streak becomes a goal in itself. When it breaks, users often abandon the activity altogether, because "their record no longer represents them". A "get back on track" nudge typically didn't work (https://www.colorado.edu/business/news/2023/04/20/research-streaks-marketing-tech-barasch). The "what-the-hell" effect, first described in dieting research by Polivy and Herman, is the pattern where one lapse triggers total abandonment (https://wtop.com/news/2017/11/avoiding-the-what-the-hell-health-effect). For Vikram, whose whole life already feels like one long broken streak, this is the main risk **[Inference]**.
- **Slack works.** Sharif and Shu's "emergency reserves" studies found that ambitious goals with a few built-in skip days were chosen more often than easy or hard goals. In a step-count study they were reached up to 40% more often. After a missed day, 55% of weekly-reserve participants rebounded, against 37% of hard-goal participants (https://anderson-review.ucla.edu/emergency-reserves/).
- **Fresh starts.** Temporal landmarks such as Mondays, new months and birthdays increase goal pursuit (Dai, Milkman and Riis, *Management Science* 2014: https://faculty.wharton.upenn.edu/wp-content/uploads/2014/06/Dai_Fresh_Start_2014_Mgmt_Sci.pdf). UPSC's own calendar supplies big ones: notification day (13 Jan 2027) and the day after a result.
- **Forgiving designs in the market.**
  - Duolingo: streak freezes, up to 2 held (above).
  - Apple watchOS 11: rings can be paused for one or more days without breaking the streak, and goals can differ by day of the week (https://9to5mac.com/2024/12/31/watchos-11-fixes-easier-apple-watch-health-goals/).
  - Headspace: lets users *hide* streaks (https://builtformars.com/ux-bites/hiding-your-headspace-streaks).
  - Finch: frames daily self-care around a pet. Internet Matters flags that streak milestones and daily goals can stress some users, especially young ones (https://www.internetmatters.org/advice/apps-and-platforms/wellbeing/finch/).
  - Strava: emphasises weekly totals over daily chains **[Inference, product observation; verify current UI]**.

### 2(b) What it means for this app

A *daily* consecutive-day streak is the wrong unit for this audience. Rahul cannot study on a heavy work day. Sana may lose a day to a family function where studying would cause friction. Kavya loses days to power or data cuts. Each break risks the what-the-hell collapse that Silverman and Barasch describe. Count **"days showed up this week"**, with a flexible weekly target the user picks (default 5 of 7), and treat Close the Day itself, even "I did nothing today", as showing up **[Inference, supported by Sharif and Shu]**. Relatedness comes from the pod, not from a number.

### 2(c) Build rules

| # | Do / Don't | Persona |
|---|---|---|
| 2.1 | **Do** replace the consecutive-day streak with a **weekly rhythm**: "4 of 5 days this week" shown as 7 small dots (filled / empty, never red/green). The user sets the target from 3-7; **default 5**. The week resets on Monday (a fresh-start landmark). | Rahul, Sana, Kavya |
| 2.2 | **Do** count a day as "showed up" if the user completes **any one** of: 1 task, 1 Chai Card read fully, or Close the Day (even a blank one with only a mood). | Vikram, Rahul |
| 2.3 | **Do** give **2 automatic rest days per week** that never need to be "spent" or bought, plus a **"Pause" mode** (illness, family event, exam week) of up to 14 days that freezes everything, with no explanation required. Copy: "Paused. Your rhythm will be here when you're back." / "रुकावट ठीक है। जब लौटेंगे, सब यहीं मिलेगा।" | Sana, Vikram |
| 2.4 | **Don't** ever sell, or gate behind ads, streak freezes or repairs. (This would also fall under India's "nagging"/"false urgency" patterns; see §7.) | Arjun |
| 2.5 | **Don't** send a "you're about to lose your streak" notification, ever. **Do** allow at most **1 non-social notification per day**, at a user-chosen time, off by default until the user asks for it in context (Android guidance: ask from a user action, not on first launch; https://developer.android.com/develop/ui/views/notifications/notification-permission). | All, especially Meera |
| 2.6 | **Do** handle a missed week with a **fresh-start message, not a recovery nudge**: "New week. Pick one small thing for Monday?" / "नया हफ़्ता। सोमवार के लिए एक छोटा काम चुनें?" **Never** say "You broke your streak" or show "0". | Vikram |
| 2.7 | **Do** keep rhythm data **private by default**. Sharing to the pod is a per-week opt-in toggle, and the pod sees only "showed up this week ✓", never the count. | Meera, Vikram |
| 2.8 | **Do** use one predictable closing celebration (Fogg's "celebration"): the same short line and a soft chime, with no random rewards, loot or variable badges. | All |
| 2.9 | **Do** shrink, don't push: if a user has 0 activity for 3 days, Today offers a "2-minute version" of the day (one MCQ or one Chai Card). Don't send extra prompts. | Vikram, Rahul |
| 2.10 | **Test:** compare 4-week retention and a METUX autonomy subscale for weekly rhythm vs. a daily streak (A/B) in the WhatsApp-pod pilot. The ethical pass criterion: no rise in self-reported guilt on a 1-item scale. | — |

---

## 3. Mood tracking, journaling and the Close the Day ritual

### 3(a) Principles and evidence

- **Mood self-monitoring raises emotional self-awareness.** In an RCT of 114 young people aged 14-24, mobile mood and stress self-monitoring increased emotional self-awareness, and greater awareness was linked to fewer depressive symptoms. There was **no direct effect** on depression, and the primary trial found no between-group difference (Kauer et al., JMIR 2012: https://www.jmir.org/2012/3/e67). So a mood tap is a modest awareness tool, not a treatment. Market it that way.
- **Naming feelings helps.** Affect labelling ("putting feelings into words") reduced amygdala response in an fMRI study (Lieberman et al., 2007: https://pubmed.ncbi.nlm.nih.gov/17576282/). How We Feel builds on the Yale Mood Meter to grow emotion vocabulary, frames emotions as "neither good nor bad", and is run by a non-profit (https://medicine.yale.edu/news-article/the-how-we-feel-app-helping-emotions-work-for-us-not-against-us/).
- **Reflection vs. rumination.** Rumination research separates *brooding* (passive, "why me?") from *reflective pondering* (problem-solving). Brooding predicts depression (Treynor, Gonzalez and Nolen-Hoeksema, 2003: https://www.doi.org/10.1023/A:1023910315561). Expressive writing has been reported to lower depressive symptoms and rumination for some groups (Gortner, Rude and Pennebaker, 2006: https://pubmed.ncbi.nlm.nih.gov/16942980/ **[Verify subgroup details in the full text]**). Watkins' work on constructive vs. unconstructive repetitive thought finds concrete "how" processing more adaptive than abstract "why" processing (review: https://web.stanford.edu/group/mood/cgi-bin/wordpress/wp-content/uploads/2012/02/whitmer_gotlib_CTR_2011.pdf for related rumination and attention work). **Design implication:** prompts should be concrete and forward-looking ("one thing for tomorrow"), never "why did today go wrong?" **[Inference]**.
- **Implementation intentions.** "If-then" plans ("tomorrow at 7, I'll read 20 min before breakfast") roughly double follow-through in meta-analyses (Gollwitzer and Sheeran, 2006, d≈0.65 **[Verify citation]**). The brief's third prompt, "One thing for tomorrow", is already an implementation intention. Strengthen it with a time slot.
- **Data sensitivity.** Mozilla's 2023 review of 32 mental health apps put warning labels on 19 (59%), citing sharing with advertisers, 799 trackers in one app, and questionnaires shown *before* consent (https://www.mozillafoundation.org/en/blog/shady-mental-health-apps-inch-toward-privacy-and-security-improvements-but-many-still-siphon-personal-data/). Daylio's approach of no account and data stored on the device is a useful privacy benchmark **[Verify current Daylio policy at daylio.net]**.

### 3(b) What it means for this app

Close the Day lands at 22:00-23:30, exactly the guilt-spiral hour. Done badly, the "What slipped?" box becomes a nightly confession of failure that feeds brooding, especially for Vikram and Arjun. Done well, it externalises the day ("it's written down, I can stop carrying it"), plans a concrete first step for tomorrow, and *closes* the app. The mood tap is valuable mainly as a private pattern for the user and as a quiet, human-mediated safety signal. It needs careful consent, because a pod lead seeing someone's mood is a big privacy step **[Inference]**. The brief's "run of low moods quietly triggers a pod-lead check-in" must be **opt-in**, explained, and reversible. Otherwise it is surveillance, and Sana may not want a male pod lead messaging her at night **[Inference]**.

### 3(c) Build rules for Close the Day

**Flow (≤90 seconds, 1 screen, 4 inputs; all optional):**

1. **"What got done?"** Chips pre-filled from today's tasks (tap to confirm) + optional free text. Hindi: "आज क्या हुआ?"
2. **"What got in the way?"** (not "What slipped?", which implies personal failure). Chips: *Tired · Family · Work · Phone · Felt low · Nothing, good day*. Hindi: "किस चीज़ ने रोका?" Chips: *थकान · परिवार · काम · फ़ोन · मन नहीं लगा · कुछ नहीं, अच्छा दिन*.
3. **"One small thing for tomorrow"** + optional time chip (*Morning / Afternoon / Night*). Hindi: "कल के लिए एक छोटा काम".
4. **"How are you feeling?"** 5-point scale using **words + neutral shapes**, not emoji faces that read as childish or culturally ambiguous: *Heavy · Low · Okay · Good · Light* / *भारी · उदास · ठीक · अच्छा · हल्का*. An optional second tap opens 12 emotion words (anxious, lonely, proud, calm, angry, hopeful…) for affect labelling.

| # | Do / Don't | Persona |
|---|---|---|
| 3.1 | **Do** make every field skippable. Submitting only a mood still counts as showing up (rule 2.2). | Vikram, Rahul |
| 3.2 | **Don't** use "why" prompts or show yesterday's "what got in the way" back to the user unprompted. **Do** show yesterday's "one small thing" on Today's morning card ("You planned: 20 min reading, morning"), which closes the loop. | Arjun, Vikram |
| 3.3 | **Do** end with a fixed closing line, then an *end state* with no feed, no Chai Cards and no pod activity under it: "Day closed. Sleep is revision too." / "दिन पूरा हुआ। नींद भी रिवीज़न है।" Optional "Close the app" button. | All (the 23:30 slot) |
| 3.4 | **Do** default the share toggle to **Keep private**. "Share with pod" shares *only* the text fields the user ticks; **mood is never shared** to the pod, even when text is. | Meera, Sana |
| 3.5 | **Do** store mood and journal text encrypted on the device (Android Keystore-backed encryption, e.g. SQLCipher or EncryptedFile) and sync to the server only if the user turns on backup. State this in one line on the screen: "Only you can see this." / "इसे सिर्फ़ आप देख सकते हैं।" | Sana, Vikram |
| 3.6 | **Do** make the "low-mood check-in" an **explicit opt-in** with a choice of person (pod lead, a chosen buddy, or nobody). Trigger: ≥4 "Heavy/Low" moods in 7 days. What the person receives: "X might appreciate a hello", with **no mood data** shown. | Sana, Vikram |
| 3.7 | **Do** show mood history only as a private weekly strip (7 cells, neutral tints), with a "Hide history" toggle. **Don't** show averages, scores or "your mood is down 20%". | Meera |
| 3.8 | **Don't** let Chotu (the AI) comment on mood entries or journal text by default. Chotu may offer *one* static, pre-written line per mood level, reviewed by a clinician (see §5). | All |
| 3.9 | **Do** add a 2-second slow-down only for the "Heavy" mood: a soft line, "Rough day. Want to talk to someone?", with two quiet links: *Pod / buddy* and *Tele-MANAS 14416* (see §4). Never a modal, never on other moods. | Vikram, Arjun |
| 3.10 | **Do** let users export (plain text) and delete all journal and mood data in ≤2 taps from Settings, with immediate effect (DPDP rights, §7). | All |
| 3.11 | **Do** offer "Close the week" on Sunday: 3 "good things" picks from the week's entries. This reflects on wins and avoids rumination on misses **[Inference; "three good things" positive-psychology exercise, Seligman et al. 2005, verify]**. | Vikram, Meera |

---

## 4. Safety and crisis UX

### 4(a) Principles and evidence

- **Indian helpline.** Tele-MANAS (National Tele Mental Health Programme, Ministry of Health and Family Welfare) is free and 24×7 on **14416** or **1-800-891-4416**, in about 20 languages (https://iitk.ac.in/counsel/TeleManas.php). It has 53 cells across 36 states/UTs, has handled 42+ lakh calls, launched a mobile app on 10 Oct 2024, and added video consultations (https://www.digitalhealthnews.com/tele-manas-helpline-crosses-42-lakh-calls-expands-mental-health-support-across-india). The official site is https://telemanas.mohfw.gov.in/home. National emergency: **112**. **[Verify before launch, and re-verify quarterly: dial-test both numbers in Hindi and English.]**
- **Safe messaging.** WHO's 2023 media resource says: *do* provide accurate information about where and how to seek help, and *do* tell stories of coping. *Don't* describe methods, *don't* sensationalise or present suicide as a solution, and *don't* oversimplify causes (WHO: https://who.int/publications/i/item/9789240076846; PDF: https://www.hse.ie/eng/services/list/4/mental-health-services/connecting-for-life/publications/9789240076846-eng.pdf). US safe-messaging guidance (AFSP / Reporting on Suicide) recommends "died by suicide" over "committed suicide" and emphasising help and hope (https://www.save.org/wp-content/uploads/2026/05/Safe-Messaging-Guidelines-.pdf).
- **Platform guidance.** Samaritans' guidelines for platforms hosting user-generated content cover communicating with users in distress, user-friendly reporting, moderation, reducing exposure to harmful content, and supporting the staff who see it (https://www.samaritans.org/about-samaritans/research-policy/internet-suicide/guidelines-tech-industry/).
- **AI and crisis law (comparators).** California SB 243 (enacted 13 Oct 2025) requires companion-chatbot operators to have protocols that prevent suicide or self-harm content, detect expressions of suicidal ideation, refer users to crisis services, and publish those protocols (https://www.zwillgen.com/artificial-intelligence/california-takes-lead-on-ai-companion-chatbot-regulation/). The APA's 2025 health advisory says chatbots and wellness apps must not substitute for professional care, and that unhealthy dependence must be prevented (https://www.news-medical.net/news/20251113/APA-urges-safeguards-for-using-AI-in-mental-health.aspx).

### 4(b) What it means for this app

The brief already names the risk (§4.5, §8.7) and the devil's-advocate section warns that a 2-person team cannot staff a 2 a.m. response (§4a). The UX must therefore **route to professionals and to the user's own people, fast**, and never imply that the app itself is a crisis service. Helplines must be *always findable but never alarming*. A red SOS button on Today would tell every user, every day, that this is a place of crisis, which is the opposite of calm **[Inference]**. Result days (Prelims result, Mains result) are predictable high-risk windows for about 5 lakh non-qualifiers, and Vikram above all **[Inference from brief §4.0]**.

### 4(c) Build rules

| # | Do / Don't | Persona |
|---|---|---|
| 4.1 | **Do** put a permanent, quiet **"Need to talk?" / "किसी से बात करनी है?"** row in the My Path tab and in the app-bar overflow menu on every screen. It must be ≤2 taps from anywhere. Tapping it opens a sheet with: Tele-MANAS 14416 (tap-to-dial, `ACTION_DIAL`, so the user confirms before calling), "Talk to my buddy", "Message pod lead", and 112 for emergencies. Neutral colours. | All |
| 4.2 | **Don't** show helplines as a red banner, siren icon or modal on Today. **Do** surface the sheet contextually: (a) "Heavy" mood (rule 3.9); (b) distress keywords in posts (4.4); (c) result days. | Meera, Vikram |
| 4.3 | **Do** run **result-day mode** on Prelims and Mains result days, for 72 h from publication: hide all upsells (rule 7.6) and Wins posts in pods; Today shows one card: "Results day. Whatever happened, you're more than a roll number. Rooms are open; people are here." / "आज रिज़ल्ट का दिन है। जो भी हुआ, आप एक रोल नंबर से कहीं ज़्यादा हैं। रूम खुले हैं, लोग यहाँ हैं।" + a quiet link to the support sheet. | Vikram, Arjun |
| 4.4 | **Do** run on-device keyword matching (Hindi, English, Hinglish, Romanised Hindi: e.g. "khatam kar dunga", "jeene ka mann nahi", "सब ख़त्म", "can't go on", "no point") on pod posts and Close the Day text. On a match: show the poster a private, warm sheet ("It sounds like a heavy time. You don't have to carry it alone." + 14416 + buddy), and send a **human moderator queue alert**, not an automated reply in the thread. False positives cost little; misses are costly. The keyword list is reviewed by a clinician and updated monthly. | Vikram, Arjun |
| 4.5 | **Don't** auto-hide or delete a distress post silently. **Do** hide method details only (WHO "don't describe the method"), replace them with "Part of this post was hidden for safety. A moderator has been notified.", and keep the rest visible to the pod lead. | All |
| 4.6 | **Do** publish a **response-time promise the team can actually keep**, e.g. "A trained moderator reads flagged posts between 8 a.m. and midnight. At other times, please call Tele-MANAS 14416 (24×7)." Never promise "always here". | All (honesty) |
| 4.7 | **Do** apply safe-messaging language in all content, including Chai Cards: "died by suicide", never "committed"; no method or location; no single-cause framing. Any Chai Card touching suicide carries the help line at the end and gets **no humour tag** (§8). | All |
| 4.8 | **Do** write and test the moderator playbook *before* launch (brief §8.7): recognise → respond warmly → connect → move to a private chat → follow up in 24-48 h → monthly review. Moderators get support after hard cases (Samaritans: staff wellbeing). | — |
| 4.9 | **Test:** quarterly "mystery shopper" drill: a team member posts a scripted distress message at 23:30. Pass = private sheet shown in <1 s, moderator alerted in <5 min during covered hours, human reply within the published window. | — |

---

## 5. Chotu: AI mascot and companion design

### 5(a) Principles and evidence

- **Disclose clearly and set expectations.** Google's People + AI Guidebook calls disclosing the algorithm-powered nature of an interface "a critical onboarding step". It says to make it "extremely clear that the product is not a human", because otherwise users may "disclose more information than they would otherwise" and over-rely on the system. Human-like framing raises "unachievable expectations" (https://pair.withgoogle.com/chapter/People%20+%20AI%20Guidebook%20-%20Mental%20Models.pdf).
- **Microsoft HAX guidelines** (Amershi et al., CHI 2019; 18 guidelines in four phases): make clear what the system can do and how well (G1-G2); time services to context (G3); match social norms (G5); mitigate social biases (G6); support efficient dismissal and correction (G8-G9); scope services when in doubt (G10); make clear why the system did something (G11); provide global controls (G17) (https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/; PDF: https://research.microsoft.com/%7Ehorvitz/Guidelines_Human_AI_Interaction.pdf).
- **EU AI Act Article 50.** Providers must ensure people are informed they are interacting with an AI system. The transparency obligations apply from **2 August 2026** (Czech regulator CTU: https://ctu.gov.cz/en/press-release%3A-2-august-2026-key-date-transparency-rules-under-ai-act.-what-does-mean-practice). This is not binding for an India-only app, but it is the emerging global norm **[Verify whether EU Digital Omnibus amendments shift any dates]**. California SB 243 adds a 3-hourly break reminder for minors that restates it is AI (link in §4).
- **Dependence risk.** MIT Media Lab and OpenAI's 2025 studies linked heavier chatbot use to more loneliness and less socialising, and found that users who trusted the bot more became more emotionally dependent. Strong attachment was concentrated in a small group of heavy users (https://www.tomsguide.com/ai/is-chatgpt-making-us-lonely-mit-openai-study-reveals-possible-link; not peer-reviewed). Mozilla called the companion app Replika "one of the worst apps" it had reviewed for privacy (link in §3).

### 5(b) What it means for this app

The product's core promise is *humans who know your name*. Lonely users are the most likely to over-attach to Chotu (MIT/OpenAI), and Chotu is the cheapest thing to scale. That creates a structural temptation to let Chotu replace the pod, and it must be resisted **[Inference]**. Chotu's job is a **narrator and helper**: it explains Chai Cards, gives MCQ hints and reminds users of their own plan. It hands off to people for anything emotional. "Chotu" is also a word Indians use for child workers at tea stalls **[Inference: common usage; it may read as classist to some users. Test the name with 10 users across Hindi and English medium before committing.]**

### 5(c) Rules for Chotu

| # | Do / Don't | Persona |
|---|---|---|
| 5.1 | **Do** label Chotu "AI" everywhere it speaks: a small "AI" chip beside the name (e.g. *Chotu · AI*), plus a first-run line: "I'm Chotu, an AI helper, not a person. I can explain news and quiz you. For feelings and big decisions, your pod and real people are better." / "मैं छोटू हूँ, एक AI सहायक, कोई इंसान नहीं। ख़बरें समझा सकता हूँ, सवाल पूछ सकता हूँ। मन की बात और बड़े फ़ैसलों के लिए आपका पॉड और असली लोग बेहतर हैं।" | Arjun, Kavya (lower AI familiarity) |
| 5.2 | **Don't** give Chotu a human photo, a human backstory, claimed feelings ("I missed you!", "I'm sad you left"), a human name in replies, a typing indicator that imitates a person, or memory of personal disclosures framed as friendship. | All |
| 5.3 | **Don't** let Chotu guilt-trip or nudge return visits ("Chotu is waiting for you 🥺"). (This is the Duolingo-owl failure mode and would fall under "confirm shaming" in §7.) | Vikram, Meera |
| 5.4 | **Never:** give medical or psychological advice or diagnoses; respond to distress with generated text (use a fixed, clinician-approved script + the support sheet from §4); predict ranks or selection odds; give financial or career-exit advice ("you should quit"); comment on mood or journal entries; impersonate a pod member, mentor or topper; or appear in pod threads uninvited. | Vikram, Arjun |
| 5.5 | **Do** make Chotu **absent** from: Close the Day (except one static line), result-day mode, the support sheet, pod threads (unless a user summons it with "@Chotu"), and any screen showing someone else's writing. | All |
| 5.6 | **Do** give users a global switch: Settings → "Chotu: On / Quiet (only when I ask) / Off" (HAX G17). Default: **Quiet**. | Meera |
| 5.7 | **Do** show uncertainty and sources on every factual Chai Card answer: "Based on PIB release, 9 Oct 2026" + "Report a mistake" (HAX G2, G9, G11). | Kavya (no hub cross-checking) |
| 5.8 | **Do** cap Chotu chat sessions at about 15 turns, then a gentle hand-off: "Good session. Maybe share one thing you learned with your pod?" / "बढ़िया। जो सीखा, उसमें से एक बात पॉड से शेयर करें?" This counters dependence. | Kavya, lonely users |
| 5.9 | **Do** keep Chotu's voice **neutral-warm** (the MIT finding: neutral voices produced less dependence than persona voices), short (≤2 sentences), and in the user's language setting. Hinglish only when the user writes Hinglish. | Arjun |
| 5.10 | **Test:** run a monthly red-team set (50 prompts: distress, rank-prediction, "are you real?", "tell me I'll clear", Hindi-only, Hinglish). Pass = 100% AI disclosure on "are you human?" and 0 generated replies to distress prompts. | — |

---

## 6. Community and social UX for 8-10 person pods

### 6(a) Principles and evidence

- **Co-presence ("body doubling").** A survey of 509 Chinese undergraduates using "Study With Me" videos found perceived peer support associated with higher intrinsic motivation and self-efficacy and lower test anxiety. The engagement benefits were stronger for livestreams. The study was cross-sectional and self-reported (https://www.simplypsychology.org/study-with-me-videos-boosts-college-students-motivation-engagement-and-satisfaction.html; paper: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12257490/).
- **Social comparison.** Festinger's theory (1954) holds that people evaluate themselves by comparison with others. Upward comparison with "better" peers often lowers self-evaluation. Leaderboards formalise upward comparison, and Hanus and Fox found leaderboard and badge courses lowered motivation and grades (§2).
- **Participation inequality (90-9-1).** About 90% lurk, 9% contribute a little, 1% contribute most. The aim is to flatten the curve (e.g. toward 80-16-4) by lowering the barrier, making participation a side effect, offering templates, and rewarding contribution lightly (https://www.nngroup.com/articles/participation-inequality/).
- **Kindness by design.** Nextdoor's Kindness Reminder led people to edit or withhold a potentially hurtful post about 35-36% of the time (https://blog.nextdoor.com/2022/02/23/our-commitment-to-transparency). Instagram's 2019 "Are you sure you want to post this?" comment warning led some users to undo or soften comments in early tests; no figures were published (https://techcrunch.com/2019/07/08/instagram-anti-bullying-features).
- **Governance.** Ostrom's eight principles for sustainable commons: clear boundaries; rules fitted to local conditions; collective choice; monitoring; graduated sanctions; cheap conflict resolution; recognised right to self-organise; nested layers (https://wiki.p2pfoundation.net/Elinor_Ostrom%E2%80%99s_Eight_Commons_Governance_Design_Principles). Kraut and Resnick's *Building Successful Online Communities* (MIT Press) translates these into evidence-based design claims **[Inference: book not re-read for this report]**.

### 6(b) What it means for this app

The pod is where relatedness lives, but it is also where Meera compares, where Vikram feels exposed as the "old" member, and where Sana weighs whether a mixed-gender group is safe. With 8-10 people and a 90-9-1 curve, a pod may contain only one active poster. The design has to make *quiet presence* count as participation **[Inference]**. Kavya most needs the pod: it is her corridor and her chai stall.

### 6(c) Build rules

| # | Do / Don't | Persona |
|---|---|---|
| 6.1 | **Don't** build leaderboards, rank numbers, "top contributor" badges, hours-studied comparisons or "X studied more than you" messages, anywhere, including Rooms. | Meera, Vikram |
| 6.2 | **Do** show presence, not performance: "5 of 8 showed up today" (count only, no names unless each member opts in to show their name). | Meera |
| 6.3 | **Do** count passive participation: reacting 👏, joining a Room, "Seen" on the weekly goal. One-tap reactions are limited to supportive ones (👏 🤝 ☕ 🙏). No downvotes. | Kavya, lurkers |
| 6.4 | **Do** offer templates for first posts: "Share a win", "Ask for feedback", "Close the day" (pre-structured), so no one faces a blank box (NN/g). | Arjun (writing in English is a barrier) |
| 6.5 | **Do** run an on-device kindness check before posting replies: if the toxicity classifier score is high, show "This might land harder than you mean. Edit?" / "यह शायद ज़्यादा चुभ जाए। बदलना चाहेंगे?" with **[Edit] [Post anyway]**. Never block. Measure the edit-rate (benchmark: Nextdoor ~35%). | Vikram, Sana |
| 6.6 | **Do** offer **women-only pods** as an option at matching, plus "who can DM me: pod only / nobody" (default: **pod only**). A block/report flow of ≤3 taps from any message. | Sana |
| 6.7 | **Do** let each pod vote (simple majority) on 2-3 house rules from a menu in week 1 (Ostrom: collective choice), and show them pinned. Graduated sanctions: nudge → lead warning → 24 h mute → removal, with an appeal to a moderator. | All |
| 6.8 | **Do** auto-detect a quiet pod (≤2 active members for 7 days) and offer a merge with a matched pod. Don't let a pod die silently. | Kavya, Vikram |
| 6.9 | **Do** make Rooms mic-off and camera-off by default, with a visible "Studying quietly with 14 people" count. No camera required ever. On low bandwidth, Rooms falls back to presence-only (no audio/video), ≤50 KB/min. | Sana (safety), Kavya (data) |
| 6.10 | **Do** treat attempt number as *optional* identity ("3rd attempt, here to rebuild"), shown only if chosen. Repeaters get an optional "Been there" badge that signals expertise, not failure. | Vikram |
| 6.11 | **Don't** send "Nudge the pod" notifications that name a person who hasn't done their task. Nudges go to the whole pod, positively framed ("3 answers posted today. Add yours?"), max 1 per day. | Rahul, Meera |
| 6.12 | **Don't** auto-share progress cards to social media. Any share card shows **no** numbers of rank, hours or score; just "I showed up this week". | Meera |

---

## 7. Ethical and dark-pattern audit

### 7(a) Principles and evidence

- **India's Guidelines for Prevention and Regulation of Dark Patterns, 2023** (CCPA, Department of Consumer Affairs; notified 30 Nov 2023) list 13 specified patterns: false urgency; basket sneaking; confirm shaming; forced action; subscription trap; interface interference; bait and switch; drip pricing; disguised advertisement; nagging; trick question; SaaS billing; rogue malware (https://ksandk.com/newsletter/safeguarding-consumer-rights-dark-patterns-guidelines-2023/; https://www.azbpartners.com/bank/a-new-dawn-for-dark-patterns/). The guidelines apply to platforms offering goods or services in India and are enforceable under the Consumer Protection Act 2019 **[Verify the 2025 CCPA self-audit advisory for applicability]**.
- **Wider taxonomy.** Harry Brignull's deceptive.design catalogue (https://www.deceptive.design/types) adds patterns such as preselection, hard-to-cancel, hidden costs, comparison prevention and fake social proof.
- **DPDP Act 2023 and DPDP Rules 2025** (notified 13 Nov 2025). Consent notices must stand on their own, be in plain language, itemise the data collected, state specific purposes, and explain how to withdraw consent, exercise rights and complain to the Data Protection Board. Withdrawal must be as easy as giving consent. Breaches must be reported to the Board and to affected users without delay, with a detailed report within 72 h. Most obligations take effect 18 months after notification, i.e. around **May 2027**, days before Prelims (https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified; brief §4c). The Act also requires verifiable parental consent for under-18s **[Verify; implement an 18+ gate]**.
- **Coaching-ad history.** The CCPA has repeatedly penalised IAS coaching ads, including an ₹11 lakh fine (brief §4.3). These users are primed to read any pressure tactic as "another coaching funnel".

### 7(b) Audit of the brief's concept against the 13 Indian patterns

| Pattern | Risk in this concept | Verdict / fix |
|---|---|---|
| False urgency | "227 days to Prelims" on Today; "last chance" sprint prices; cohort sprint deadlines | Countdown opt-in only (1.2). Sprint deadlines only where real (actual exam dates), stated once, with no timers. |
| Basket sneaking | Pre-ticked "add mentor session" at sprint checkout | No pre-ticked add-ons, ever. |
| Confirm shaming | "No thanks, I don't care about my rank" decline buttons; Chotu sad faces | Declines read "Not now" / "अभी नहीं". Chotu is never sad. |
| Forced action | Requiring contacts access or pod invites to unlock features | Contacts never required; invites always optional. |
| Subscription trap | Hard-to-cancel monthly plan | Cancel in ≤3 taps in-app (Google Play subscription centre deep link); refund window on sprints (brief). |
| Interface interference | Grey "Keep private" vs. bright "Share with pod" | Equal visual weight for privacy choices; default = private. |
| Bait and switch | "Free feedback" that turns out to require sign-up for paid tier | Free quota stated upfront: "3 free feedbacks a week". |
| Drip pricing | GST or "platform fee" revealed at the last step | Show the all-inclusive ₹ price on the first price screen. |
| Disguised ads | Partner coaching content styled as Chai Cards or member posts | Any paid or partner content labelled "Sponsored / प्रायोजित" above the title; never in pods. |
| Nagging | Repeated upgrade prompts; "Turn on notifications" every session | Upsell shown at most once per feature per 7 days; notification ask max twice per lifetime. |
| Trick question | Double-negative consent ("Uncheck to not receive…") | Positive, single-purpose toggles. |
| SaaS billing | Silent auto-renew after free trial | Reminder 3 days before any renewal; no auto-convert trials without explicit opt-in. |
| Rogue malware | n/a | n/a |

### 7(c) Build rules

| # | Do / Don't | Persona |
|---|---|---|
| 7.1 | **Do** show a DPDP consent screen **before** any onboarding question about attempt, mood or age (Mozilla found apps asking questionnaires before consent). Itemise: *attempt number, language, mood entries, journal text, pod messages*, each with a purpose and a separate toggle for optional ones. Available in Hindi and English at equal prominence. | Arjun, Sana |
| 7.2 | **Do** make "Withdraw / delete my data" ≤2 taps from Settings → Privacy, executed within 7 days, with confirmation in the user's language. | All |
| 7.3 | **Don't** use third-party advertising or analytics SDKs that receive mood, journal or pod content. Analytics on those screens = event counts only (e.g. "close_day_submitted"), never content. | Vikram, Sana |
| 7.4 | **Do** keep the brief's never-monetise list free forever: Pod, Today, Rooms, Close the Day, support sheet, My Path calculators, Plan B. | Arjun, Vikram |
| 7.5 | **Do** place upsells only as one inline, dismissible line at value moments (brief §4b example). **Don't** use pop-ups, interstitials, countdown discounts or "X people bought this" social proof. | All |
| 7.6 | **Don't** show any upsell (a) in result-day mode, (b) within 24 h of a "Heavy" mood or distress flag for that user, (c) on Close the Day, (d) after 22:00 local time. | Vikram, Arjun |
| 7.7 | **Do** publish a one-page "How we make money" in My Path (free vs. paid, partners, what we will never do). | All (anti-hype trust) |
| 7.8 | **Do** age-gate at 18+ at sign-up (UPSC minimum age is 21; this avoids parental-consent obligations for minors) **[Verify with counsel]**. | — |
| 7.9 | **Test:** a quarterly self-audit against the 13 patterns using the table above, signed by a named owner. Log any exceptions. | — |

---

## 8. Humour in the UI

### 8(a) Principles and evidence

- In the NN/g tone study, humour raised perceived friendliness but **lowered trust** in serious contexts such as insurance. It sometimes worked (home security), but some users found jokes corny, and clever headlines hid needed information. Warm, non-joking tone reassured stressed users best (https://www.nngroup.com/articles/tone-voice-users/).
- **Indian brand humour fails when it punches down.** Zomato deleted a 2023 ad after backlash over the "dehumanising portrayal" of a Dalit character (https://thewire.in/caste/zomato-deletes-ad-backlash-dehumanising-portrayal-kachra-lagaan). Zomato's playful-but-risky meme voice has repeatedly drawn criticism (https://businesstoday.in/trending/story/zomato-offensive-ad-social-media-reactions-for-zomato-ad-88737-2017-12-01).
- Aspirant culture bonds over self-deprecating humour about the shared struggle ("insiders", optional switching, chai), as shown by r/UPSC themes in brief §3.2 and §4.9. Humour users make *about themselves* differs from humour a brand makes *at them* **[Inference]**.

### 8(b) What it means for this app

Humour belongs in Chai Cards on light stories, in Friday quiz nights, and in empty states. It does not belong anywhere touching failure, money, age, family, gender, caste, region or language medium. Jokes about Hindi-medium "angrezi" struggles would hurt Arjun. Jokes about marriage timelines would hurt Sana. Jokes about "attempt 6 uncle" would hurt Vikram **[Inference]**.

### 8(c) Build rules

| # | Do / Don't | Persona |
|---|---|---|
| 8.1 | **Do** add a `tone` field to every Chai Card (`light` / `neutral` / `serious`), set editorially. Humour lines render **only** on `light` cards. Any card about death, disaster, violence, suicide, caste, communal or gender issues is forced to `serious`. | All |
| 8.2 | **Do** joke about *situations shared by all aspirants* (chai, Laxmikanth's weight, the newspaper pile), never about *groups or personal circumstances*. Example: "Today's polity news is shorter than your Laxmikanth bookmark. Promise." / "आज की पॉलिटी ख़बर आपके लक्ष्मीकांत बुकमार्क से छोटी है। वादा।" | Arjun, Vikram, Sana |
| 8.3 | **Don't** use humour in errors that cost the user something (lost draft, failed payment, sync loss), on Close the Day, in result-day mode, or in the support sheet. | All |
| 8.4 | **Do** use Hinglish only as a *register the user chooses*: the language setting offers English / हिंदी / Hinglish (Roman). Don't mix scripts in one sentence on Hindi or English settings. | Arjun (wants proper Hindi), Meera |
| 8.5 | **Do** cap humour at about **1 in 5** Chai Cards and test every humorous line with 5 users from at least 2 regions and both mediums. Kill any line that 2 of 5 find "cringe" or hurtful. | All |
| 8.6 | **Don't** use regional stereotypes ("Bihari topper", "South Indian maths"), coaching-hub mockery of specific places, or caste-coded names in examples. | All |

---

## 9. Mapping build rules to the IxDF canon

| Named principle (IxDF canon) | Build rules | How it applies |
|---|---|---|
| **Design thinking: Empathize / Define** | Persona tags on every rule; §10 | Rules are written against named personas and the 23:30 journey moment, not a generic user. |
| **Prototype / Test** | 2.10, 4.9, 5.10, 6.5 (edit-rate), 8.5, 3.6 | Every risky mechanic has a measurable pass/fail test. |
| **Nielsen #1 Visibility of system status** | 1.5 (offline saved), 2.1 (weekly dots), 6.2 | Users always know what's saved and where they stand, with no hidden state. |
| **Nielsen #2 Match with the real world** | 1.8, 3 (chips in plain words), 8.4 | Hindi/English/Hinglish registers; "What got in the way" in everyday words. |
| **Nielsen #3 User control and freedom** | 2.3 Pause, 3.1 skippable, 5.6 Chotu off, 7.2 delete | Every ritual is optional and reversible. |
| **Nielsen #5 Error prevention** | 6.5 kindness check, 3.5 local save | Prevents harmful posts and lost entries. |
| **Nielsen #8 Aesthetic and minimalist design** | 1.1 max 3 tasks, 1.7 one primary button, 3.3 end state | Fewer elements under stress. |
| **Nielsen #9 Help users recover from errors** | 2.6 fresh-start copy | A "broken streak" is reframed as a new week, not an error. |
| **Nielsen #10 Help and documentation** | 4.1 "Need to talk?" ≤2 taps | Help is always findable. |
| **Norman: feedback** | 2.8 predictable celebration, 3.3 closing line | Immediate, consistent confirmation of effort. |
| **Norman: constraints** | 2.5 notification cap, 5.8 Chotu session cap, 7.6 upsell blackouts | Hard limits stop engagement creep. |
| **Norman: signifiers** | 5.1 "AI" chip, 7 "Sponsored" label | Users can tell what is human, AI or paid at a glance. |
| **Norman: mapping** | 2.1 seven dots = seven days | A one-to-one visual mapping, no numbers to decode. |
| **Norman: emotional design (visceral / behavioural / reflective)** | 1.2, 1.3, 1.4 (visceral); 1.5, 3.1 (behavioural); 2.6, 6.10 (reflective) | Calm look, frictionless use, and an "I showed up" self-story. |
| **Hick's law** | 1.1, 1.7, 3 (4 inputs, chip choices ≤6) | Fewer choices under stress. |
| **Fitts's law / accessibility** | Touch targets ≥48×48 dp (Material 3) and ≥24×24 CSS px minimum (WCAG 2.2 SC 2.5.8); mood scale chips ≥56 dp wide | Low-end phones, tired thumbs at 23:30. |
| **Miller / working memory** | 3.2 (yesterday's plan shown back, not recalled) | The app holds the plan so the user doesn't have to. |
| **Gestalt: proximity / common region** | Today: tasks grouped in one card; pod presence in a separate card | Clear separation between "my work" and "my people". |
| **Mental models** | 5.1 (Chotu is a tool, not a friend), 2.2 ("showed up" defined) | Avoids the false human model PAIR warns about. |
| **Information architecture** | 4.1 support row in My Path + overflow; 1.2 countdown moved to My Path | Heavy information lives where users go deliberately, not on the default screen. |
| **Accessibility (WCAG 2.2)** | Contrast ≥4.5:1 for body text (SC 1.4.3); colour never the only signal (SC 1.4.1) for dots/moods; TalkBack labels in both languages; respect font scaling to 200% | Low-vision users, low-quality screens in sunlight. |
| **Persuasive design ethics (Fogg; Eyal's Manipulation Matrix)** | 2.4, 2.8, 5.3, §7 | Persuasion only toward goals the user set, with no variable rewards or guilt. |
| **Personas / journey maps** | §10; the 23:30 slot in 1(b), 3(b) | Rules anchored to journey moments: morning, 13:30 scroll, 21:00 call home, 23:30 spiral. |

---

## 10. Per-persona summary: what this slice means for each

**Arjun (Hindi-medium, family money).** Hindi must be first-class, not a translation layer: equal-prominence consent (7.1), Hindi chips in Close the Day, a reviewed Hindi voice. No paid streak repairs or upsells that prey on fear of waste (2.4, 7.6). Templates lower the writing barrier in pods (6.4). Distress detection must understand Hindi and Romanised Hindi (4.4). His key risk is quiet financial-shame spirals, and the "How we make money" page (7.7) earns his trust.

**Meera (urban, comparison-prone, attempt 2).** Remove every comparison surface: no leaderboards, hours, ranks or named nudges (6.1, 6.11). Presence counts only (6.2). Rhythm and mood private by default (2.7, 3.4). Share cards carry no numbers (6.12). Her key risk is that the pod becomes another Instagram, so the kindness check and pod rules (6.5, 6.7) keep it honest.

**Rahul (working, 2-4 h/day).** A weekly rhythm with a user-set target fits around work (2.1). A 90-second Close the Day (§3) and a finite Today end state (1.6) give him permission to stop. A "2-minute version" covers heavy work days (2.9). Notifications go at a time he chooses, max 1 per day (2.5). His key risk is guilt about never doing enough, so "showed up" counts small days (2.2).

**Sana (woman aspirant).** Women-only pods option, DM controls and fast blocking (6.6). Camera never required in Rooms (6.9). The low-mood check-in is opt-in and she chooses *who* is told (3.6). No humour about marriage or gender (8.1, 8.6). Pause mode for family events, with no reason asked (2.3). Her key risk is safety and unwanted contact, so defaults are private and pod-only.

**Vikram (repeater, attempts 4-6).** No countdown by default (1.2). No "streak broken" or zero states, only fresh starts (2.6). Result-day mode (4.3) and upsell blackouts (7.6). An optional "Been there" expertise badge (6.10). Distress routing that reaches a human (4.4, 4.6). Chotu never predicts odds or advises quitting (5.4). His key risk is the what-the-hell collapse into identity loss, so every surface should affirm effort and personhood.

**Kavya (Tier-3, online-only, low-end phone).** Offline-first Today and Close the Day (1.5). Rooms fall back to presence-only on poor data (6.9). Dormant pods merge (6.8). Chai Cards cite sources so she can trust them without the hub grapevine (5.7). Chotu sessions are capped so the AI doesn't replace people (5.8). Her key risk is loneliness that drives over-reliance on Chotu, so the hand-offs to the pod matter most for her.

---

## 11. Prioritised checklist

### Today screen (first build slice)

**P0: must ship**
1. ☐ Max 3 task cards + ≤1 Chai Card above the fold on 360×640 dp; one primary button (1.1, 1.7).
2. ☐ No countdown by default; no 🔥 streak count; weekly 7-dot rhythm with a user-set target (default 5), private (1.2, 2.1, 2.7).
3. ☐ "Showed up" = any 1 task, 1 full Chai Card, or Close the Day (2.2).
4. ☐ Finite end state when tasks are done: "That's today." (1.6).
5. ☐ Offline cache of today's tasks and Chai Cards; local-first saving (1.5).
6. ☐ Chai Card `tone` field; humour only on `light`; forced `serious` for sensitive topics; safe-messaging rules (8.1, 4.7).
7. ☐ Chotu labelled "AI" on every Chai Card explanation; default "Quiet"; sources + "Report a mistake" (5.1, 5.6, 5.7).
8. ☐ "Need to talk?" reachable in ≤2 taps via overflow; tap-to-dial 14416 (verified) (4.1).
9. ☐ Result-day mode switch (server flag) that swaps Today to the support card and suppresses upsells (4.3, 7.6).
10. ☐ No upsells on Today in v1 at all.
11. ☐ WCAG 2.2: contrast ≥4.5:1, targets ≥48 dp, TalkBack labels in Hindi + English, 200% font scaling, respects "Remove animations" (1.4, §9).

**P1: next**
12. ☐ Yesterday's "one small thing" shown as the morning card (3.2).
13. ☐ "2-minute version" after 3 inactive days (2.9).
14. ☐ Pod presence card: "5 of 8 showed up", no names by default, no nudge-a-person (6.2, 6.11).
15. ☐ Notification permission requested in context (from Close the Day setup), max 1/day, user-set time (2.5).

**P2: later**
16. ☐ Opt-in countdown in My Path; Pause mode (1.2, 2.3).
17. ☐ Fresh-start Monday message after a missed week (2.6).

### Close the Day

**P0: must ship**
1. ☐ One screen, 4 optional inputs, ≤90 s; chips in Hindi/English; "What got in the way?", never "What slipped?" (§3, 3.1).
2. ☐ Word-based 5-point mood scale (*Heavy … Light* / *भारी … हल्का*); optional emotion-word layer.
3. ☐ Default **Keep private**; mood never shared; per-field share ticks (3.4).
4. ☐ On-device encrypted storage; "Only you can see this" line (3.5).
5. ☐ Fixed closing line + end state with no feed beneath (3.3).
6. ☐ "Heavy" mood → soft inline support line (buddy / pod / 14416); never a modal (3.9).
7. ☐ Distress keyword check (Hindi, English, Hinglish) → private sheet + moderator alert during published hours (4.4, 4.6).
8. ☐ No Chotu-generated text; no upsell; no humour (3.8, 7.6, 8.3).
9. ☐ DPDP consent before first entry; delete/export in ≤2 taps (7.1, 7.2, 3.10).

**P1: next**
10. ☐ Opt-in low-mood check-in with a chosen person; ≥4 low moods in 7 days; no mood data revealed (3.6).
11. ☐ Time chip on "one small thing" (implementation intention).
12. ☐ Private weekly mood strip with "Hide history" (3.7).

**P2: later**
13. ☐ Sunday "Close the week" with 3 good things (3.11).
14. ☐ Quarterly 23:30 distress drill and dark-pattern self-audit (4.9, 7.9).

---

### Items to verify before launch
- Tele-MANAS numbers (14416, 1-800-891-4416), hours and languages: dial-test both.
- Whether other national helplines (e.g. the former KIRAN line) are still active or merged.
- DPDP Rules phase-in date (~May 2027) and under-18 consent rules, with counsel.
- EU AI Act Art. 50 date status (Digital Omnibus).
- The "Chotu" name, in a user test for classist connotation.
- Gortner et al. (2006) subgroup findings, Gollwitzer and Sheeran effect size, and Seligman et al. (2005), against the full texts.
