# Distress phrases: Telugu and Tenglish

> **DRAFT for human review. Not approved. Do not use with members until the safety lead and a qualified mental-health professional have signed off.**

> **A native Telugu speaker must check every line in this file**, including the romanised forms and the misspellings. Nothing here goes live until that check is signed and dated in the review block at the end. Telugu is blocked from going live in the app until this file has a signed Telugu review (see `status/project-status.md`).

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
| చనిపోవాలని ఉంది | chanipovaalani undi | chanipovalani undi, chanipovalanipistondi, chachipovalani undi, chanipotha | Direct wish to die. |
| నేను ఆత్మహత్య చేసుకుంటాను | nenu aatmahatya chesukuntaanu | atmahatya chesukunta, aathmahathya, suicide chesukunta, sucide chesukunta | Direct intent. Also a GS topic (farmer suicides). See falsePositives. |
| ఇక బతకాలని లేదు | ika bathakaalani ledu | ika batakalani ledu, bathakalani ledu, bratakalani ledu, brathakalani ledu | Direct wish not to live. 'Brathakalani' is a common spoken form. |
| ఇదే నా చివరి మెసేజ్ | ide naa chivari message | ide na chivari msg, idhe naa last message, chivari message | Farewell. Danger unless clearly about leaving the app. |
| అందరికీ బై, ఇక నేను కనిపించను | andariki bye, ika nenu kanipinchanu | andariki bye ika kanipinchanu, ika kanipinchanu, inka kanipinchanu | Farewell: 'you won't see me again'. |
| అమ్మా నాన్నా, నన్ను క్షమించండి | amma naanna, nannu kshaminchandi | nannu kshaminchandi, nannu kshaminchu amma, sorry amma nanna | Apology to parents in a farewell tone is a strong sign. |
| ఈ రోజు రాత్రే అంతా ముగిస్తా | ee roju raathre antha mugistha | ee rathri antha mugistha, eeroju antha aipothundi, ivale antha mugistha | Time plus intent. |
| మాత్రలు దాచి పెట్టుకున్నా | maatralu daachi pettukunna | tablets daachi pettukunna, pills unchukunna, matralu mingesta | Mentions means. Do not ask for details beyond what safety needs. |
| నా జీవితం ముగించేస్తా | naa jeevitham muginchestha | na jeevitham muginchesta, life end chestha, life ki end | Direct intent. |

## Tier 2: High concern

Route to the wellbeing moderator queue. Helpline sheet shown. Target first human reply: **[T2 minutes, team to set]**.

| Native script | What people type | Common variants and misspellings | Note for moderators |
| --- | --- | --- | --- |
| ఇక నా వల్ల కాదు | ika naa valla kaadu | ika na valla kadu, naa valla kaadu inka, inka naa valla kaadu | 'I can't any more'. Read the thread for what 'it' is. |
| బతికి ఏం లాభం | bathiki em laabham | brathiki em labham, bathiki emi labham, batiki em use | 'What's the use of living'. Upgrade to danger with any time, method or farewell. |
| అంతా అయిపోయింది | antha aipoyindi | antha ayipoyindi, anta aipoyindi, antha aipoyindhi, antha over | Telugu equivalent of 'sab khatam'. Often means the attempt is over. Always a human read. |
| నేను లేకపోతే అందరికీ మంచిది | nenu lekapothe andariki manchidi | nenu lekapote andariki better, nenu lekunte manchidi | Feeling like a burden. Strong warning sign. |
| నేను అందరికీ భారం | nenu andariki bhaaram | nenu bharam, intlo vallaki bharam ayyanu, burden ayyanu | Burden on family. Common for long-haul repeaters. |
| ఇంట్లో వాళ్ళకి మొహం చూపించలేను | intlo vaallaki moham choopinchalenu | moham chupinchalenu, intiki ela vellali, intlo ela cheppali | Shame after a result. |
| ఇక ఏ ఆశ లేదు | ika e aasha ledu | inka aasha ledu, hope ledu, e hope ledu | Hopelessness. |
| నా పుస్తకాలు, నోట్స్ అన్నీ ఇచ్చేస్తా, ఇక అవసరం లేదు | naa pusthakaalu, notes anni ichestha, ika avasaram ledu | notes anni ichestha, books anni free ga istha ika avasaram ledu | Giving things away. Selling books after quitting is common. The 'ika avasaram ledu' part with hopeless words is the signal. |
| ఎక్కడికైనా దూరంగా వెళ్ళిపోవాలని ఉంది | ekkadikaina dooranga vellipovaalani undi | dooranga vellipotha, evariki kanipinchakunda vellipotha | Ambiguous: can mean a trip or running away, or something more. A human decides. |

## Tier 3: Low mood, worth a check-in

Suggest a private check-in from the pod lead within 24 hours. Helpline link shown quietly, no pop-up.

| Native script | What people type | Common variants and misspellings | Note for moderators |
| --- | --- | --- | --- |
| మనసు బాలేదు | manasu baaledu | manasu baledu, mood baaledu, manasu bagaledu | Low mood. A kind check-in. |
| నిద్ర పట్టట్లేదు | nidra pattatledu | nidra raavatledu, nidra pattadam ledu, raatri antha melukuva | Sleep trouble. |
| ఒంటరిగా అనిపిస్తోంది | ontariga anipistondi | ontariga unna, onteriga anipistundi, lonely ga undi | Loneliness. Offer a buddy or a chai-break room. |
| ఏమీ చదవాలనిపించట్లేదు | emi chadavaalanipinchatledu | emi chadavalanipinchatledu, chadavalani ledu | Low motivation. |
| చాలా డిప్రెస్డ్ గా ఉంది | chaala depressed ga undi | chala depressed ga undi, depression lo unna | Often casual. Still worth a private check-in. |
| ఏడుపొస్తోంది | edupostondi | edupu vastundi, edustunna | Crying. A human reply soon. |
| ఎవరితోనూ మాట్లాడాలనిపించట్లేదు | evarithonu maatlaadaalanipinchatledu | evaritho matladalani ledu | Withdrawal. Gentle, no pressure. |

## False positives (exam slang and study topics)

These phrases look alarming but usually are not. A false-positive match lowers the priority of a low or high match. **It never hides a danger match**, and a human still sees every flagged post.

| Native script | What people type | Why it is usually fine |
| --- | --- | --- |
| చచ్చిపోయా, పేపర్ చాలా టఫ్ | chachipoyaa, paper chaala tough | Exam slang for 'that paper destroyed me'. Lower priority only if nothing else is hopeless. |
| సిలబస్ ని చంపేద్దాం | syllabus ni champeddam | 'Let's kill the syllabus'. Motivation slang. |
| CSAT చంపేసింది | CSAT champesindi | 'CSAT killed me'. Slang. |
| ప్రిలిమ్స్ అయిపోయింది | prelims aipoyindi | Literal: the exam is over. Read the next line. |
| మైండ్ పోయింది | mind poyindi | Slang for 'I was stunned' or 'I'm fried'. |
| రైతుల ఆత్మహత్యలు | raithula aatmahatyalu | GS3 topic on farmer suicides. A study discussion is not a disclosure, but a human still glances. |

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

- [ ] A native Telugu speaker has read every row, including variants, and fixed anything unnatural, wrong or offensive. Name and date: ________
- [ ] Each phrase is in the right tier. A qualified mental-health professional agrees with the tier rules. Name and date: ________
- [ ] Regional and dialect forms are covered (for example Telangana and Andhra usage; Rayalaseema forms; Telugu typed in Kannada or English keyboards). Missing forms listed for the next version.
- [ ] False positives are realistic and none of them could hide a real disclosure.
- [ ] The list has been tested against a sample of real, consented, anonymised pilot posts, and the miss rate on danger-tier posts is recorded. (Not done yet.)
- [ ] The JSON and this file match.
- [ ] The safety lead has signed off. Name and date: ________
