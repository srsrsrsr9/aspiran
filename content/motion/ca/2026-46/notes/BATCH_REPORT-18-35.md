# Video batch report: episodes 18-35 (V1 finish, V2, V3)

Made 3 November 2026. All episodes are drafts (review.status "draft"); nothing is approved. Narration in the mp4s is the offline placeholder voice; I verified frames, timings and loudness, not how the voice sounds.

## New files in every zip
- `NN-id.voice.txt`: English narration for Sarvam (Bulbul), split into parts of at most 1,500 characters (every episode fits in one part). Save the audio as `NN-id-01.mp3`.
- `NN-id.hi.voice.txt`: Hindi narration for Sarvam, numbers written out in words. Save as `NN-id.hi-01.mp3`.
- `NN-id.hi.srt`: Hindi subtitles, timed to the English video's sentences. Re-time once the Hindi audio exists.
- The Hindi is my own translation and needs the Hindi editor.

Episodes 18-21 were already built in the earlier thread; I only added the three new files to their zips.

## Summary

| n | Title | Format | Tone | Length | QA |
|---|---|---|---|---|---|
| 22 | Western disturbances bring winter rain the monsoon doesn't | whiteboard | LIGHT | 0:44 | PASS |
| 23 | The WTO's peace clause shields India's grain stocks, for now | cards | NEUTRAL | 0:49 | PASS |
| 24 | Tribunals keep losing to the Supreme Court | kinetic | NEUTRAL | 0:47 | PASS |
| 25 | India's data law gives you rights, and the rules decide when | cards | NEUTRAL | 0:43 | PASS |
| 26 | Project Cheetah started with a court's permission | whiteboard | NEUTRAL | 0:42 | PASS |
| 27 | Governors now have a clock on assent, or do they? | kinetic | SERIOUS | 0:49 | PASS |
| 13 | The Indus Waters Treaty has no exit clause for one side | cards | SERIOUS | 0:55 | PASS |
| 28 | The reverse repo stopped being the floor in 2022 | whiteboard | NEUTRAL | 0:48 | PASS |
| 29 | A bill can become law even if the Rajya Sabha says no | kinetic | NEUTRAL | 0:41 | PASS |
| 30 | When Union and State laws clash, the Union usually wins. Usually. | cards | NEUTRAL | 0:48 | PASS |
| 31 | El Niño usually weakens the monsoon, but not always | whiteboard | NEUTRAL | 0:41 | PASS |
| 32 | A biodiversity hotspot is defined by what it has lost | cards | NEUTRAL | 0:51 | PASS |
| 33 | Two words in the Preamble weren't there in 1949 | kinetic | NEUTRAL | 0:49 | PASS |
| 34 | India's goods gap is huge. Its current account gap isn't. | whiteboard | NEUTRAL | 0:44 | PASS |
| 35 | 1857 lost the war, and still ended Company rule | cards | NEUTRAL | 0:47 | PASS |

## Kit fixes made this round
- Whiteboard quiz: options now finish at least 1 s before the end (they were drawn in the last frames).
- Kinetic quiz: the question no longer overlaps the options.
- All formats: quiz options use one font size, so a long option cannot stand out.
- Loudness target set to true peak -2.0 so the AAC encode stays under -1 dBFS.
- Validator number check no longer trips on a full stop after a number.

## Per-episode notes

### 22. Western disturbances bring winter rain the monsoon doesn't

- Format / tone / length: whiteboard / LIGHT / 44.3 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Where do western disturbances come from? (answer: The Mediterranean region)
- Sources: IMD Meteorological Centre Srinagar, 'Western Disturbance' explainer (mausam.imd.gov.in/srinagar/img/wd.pdf); IMD, Western Disturbance report, 12-13 December 2019
- Editor notes: IMD sources only, as asked. The IMD Srinagar explainer says WDs can occur in any season; the script presents them as the source of winter rain (also from that page) and does not claim they occur only in winter. Delhi winter rain is backed by one dated IMD event report (Dec 2019). Not included: WD frequency per month, cold waves and fog (in the IMD page but cut for length), climate-change trends.
- Files: 22-western-disturbances.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 23. The WTO's peace clause shields India's grain stocks, for now

- Format / tone / length: cards / NEUTRAL / 49.2 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: What does the peace clause protect? (answer: Public food stocks from WTO disputes)
- Sources: WTO General Council decision on public stockholding for food security purposes, 27 November 2014 (WT/L/939), interpreting the Bali Ministerial Decision WT/MIN(13)/38-WT/L/913 (2013); WTO Agreement on Agriculture, Articles 6.3 and 7.2(b); India's first invocation for rice, marketing year 2018-19, notified 31 March 2020 (TWN); again in 2024 for 2022-23 (Outlook Business); MC14, Yaounde, concluded 30 March 2026 without a permanent solution (NEXT IAS; OWINFS)
- Editor notes: Peace clause text from the WTO page (2014 decision). The 10 percent de minimis and 1986-88 reference prices are AoA rules but sourced here to secondary reports; check against AoA Article 6.4. India's invocations (2020 first; again since) and the MC14 outcome are secondary-only. Simplified: the clause has conditions (existing programmes, transparency, no trade distortion) which the script compresses into 'stops members from challenging'. Not included: the number of times India has invoked it, rice export figures.
- Files: 23-peace-clause.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 24. Tribunals keep losing to the Supreme Court

- Format / tone / length: kinetic / NEUTRAL / 47.8 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: What did the Tribunals Reforms Act do? (answer: Abolished several appellate tribunals)
- Sources: L. Chandra Kumar v. Union of India, Supreme Court, 18 March 1997, seven-judge bench (digiscr.sci.gov.in); PRS Legislative Brief, Tribunals Reforms Bill, 2021 (incl. the July 2021 Madras Bar Association ruling on the Ordinance); Madras Bar Association (MBA V), Supreme Court, 19 November 2025 (Business Standard; Bar and Bench)
- Editor notes: L. Chandra Kumar facts from the official judgment PDF (digiscr.sci.gov.in). The 2021 and 2025 rulings are from secondary sources (PRS, Business Standard, Bar and Bench); check against the judgments. The script says 'High Court review' for judicial review under Articles 226/227 (the judgment also covers Article 32). Left out: Rojer Mathew (2019), MBA III/IV details, whether the Commission has been set up as of today, bench composition of the 2025 ruling (reported as CJI Gavai and Justice Vinod Chandran).
- Files: 24-tribunals.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 25. India's data law gives you rights, and the rules decide when

- Format / tone / length: cards / NEUTRAL / 43.3 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Who is a Data Fiduciary? (answer: Whoever decides purpose and means)
- Sources: Digital Personal Data Protection Act, 2023 (Act 22 of 2023, 11 August 2023): sections 1(2), 2(i), 2(j), 11-14 (indiacode.nic.in); DPDP Rules, 2025, notified 13-14 November 2025, phased over 12 and 18 months (PTI via The Week; MirvoLegal timeline as at September 2026)
- Editor notes: Act text from indiacode.nic.in. Rules timeline from two secondary sources; the exact commencement dates (13 or 14 Nov 2026 / May 2027) vary by a day across sources, so the script says 'a year later' and 'around May 2027'. Left out: MeitY's January 2026 proposal to compress the 18 months to 12 (a draft, not notified as of the MirvoLegal update in September 2026; re-check before release). 'Most of it still isn't in force' reflects that the rights and fiduciary duties start with the 18-month phase per the timeline sources. Penalties and exemptions not covered.
- Files: 25-dpdp-act.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 26. Project Cheetah started with a court's permission

- Format / tone / length: whiteboard / NEUTRAL / 42.8 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Where did the first cheetahs come from? (answer: Namibia)
- Sources: Supreme Court order, Centre for Environment Law, WWF v. Union of India, 28 January 2020 (India Environment Portal; Down To Earth); Arrivals: eight from Namibia (released 17 September 2022), twelve from South Africa (February 2023) (The Week; Wikipedia); Population 52 as of September 2026, 32 born in India (Insights IAS; Punjab Kesari)
- Editor notes: All sources are secondary. The SC order text was read through India Environment Portal's summary, not the order PDF. Counts are shown only as 'over fifty, as of September 2026' (sources report 52; others report 57-60 at other dates, so the number moves). 'Most born here' rests on 32 of 52. Left out: cheetah deaths, Gandhi Sagar, Botswana batch (not confirmed), the 2023 SC hearings on deaths.
- Files: 26-project-cheetah.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 27. Governors now have a clock on assent, or do they?

- Format / tone / length: kinetic / SERIOUS / 49.8 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Which Article covers the Governor's assent to bills? (answer: Article 200)
- Sources: Constitution of India, Articles 200, 142, 143; State of Tamil Nadu v. Governor of Tamil Nadu, Supreme Court, 8 April 2025 (two-judge bench); In re: Assent, Withholding or Reservation of Bills by the Governor and the President of India, Special Reference under Article 143, opinion of 20 November 2025 (five-judge bench)
- Editor notes: SERIOUS, strictly neutral: the script reports what each ruling held, with no evaluation. All sources secondary; check against the 8 April 2025 judgment and the 20 November 2025 opinion. The opinion is advisory (Article 143); the script says 'advised'. The return-for-reconsideration option (first proviso to Article 200) is omitted from the spoken list for length but noted in claims. Left out: the specific one- and three-month timelines of the April 2025 ruling (not confirmed by two sources), whether the opinion was unanimous, names of the Governor and judges, any later developments after November 2025 (none found).
- Files: 27-governor-assent.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 13. The Indus Waters Treaty has no exit clause for one side

- Format / tone / length: cards / SERIOUS / 55.2 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Which rivers go to India under the treaty? (answer: Sutlej, Beas and Ravi)
- Sources: Indus Waters Treaty, Karachi, 19 September 1960 (UN Treaty Series vol. 419, No. 6032): Articles I(5)-(6), II(1), III(1), XII(3)-(4); India: MEA special briefing, 23 April 2025; Government of India statement, 31 August 2026 (Tribune; Al Jazeera); Pakistan: National Security Committee statement, 24 April 2025 (Radio Pakistan; Dawn); Court of Arbitration (Indus Waters Western Rivers Arbitration), award of 31 August 2026 (Tribune; Al Jazeera)
- Editor notes: SERIOUS and strictly neutral: treaty text plus each side's formal statements with dates, no verdict and no characterisation. Treaty text from the UN Treaty Series (primary); India's April 2025 statement from the MEA briefing transcript on an Indian embassy site (primary). Pakistan's statement and the August 2026 award and India's response come from two news sources each; the award text itself was not read. Left out on purpose: Pakistan's 'act of war' wording, the Pahalgam attack details, the Ratle/Kishenganga merits, the Neutral Expert process, the June 2025 supplemental award, any figures on water flows. Exit-clause title is accurate to Article XII(4): no unilateral termination clause. Re-check status immediately before release; this topic moves.
- Files: 13-indus-waters-treaty.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 28. The reverse repo stopped being the floor in 2022

- Format / tone / length: whiteboard / NEUTRAL / 48.0 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Which facility is now the floor of the RBI's corridor? (answer: Standing Deposit Facility)
- Sources: RBI, Statement on Developmental and Regulatory Policies, April 2022 (SDF as floor of the LAF corridor; FRRR at 3.35 per cent retained); RBI, Governor's Statement, 7 October 2026 (repo 5.50, SDF 5.25, MSF and Bank Rate 5.75 per cent)
- Editor notes: Primary: RBI April 2022 statement and RBI 7 October 2026 Governor's statement. Moving numbers carry 'as of October 2026' on screen and in narration; re-check after the next MPC meeting (rates change). The hook 'many notes still call the reverse repo the floor' is an editorial framing, not a sourced fact. Left out: what the MPC is, CRR/SLR, OMOs, variable-rate repo/reverse repo auctions.
- Files: 28-liquidity-corridor.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 29. A bill can become law even if the Rajya Sabha says no

- Format / tone / length: kinetic / NEUTRAL / 41.6 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Which bill can never go to a joint sitting? (answer: A Money Bill)
- Sources: Constitution of India, Article 108 (joint sitting) and Article 111 (assent to Bills); Joint sittings held in 1961 (Dowry Prohibition Bill), 1978 (Banking Service Commission (Repeal) Bill) and 2002 (Prevention of Terrorism Bill)
- Editor notes: Constitution text read via constitutionofindia.net (not the official Gazette copy); check against the Legislative Department text. 'Six months pass' compresses 'more than six months elapse from the date of reception of the Bill by the other House'. The President 'can call' = notifies intention to summon (Art. 108(1)); the bar on summoning after Lok Sabha dissolution (Art. 108(5)) was covered in episode 16 and left out here. Joint sitting count rests on two secondary sources; re-check that no further joint sitting has been held.
- Files: 29-joint-sitting.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 30. When Union and State laws clash, the Union usually wins. Usually.

- Format / tone / length: cards / NEUTRAL / 48.2 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Who holds powers over subjects on no list? (answer: Parliament)
- Sources: Constitution of India, Articles 246, 248, 254 and 356; Seventh Schedule; S. R. Bommai v. Union of India, Supreme Court, 1994 (nine-judge bench)
- Editor notes: Constitution text read via constitutionofindia.net and two explainers, not the official Gazette copy. Simplification: Article 254(1) also covers conflicts with Union List laws; the script frames it for Concurrent subjects, where 254(2) applies. Entry counts of each list are deliberately left out (sources disagree after amendments). Episode 8 already covers Bommai in depth, so it gets one line here. Title is a framing; accurate to Art. 254(2).
- Files: 30-three-lists.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 31. El Niño usually weakens the monsoon, but not always

- Format / tone / length: whiteboard / NEUTRAL / 41.5 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Which of these usually helps India's monsoon? (answer: La Niña)
- Sources: IMD, end-of-season press release, southwest monsoon 2019 (El Nino and positive IOD; June-September season); IMD long range forecast, April 2026, as reported by Down To Earth (El Nino expected; positive IOD could offset); Down To Earth, 'El Nino may disrupt monsoons' (1997: about 101% of LPA); Anantam IAS explainer on El Nino and La Nina
- Editor notes: Mostly secondary sources; IMD's 2019 end-of-season press release confirms the June-September season and IMD's use of El Nino and IOD. The 1997 figure differs slightly between sources (101% of LPA vs +2%), so the video says 'about normal' and '~100%'. Left out: the 2026 outcome (sources give a 12-13% deficit; still settling), the Walker circulation mechanism, Eurasian snow cover. The 'warmer western Indian Ocean' gloss for positive IOD is from the Anantam explainer.
- Files: 31-el-nino-monsoon.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 32. A biodiversity hotspot is defined by what it has lost

- Format / tone / length: cards / NEUTRAL / 51.7 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Which hotspot covers the Nicobar Islands? (answer: Sundaland)
- Sources: Critical Ecosystem Partnership Fund (CEPF), 'Biodiversity hotspots' (criteria; 36 hotspots); India's four hotspots: Himalaya, Indo-Burma, Western Ghats, Sundaland (Nicobar Islands) (Padhai; Maps for UPSC); Wild Life (Protection) Act, 1972: protected-area categories (WII ENVIS page); national park and sanctuary rules (GKToday; WildTrails)
- Editor notes: Hotspot criteria from CEPF (the hotspot programme's funder) plus an explainer; the 1,500 figure refers to endemic vascular plants. India's four hotspots from two explainers. The sanctuary-rights point (Chief Wildlife Warden's discretion) is in one source only (GKToday); check against WLPA sections 33 and 35. Protected-area counts are deliberately left out: the WII page is dated 2021 and its totals don't add up. Andamans are in Indo-Burma per Maps for UPSC; that supports the quiz explanation.
- Files: 32-biodiversity-hotspots.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 33. Two words in the Preamble weren't there in 1949

- Format / tone / length: kinetic / NEUTRAL / 50.0 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: On which date was the Constitution adopted? (answer: 26 November 1949)
- Sources: Preamble to the Constitution of India (text incl. 'this twenty-sixth day of November, 1949'); Constitution (Forty-second Amendment) Act, 1976; Kesavananda Bharati v. State of Kerala (1973); Dr Balram Singh v. Union of India, Supreme Court, 25 November 2024
- Editor notes: Preamble text read from an institutional PDF and an explainer, not the Gazette copy. 'The authority starts with us' is an editorial gloss on 'We, the people'. Left out: 'unity and integrity' wording change in 1976 (not confirmed by two sources here), Berubari (1960), the Emergency context. 26 January 1950 as commencement is in the quiz explanation only; check before release.
- Files: 33-preamble.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 34. India's goods gap is huge. Its current account gap isn't.

- Format / tone / length: whiteboard / NEUTRAL / 44.8 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: Which account records remittances from abroad? (answer: The current account)
- Sources: RBI, 'Developments in India's Balance of Payments during the First Quarter (April-June) of 2026-27', 1 September 2026
- Editor notes: All figures from RBI's 1 September 2026 press release (primary) and are preliminary; they may be revised. The video shows 'Apr-Jun 2026' on every number. Remittance figure is gross personal transfer receipts as RBI reports it. Simplification: 'textbooks call it the capital account' reflects the older presentation; check the wording with the economy editor. Left out: reserve valuation changes, primary income, the year-ago comparison.
- Files: 34-balance-of-payments.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png

### 35. 1857 lost the war, and still ended Company rule

- Format / tone / length: cards / NEUTRAL / 47.5 s. QA: PASS (duration, -16 LUFS, true peak, captions; frames checked on the contact sheet)
- Quiz: What did the Government of India Act, 1858 do? (answer: Moved power to the Crown)
- Sources: NCERT Class 8, Our Pasts III, 'When People Rebel' (via BharatNotes study page); Explainers on the revolt and its failure (GKToday; PW Only IAS); Government of India Act, 1858
- Editor notes: Secondary sources only (NCERT-based study page and two explainers); check against NCERT Class 8 'When People Rebel' and Class 12 'Rebels and the Raj'. 'Reportedly' is kept for the cartridge grease, as NCERT presents it as the belief that spread. Left out: names of other leaders (Rani Lakshmibai, Nana Saheb, Tantia Tope, Kunwar Singh) for length; the 'First War of Independence' naming debate; casualty figures.
- Files: 35-revolt-1857.mp4, .vtt, .jpg, .manifest-entry.json, .claims.md, .elevenlabs.txt, .voice.txt, .hi.voice.txt, .hi.srt, .contact.png
