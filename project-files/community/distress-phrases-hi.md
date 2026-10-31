# Distress phrases: Hindi and Hinglish

> **DRAFT for human review. Not approved. Do not use with members until the safety lead and a qualified mental-health professional have signed off.**

> **A native Hindi speaker must check every line in this file**, including the romanised forms and the misspellings. Nothing here goes live until that check is signed and dated in the review block at the end.

## What this list is for

This list does two jobs. It seeds the distress pre-filter in the app, and it trains moderators to recognise how people actually write when they are struggling.

The rule for the pre-filter is short:

> Matches only route a post to a human moderator and show helplines. Never auto-reply as a person, never block or delete the post.

A match is a reason for a human to look. It is never a diagnosis and never a verdict. Most matches will be ordinary frustration. That is fine. A moderator reading a post that turned out to be about a hard CSAT paper costs a minute. Missing a real one costs far more.

The machine-readable copy is `distress-phrases.json`. This file is generated from it, so edit the JSON and regenerate, or edit both together.

## How matching works

- Lowercase the roman text.
- Collapse repeated letters (khatammm -> khatam).
- Strip punctuation and emoji before matching, but keep emoji for the moderator view.
- Treat zero-width characters and extra spaces as absent.
- Match both native script and roman forms, plus every entry in variants.

**Tier rules**

- danger: route to the on-call wellbeing moderator at once and show the helpline sheet first.
- high: route to the wellbeing moderator queue and show the helpline sheet.
- low: suggest a private check-in from the pod lead. Show the helpline sheet as a quiet link, not a pop-up.
- A low or high match together with a farewell, a method, a time ('tonight', 'aaj raat') or giving things away counts as danger.
- A falsePositives match lowers the priority of a low or high match only. It never hides a danger match. A human still sees the post.

**The filter never:**

- Auto-reply as if a human wrote it.
- Block, hide, delete or shadow-ban the post.
- Tell the pod that a post was flagged.
- Show an upsell, a quote card or a celebration to the member while a flag is open.
- Send the private Chotu chat text anywhere without the member tapping 'Talk to a person'.

## Tier 1: Immediate danger

Route at once to the on-call wellbeing moderator. Helpline sheet shown first. Target first human reply: **[T1 minutes, team to set]**.

| Native script | What people type | Common variants and misspellings | Note for moderators |
| --- | --- | --- | --- |
| मैं खुद को खत्म कर लूँगा | main khud ko khatam kar lunga | khud ko khatm kar lunga, khud ko khatam kar lungi, khudko khatam kr lunga, khud ko khtm kar dunga | Direct statement of intent. Feminine form 'kar lungi' is equally common. |
| मैं मरना चाहता हूँ | main marna chahta hoon | mai marna chahta hu, marna chahti hoon, mrna chahta hu, bas marna hai | Direct. Check it is not a quote or a GS discussion. |
| आत्महत्या कर लूँगा | aatmahatya kar lunga | atmhatya kar lunga, aatmhatya, atmahatya, suicide kar lunga, sucide kar lunga | Also appears in GS topics (farmer suicides). See falsePositives. Intent wording ('kar lunga', 'karne wala hoon') is the signal. |
| अब जीना नहीं है | ab jeena nahi hai | ab jina nahi hai, ab nahi jeena, jeene ka mann nahi, jina nhi h | Direct wish not to live. |
| ये मेरा आखिरी मैसेज है | ye mera aakhri message hai | mera akhri msg hai, last message hai mera, aakhiri message | Farewell. Treat as danger unless clearly about leaving the app or a group. |
| सबको अलविदा, मुझे माफ़ करना | sabko alvida, mujhe maaf karna | sabko alwida, alvida doston, maaf karna mummy papa, mujhe maaf kar dena | Farewell plus apology to family is a strong sign. |
| आज रात सब खत्म कर दूँगा | aaj raat sab khatam kar dunga | aaj raat sab khatm, aaj sab khatam kar dungi, aaj hi sab khatam | Time plus intent. |
| नींद की गोलियाँ जमा कर ली हैं | neend ki goliyan jama kar li hain | goliyan jama kar li, pills rakh li hain, dawai ikatthi kar li | Mentions a method or means. Moderators should not ask for details beyond what safety needs. |
| फाँसी लगा लूँगा | phansi laga lunga | fansi laga lunga, phaansi, latak jaunga | Method mention. 'Phansi' also appears in GS discussions of capital punishment. See falsePositives. |
| मेरे जाने के बाद मेरी किताबें ले लेना | mere jaane ke baad meri kitaben le lena | mere baad notes le lena, mere jane ke baad | Farewell plus giving things away. |

## Tier 2: High concern

Route to the wellbeing moderator queue. Helpline sheet shown. Target first human reply: **[T2 minutes, team to set]**.

| Native script | What people type | Common variants and misspellings | Note for moderators |
| --- | --- | --- | --- |
| सब खत्म हो गया | sab khatam ho gaya | sab khatm, sab khtm ho gaya, sab khatam, ktm sab, sab khatam hai | Very common after results. Often means 'this attempt is over', sometimes means much more. Always gets a human read. 'Syllabus khatam' is a false positive. |
| अब और नहीं होगा मुझसे | ab aur nahi hoga mujhse | ab nahi hoga, mujhse nahi hoga ab, ab bas, ab aur nahi | Exhaustion or giving up. Read the thread around it. |
| जीने का कोई मतलब नहीं | jeene ka koi matlab nahi | jine ka koi matlab nahi, zindagi ka koi matlab nahi, jindagi bekaar hai | Passive wish not to live. Upgrade to danger with any time, method or farewell. |
| मेरे बिना सब बेहतर रहेंगे | mere bina sab behtar rahenge | mere bina sab khush rahenge, main na rahun to accha, main nahi rahunga to | Feeling like a burden. Strong warning sign. |
| मैं घरवालों पर बोझ हूँ | main gharwalon par bojh hoon | bojh hoon, main bojh hu, sab par bojh | Burden. Common for older repeaters supported by family. |
| घरवालों को मुँह नहीं दिखा सकता | gharwalon ko munh nahi dikha sakta | muh nahi dikha sakta, mooh kaise dikhaunga, ghar kaise jaunga | Shame after a result. Check in quickly. |
| अब कुछ नहीं बचा | ab kuch nahi bacha | kuch nahi bacha, kuchh nahi bacha ab | Hopelessness. Can also mean 'no attempts left'. A human decides. |
| ज़िंदगी से थक गया हूँ | zindagi se thak gaya hoon | jindagi se thak gaya, zindgi se thak gayi hoon, life se thak gaya | Tired of life, not just tired of study. |
| मुझे मर जाना चाहिए | mujhe mar jana chahiye | mar jana chahiye mujhe, mar jaun to accha | Can be said in frustration. Still a human read every time. |
| अपनी सारी किताबें दे रहा हूँ, अब ज़रूरत नहीं | apni saari kitaben de raha hoon, ab zaroorat nahi | notes free mein de raha hu ab zarurat nahi, sab saman de raha hu | Giving things away. Many people sell books after quitting. The 'ab zaroorat nahi' part with hopeless words is the signal. |

## Tier 3: Low mood, worth a check-in

Suggest a private check-in from the pod lead within 24 hours. Helpline link shown quietly, no pop-up.

| Native script | What people type | Common variants and misspellings | Note for moderators |
| --- | --- | --- | --- |
| मन नहीं लग रहा | mann nahi lag raha | man nhi lag raha, padhai mein mann nahi, mann nahi lagta | Low mood or low focus. A kind check-in from the pod lead. |
| बहुत डिप्रेस्ड हूँ | bahut depressed hoon | bohot depressed hu, depress ho gaya, dipression | Often casual. Still worth a private check-in. |
| नींद नहीं आती | neend nahi aati | neend nhi aa rahi, so nahi pa raha, raat bhar jagta hu | Sleep trouble. Pair with Lamp Off and a check-in. |
| बहुत अकेला लग रहा है | bahut akela lag raha hai | akela feel hota hai, akeli hoon, koi baat karne wala nahi | Loneliness. Offer a buddy or a chai-break room. |
| सब बेकार लग रहा है | sab bekaar lag raha hai | sab bekar, kuch accha nahi lagta | Low mood. Ask gently how long it has felt this way. |
| रोना आ रहा है | rona aa raha hai | bahut rona aa raha, ro raha hu | Distress in the moment. A human reply soon. |
| क्या फ़ायदा | kya fayda | kya faayda, kya fayda padhne ka, koi fayda nahi | 'What's the point'. Usually about study, sometimes about life. Read the context. |

## False positives (exam slang and study topics)

These phrases look alarming but usually are not. A false-positive match lowers the priority of a low or high match. **It never hides a danger match**, and a human still sees every flagged post.

| Native script | What people type | Why it is usually fine |
| --- | --- | --- |
| मर गया, पेपर बहुत टफ था | mar gaya, paper bahut tough tha | Exam slang for 'that paper destroyed me'. Lower priority only if nothing else in the post is hopeless. |
| CSAT ने मार डाला | CSAT ne maar dala | Slang. Same as 'this paper killed me'. |
| सिलेबस खत्म कर दिया | syllabus khatam kar diya | Good news: finished the syllabus. 'Khatam' here is positive. |
| प्रीलिम्स खत्म | prelims khatam | Literal: the exam is over. Read the next line before deciding. |
| जान निकल गई | jaan nikal gayi | Slang for 'I was terrified' or 'I'm exhausted'. |
| किसान आत्महत्या, कोटा की ख़बरें | kisan aatmahatya, Kota ki khabrein | GS topics and news. A study discussion is not a disclosure. But a member can move from the topic to themselves, so a human still glances. |
| फाँसी की सज़ा पर निबंध | phansi ki saza par nibandh | Essay or GS4 topic on capital punishment. |
| देश के लिए जान दे दूँगा | desh ke liye jaan de dunga | Patriotic phrase common in interview prep. Not a disclosure. |

## Signs that are not phrases

Some of the strongest warning signs are behaviour, not words. The filter cannot see most of them. Pod leads and moderators can.

- **Sudden silence after result day from someone who posted most days** (tier: low). Pod lead check-in within 48 hours. Upgrade to high if the last post was a farewell or hopeless.
- **Leaving the pod or deleting posts soon after a result** (tier: low). Gentle private message. Do not ask them to justify leaving.
- **Giving away books, notes, test-series logins or belongings with phrases like 'ab zaroorat nahi'** (tier: high). Giving things away is a classic warning sign. Combined with a farewell it is danger.
- **Thank-you-for-everything or farewell posts that do not fit the conversation** (tier: high). Treat as danger if it is late at night, after a result, or with any hopeless phrase.
- **A run of low moods on Close the Day** (tier: low). Private by default. Only the person the member chose hears about it.
- **Posting at 2 to 5 a.m. several nights running with hopeless language** (tier: high). Sleep loss plus hopelessness. Check the night roster.

## Notes for moderators reading these posts

- Read the whole post and the two or three posts before it. Context decides the tier, not one word.
- When unsure between two tiers, choose the higher one.
- Never quote the member's words back to the pod or in a public thread.
- Never ask for details of a method beyond what you need to keep them safe. Follow `crisis-protocol.md`.
- If a new phrase keeps turning up in real posts, note it (without the member's name) for the monthly review.

## Review block

A reviewer must check, and initial each line:

- [ ] A native Hindi speaker has read every row, including variants, and fixed anything unnatural, wrong or offensive. Name and date: ________
- [ ] Each phrase is in the right tier. A qualified mental-health professional agrees with the tier rules. Name and date: ________
- [ ] Regional and dialect forms are covered (for example Bhojpuri, Awadhi and Rajasthani-influenced Hindi; Urdu-script users). Missing forms listed for the next version.
- [ ] False positives are realistic and none of them could hide a real disclosure.
- [ ] The list has been tested against a sample of real, consented, anonymised pilot posts, and the miss rate on danger-tier posts is recorded. (Not done yet.)
- [ ] The JSON and this file match.
- [ ] The safety lead has signed off. Name and date: ________
