# Federalism demo: learning-science notes, humour, feedback design, critique

8 November 2026. Written for the "Try one topic" path (`content/topic-paths/federalism.json`, `server/public/app/try.js`).
Bands follow our scale (A proven, B well supported with conditions, C promising but thin, D little research, E doesn't work).
Every citation below was checked by web search today (title, authors, year, journal). Where I give a number, it is from the
abstract or our own research notes. One item is marked UNVERIFIED.

---

## 0. Decisions in one screen

1. **Biggest learning win, cheap to build:** hide the reading text before each part's check. Right now the check sits under
   the text, so people scroll up and copy. That is looking up, not remembering.
2. **"Keep it" should be a real try, not a free pass.** `keepCards` marks all 8 cards as "Good" without the person answering
   any of them. Ask them cold, and set the first return from the answer.
3. **Feedback:** 5 one-tap questions inside the path (each skippable, never blocking Next), and a 6-question end survey.
   For price, use one honest choice question, not Van Westendorp (reasons in 3c).
4. **Owner must confirm before the price question ships:** does the ₹999 founding price renew at ₹999 or at ₹9,999? And
   since Play can't cap by count, the 300 limit is web-only. The question must say exactly what is true.
5. **Sending feedback breaks the current promise in try.js ("nothing is sent anywhere").** Add one plain line before the
   first question: what's sent, and that it's anonymous unless they add contact details.

---

## 1. "WHY WE DO IT THIS WAY": one note per step

Format: what it does for memory, why it feels harder than re-reading (EN, then HI), then one citation and its band.

### Warm-up (guess first: pretest)
**EN.** Guessing before you read primes your brain to notice the answer when it turns up. A wrong guess followed by the right
answer often sticks better than reading alone. It feels uncomfortable because you're asked to answer something you haven't
been taught yet, and that discomfort is part of how it works.
**HI.** पढ़ने से पहले अंदाज़ा लगाने से दिमाग़ जवाब के आने पर उसे पकड़ने के लिए तैयार रहता है। गलत अंदाज़ा और फिर सही जवाब, अक्सर सिर्फ़ पढ़ने से ज़्यादा टिकता है। अजीब इसलिए लगता है क्योंकि आपसे वह पूछा जा रहा है जो अभी पढ़ाया ही नहीं गया, और यही असहजता इसके काम करने का हिस्सा है।
**Citation:** Pan, S. C. & Carpenter, S. K. (2023). *Prequestioning and pretesting effects: a review of empirical research,
theoretical perspectives, and implications for educational practice.* Educational Psychology Review 35:97. **Band C**
(our notes: no pooled effect size yet; benefit is mainly for the items that were pretested).

### Read (short parts, then a check)
**EN.** Short parts with a question after each keep your mind from drifting and make you pull the idea back out straight away.
Answering from memory is what builds memory; scrolling back to find the line is not. It feels slower than reading on, but
you're actually keeping what you read.
**HI.** छोटे हिस्से और हर एक के बाद एक सवाल, ध्यान भटकने नहीं देते और बात को तुरंत याद से निकलवाते हैं। याद से जवाब देना ही याद बनाता है; वापस scroll करके पंक्ति ढूँढना नहीं। आगे पढ़ते जाने से धीमा लगता है, पर इस तरह जो पढ़ा वह सच में आपके पास रहता है।
**Citation:** Szpunar, K. K., Khan, N. Y. & Schacter, D. L. (2013). *Interpolated memory tests reduce mind wandering and improve
learning of online lectures.* PNAS 110(16), 6313–6317. **Band B** (lab, one lecture; retrieval practice itself is band A).

### Sort (which list? interleaving and telling lookalikes apart)
**EN.** Mixing the subjects makes you decide each time *which* list, which is exactly what a Prelims option asks. Doing one
list at a time feels smoother but teaches you less about the differences. Expect more mistakes here; that's the
lookalikes doing their job.
**HI.** विषयों को मिलाने से हर बार आपको तय करना पड़ता है कि *कौन-सी* सूची, और Prelims का विकल्प ठीक यही पूछता है। एक-एक सूची करके पढ़ना आसान लगता है, पर फ़र्क़ कम सिखाता है। यहाँ गलतियाँ ज़्यादा होंगी; मिलते-जुलते जोड़े अपना काम कर रहे हैं।
**Citation:** Brunmair, M. & Richter, T. (2019). *Similarity matters: A meta-analysis of interleaved learning and its moderators.*
Psychological Bulletin 145(11), 1029–1052. **Band B** (works best when categories look alike, as here; weak for prose
and essays).

### Recall (say it from memory: free recall / brain dump)
**EN.** Writing down everything you remember, with notes shut, is one of the best-tested ways to make learning last. It feels
worse than re-reading because you see the gaps, and re-reading hides them. The gaps you find now are the ones you'll fix.
**HI.** नोट्स बंद करके जो याद है सब लिख देना, सीखी बात को टिकाने के सबसे ज़्यादा परखे गए तरीक़ों में से है। दोबारा पढ़ने से बुरा लगता है क्योंकि कमियाँ दिखती हैं, और दोबारा पढ़ना उन्हें छिपा देता है। जो कमियाँ अभी दिखीं, वही आप ठीक करेंगे।
**Citation:** Karpicke, J. D. & Blunt, J. R. (2011). *Retrieval practice produces more learning than elaborative studying with
concept mapping.* Science 331, 772–775. **Band A.**

### PYQ (how sure are you? calibration under negative marking)
**EN.** Saying how sure you are before answering trains the real Prelims skill: knowing when you're guessing. When you were sure
and still wrong, the correct answer tends to stick unusually well, so those surprises are worth a second look. It feels
fussier than just answering, because it makes you check yourself twice.
**HI.** जवाब देने से पहले यह बताना कि आप कितने पक्के हैं, Prelims का असली हुनर सिखाता है: यह पहचानना कि कब आप अंदाज़ा लगा रहे हैं। जहाँ आप पक्के थे फिर भी गलत हुए, वहाँ सही जवाब ख़ास तौर पर अच्छे से याद रहता है, इसलिए उन पर दोबारा नज़र डालिए। सिर्फ़ जवाब देने से ज़्यादा झंझट लगता है, क्योंकि यह आपसे ख़ुद को दो बार जाँचवाता है।
**Citation:** Butterfield, B. & Metcalfe, J. (2001). *Errors committed with high confidence are hypercorrected.* Journal of
Experimental Psychology: Learning, Memory, and Cognition 27(6), 1491–1494. **Band C** for calibration as an exam skill
(hypercorrection itself is well replicated in the lab; no trials show confidence-rating practice raises Prelims scores).
Theory for "answer or skip" decisions: Koriat & Goldsmith (1996), Psychological Review 103(3), 490–517.

### Apply (three situations: transfer)
**EN.** Using a rule in a new situation is harder than recognising it, and it's what UPSC actually tests. Practice with questions
helps most when the later question looks different from the practice one, which is why these aren't repeats. It feels
like the ground moved; it did, on purpose.
**HI.** किसी नियम को नई स्थिति में लगाना उसे पहचानने से कठिन है, और UPSC असल में यही परखता है। सवालों से practice सबसे ज़्यादा तब काम आती है जब बाद का सवाल practice वाले से अलग दिखे, इसीलिए ये दोहराव नहीं हैं। लगता है ज़मीन खिसक गई; जानबूझकर खिसकाई गई है।
**Citation:** Pan, S. C. & Rickard, T. C. (2018). *Transfer of test-enhanced learning: Meta-analytic review and synthesis.*
Psychological Bulletin 144(7), 710–756. **Band B** (transfer is strongest to application and inference questions).

### Mains (try before you see ours; skeleton; self-check)
**EN.** Planning your own answer before seeing ours makes you notice what you didn't know, so our skeleton lands on prepared
ground. Ticking your plan against a checklist trains the eye you'll need for your own answers later. It feels exposed to
plan with nothing to copy; that's the point, and ours is right there after. If you're brand new to Mains, looking at one
worked plan *first* is fine: beginners learn more from examples, and experts less.
**HI.** हमारा ढाँचा देखने से पहले अपना बनाने से आपको पता चलता है कि क्या नहीं आता, और फिर हमारा ढाँचा तैयार ज़मीन पर उतरता है। अपने plan को checklist से मिलाना वह नज़र बनाता है जो आगे अपने answers जाँचने में चाहिए। बिना नकल के plan बनाना असहज लगता है; यही मक़सद है, और हमारा ढाँचा ठीक उसके बाद है। अगर Mains बिलकुल नया है, तो *पहले* एक बना हुआ ढाँचा देखना ठीक है: नए लोग उदाहरण से ज़्यादा सीखते हैं, अनुभवी कम।
**Citation:** Sinha, T. & Kapur, M. (2021). *When problem solving followed by instruction works: Evidence for productive failure.*
Review of Educational Research 91(5), 761–798. **Band B** for the idea (53 studies; mostly maths and science), **C** for
Mains answers (untested). For the beginner exception: Kalyuga, Ayres, Chandler & Sweller (2003), *The expertise reversal
effect*, Educational Psychologist 38(1), 23–31.

### Keep (spaced review, FSRS)
**EN.** Each card comes back just before you'd forget it, and each successful return pushes the next one further away. Coming
back after a gap feels harder than revising tonight, and that effort is exactly what makes the memory last months, not
days.
**HI.** हर card ठीक तब लौटता है जब आप उसे भूलने वाले होते हैं, और हर सही जवाब अगली वापसी को और दूर कर देता है। अंतराल के बाद लौटना आज रात दोहराने से कठिन लगता है, और यही मेहनत याद को दिनों नहीं, महीनों तक टिकाती है।
**Citation:** Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T. & Rohrer, D. (2006). *Distributed practice in verbal recall
tasks: A review and quantitative synthesis.* Psychological Bulletin 132(3), 354–380. **Band A** for spacing.
FSRS as a brand: **D/C** (our notes). Its authors' related peer-reviewed work: Su, Ye, Nie, Cao & Chen (2023), IEEE TKDE
35(10); I could not confirm FSRS itself is the method in that paper, so don't cite it as "the FSRS paper".

### Finish (can-do list and what's next)
**EN.** Ending with what you can now do, and naming when you'll next meet these cards, turns a good intention into a plan. A
plan that says "when X, I'll do Y" is followed far more often than "I'll revise later". It takes ten seconds and feels
almost too small to matter; it isn't.
**HI.** अंत में यह देखना कि अब आप क्या कर सकते हैं, और तय करना कि ये cards अगली बार कब मिलेंगे, एक अच्छे इरादे को plan बना देता है। "जब X होगा, मैं Y करूँगा" वाला plan "बाद में दोहरा लूँगा" से कहीं ज़्यादा निभता है। दस सेकंड लगते हैं और इतना छोटा लगता है कि शायद काम का न हो; है।
**Citation:** Gollwitzer, P. M. & Sheeran, P. (2006). *Implementation intentions and goal achievement: A meta-analysis of effects
and processes.* Advances in Experimental Social Psychology 38, 69–119 (d = .65). **Band B** (a 2024 update by the same group
finds smaller effects on behaviour; still positive).

### NEW: Simulation (GST Council vote calculator / "Governor's desk")
**EN.** Moving the votes yourself shows *why* the rule matters: the states together hold two-thirds, a decision needs
three-quarters, so neither side can pass anything alone. Working that out by trying beats memorising "1/3, 2/3, 3/4". It
takes longer than reading the rule, but you'll be able to rebuild it in the exam hall.
**HI.** वोट ख़ुद घुमाकर दिखता है कि नियम *क्यों* अहम है: सभी राज्य मिलकर दो-तिहाई रखते हैं, फ़ैसले के लिए तीन-चौथाई चाहिए, इसलिए कोई पक्ष अकेले कुछ पारित नहीं कर सकता। आज़माकर समझना "1/3, 2/3, 3/4" रटने से बेहतर है। नियम पढ़ने से ज़्यादा समय लगता है, पर exam hall में आप इसे फिर से बना पाएँगे।
**Citation:** Chernikova, O., Heitzmann, N., Stadler, M., Holzberger, D., Seidel, T. & Fischer, F. (2020). *Simulation-based
learning in higher education: A meta-analysis.* Review of Educational Research 90(4), 499–541. **Band B** for complex
professional skills; **C** for a short constitutional-rules game (untested). Guardrail: unguided "play around" doesn't
help (Alfieri et al. 2011, J. Educational Psychology 103(1), 1–18), so give it a goal ("find the smallest coalition that
passes") and a debrief.
Design facts (checked): Centre 1/3 of weighted votes, all states 2/3, decisions need 3/4 of weighted votes of members
present and voting (Art. 279A(9)). So with the Centre voting yes, states holding at least 5/8 of the states' vote share
present must also say yes. Show it as shares, not a clock.

### NEW: Short explainer video
**EN.** A short video helps most when it adds to what you read rather than replacing it. Video is easy to watch passively, which
feels like learning; so ours stops once to ask you a question. Sound is off until you tap it, and there are captions.
**HI.** छोटा video सबसे ज़्यादा तब मदद करता है जब वह पढ़े हुए में कुछ जोड़े, उसकी जगह न ले। Video बैठे-बैठे देख लेना आसान है, और वह learning जैसा लगता है; इसलिए हमारा video एक बार रुककर सवाल पूछता है। आवाज़ तब तक बंद है जब तक आप न दबाएँ, और captions साथ हैं।
**Citation:** Noetel, M., Griffith, S., Delaney, O., Sanders, T., Parker, P., del Pozo Cruz, B. & Lonsdale, C. (2021). *Video
improves learning in higher education: A systematic review.* Review of Educational Research 91(2), 204–236 (adding video
g = 0.80; swapping teaching for video g = 0.28). **Band B.**

### NEW: Essay in three snaps (skeleton → outline → essay)
**EN.** Planning before you write frees your attention for the arguments, and essays written after an outline are rated
better. Photographing each stage lets you see where an idea got lost between plan and page. It feels slower than just
starting to write, but the time comes back in the essay.
**HI.** लिखने से पहले plan बनाने से ध्यान तर्कों पर लगा रहता है, और रूपरेखा के बाद लिखे निबंध बेहतर आँके गए हैं। हर चरण की फ़ोटो से दिखता है कि plan और पन्ने के बीच कौन-सा विचार छूट गया। सीधे लिखना शुरू करने से धीमा लगता है, पर वह समय निबंध में लौट आता है।
**Citation:** Kellogg, R. T. (1988). *Attentional overload and writing performance: Effects of rough draft and outline
strategies.* Journal of Experimental Psychology: Learning, Memory, and Cognition 14, 355–365. **Band C** (small lab studies,
not exam essays). Comparing against a guide is self-assessment: Panadero, Jonsson & Botella (2017), Educational Research
Review 22, 74–98, show effects on self-regulation and self-efficacy, not directly on marks.

### NEW: Chai card tied to the static syllabus
**EN.** News sticks better when it hangs on something you already know, so every Chai card names the syllabus line it belongs to
and asks one question that links them. Reading news on its own feels productive but slides off. Linking takes one extra
moment of thought.
**HI.** ख़बर तब बेहतर टिकती है जब वह किसी पहले से जानी बात पर टँगी हो, इसलिए हर Chai card बताता है कि वह syllabus की किस पंक्ति से जुड़ा है और दोनों को जोड़ने वाला एक सवाल पूछता है। अकेले ख़बर पढ़ना काम का लगता है पर फिसल जाता है। जोड़ने में बस एक पल ज़्यादा सोचना पड़ता है।
**Citation:** van Kesteren, M. T. R., Ruiter, D. J., Fernández, G. & Henson, R. N. (2012). *How schema and novelty augment memory
formation.* Trends in Neurosciences 35(4), 211–219. **Band C** (a theory review; the "news tied to syllabus" format itself
is untested).

---

## 2. One wry line per step (EN + HI)

Never about failure, results, attempts or wellbeing. Punching up only (institutions, habits, the syllabus).

| Step | EN | HI |
|---|---|---|
| Warm-up | Guessing is allowed. Even Laxmikanth had a first edition. | अंदाज़ा लगाना पूरी तरह जायज़ है। लक्ष्मीकांत का भी कभी पहला संस्करण था। |
| Read | Four minutes. Shorter than the queue at a Mukherjee Nagar photocopy shop. | चार मिनट। मुखर्जी नगर की फ़ोटोकॉपी दुकान की लाइन से भी छोटा। |
| Sort | Prisons: State. Criminal law: Concurrent. The Seventh Schedule enjoys a plot twist. | जेल: राज्य। दंड विधि: समवर्ती। सातवीं अनुसूची को भी ट्विस्ट पसंद है। |
| Recall | Reading a chapter for the fifth time is very relaxing. That's the problem. | एक ही chapter पाँचवीं बार पढ़ना बड़ा सुकून देता है। दिक़्क़त भी यही है। |
| PYQ | UPSC writes "consider the following statements" the way other people say good morning. | UPSC "निम्नलिखित कथनों पर विचार कीजिए" ऐसे लिखता है जैसे बाक़ी लोग "सुप्रभात" कहते हैं। |
| Apply | Facts are the ingredients. Situations are where UPSC says: now cook. | Facts सामग्री हैं। स्थितियों में UPSC कहता है: अब खाना बनाइए। |
| Mains | Two minutes of planning: less time than choosing a pen colour for the heading. | दो मिनट की planning: heading के लिए पेन का रंग चुनने से भी कम समय। |
| Keep | These cards come back like a Finance Commission: on schedule, with a formula. | ये cards वित्त आयोग की तरह लौटेंगे: तय समय पर, एक फ़ॉर्मूले के साथ। |
| Finish | Topic complete. No Governor's assent required. | Topic पूरा। राज्यपाल की स्वीकृति की ज़रूरत नहीं। |
| Simulation (Governor's desk) | Article 200 gives the Governor four options. "Leave it on the desk for two years" isn't one of them. | अनुच्छेद 200 राज्यपाल को चार विकल्प देता है। "दो साल मेज़ पर रखे रहना" उनमें नहीं है। |
| Simulation (GST) | In the GST Council nobody wins alone. A bit like a pod. | GST परिषद में कोई अकेले नहीं जीतता। कुछ-कुछ pod जैसा। |
| Video | Eight minutes, one idea, and nobody asks you to smash the like button. | आठ मिनट, एक बात, और कोई नहीं कहता कि like बटन दबाइए। |
| Essay snaps | Three snaps. Your gallery finally holds something besides screenshots of current-affairs PDFs. | तीन फ़ोटो। आपकी gallery में आख़िरकार current affairs PDF के screenshots के अलावा भी कुछ होगा। |
| Chai | One story, one syllabus line. A 300-page monthly compilation is not a cup of chai. | एक ख़बर, syllabus की एक पंक्ति। 300 पन्नों का मासिक संकलन एक कप चाय नहीं होता। |

Notes: the Governor line refers to a real 2025 Supreme Court case on delayed bills, so it's factual satire, aimed at an office,
not a person; keep it off any TRAGIC-tone screen. Don't name a sitting Governor or state.

---

## 3. Feedback design

### Ground rules (so it doesn't nag)
- **Every question is skippable, one tap, inline below the step, never a pop-up, never blocks Next.** Answering or skipping
  hides it for good on that browser.
- **One "No questions, thanks" link** on the first question switches off all the rest (and the end survey invite).
- **A plain notice before the first one** (replaces "nothing is sent anywhere" in try.js):
  EN: "These quick questions are sent to us so we can improve the demo. They don't include your name or your answers to the
  study questions. Skip any of them."
  HI: "ये छोटे सवाल हमें भेजे जाते हैं ताकि हम demo बेहतर बना सकें। इनमें आपका नाम या पढ़ाई वाले सवालों के जवाब नहीं होते। कोई भी सवाल छोड़ सकते हैं।"
- **What's sent:** chip chosen, step id, UI language, a random per-browser id (so we can join the five answers and the end
  survey), and the furthest step reached. No free text from recall or mains plans. If we ever want to join feedback to
  performance (e.g. sort score), the notice must say so first.
- **Randomise chip order** where the chips aren't a scale; keep "Skip" last.

### 3a. Five micro-questions (max), each tied to a decision

| # | After step | Question | Chips | Decision it informs |
|---|---|---|---|---|
| 1 | read-1 | EN: For you, this part was… · HI: आपके लिए यह हिस्सा… | Too basic · बहुत आसान / About right · ठीक / Too dense · बहुत भारी / Hindi wording unclear · हिंदी शब्द अस्पष्ट | Pitch and chunk length. If >30% "too dense", split parts to ~3 min; if Hindi "unclear" >15% of HI users, send to the Hindi editor first. |
| 2 | sort | EN: Mixing the subjects on purpose felt… · HI: विषयों को जानबूझकर मिलाना कैसा लगा? | Helped me spot lookalikes · मिलते-जुलते पहचानने में मदद / Felt like a trick · चाल जैसा लगा / Fiddly on my phone · फ़ोन पर झंझट | Keep interleaved sort as a format across topics; whether to rebuild the tap-to-place UI. |
| 3 | recall | EN: What did you actually do? · HI: आपने असल में क्या किया? | Wrote it · लिखा / Said it aloud · बोला / Thought it in my head · मन में सोचा / Went straight to the list · सीधे सूची खोली | Behaviour, not opinion. If "straight to the list" is common, gate the checklist; if "said it aloud" is common, prioritise voice input. |
| 4 | pyq | EN: The "how sure?" tick… · HI: "कितने पक्के?" वाला निशान… | Will change how I answer · मेरे जवाब देने का तरीक़ा बदलेगा / Interesting, won't change much · रोचक, ज़्यादा फ़र्क़ नहीं / Slowed me down · धीमा किया / Didn't see the point · समझ नहीं आया | Keep calibration in all PYQ sets; whether to add the negative-marking maths explainer (critique #4). |
| 5 | mains | EN: Before you saw our plan, you… · HI: हमारा ढाँचा देखने से पहले आपने… | Planned my own · अपना बनाया / Wrote a little, then looked · थोड़ा लिखा, फिर देखा / Wrote it on paper · काग़ज़ पर लिखा / Skipped planning · planning छोड़ दी | Whether try-before-show holds; whether paper-photo upload (three snaps) should come before other builds; whether beginners need the worked example first. |

Questions 3 and 5 ask what people **did**, not whether they liked it. Behaviour reports are less bent by politeness.

### 3b. End survey (6 questions, shown on Finish, invite once)

Opening line. EN: "Six questions, about two minutes. An honest 'no' helps us more than a polite 'yes'."
HI: "छह सवाल, लगभग दो मिनट। ईमानदार 'नहीं' हमारे लिए विनम्र 'हाँ' से ज़्यादा काम का है।"

1. **Where are you in your preparation?** / **आपकी तैयारी किस मोड़ पर है?** (three small chip rows, each with "Prefer not to say / बताना नहीं चाहते")
   - Stage: Just exploring · बस देख रहे हैं / Preparing for my first Prelims · पहले Prelims की तैयारी / Have sat Prelims before · पहले Prelims दे चुके हैं / Preparing for Mains · Mains की तैयारी / Working and preparing · नौकरी के साथ तैयारी
   - Medium: English / हिंदी / Another language · कोई और भाषा
   - Studying with: Coaching (classroom or online) · कोचिंग / Self-study only · सिर्फ़ ख़ुद से
   (I've folded "attempt" into "sat Prelims before"; asking an attempt count adds sensitivity and little decision value.)
2. **Which part was most useful to you?** (pick one; order randomised) / **कौन-सा हिस्सा सबसे काम का लगा?**
   Guess first · Short reads with a check · Which list? · Say it from memory · Real PYQs with "how sure?" · Three situations · Plan a Mains answer · Keep it (review cards) · None really · कोई ख़ास नहीं
3. **What was missing, or what would you change?** (open, optional) / **क्या कमी लगी, या आप क्या बदलेंगे?**
4. **If the full app covered your syllabus this way, would it replace anything you use now?** (pick any) / **अगर पूरा app आपका syllabus ऐसे ही कराए, तो क्या यह किसी चीज़ की जगह लेगा जो आप अभी इस्तेमाल करते हैं?**
   Coaching notes or modules · कोचिंग नोट्स / A test series · टेस्ट सीरीज़ / YouTube lectures · YouTube / Telegram or WhatsApp groups · Telegram या WhatsApp ग्रुप / A flashcard app · flashcard app / A standard book · कोई मानक किताब / No, I'd use it alongside · नहीं, साथ में चलाऊँगा / Not sure · पक्का नहीं
   + optional "Which one?" text. Decides positioning and which competitor to compare against on the website.
5. **Price** (see 3c for reasoning). Show exactly:
   EN: "The free parts of Aspiran stay free. Aspiran Plus [one line on what Plus adds: owner to confirm] costs ₹9,999 a year.
   The first 300 people to buy on our website pay ₹999 [for the first year / every year: owner to confirm]. Which is closest
   to true for you today?"
   HI: "Aspiran के मुफ़्त हिस्से मुफ़्त ही रहेंगे। Aspiran Plus [Plus में क्या जुड़ता है: owner पुष्टि करें] ₹9,999 प्रति वर्ष है। हमारी website पर पहले 300 ख़रीदार ₹999 [पहले साल / हर साल: owner पुष्टि करें] देंगे। आज के हिसाब से आपके लिए सबसे सही क्या है?"
   Chips: I'd pay ₹9,999 a year · ₹9,999 सालाना दूँगा / I'd pay at the ₹999 founding price, not at ₹9,999 · ₹999 पर हाँ, ₹9,999 पर नहीं / Worth it, but I can't afford it · क़ीमत के लायक़ है, पर मेरी पहुँच से बाहर / I'd use only the free parts · सिर्फ़ मुफ़्त हिस्से / Can't say yet · अभी नहीं कह सकते
   Optional follow-up only for the 2nd–4th chips: "What would feel fair for a year? (₹)" / "एक साल के लिए क्या ठीक लगेगा? (₹)"
6. **Can we contact you?** (entirely optional; two separate, unticked boxes)
   EN: "Optional. Leave an email or phone number only if you want one of these. We'll use it for what you tick and nothing
   else: no ads, no sharing, no selling.
   ☐ Tell me when the full app opens.
   ☐ I'm open to a 15-minute call about how I prepare.
   ☐ I'm 18 or older.
   We keep your survey answers with your contact details so a call makes sense. To withdraw, write to [contact email] or
   reply STOP; we'll delete them within [7] days. If we haven't used them, we delete them [12 months] after the demo ends.
   Questions or complaints: [grievance contact]."
   HI: "वैकल्पिक। email या फ़ोन नंबर तभी दीजिए जब आप इनमें से कुछ चाहें। हम इसे सिर्फ़ उसी काम के लिए इस्तेमाल करेंगे जिस पर आप निशान लगाएँ: कोई विज्ञापन नहीं, किसी से साझा नहीं, बिक्री नहीं।
   ☐ पूरा app खुलने पर मुझे बताइए।
   ☐ मेरी तैयारी के बारे में 15 मिनट की बातचीत के लिए मैं तैयार हूँ।
   ☐ मेरी उम्र 18 वर्ष या उससे अधिक है।
   बातचीत का संदर्भ रहे, इसलिए हम आपके survey जवाब आपके संपर्क के साथ रखते हैं। सहमति वापस लेने के लिए [contact email] पर लिखिए या STOP भेजिए; हम [7] दिनों में मिटा देंगे। इस्तेमाल न हुआ तो demo ख़त्म होने के [12 महीने] बाद मिटा देंगे। सवाल या शिकायत: [grievance contact]।"
   Why this shape: the DPDP Act 2023 wants consent that is specific to a purpose, given by a clear action, and as easy to
   withdraw as to give; the DPDP Rules 2025 (notified 13 Nov 2025) want an itemised, stand-alone notice in plain language with
   a withdrawal route. Under-18s need verifiable parental consent, hence the age box (contact fields stay disabled until it's
   ticked). The notice duties are being phased in; one source says Rule 3 applies from May 2027 (not confirmed elsewhere).
   Build to it now. This is design advice, not legal advice: have a lawyer read the final text.

### 3c. Why not Van Westendorp, and why this price question
- Van Westendorp needs four open price questions ("too cheap", "cheap", "expensive", "too expensive"). That's two-thirds of
  the survey budget, it needs a few hundred answers to be stable, and it answers "what range feels acceptable", while our
  price is already set. We need to know: at ₹9,999, yes or no, and is a "no" about value or about affordability.
- Stated willingness to pay runs high. A meta-analysis of 28 studies found a median hypothetical-to-real ratio of 1.35, and
  choice-style questions were less biased than open ones: Murphy, Allen, Stevens & Weatherhead (2005), *A meta-analysis of
  hypothetical bias in stated preference valuation*, Environmental & Resource Economics 30(3), 313–325. So: one choice
  question, read the "yes" as an upper bound, and divide it down when forecasting.
- The "worth it but can't afford it" chip matters in India: it separates a value problem (fix the product) from a price
  problem (scholarships, EMI, the free tier).
- **Honesty checks:** show ₹9,999 first and the ₹999 offer second, as the real checkout will. Say "first 300 on our website"
  because Play can't cap by count. If the founding price renews at ₹9,999, say so in the question; otherwise the answers
  measure a price we don't charge. Never show a live "seats left" counter in the survey.
- The only real signal is behaviour. Once Cashfree is live, count founding purchases and compare with the survey's "yes" share.

### 3d. Research-method pitfalls to avoid
- **Leading questions.** Not "How helpful was…?" (assumes it helped) but "For you, this part was…" with a neutral midpoint.
- **Demand effects and politeness.** People are kind to makers. Say an honest "no" helps, ask about behaviour (Q3, Q5),
  don't put the brand or the founder's face on the survey, and avoid agree/disagree scales (people tend to agree).
- **Double-barrelled questions.** One idea per question ("clear and useful?" is two).
- **Self-selection and survivorship.** The end survey only reaches finishers, who liked it enough to finish. Record the
  furthest step reached (anonymous) and lean on the in-path questions for the people who left.
- **Anchoring.** The ₹999 sitting next to ₹9,999 drags answers down. Keep the order fixed (full price first) and note it when
  reading results.
- **Order effects.** Randomise non-scale chips; ask the price question after the "useful" and "missing" ones, never first.
- **Small numbers.** With 50–200 answers, read percentages as rough. Don't change a pedagogy rule on 12 votes; pair numbers
  with five follow-up calls.
- **Sensitive ground.** "Prefer not to say" on every profile chip; no questions about results, scores or number of attempts.

---

## 4. Critique: top 5 changes, ranked by impact on learning and feel

1. **Fold the text away before each part's check.** In `read`, the check sits below the body on the same screen, so the
   answer is a scroll away. Put the check behind a "Done reading" button that collapses the text (a "show the text again"
   link can stay, after an answer). This turns five look-ups into five retrievals. Also make one check in parts 3–5 a
   callback to an earlier part ("From part 1: which is a unitary feature?"). That adds spacing and mixing for free. (Band A idea.)
2. **Make "Keep it" a real attempt.** `keepCards` seeds every card with `F.review(null, F.GOOD, day)` without asking anything,
   so the schedule is set by a press of a button, not by memory. Show the 8 cards cold, one at a time; cards answered
   correctly start a few days out, cards missed come back tomorrow. Bring the three warm-up questions back here too ("Your
   guesses from the start: try them now"): closing that loop is what the pretest effect pays out on, and it feels good.
   (Spacing A; Rawson, Dunlosky & Sciartelli 2013, *The power of successive relearning*, Educational Psychology Review 25(4),
   523–548: about a letter grade on real course exams.)
3. **Hold recall to "try first", then add a second go.** The checklist in `recall` is a `<details>` anyone can open before
   writing a word; `mains` already gates its reveal on 20 characters. Gate recall the same way, with an "I said it aloud"
   button for people who didn't type. After the tick list, offer one more pass: "Close the list. Try just the ones you
   didn't tick." That second retrieval is where most of the gain is. Also remove the bypass button in `mains` that reveals
   the skeleton straight away ("I'll plan on paper"): keep it, but ask them to tap "I've planned on paper" after doing so.
4. **Teach the negative-marking maths in the PYQ step, and allow three confidence levels.** Replace Sure / Not sure with
   Sure / Can rule out one or two / Pure guess. Then, in the tally, show the arithmetic once (GS Paper I: +2 right,
   −0.67 wrong): a pure guess among four is worth 0 on average; rule out one option and it's worth about +0.22; rule out two
   and it's about +0.67. This is the most useful exam-technique fact for Prelims and nobody teaches it with the person's own
   answers. Reword "those are the costly ones" to add the hopeful half: "and those are the ones you'll now remember best"
   (hypercorrection). Keep everything private, no percentage score.
5. **Make the path feel like three short sittings, and break the reading block.** `sittings` promises three 25-minute sittings
   but the steps flow as one 13-step line, with parts 3, 4 and 5 read back to back (about 14 minutes of reading). (a) Add two
   "Good place to stop" cards (after the sort, after apply) that say what's saved, what's next, and roughly how long it
   takes. (b) Put the new Governor's desk game right after part 3 and the GST calculator right after part 4, so the reading
   block becomes read, do, read, do. (c) In Mains, add a "New to Mains? See one worked plan for a different question first"
   option: an example then a problem helps beginners (van Gog, Kester & Paas 2011, Contemporary Educational Psychology
   36(3), 212–218), while try-first stays the default for everyone else (expertise reversal).

Smaller notes, not ranked: show the "why we do it" line once per step type, then collapse it to an "i"; the sort shows
"x / 12" in bold, so make it as quiet as the PYQ tally; give the video step a transcript as well as captions (low data, Hindi).

---

## Sources checked (web, 8 Nov 2026)
- Pan & Carpenter 2023: https://sc-pan.github.io/pdf/PR_2023.pdf
- Szpunar, Khan & Schacter 2013: https://pmc.ncbi.nlm.nih.gov/articles/PMC3631699/
- Brunmair & Richter 2019: https://pubmed.ncbi.nlm.nih.gov/31556629/
- Karpicke & Blunt 2011: https://www.purdue.edu/newsroom/research/2011/110120KarpickeScience.html
- Butterfield & Metcalfe 2001: https://en.wikipedia.org/wiki/Hypercorrection_(psychology)
- Koriat & Goldsmith 1996: https://cris.haifa.ac.il/en/publications/monitoring-and-control-processes-in-the-strategic-regulation-of-m/
- Pan & Rickard 2018: https://sc-pan.github.io/pdf/PR_2018.pdf
- Sinha & Kapur 2021: https://ouci.dntb.gov.ua/works/4KnMgZq7
- Kalyuga et al. 2003: https://ro.uow.edu.au/edupapers/136
- van Gog, Kester & Paas 2011: https://repub.eur.nl/pub/26205
- Cepeda et al. 2006: https://pubmed.ncbi.nlm.nih.gov/16719566/
- Su et al. 2023 (TKDE): https://scholar.hit.edu.cn/en/publications/optimizing-spaced-repetition-schedule-by-capturing-the-dynamics-o/
- Rawson, Dunlosky & Sciartelli 2013: https://www.retrievalpractice.org/archive/2018/successive-relearning
- Gollwitzer & Sheeran 2006: https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f
- Chernikova et al. 2020: https://epub.ub.uni-muenchen.de/84298/1/0034654320933544.pdf
- Alfieri et al. 2011: https://www.fisme.science.uu.nl/publicaties/literatuur/2011_alfieri_discovery_learning.pdf
- Noetel et al. 2021: https://www.aera.net/tabid/19324/mid/50329/default.aspx
- Kellogg 1988: https://scholarsmine.mst.edu/psysci_facwork/284
- Panadero, Jonsson & Botella 2017: https://www.sciencegate.app/document/10.1016/j.edurev.2017.08.004
- van Kesteren et al. 2012: https://research.vu.nl/en/publications/how-schema-and-novelty-augment-memory-formation/
- Murphy et al. 2005: https://econpapers.repec.org/RePEc:kap:enreec:v:30:y:2005:i:3:p:313-325
- GST Council voting (Art. 279A): https://tax2win.in/guide/article-279a-gst-council
- UPSC negative marking: https://vajiramandravi.com/upsc-exam/negative-marking-in-upsc/
- DPDP Rules 2025: https://www.khaitanco.com/sites/default/files/2025-11/ERGO%20-%20Digital%20Personal%20%20Data%20Protection%20Rules%20-%2015%20November%202025.pdf ; https://dpdpa.com/dpdparules/rule3.html

UNVERIFIED: the Rule 3 start date of 13 May 2027 (one compliance tracker only).
