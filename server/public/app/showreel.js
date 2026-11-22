// The showreel (#tour/<topic>): a fast, confident sales tour of one topic that plays like a video but is built from
// the topic's real content. Made 21 Nov 2026 from the owner's review of the old demo ("more oomph", side comments that
// sell, features shown like trophies, nav that never drowns, no feedback forms, one Join button, nothing below the fold).
//
// How it plays:
// - One full-screen stage. A thin top bar (progress, language, sound, one Join pill) and a fixed bottom bar (Back,
//   Pause, Next: <what's next>) that content can never cover. Each scene fits the screen; there is no page scroll.
// - Every scene is a feature shown like a trophy: its name, one plain line on how it helps in UPSC prep, and the
//   feature itself, animated with the topic's own questions, bills, lists, PYQs and pages.
// - A voice (the salesman) speaks each side comment; the comment pops up beside the scene as he says it, so with the
//   sound off the comments are the captions. Recorded once per language by scripts/showreel-voice.mjs into
//   demo-voice/showreel/<scene>-<n>-<lang>.mp3; durations.json there times the silent version.
// - A few moments take a tap (pick an answer, choose for the Governor, flip the card). Nobody has to: the tour picks
//   for them after a beat. The real video plays only if tapped (it pauses the tour). Nothing else autoplays.
// - Sound: nothing plays until the visitor presses Play, and the start screen offers a silent way in. One speaker
//   button turns the voice and the effects off together (remembered). Reduced motion: no movement, no shake, no sparks.
// - No timers, scores or streaks shown; no feedback questions; anonymous funnel events only (tour_*).
// - No "AI" labels, and the voice player says nothing about the voice. Plus is ₹3,999 a year, no founding offer.
// Only topics with a recorded script (TOPICS) get the tour; any other id goes to #try/<id>.

import { kulhad } from "./kulhad.js";

export const TOPICS = ["path-pol-federalism"];

// --- The script -------------------------------------------------------------------------------------------------------
// Each scene: lines (side comments, spoken in order) and help (the plain "how it helps", spoken last). `say` is what the
// voice reads when it differs from the text on screen (numbers spelt out). Facts here match the topic file and the
// Plus page (free: 3 answer reviews a week, one mock a month, 15 Chotu turns a day; Plus: no limits, 100 turns).

export const LINES = {
  intro: { lines: [
    { en: "Welcome to Aspiran. Give me a few minutes, and I'll show you how one UPSC topic stays with you for good.",
      hi: "Aspiran में आपका स्वागत है। बस कुछ मिनट दीजिए, और मैं दिखाता हूँ कि UPSC का एक topic कैसे हमेशा के लिए याद रह जाता है।",
      say: { en: "Welcome to Aspi-raan. Give me a few minutes, and I'll show you how one U P S C topic stays with you for good.",
        hi: "आस्पिरान में आपका स्वागत है। बस कुछ मिनट दीजिए, और मैं दिखाता हूँ कि UPSC का एक topic कैसे हमेशा के लिए याद रह जाता है।" } },
    { en: "One topic, eleven ways to make it stick. Let's begin.", hi: "एक topic, उसे पक्का करने के ग्यारह तरीक़े। चलिए, शुरू करते हैं।" }] },
  guess: { lines: [
    { en: "Notice something? You get a question before a single page of teaching. Go on, take a guess.", hi: "ग़ौर कीजिए, पढ़ाई का एक पन्ना भी नहीं और पहले सवाल। चलिए, अंदाज़ा लगाइए।" },
    { en: "Right or wrong, it doesn't matter. A guess before the lesson makes the answer stick, and that's memory science, not magic.",
      hi: "सही हो या ग़लत, फ़र्क़ नहीं पड़ता। पढ़ने से पहले का अंदाज़ा जवाब को पक्का कर देता है, और ये जादू नहीं, याददाश्त का विज्ञान है।" }],
    help: { en: "In Prelims you need it on the day, and guessing first is how it stays.", hi: "Prelims में जवाब उसी दिन याद चाहिए, और पहले अंदाज़ा लगाने से वो टिकता है।" } },
  read: { lines: [
    { en: "Now the reading: short and sharp, with every key idea in bold and every Article named.", hi: "अब पढ़ाई: छोटी और धारदार, हर ज़रूरी बात bold में और हर अनुच्छेद का नाम साथ।" },
    { en: "Then the text folds away, and you answer from memory. No lazy re-reading here.",
      hi: "फिर पाठ छिप जाता है, और जवाब याद से देना होता है। यहाँ आलसी दोहराई नहीं चलती।" }],
    help: { en: "Recalling beats re-reading: fewer hours on the same page, and more of it left for the exam hall.",
      hi: "दोबारा पढ़ने से बेहतर है याद करके बताना: एक ही पन्ने पर कम घंटे, और परीक्षा हॉल में ज़्यादा याद।" } },
  video: { lines: [
    { en: "In under a minute, the Governor, Article 200 and the Supreme Court's 2025 opinion, in one crisp video.",
      hi: "एक मिनट से कम में राज्यपाल, अनुच्छेद 200 और सुप्रीम कोर्ट की 2025 की राय, एक कसे हुए video में।",
      say: { en: "In under a minute, the Governor, Article two hundred and the Supreme Court's twenty twenty-five opinion, in one crisp video.",
        hi: "एक मिनट से कम में राज्यपाल, अनुच्छेद दो सौ और सुप्रीम कोर्ट की दो हज़ार पच्चीस की राय, एक कसे हुए वीडियो में।" } },
    { en: "The moment it ends, you answer the very question it ends on. You don't just watch it, you use it.",
      hi: "Video ख़त्म होते ही आप उसी सवाल का जवाब देते हैं जिस पर वो ख़त्म होता है। सिर्फ़ देखते नहीं, इस्तेमाल करते हैं।",
      say: { en: "The moment it ends, you answer the very question it ends on. You don't just watch it, you use it.",
        hi: "वीडियो ख़त्म होते ही आप उसी सवाल का जवाब देते हैं जिस पर वो ख़त्म होता है। सिर्फ़ देखते नहीं, इस्तेमाल करते हैं।" } }],
    help: { en: "Current affairs, tied straight to the static syllabus, which is exactly how GS2 asks it.", hi: "करेंट अफ़ेयर्स, सीधे static syllabus से जुड़े, और GS2 ठीक ऐसे ही पूछता है।",
      say: { en: "Current affairs, tied straight to the static syllabus, which is exactly how G S two asks it.", hi: "करेंट अफ़ेयर्स, सीधे स्टैटिक सिलेबस से जुड़े, और जी एस दो ठीक ऐसे ही पूछता है।" } } },
  gov: { lines: [
    { en: "Now you are the Governor, and a bill lands on your desk. Do you sign it, send it back, or send it to the President?",
      hi: "अब आप राज्यपाल हैं, और आपकी मेज़ पर एक विधेयक आया है। हस्ताक्षर करेंगे, वापस भेजेंगे, या राष्ट्रपति को?" },
    { en: "Every choice comes back with the rule behind it. Sit in this chair once, and Article 200 is yours for life.",
      hi: "हर फ़ैसले के साथ उसका नियम भी आता है। इस कुर्सी पर एक बार बैठिए, और अनुच्छेद 200 ज़िंदगी भर याद रहेगा।",
      say: { en: "Every choice comes back with the rule behind it. Sit in this chair once, and Article two hundred is yours for life.",
        hi: "हर फ़ैसले के साथ उसका नियम भी आता है। इस कुर्सी पर एक बार बैठिए, और अनुच्छेद दो सौ ज़िंदगी भर याद रहेगा।" } }],
    help: { en: "Mains asks you to judge, not recite, and here you practise judging.", hi: "Mains रटा हुआ नहीं, आपका फ़ैसला माँगता है, और यहाँ आप फ़ैसला करना सीखते हैं।" } },
  sort: { lines: [
    { en: "Union, State or Concurrent? Watch these lookalike subjects fly into the right list.", hi: "संघ, राज्य या समवर्ती? देखिए, मिलते-जुलते विषय उड़कर सही सूची में जाते हैं।" },
    { en: "These are exactly the lookalikes UPSC uses to trap you. Sort them once here, and the trap stops working.",
      hi: "UPSC इन्हीं मिलते-जुलते विषयों से फँसाता है। यहाँ एक बार छाँट लीजिए, और वो जाल काम करना बंद कर देता है।" }],
    help: { en: "Telling lookalikes apart is exactly what Prelims tests.", hi: "मिलती-जुलती चीज़ों में फ़र्क़ करना, यही तो Prelims परखता है।" } },
  gst: { lines: [
    { en: "Now my favourite, the GST Council: thirty-one states and one Centre. Every state votes yes, and the Centre says no.",
      hi: "अब मेरा पसंदीदा, GST परिषद: इकतीस राज्य और एक केंद्र। सारे राज्य हाँ कहते हैं, और केंद्र कहता है ना।",
      say: { en: "Now my favourite, the G S T Council: thirty-one states and one Centre. Every state votes yes, and the Centre says no.",
        hi: "अब मेरा पसंदीदा, जी एस टी परिषद: इकतीस राज्य और एक केंद्र। सारे राज्य हाँ कहते हैं, और केंद्र कहता है ना।" } },
    { en: "Blocked. All the states together hold only two-thirds of the vote, and seventy-five percent is needed. So the Centre has a veto, and you just saw why.",
      hi: "रुक गया। सारे राज्य मिलकर भी वोट का सिर्फ़ दो-तिहाई रखते हैं, और चाहिए पचहत्तर प्रतिशत। यानी केंद्र के पास वीटो है, और आपने अभी देखा क्यों।" }],
    help: { en: "A number you play with is a number you remember in the exam.", hi: "जिस आँकड़े से आप खेलते हैं, वो परीक्षा में याद रहता है।" } },
  pyq: { lines: [
    { en: "This is real Prelims 2025, with the official answer key. Pick an answer, then say how sure you are.", hi: "ये असली Prelims 2025 है, आधिकारिक उत्तर-कुंजी के साथ। पहले जवाब चुनिए, फिर बताइए कितने पक्के हैं।",
      say: { en: "This is real Prelims twenty twenty-five, with the official answer key. Pick an answer, then say how sure you are.", hi: "ये असली प्रीलिम्स दो हज़ार पच्चीस है, आधिकारिक उत्तर-कुंजी के साथ। पहले जवाब चुनिए, फिर बताइए कितने पक्के हैं।" } },
    { en: "Sure, and wrong? In the real exam, that costs a third of the question's marks. Here, you get one more try.",
      hi: "पक्का, और ग़लत? असली परीक्षा में इससे उस सवाल के एक-तिहाई अंक कट जाते हैं। यहाँ आपको एक और मौक़ा मिलता है।" },
    { en: "Right on the second go, and now you know exactly where you were guessing.", hi: "दूसरी बार में सही, और अब आपको पता है कि आप अंदाज़ा कहाँ लगा रहे थे।" }],
    help: { en: "With negative marking, knowing when you're guessing saves real marks.", hi: "Negative marking में ये जानना कि आप कब अंदाज़ा लगा रहे हैं, असली अंक बचाता है।",
      say: { en: "With negative marking, knowing when you're guessing saves real marks.", hi: "नेगेटिव मार्किंग में ये जानना कि आप कब अंदाज़ा लगा रहे हैं, असली अंक बचाता है।" } } },
  mains: { lines: [
    { en: "Mains 2025, GS2, fifteen marks. Watch the answer build itself, one point at a time.", hi: "Mains 2025, GS2, पंद्रह अंक। देखिए, उत्तर एक-एक बिंदु करके ख़ुद बनता है।",
      say: { en: "Mains twenty twenty-five, G S two, fifteen marks. Watch the answer build itself, one point at a time.", hi: "मेन्स दो हज़ार पच्चीस, जी एस दो, पंद्रह अंक। देखिए, उत्तर एक-एक बिंदु करके ख़ुद बनता है।" } },
    { en: "The answer comes in the first line, every point carries an Article, a number or a year, and the way forward says who does what. That's what examiners reward.",
      hi: "पहली पंक्ति में जवाब, हर बिंदु पर एक अनुच्छेद, आँकड़ा या वर्ष, और आगे का रास्ता बताता है कि कौन क्या करे। परीक्षक इसी को अंक देते हैं।" }],
    help: { en: "A plan in minutes is how you finish all twenty questions on the day.", hi: "मिनटों में ढाँचा, यही है परीक्षा के दिन बीसों सवाल पूरे करने का तरीक़ा।" } },
  desk: { lines: [
    { en: "Nobody writes an essay in the middle of a demo, so here's a page we wrote earlier.", hi: "Demo के बीच कोई निबंध नहीं लिखता, इसलिए ये रहा पहले से लिखा एक पन्ना।",
      say: { en: "Nobody writes an essay in the middle of a demo, so here's a page we wrote earlier.", hi: "डेमो के बीच कोई निबंध नहीं लिखता, इसलिए ये रहा पहले से लिखा एक पन्ना।" } },
    { en: "In the app, you write by hand and snap a photo, and Chotu marks it right in the margin. Like a strict teacher, minus the scolding.",
      hi: "App में आप हाथ से लिखकर फ़ोटो लेते हैं, और Chotu हाशिये में ही जाँच कर देता है। सख़्त टीचर जैसा, पर डाँट के बिना।",
      say: { en: "In the app, you write by hand and snap a photo, and Chotu marks it right in the margin. Like a strict teacher, minus the scolding.",
        hi: "ऐप में आप हाथ से लिखकर फ़ोटो लेते हैं, और छोटू हाशिये में ही जाँच कर देता है। सख़्त टीचर जैसा, पर डाँट के बिना।" } }],
    help: { en: "Answer writing only improves with feedback. Three pages a week are marked free, and on Plus, every page.",
      hi: "उत्तर-लेखन फ़ीडबैक से ही सुधरता है। हर हफ़्ते तीन पन्ने मुफ़्त जाँचे जाते हैं, और Plus पर हर पन्ना।",
      say: { en: "Answer writing only improves with feedback. Three pages a week are marked free, and on Plus, every page.",
        hi: "उत्तर-लेखन फ़ीडबैक से ही सुधरता है। हर हफ़्ते तीन पन्ने मुफ़्त जाँचे जाते हैं, और प्लस पर हर पन्ना।" } } },
  essay: { lines: [
    { en: "And the Essay paper? One topic and three pages: the skeleton, the outline, and the first paragraph, written out.",
      hi: "और Essay paper? एक विषय और तीन पन्ने: ढाँचा, रूपरेखा, और लिखा हुआ पहला पैराग्राफ़।",
      say: { en: "And the Essay paper? One topic and three pages: the skeleton, the outline, and the first paragraph, written out.", hi: "और निबंध का पेपर? एक विषय और तीन पन्ने: ढाँचा, रूपरेखा, और लिखा हुआ पहला पैराग्राफ़।" } },
    { en: "Every page is marked, so you see exactly what lifts an essay. Not tips, but proof.", hi: "हर पन्ना जाँचा हुआ है, ताकि दिखे कि निबंध ऊपर कैसे उठता है। नुस्ख़े नहीं, सबूत।" }],
    help: { en: "The Essay paper carries 250 marks, and watching a page get better teaches more than a list of tips.",
      hi: "Essay paper 250 अंक का है, और एक पन्ने को बेहतर होते देखना नुस्ख़ों की सूची से ज़्यादा सिखाता है।",
      say: { en: "The Essay paper carries two hundred and fifty marks, and watching a page get better teaches more than a list of tips.",
        hi: "निबंध का पेपर ढाई सौ अंक का है, और एक पन्ने को बेहतर होते देखना नुस्ख़ों की सूची से ज़्यादा सिखाता है।" } } },
  cards: { lines: [
    { en: "Remember your very first guess? It's back, as a memory card.", hi: "अपना पहला अंदाज़ा याद है? वो एक memory card बनकर लौट आया है।",
      say: { en: "Remember your very first guess? It's back, as a memory card.", hi: "अपना पहला अंदाज़ा याद है? वो एक मेमोरी कार्ड बनकर लौट आया है।" } },
    { en: "Miss it, and it comes back tomorrow. Know it, and it waits until just before you'd forget, so your revision plans itself.",
      hi: "भूले, तो कल फिर आएगा। याद रहा, तो ठीक भूलने से पहले लौटेगा, यानी आपकी revision ख़ुद अपना plan बनाती है।",
      say: { en: "Miss it, and it comes back tomorrow. Know it, and it waits until just before you'd forget, so your revision plans itself.",
        hi: "भूले, तो कल फिर आएगा। याद रहा, तो ठीक भूलने से पहले लौटेगा, यानी आपका रिवीज़न ख़ुद अपनी योजना बनाता है।" } }],
    help: { en: "That's how a two-year syllabus is still fresh on exam day.", hi: "ऐसे ही दो साल का syllabus परीक्षा के दिन भी ताज़ा रहता है।",
      say: { en: "That's how a two-year syllabus is still fresh on exam day.", hi: "ऐसे ही दो साल का सिलेबस परीक्षा के दिन भी ताज़ा रहता है।" } } },
  pods: { lines: [
    { en: "Now, the heart of Aspiran: your pod. Six to eight aspirants at your stage, not a group of fifty thousand strangers.",
      hi: "अब, Aspiran का दिल: आपका pod. आपके स्तर के छह से आठ उम्मीदवार, पचास हज़ार अजनबियों का group नहीं।",
      say: { en: "Now, the heart of Aspi-raan: your pod. Six to eight aspirants at your stage, not a group of fifty thousand strangers.",
        hi: "अब, आस्पिरान का दिल: आपका पॉड। आपके स्तर के छह से आठ उम्मीदवार, पचास हज़ार अजनबियों का ग्रुप नहीं।" } },
    { en: "You study together and keep each other going, and nobody ranks anybody. There are no public scores, ever.",
      hi: "साथ पढ़िए, एक-दूसरे को आगे बढ़ाइए, और कोई किसी की rank नहीं लगाता। कोई public score नहीं, कभी नहीं।",
      say: { en: "You study together and keep each other going, and nobody ranks anybody. There are no public scores, ever.",
        hi: "साथ पढ़िए, एक-दूसरे को आगे बढ़ाइए, और कोई किसी की रैंक नहीं लगाता। कोई पब्लिक स्कोर नहीं, कभी नहीं।" } }],
    help: { en: "UPSC is a long road, and a small, steady group keeps you on it.", hi: "UPSC लंबा रास्ता है, और एक छोटा, भरोसेमंद group आपको उस पर टिकाए रखता है।",
      say: { en: "U P S C is a long road, and a small, steady group keeps you on it.", hi: "यू पी एस सी लंबा रास्ता है, और एक छोटा, भरोसेमंद ग्रुप आपको उस पर टिकाए रखता है।" } } },
  chotu: { lines: [
    { en: "And meet Chotu, your study buddy. Stuck on Article 356 late in the evening? Just ask Chotu.", hi: "और मिलिए Chotu से, आपका study साथी। शाम को अनुच्छेद 356 पर अटके? बस Chotu से पूछिए।",
      say: { en: "And meet Chotu, your study buddy. Stuck on Article three fifty-six late in the evening? Just ask Chotu.", hi: "और मिलिए छोटू से, आपका पढ़ाई का साथी। शाम को अनुच्छेद तीन सौ छप्पन पर अटके? बस छोटू से पूछिए।" } },
    { en: "He gives you a nudge, not the answer, and after half past eleven he goes quiet so you can sleep. Now that's a good friend.",
      hi: "वो इशारा देता है, जवाब नहीं, और साढ़े ग्यारह के बाद चुप हो जाता है ताकि आप सो सकें। ऐसा होता है सच्चा साथी।" }],
    help: { en: "Help the moment you're stuck, and the thinking stays yours.", hi: "अटकते ही मदद, और सोचने का काम आपका ही रहता है।" } },
  variety: { lines: [
    { en: "And all of that was just one topic. There's so much more: Chai news cards, mocks, maps, videos, games and past papers.",
      hi: "और ये सब सिर्फ़ एक topic था। और भी बहुत कुछ है: Chai news cards, mock, नक़्शे, video, खेल और पिछले papers।",
      say: { en: "And all of that was just one topic. There's so much more: Chai news cards, mocks, maps, videos, games and past papers.",
        hi: "और ये सब सिर्फ़ एक टॉपिक था। और भी बहुत कुछ है: चाय न्यूज़ कार्ड, मॉक टेस्ट, नक़्शे, वीडियो, खेल और पिछले साल के पेपर।" } }] },
  finale: { lines: [
    { en: "So here's the deal: join free, today. Your pod, Chai, practice, games and Chotu, all free.",
      hi: "तो सौदा ये है: आज ही मुफ़्त जुड़िए। आपका pod, Chai, अभ्यास, खेल और Chotu, सब मुफ़्त।",
      say: { en: "So here's the deal: join free, today. Your pod, Chai, practice, games and Chotu, all free.",
        hi: "तो सौदा ये है: आज ही मुफ़्त जुड़िए। आपका पॉड, चाय, अभ्यास, खेल और छोटू, सब मुफ़्त।" } },
    { en: "Want every answer marked and every mock? Plus is ₹3,999 a year, about eleven rupees a day, the price of a cup of chai.",
      hi: "हर उत्तर की जाँच और हर mock चाहिए? Plus है ₹3,999 साल का, यानी लगभग ग्यारह रुपये रोज़, एक कप चाय जितना।",
      say: { en: "Want every answer marked and every mock? Plus is three thousand, nine hundred and ninety-nine rupees a year, about eleven rupees a day, the price of a cup of chai.",
        hi: "हर उत्तर की जाँच और हर मॉक टेस्ट चाहिए? प्लस है तीन हज़ार नौ सौ निन्यानवे रुपये साल का, यानी लगभग ग्यारह रुपये रोज़, एक कप चाय जितना।" } },
    { en: "Go on, tap Join free. No card needed.", hi: "चलिए, ‘मुफ़्त जुड़िए’ दबाइए। कोई card नहीं चाहिए।",
      say: { en: "Go on, tap Join free. No card needed.", hi: "चलिए, मुफ़्त जुड़िए दबाइए। कोई कार्ड नहीं चाहिए।" } }] },
};

/** Every recorded clip: [file key, { en, hi } text to speak]. The voice script and the player both use this. */
export function clips() {
  const out = [];
  for (const [id, s] of Object.entries(LINES)) {
    s.lines.forEach((l, i) => out.push([`${id}-${i + 1}`, l.say ?? l]));
    if (s.help) out.push([`${id}-h`, s.help.say ?? s.help]);
  }
  return out;
}

// --- Words on screen --------------------------------------------------------------------------------------------------

const W = {
  en: {
    kick: "Free tour · no account", title: "One topic.<br><em>Eleven ways</em> to make it stick.", play: "Play the tour", playSub: "with sound", silent: "Watch without sound",
    back: "Back", next: "Next", pause: "Pause", resume: "Play", soundOn: "Sound on", soundOff: "Sound off", join: "Join free", helps: "How it helps in UPSC",
    tapOr: "Tap one, or just watch", yourPick: "Your pick", right: "Right", watch: "Watch the video", secs: (s) => `${s} sec`, endsOn: "The question the video ends on",
    bill: "Bill", fromMemory: "From memory", folded: "Text folded away. Now, from memory:", allowed: "Allowed", stampIn: "Passed by the Assembly",
    union: "Centre", statesW: "31 states", states: "States", centreW: "Centre", need: "75% needed", blocked: "Blocked", weight: "of the vote",
    sure: ["Sure", "Ruled some out", "Pure guess"], howSure: "How sure?", minus: "−⅓ in the real exam", oneMore: "One more try", key: "Official key",
    marks: (m, w) => `${m} marks · ${w} words`, intro: "Opening", way: "Way forward", snap: "Snap", legend: [["S", "Structure"], ["C", "Content"], ["E", "Expression"]],
    madeFor: "Written by our team for this demo", pages: ["Skeleton", "Outline", "Page"], notes: (n) => `${n} margin notes`,
    front: "Memory card", flip: "Tap to flip", missed: "Missed it", knew: "Knew it", tomorrow: "Back tomorrow", later: "Back just before you'd forget",
    pod: "Your pod", podSize: "6 to 8 aspirants at your stage", noScores: "No public scores. No ranks. Ever.", illus: "Illustration",
    podActs: ["Shared a Mains plan", "Finished today's Chai", "Asked a doubt", "Marked a page"],
    chotuQ: "Article 356 is confusing me. What happens to the state's laws?", chotuA: "Here's a nudge: under President's Rule, who takes over the state's law-making? Look at Article 356(1)(b) and tell me what you find.",
    quiet: "Quiet from 11:30 pm to 7 am", buddy: "Chotu · study buddy",
    trophies: ["Guess first", "Smart reads", "Short videos", "Games", "Real PYQs", "Mains plans", "Marking desk", "Essays", "Memory cards", "Pods", "Chotu", "Chai news cards", "Mocks", "Maps"],
    oneTopic: "All of that was <em>one</em> topic.",
    finTitle: "Start free <em>today.</em>", free: "Free", plus: "Plus", perYear: "/year", perDay: "about ₹11 a day",
    freeList: ["Your pod of 6 to 8 aspirants", "Chai news cards, every day", "Practice, games and past papers", "3 answers marked a week", "One full mock a month", "Chotu, 15 turns a day"],
    plusList: ["Everything in Free", "Every answer marked", "Every mock", "Chotu, 100 turns a day"], plusNote: "Upgrade inside the app, whenever you're ready.",
    noCard: "Free to join. No card needed.", again: "Watch again", yourself: "Try the topic yourself",
    names: { intro: "Welcome", guess: "Guess first", read: "Read smart", video: "Watch", gov: "The Governor's desk", sort: "Sort the lists", gst: "The GST vote",
      pyq: "Real PYQs", mains: "Mains answers", desk: "The marking desk", essay: "The essay", cards: "Memory cards", pods: "Your pod", chotu: "Chotu", variety: "And more", finale: "Join free" },
    loading: "Loading the tour…", offline: "The tour needs a connection the first time. Try again in a moment.", sceneOf: (i, n) => `${i} of ${n}`,
  },
  hi: {
    kick: "मुफ़्त टूर · बिना account", title: "एक topic.<br>पक्का करने के <em>ग्यारह तरीक़े</em>।", play: "टूर चलाइए", playSub: "आवाज़ के साथ", silent: "बिना आवाज़ देखिए",
    back: "पीछे", next: "आगे", pause: "रोकिए", resume: "चलाइए", soundOn: "आवाज़ चालू", soundOff: "आवाज़ बंद", join: "मुफ़्त जुड़िए", helps: "UPSC में कैसे काम आता है",
    tapOr: "एक चुनिए, या बस देखिए", yourPick: "आपका चुनाव", right: "सही", watch: "Video देखिए", secs: (s) => `${s} सेकंड`, endsOn: "जिस सवाल पर video ख़त्म होता है",
    bill: "विधेयक", fromMemory: "याद से", folded: "पाठ छिप गया। अब याद से:", allowed: "अनुमति है", stampIn: "विधानसभा से पारित",
    union: "केंद्र", statesW: "31 राज्य", states: "राज्य", centreW: "केंद्र", need: "75% चाहिए", blocked: "रुका", weight: "वोट",
    sure: ["पक्का", "कुछ हटा सका", "पूरा अंदाज़ा"], howSure: "कितने पक्के?", minus: "असली परीक्षा में −⅓", oneMore: "एक और मौक़ा", key: "आधिकारिक कुंजी",
    marks: (m, w) => `${m} अंक · ${w} शब्द`, intro: "शुरुआत", way: "आगे का रास्ता", snap: "क्लिक", legend: [["S", "ढाँचा"], ["C", "सामग्री"], ["E", "अभिव्यक्ति"]],
    madeFor: "इस demo के लिए हमारी टीम ने लिखा", pages: ["ढाँचा", "रूपरेखा", "पन्ना"], notes: (n) => `हाशिये में ${n} टिप्पणियाँ`,
    front: "Memory card", flip: "पलटने के लिए टैप कीजिए", missed: "भूल गए", knew: "याद था", tomorrow: "कल फिर", later: "ठीक भूलने से पहले",
    pod: "आपका pod", podSize: "आपके स्तर के 6 से 8 उम्मीदवार", noScores: "कोई public score नहीं। कोई rank नहीं। कभी नहीं।", illus: "चित्रण",
    podActs: ["Mains का ढाँचा साझा किया", "आज की Chai पूरी की", "एक doubt पूछा", "एक पन्ना जँचवाया"],
    chotuQ: "अनुच्छेद 356 समझ नहीं आ रहा। राज्य के क़ानूनों का क्या होता है?", chotuA: "एक इशारा: राष्ट्रपति शासन में राज्य का क़ानून बनाने का काम कौन सँभालता है? अनुच्छेद 356(1)(ख) देखिए और बताइए क्या मिला।",
    quiet: "रात 11:30 से सुबह 7 बजे तक चुप", buddy: "Chotu · study साथी",
    trophies: ["पहले अंदाज़ा", "समझकर पढ़ाई", "छोटे video", "खेल", "असली PYQ", "Mains ढाँचे", "जाँच की मेज़", "निबंध", "Memory cards", "Pods", "Chotu", "Chai news cards", "Mocks", "नक़्शे"],
    oneTopic: "ये सब <em>एक</em> topic था।",
    finTitle: "आज ही <em>मुफ़्त</em> शुरू कीजिए।", free: "Free", plus: "Plus", perYear: "/साल", perDay: "लगभग ₹11 रोज़",
    freeList: ["6 से 8 उम्मीदवारों का आपका pod", "रोज़ Chai news cards", "अभ्यास, खेल और पिछले papers", "हर हफ़्ते 3 उत्तरों की जाँच", "हर महीने एक पूरा mock", "Chotu, रोज़ 15 बातें"],
    plusList: ["Free में जो है, सब", "हर उत्तर की जाँच", "सारे mock", "Chotu, रोज़ 100 बातें"], plusNote: "जब चाहें, app के अंदर से upgrade कीजिए।",
    noCard: "जुड़ना मुफ़्त। कोई card नहीं चाहिए।", again: "फिर से देखिए", yourself: "Topic ख़ुद करके देखिए",
    names: { intro: "स्वागत", guess: "पहले अंदाज़ा", read: "समझकर पढ़िए", video: "देखिए", gov: "राज्यपाल की मेज़", sort: "सूचियाँ छाँटिए", gst: "GST का वोट",
      pyq: "असली PYQ", mains: "Mains उत्तर", desk: "जाँच की मेज़", essay: "निबंध", cards: "Memory cards", pods: "आपका pod", chotu: "Chotu", variety: "और भी", finale: "मुफ़्त जुड़िए" },
    loading: "टूर खुल रहा है…", offline: "पहली बार टूर के लिए internet चाहिए। थोड़ी देर में फिर कोशिश कीजिए।", sceneOf: (i, n) => `${i} / ${n}`,
  },
};

// The side chip beside each line of the Mains plan: why that line is there.
const WHY = {
  en: { intro: "Answers the question in one breath", p0: "A hook on every point: Article 280, Gadgil, 1969", p1: "Exact numbers, current to the 16th Finance Commission",
    p2: "Both sides in one point. \"Examine\" means weigh", p3: "The counter-trend that lifts it from average to good", way: "Says who should do what" },
  hi: { intro: "एक साँस में सवाल का जवाब", p0: "हर बिंदु पर पकड़: अनुच्छेद 280, गाडगिल, 1969", p1: "सटीक आँकड़े, 16वें वित्त आयोग तक",
    p2: "एक बिंदु में दोनों पक्ष। \"परीक्षण\" यानी तौलना", p3: "उलटा रुझान, जो औसत को अच्छा बनाता है", way: "कौन क्या करे, साफ़ बताता है" },
};

// --- Plumbing ---------------------------------------------------------------------------------------------------------

let X = null; // { store, track, profile }
export function init(ctx) { X = ctx; }
const NS = "http://www.w3.org/2000/svg";
/** h("div.a.b", { attrs }, ...kids): style objects may carry --custom properties. */
function h(tag, attrs, ...kids) {
  const [name, ...cls] = tag.split(".");
  const el = document.createElement(name || "div");
  if (cls.length) el.className = cls.join(" ");
  if (attrs && (typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style") for (const [p, x] of Object.entries(v)) el.style.setProperty(p.startsWith("--") ? p : p.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()), x);
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k instanceof Node ? k : String(k));
  return el;
}
const put = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));
const RM = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
const lang = () => { const l = X.store.get("try:lang", (navigator.language || "").startsWith("hi") ? "hi" : "en"); return l === "hi" && hiOK ? "hi" : "en"; };
let hiOK = true;
const L = (v) => (v && typeof v === "object" ? v[lang()] || v.en || "" : v ?? "");
const t = (k, ...a) => { const v = (W[lang()] ?? W.en)[k] ?? W.en[k]; return typeof v === "function" ? v(...a) : v; };
const track = (name, props = {}) => { try { X.track?.(name, { path: topic?.id, ...props }); } catch {} };
/** **bold** lead-ins as nodes. */
const rich = (s) => String(s).split(/\*\*(.+?)\*\*/).map((p, i) => (i % 2 ? h("strong", p) : p));
const plain = (s) => String(s).replace(/\*\*/g, "");

const ICON = {
  guess: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z",
  read: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  video: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 8.5v7l6-3.5z",
  gov: "M7 21h10M5 17h14v-3H5zM9.5 14l.8-4.5a1.8 1.8 0 1 1 3.4 0l.8 4.5",
  sort: "M4 4h4.5v16H4zM9.75 4h4.5v16h-4.5zM15.5 4H20v16h-4.5z",
  gst: "M4 12h16v8H4zM8 12V4h8v8M10 8l1.5 1.5L14 6.5",
  pyq: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  mains: "M4 20l4-1 11-11-3-3L5 16zM14 7l3 3",
  desk: "M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  essay: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5",
  cards: "M8 3h12v14H8zM4 7v14h12",
  pods: "M12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM19 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM7 20c0-3 2.2-6 5-6s5 3 5 6M1.5 19c0-2.2 1.5-4 3.5-4M22.5 19c0-2.2-1.5-4-3.5-4",
  chotu: "M5 9h14l-2 11H7zM8 5c-1 1.5 1 2 0 3.5M12 4c-1 1.5 1 2 0 4M16 5c-1 1.5 1 2 0 3.5",
  variety: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9.5 17h5",
  finale: "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z",
  intro: "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z",
  back: "M15 5l-7 7 7 7", next: "M9 5l7 7-7 7", play: "M8 5v14l11-7z", pause: "M8 5h3v14H8zM13 5h3v14h-3z",
  on: "M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11", off: "M4 9h4l5-4v14l-5-4H4zM16 9.5l5 5M21 9.5l-5 5",
  check: "M5 12.5l4.5 4.5L19 7.5", x: "M6 6l12 12M18 6L6 18", replay: "M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4",
};
function icon(name, s = 20) {
  const el = document.createElementNS(NS, "svg");
  el.setAttribute("viewBox", "0 0 24 24"); el.setAttribute("width", s); el.setAttribute("height", s); el.setAttribute("aria-hidden", "true"); el.setAttribute("class", "sr-ic");
  const p = document.createElementNS(NS, "path"); p.setAttribute("d", ICON[name] ?? ICON.next); el.append(p);
  return el;
}

// --- Sound effects (made here, no files) ----------------------------------------------------------------------------

let ac = null;
const soundOn = () => X.store.get("tour:sound", true) !== false;
function tone(f, d, type = "sine", g = 0.06, when = 0, slide = 0) {
  if (!soundOn() || !started) return;
  try {
    ac ??= new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ac.currentTime + when, o = ac.createOscillator(), v = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
    v.gain.setValueAtTime(g, t0); v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(v).connect(ac.destination); o.start(t0); o.stop(t0 + d + 0.03);
  } catch {}
}
function noise(d, g = 0.08, when = 0, hp = 1200) {
  if (!soundOn() || !started) return;
  try {
    ac ??= new (window.AudioContext || window.webkitAudioContext)();
    const n = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain(), t0 = ac.currentTime + when;
    s.buffer = buf; f.type = "highpass"; f.frequency.value = hp; v.gain.value = g;
    s.connect(f).connect(v).connect(ac.destination); s.start(t0);
  } catch {}
}
const SFX = {
  whoosh: () => { noise(0.35, 0.05, 0, 600); tone(240, 0.3, "sine", 0.025, 0, 720); },
  boom: () => { tone(110, 0.5, "sine", 0.16, 0, 42); noise(0.12, 0.04, 0, 200); },
  tap: () => tone(760, 0.05, "triangle", 0.04),
  right: () => { tone(660, 0.12, "sine", 0.07); tone(990, 0.22, "sine", 0.06, 0.09); },
  wrong: () => tone(210, 0.28, "triangle", 0.08, 0, 140),
  stamp: () => { tone(90, 0.35, "sine", 0.2, 0, 40); noise(0.08, 0.07, 0, 300); },
  drop: () => tone(560, 0.09, "sine", 0.06, 0, 380),
  tick: () => tone(1200, 0.03, "square", 0.015),
  flip: () => { noise(0.12, 0.03, 0, 2500); tone(500, 0.06, "triangle", 0.03, 0, 900); },
  shutter: () => { noise(0.05, 0.12, 0, 3000); noise(0.06, 0.09, 0.08, 2000); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.26, "triangle", 0.055, i * 0.08)),
  shine: () => [1318, 1760, 2093].forEach((f, i) => tone(f, 0.18, "sine", 0.02, i * 0.05)),
};

function burst(el, n = 18) {
  if (RM() || !el) return;
  const box = h("span.sr-burst", { "aria-hidden": "true" });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, d = 50 + Math.random() * 60;
    box.append(h("i", { style: { "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, "--c": ["#FFC66B", "#F0A04B", "#5DD39E", "#9FB4FF", "#FF8FB1"][i % 5] } }));
  }
  el.append(box); setTimeout(() => box.remove(), 1200);
}
function shake() { if (RM() || !stageEl) return; stageEl.classList.remove("sr-shake"); void stageEl.offsetWidth; stageEl.classList.add("sr-shake"); }
/** Moves el into target, gliding from where it was (FLIP). */
function fly(el, target) {
  const a = el.getBoundingClientRect();
  target.append(el);
  if (RM()) return;
  const b = el.getBoundingClientRect();
  el.style.transition = "none"; el.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(1.15)`;
  void el.offsetWidth;
  el.style.transition = "transform .55s cubic-bezier(.2,.9,.25,1.15)"; el.style.transform = "";
}
/** A gold label that pops up pinned to an element. */
function tag(el, text, cls = "") { if (!el) return; const s = h("span.sr-tag" + cls, text); el.append(s); return s; }

// --- The player: runs, pauses, aborts ---------------------------------------------------------------------------------

const ABORT = Symbol("abort");
let run = 0, paused = false, started = false, idx = 0, topic = null, durations = {};
let rootEl = null, stageEl = null, sideEl = null, ctlEl = null, topEl = null;
let audio = null, pending = null; // the one voice <audio>, and the resolver of the line playing now

const alive = (tok) => { if (tok !== run) throw ABORT; };
/** A promise that may be left un-awaited when the visitor skips: its abort must not reach the console. */
const quiet = (p) => { p.catch(() => {}); return p; };
const wait = (ms, tok) => quiet(waitFor(ms, tok));
async function waitFor(ms, tok) {
  // Counts real time (timers slow down in background tabs), and only while not paused.
  let left = ms, last = performance.now();
  while (left > 0) {
    await new Promise((r) => setTimeout(r, Math.min(80, left)));
    alive(tok);
    const now = performance.now();
    if (!paused) left -= now - last;
    last = now;
  }
}
const est = (text) => Math.max(1800, plain(text).length * (lang() === "hi" ? 62 : 58) + 600);
const clipUrl = (key) => `/app/demo-voice/showreel/${key}-${lang()}.mp3`;
/** Plays one recorded line (or waits its length when the sound is off), showing its side comment. */
const say = (...a) => quiet(sayLine(...a));
async function sayLine(scene, i, tok, { help = false } = {}) {
  const s = LINES[scene], line = help ? s.help : s.lines[i];
  const key = `${scene}-${help ? "h" : i + 1}`;
  if (help) helpGlow(); else bubble(L(line));
  const ms = (durations[`${key}-${lang()}`] ?? 0) * 1000 || est(L(line));
  if (!soundOn()) { await wait(ms + 250, tok); return; }
  audio ??= new Audio();
  audio.src = clipUrl(key);
  const res = await new Promise((resolve) => {
    pending = resolve;
    audio.onended = () => resolve("end");
    audio.onerror = () => resolve("fail");
    if (!paused) audio.play().catch(() => resolve("fail"));
  });
  pending = null;
  alive(tok);
  if (res === "fail") await wait(ms, tok);
  else if (res?.left) await wait(res.left, tok);
  else await wait(120, tok);
}
function stopVoice() { try { audio?.pause(); } catch {} const p = pending; pending = null; p?.("abort"); }
/** Waits for a tap on one of `btns` or, after `ms`, picks `auto`. Resolves with the index. */
async function pick(btns, auto, ms, tok) {
  let chosen = -1;
  btns.forEach((b, i) => { b.disabled = false; b.onclick = () => { if (chosen < 0) { chosen = i; SFX.tap(); track("tour_tap", { scene: SCENES[idx].id }); } }; });
  let left = ms, last = performance.now();
  while (chosen < 0 && left > 0) { await new Promise((r) => setTimeout(r, 80)); alive(tok); const now = performance.now(); if (!paused) left -= now - last; last = now; }
  if (chosen < 0) chosen = auto;
  btns.forEach((b) => { b.onclick = null; b.disabled = true; });
  return chosen;
}

function setPaused(on) {
  paused = on;
  if (on) { try { audio?.pause(); } catch {} } else if (pending && soundOn()) audio?.play().catch(() => {});
  drawCtl();
}
function setSound(on) {
  X.store.set("tour:sound", on);
  track("tour_sound", { on });
  if (!on && pending) {
    const left = audio && isFinite(audio.duration) ? Math.max(0, (audio.duration - audio.currentTime) * 1000) : 1500;
    try { audio.pause(); } catch {}
    const p = pending; pending = null; p({ left });
  }
  drawTop();
}

// --- Frame ------------------------------------------------------------------------------------------------------------

const SCENES = [
  { id: "intro", play: sIntro }, { id: "guess", play: sGuess, need: "warmup" }, { id: "read", play: sRead, need: "read-3" },
  { id: "video", play: sVideo, need: "video-governor" }, { id: "gov", play: sGov, need: "sim-governor" }, { id: "sort", play: sSort, need: "sort" },
  { id: "gst", play: sGst, need: "sim-gst" }, { id: "pyq", play: sPyq, need: "pyq" }, { id: "mains", play: sMains, need: "mains" },
  { id: "desk", play: sDesk, need: "essay" }, { id: "essay", play: sEssay, need: "essay" }, { id: "cards", play: sCards, need: "keep" },
  { id: "pods", play: sPods }, { id: "chotu", play: sChotu }, { id: "variety", play: sVariety }, { id: "finale", play: sFinale },
];
let scenes = SCENES;
const step = (id) => topic.data.steps.find((s) => s.id === id);

export function view(arg = "") {
  const id = decodeURIComponent(String(arg).split("?")[0] || TOPICS[0]);
  if (!TOPICS.includes(id)) { location.replace("#try/" + encodeURIComponent(id)); return h("div"); }
  rootEl = h("div.sr", { role: "region", "aria-label": "Aspiran tour" }, h("p.sr-loading", t("loading")));
  css();
  document.documentElement.classList.add("sr-on");
  load(id).then((d) => {
    if (!rootEl.isConnected) return;
    if (!d) return put(rootEl, h("div.sr-loading", h("p", t("offline")), h("a.sr-btn", { href: location.hash, onclick: () => location.reload() }, "↻")));
    topic = d; hiOK = (d.languages ?? ["en"]).includes("hi");
    scenes = SCENES.filter((s) => !s.need || step(s.need));
    if (opened !== id) { opened = id; track("tour_open", {}); }
    build();
  });
  return rootEl;
}
let opened = null;
async function load(id) {
  try {
    const [r, dj] = await Promise.all([fetch(`/try/${encodeURIComponent(id)}`), fetch("/app/demo-voice/showreel/durations.json").then((x) => (x.ok ? x.json() : {})).catch(() => ({}))]);
    durations = dj ?? {};
    if (r.ok) { const d = await r.json(); X.store.set("try:data:" + id, d); return d; }
  } catch {}
  return X.store.get("try:data:" + id, null);
}
// Page listeners, set up only in a browser (the voice script imports LINES in node).
if (typeof window !== "undefined") {
addEventListener("hashchange", () => {
  if (/^#tour(\/|$)/.test(location.hash)) return;
  run++; stopVoice(); started = false; document.documentElement.classList.remove("sr-on");
});
addEventListener("keydown", (e) => {
  if (!rootEl?.isConnected || !started || e.target.closest?.("input, textarea, video")) return;
  if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
  else if (e.key === " " && !e.target.closest?.("button, a")) { e.preventDefault(); setPaused(!paused); }
});
document.addEventListener("visibilitychange", () => { if (document.hidden && started && !paused) setPaused(true); });
}

function build() {
  document.documentElement.lang = lang();
  topEl = h("header.sr-top");
  stageEl = h("div.sr-stage", { "aria-live": "off" });
  sideEl = h("aside.sr-side", { "aria-live": "polite" });
  ctlEl = h("nav.sr-ctl", { "aria-label": "Tour controls" });
  put(rootEl, h("div.sr-bg", { "aria-hidden": "true" }), topEl, h("main.sr-main", stageEl, sideEl), ctlEl);
  drawTop(); drawCtl();
  if (!started) cover(); else go(idx, true);
}
function drawTop() {
  if (!topEl) return;
  const fin = scenes[idx]?.id === "finale" && started;
  put(topEl,
    h("a.sr-logo", { href: lang() === "hi" ? "https://aspiran.in/hi/" : "https://aspiran.in/", "aria-label": "Aspiran" }, logo(), h("span", "Aspiran")),
    h("ol.sr-prog", { "aria-label": t("sceneOf", idx + 1, scenes.length) }, scenes.map((s, i) => h("li", h("button.sr-seg" + (i < idx ? ".done" : "") + (i === idx && started ? ".on" : ""),
      { type: "button", title: t("names")[s.id], "aria-label": t("names")[s.id], "aria-current": i === idx && started ? "step" : null, onclick: () => { if (!started) begin(soundOn()); go(i); } })))),
    hiOK && h("div.sr-lang", ["en", "hi"].map((l) => h("button" + (lang() === l ? ".on" : ""), { type: "button", "aria-pressed": String(lang() === l), lang: l,
      onclick: () => { if (lang() === l) return; X.store.set("try:lang", l); track("tour_lang", { lang: l }); build(); } }, l === "en" ? "EN" : "हिं"))),
    h("button.sr-icon", { type: "button", "aria-pressed": String(soundOn()), "aria-label": soundOn() ? t("soundOn") : t("soundOff"), title: soundOn() ? t("soundOn") : t("soundOff"),
      onclick: () => setSound(!soundOn()) }, icon(soundOn() ? "on" : "off", 20)),
    !fin && h("a.sr-pill", { href: "#", onclick: () => joining("top") }, t("join")));
}
function drawCtl() {
  if (!ctlEl) return;
  if (!started) return put(ctlEl);
  const last = idx >= scenes.length - 1, nx = scenes[idx + 1];
  put(ctlEl,
    h("button.sr-nav", { type: "button", disabled: idx === 0, onclick: () => go(idx - 1), "aria-label": t("back") }, icon("back", 22), h("span.sr-nav-l", t("back"))),
    h("button.sr-play", { type: "button", onclick: () => setPaused(!paused), "aria-label": paused ? t("resume") : t("pause") }, icon(paused ? "play" : "pause", 24)),
    last ? h("button.sr-nav.next", { type: "button", onclick: () => go(0), "aria-label": t("again") }, h("span.sr-nav-l", t("again")), icon("replay", 22))
      : h("button.sr-nav.next", { type: "button", onclick: () => go(idx + 1), "aria-label": `${t("next")}: ${t("names")[nx.id]}` },
        h("span.sr-nav-l", h("small", t("next")), t("names")[nx.id]), icon("next", 22)));
}
function logo() {
  const s = h("span.sr-mark");
  s.innerHTML = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M14 3c-2 3 2 4 0 7M20 2c-2 3 2 4 0 8M26 3c-2 3 2 4 0 7" fill="none" stroke="#F0A04B" stroke-width="2" stroke-linecap="round"/><path d="M5 15h30l-4.5 20.5a3 3 0 0 1-3 2.5H12.5a3 3 0 0 1-3-2.5z" fill="#C8693A"/><rect x="4" y="13" width="32" height="4.5" rx="2.2" fill="#E08A55"/></svg>`;
  return s;
}
function joining(where) {
  X.store.set("try:joining", { path: topic?.id ?? null, title: topic?.data?.short ?? topic?.data?.title ?? null, n: 0, lang: lang(), at: Date.now() });
  track("tour_join", { where, scene: scenes[idx]?.id });
  stopVoice();
}

/** The start screen: nothing plays until the visitor picks a way in. */
function cover() {
  put(sideEl);
  put(stageEl, h("section.sr-cover",
    h("div.sr-letter.top"), h("div.sr-letter.bot"),
    h("p.sr-kick", t("kick")),
    h("h1.sr-hero", { html: t("title") }),
    h("p.sr-topic", L(topic.data.title)),
    h("div.sr-start",
      h("button.sr-go", { type: "button", onclick: () => begin(true) }, h("span.sr-go-ic", icon("play", 30)), h("span", h("b", t("play")), h("small", t("playSub")))),
      h("button.sr-quiet", { type: "button", onclick: () => begin(false) }, t("silent")))));
}
function begin(sound) {
  started = true; X.store.set("tour:sound", sound);
  track("tour_start", { sound });
  // The first tap unlocks audio on phones: prime the voice element and the effects inside the gesture.
  if (sound) { try { audio ??= new Audio(); audio.muted = true; audio.play().catch(() => {}); audio.pause(); audio.muted = false; ac ??= new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.(); } catch {} }
  drawTop(); go(0);
}

function go(i, redraw = false) {
  if (i < 0 || i >= scenes.length) return;
  if (!started) started = true;
  const tok = ++run;
  stopVoice(); paused = false; idx = i;
  const sc = scenes[i];
  if (!redraw) track("tour_scene", { scene: sc.id, n: i + 1, of: scenes.length });
  drawTop(); drawCtl();
  put(sideEl);
  stageEl.className = "sr-stage sr-in";
  stageEl.dataset.scene = sc.id;
  void stageEl.offsetWidth;
  SFX.whoosh();
  const help = LINES[sc.id]?.help;
  const body = h("div.sr-body");
  put(stageEl, sc.id !== "intro" && sc.id !== "finale" && trophy(sc.id, help), body);
  stageEl.scrollTop = 0;
  sc.play(body, tok)
    .then(async () => {
      if (help) await say(sc.id, 0, tok, { help: true });
      if (sc.id === "finale") { track("tour_finish", {}); return; }
      await wait(700, tok);
      go(idx + 1);
    })
    .catch((e) => { if (e !== ABORT) console.warn("tour", e); });
}
/** The scene's title, shown like a trophy, and the plain line on how it helps. */
function trophy(id, help) {
  const n = scenes.findIndex((s) => s.id === id);
  setTimeout(() => SFX.shine(), 180);
  return h("div.sr-trophy",
    h("span.sr-medal", icon(id, 26)),
    h("div.sr-trophy-t", h("p.sr-kick", t("sceneOf", n, scenes.length - 2)), h("h2", h("span.sr-shine", t("names")[id]))),
    help && h("p.sr-help", h("b", t("helps")), " ", L(help)));
}
function helpGlow() { const el = stageEl.querySelector(".sr-help"); if (!el) return; el.classList.remove("glow"); void el.offsetWidth; el.classList.add("glow"); }
/** A side comment: the salesman's line pops in; the last two stay. */
function bubble(text) {
  const old = [...sideEl.children];
  old.forEach((b, i) => { b.classList.add("old"); if (old.length - i > 1) b.remove(); });
  const b = h("div.sr-bub", h("span.sr-host", { "aria-hidden": "true" }, icon("finale", 16)), h("p", text));
  sideEl.append(b);
}

// --- Scenes -----------------------------------------------------------------------------------------------------------

async function sIntro(body, tok) {
  put(body, h("section.sr-cover.playing",
    h("div.sr-letter.top"), h("div.sr-letter.bot"),
    h("p.sr-kick", L(topic.data.title)),
    h("h1.sr-hero", { html: t("title") }),
    h("div.sr-reel", t("trophies").slice(0, 11).map((n, i) => h("span", { style: { "--i": i } }, n)))));
  SFX.boom();
  await say("intro", 0, tok);
  await say("intro", 1, tok);
}

/** A question card with option buttons. */
function qcard(q, { label, cls = "" } = {}) {
  const opts = q.options.map((o, i) => h("button.sr-opt", { type: "button", disabled: true, style: { "--i": i } }, h("b", "ABCD"[i]), h("span", L(o))));
  const card = h("div.sr-q" + cls, label && h("p.sr-qlabel", label), h("p.sr-qtext", L(q.q)), h("div.sr-opts", opts));
  return { card, opts };
}
function mark(opts, chosen, answer) {
  opts.forEach((b, i) => b.classList.toggle("dim", i !== chosen && i !== answer));
  if (chosen !== answer) { opts[chosen].classList.add("bad"); SFX.wrong(); shake(); }
  opts[answer].classList.add("good"); if (chosen === answer) { SFX.right(); burst(opts[answer]); }
}

async function sGuess(body, tok) {
  const q = step("warmup").questions[0];
  const { card, opts } = qcard(q, { label: t("tapOr") });
  const why = h("p.sr-why");
  put(body, card, why);
  await say("guess", 0, tok);
  const c = await pick(opts, 1, 1900, tok);
  tag(opts[c], t("yourPick"), ".pick");
  await wait(350, tok);
  mark(opts, c, q.answer);
  put(why, L(q.why)); why.classList.add("in");
  await say("guess", 1, tok);
}

async function sRead(body, tok) {
  const st = step("read-3");
  const paras = L(st.body).split(/\n\n+/).slice(0, 3).map((p) => {
    const m = p.match(/^\*\*(.+?)\*\*\s*(.*)$/s);
    const rest = (m ? m[2] : p).split(/(?<=[.)])\s+(?=[A-Zऀ-ॿ])/)[0];
    return h("p.sr-para", m && h("strong", m[1]), " ", rest);
  });
  const text = h("div.sr-text", h("h3", L(st.title)), paras);
  const chk = st.check?.[0];
  const { card, opts } = chk ? qcard(chk, { label: t("folded"), cls: ".hidden" }) : { card: null, opts: [] };
  put(body, h("div.sr-read", text, card));
  const go1 = say("read", 0, tok);
  for (const p of paras) { await wait(900, tok); p.classList.add("lit"); SFX.tick(); }
  await go1;
  text.classList.add("fold"); SFX.whoosh();
  await wait(500, tok);
  if (card) {
    card.classList.remove("hidden");
    const sp = say("read", 1, tok);
    await wait(1700, tok);
    mark(opts, chk.answer, chk.answer); tag(opts[chk.answer], t("fromMemory"), ".ok");
    await sp;
  } else await say("read", 1, tok);
}

async function sVideo(body, tok) {
  const st = step("video-governor"), v = st.video;
  const q = st.questions?.find((x) => x.fromVideo) ?? st.questions?.[0];
  const caps = L(v.transcript).split(/(?<=[.?!।])\s+/).slice(0, 5);
  const cap = h("p.sr-cap");
  const screen = h("div.sr-screen", h("img", { src: v.poster, alt: "" }), cap);
  const playBtn = h("button.sr-vplay", { type: "button", onclick: () => watch() }, icon("play", 22), h("span", t("watch")), h("small", t("secs", v.seconds ?? 52)));
  const frame = h("div.sr-film", screen, playBtn);
  const { card, opts } = q ? qcard(q, { label: t("endsOn"), cls: ".hidden.compact" }) : { card: null, opts: [] };
  put(body, h("div.sr-video", frame, card));
  function watch() {
    track("tour_video", {});
    setPaused(true);
    const el = h("video", { controls: true, playsinline: true, preload: "auto", poster: v.poster, "aria-label": L(v.title) },
      h("source", { src: v.mp4, type: "video/mp4" }), v.vtt && h("track", { kind: "captions", src: v.vtt, srclang: "en", label: "English", default: true }));
    el.addEventListener("ended", () => { if (rootEl.isConnected && paused) setPaused(false); });
    put(screen, el); playBtn.remove();
    el.play?.()?.catch?.(() => {});
  }
  // The transcript ticks by as captions while the line plays; it stops when the line ends.
  let spoke = false;
  const sp = quiet(say("video", 0, tok).finally(() => { spoke = true; }));
  for (const c of caps) {
    if (spoke || !cap.isConnected) break;
    cap.textContent = c; cap.classList.remove("in"); void cap.offsetWidth; cap.classList.add("in");
    await Promise.race([wait(Math.min(3200, Math.max(1800, c.length * 45)), tok), sp]);
  }
  await sp;
  if (card) {
    frame.classList.add("small"); card.classList.remove("hidden"); SFX.whoosh();
    const sp2 = say("video", 1, tok);
    await wait(1600, tok);
    mark(opts, q.answer, q.answer);
    await sp2;
  } else await say("video", 1, tok);
}

async function sGov(body, tok) {
  const st = step("sim-governor"), r = st.rounds[0];
  const stamp = h("span.sr-stamp.in", L(r.stamp));
  const paper = h("div.sr-bill", h("p.sr-bill-h", t("bill")), h("p.sr-bill-t", L(r.bill)), h("div.sr-bill-lines", h("i"), h("i"), h("i.s")), stamp);
  const btns = r.options.map((o) => h("button.sr-choice", { type: "button", disabled: true }, L(o.label)));
  const res = h("p.sr-why");
  put(body, h("div.sr-gov", paper, h("div.sr-choices", h("p.sr-qlabel", t("tapOr")), btns), res));
  setTimeout(() => SFX.stamp(), RM() ? 0 : 500);
  await say("gov", 0, tok);
  const c = await pick(btns, 1, 1900, tok);
  btns.forEach((b, i) => b.classList.toggle(i === c ? "on" : "dim", true));
  const big = h("span.sr-stamp.big" + (r.options[c].ok ? "" : ".no"), r.options[c].ok ? t("allowed") : "✕");
  paper.append(big); SFX.stamp(); shake();
  put(res, L(r.options[c].result)); res.classList.add("in");
  await say("gov", 1, tok);
}

async function sSort(body, tok) {
  const st = step("sort"), items = st.items.slice(0, 6);
  const bins = st.buckets.map((b) => h("div.sr-bin", h("p", L(b)), h("div.sr-bin-in")));
  const chips = items.map((it) => h("span.sr-chip", L(it.text)));
  put(body, h("div.sr-sort", h("div.sr-tray", chips), h("div.sr-bins", bins)));
  const sp = say("sort", 0, tok);
  await wait(900, tok);
  for (let i = 0; i < items.length; i++) {
    fly(chips[i], bins[items[i].bucket].lastChild); SFX.drop();
    setTimeout(() => chips[i].classList.add("ok"), RM() ? 0 : 500);
    await wait(650, tok);
  }
  await sp;
  bins.forEach((b) => b.classList.add("done")); SFX.right();
  const trap = items.find((x) => /prison|जेल/i.test(L(x.text))) ?? items[1];
  const tg = tag(chips[items.indexOf(trap)], "!", ".warn");
  await say("sort", 1, tok);
  tg?.remove();
}

async function sGst(body, tok) {
  const st = step("sim-gst"), n = st.states ?? 31;
  const seats = Array.from({ length: n }, () => h("i.sr-seat"));
  const centre = h("div.sr-centre", h("b", t("centreW")), h("span", "⅓"));
  const fill = h("div.sr-meter-fill"), pct = h("b.sr-pct", "0%");
  const verdict = h("div.sr-verdict");
  put(body, h("div.sr-gst",
    h("div.sr-house", centre, h("div.sr-seats", h("p", t("statesW"), " · ⅔"), h("div.sr-grid", seats))),
    h("div.sr-meter", fill, h("span.sr-line", h("small", t("need")))), h("p.sr-meter-l", pct, " ", t("weight")), verdict));
  const sp = say("gst", 0, tok);
  await wait(1400, tok);
  for (let i = 0; i < n; i++) {
    seats[i].classList.add("yes");
    const p = ((i + 1) / n) * (200 / 3);
    fill.style.width = p + "%"; pct.textContent = Math.round(p * 10) / 10 + "%";
    if (i % 3 === 0) SFX.tick();
    await wait(RM() ? 0 : 70, tok);
  }
  await wait(500, tok);
  centre.classList.add("no"); SFX.wrong();
  await sp;
  put(verdict, h("span.sr-stamp.big.no", t("blocked"))); SFX.stamp(); shake();
  await say("gst", 1, tok);
}

async function sPyq(body, tok) {
  const st = step("pyq"), q = st.questions[0];
  const conf = t("sure").map((s) => h("span.sr-conf", s));
  const { card, opts } = qcard(q, { label: `${q.source?.label ?? "Prelims"} · ${t("key")}` });
  const why = h("p.sr-why");
  // The confidence question comes only after an answer is picked (owner, Nov 2026).
  const confRow = h("div.sr-confrow.hidden", h("small", t("howSure")), conf);
  put(body, h("div.sr-pyq", card, confRow, why));
  const wrong = q.answer === 2 ? 1 : 2;
  const sp = say("pyq", 0, tok);
  await wait(1500, tok);
  opts[wrong].classList.add("picked"); SFX.tap();
  const yp = tag(opts[wrong], t("yourPick"), ".pick");
  await wait(900, tok);
  confRow.classList.remove("hidden"); SFX.whoosh();
  await wait(1100, tok);
  conf[0].classList.add("on"); SFX.tap();
  await sp;
  yp?.remove();
  opts[wrong].classList.add("bad"); SFX.wrong(); shake();
  const minus = tag(opts[wrong], t("minus"), ".bad");
  const sp2 = say("pyq", 1, tok);
  await wait(2600, tok);
  await sp2;
  minus?.remove(); opts[wrong].classList.add("dim");
  tag(card, t("oneMore"), ".pick");
  await wait(600, tok);
  opts[q.answer].classList.add("good"); SFX.right(); burst(opts[q.answer]);
  put(why, L(q.why)); why.classList.add("in");
  await say("pyq", 2, tok);
}

async function sMains(body, tok) {
  const st = step("mains"), q = st.questions[0], sk = q.skeleton;
  const rows = [["intro", t("intro"), sk.intro], ...sk.points.map((p, i) => ["p" + i, String(i + 1), p]), ["way", t("way"), sk.wayForward]];
  const list = h("ol.sr-plan");
  put(body, h("div.sr-mains", h("div.sr-mq", h("p.sr-qlabel", `${q.source?.label ?? "Mains"} · ${t("marks", q.marks, q.words)}`), h("p.sr-qtext.sm", L(q.q))), list));
  const why = WHY[lang()] ?? WHY.en;
  const sp = say("mains", 0, tok);
  let sp2 = null;
  for (let i = 0; i < rows.length; i++) {
    const [k, n, txt] = rows[i];
    [...list.children].forEach((li) => li.classList.remove("new"));
    const body2 = h("span.sr-pt-t");
    const li = h("li.sr-pt.new", h("b.sr-pt-n", n), h("div", body2, why[k] && h("span.sr-pt-why", why[k])));
    list.append(li);
    const words = L(txt).split(" ");
    for (let w = 0; w < words.length; w += 3) { body2.textContent = words.slice(0, w + 3).join(" "); await wait(RM() ? 0 : 60, tok); }
    SFX.tick();
    if (i === 1) { await sp; sp2 = say("mains", 1, tok); }
    await wait(700, tok);
  }
  await (sp2 ?? say("mains", 1, tok));
}

/** A handwritten page: lines, strikes, margin notes as they're shown. */
function paper(snap, cls = "") {
  return h("div.sr-paper" + cls, snap.lines.map((ln) => {
    const text = typeof ln === "string" ? ln : ln.t;
    return h("p.sr-ln" + (typeof ln === "object" && ln?.strike === true ? ".strike" : ""), h("span", text));
  }));
}
async function sDesk(body, tok) {
  const st = step("essay"), snap = st.snaps[0];
  const page = paper(snap);
  const flash = h("div.sr-flash"), scan = h("div.sr-scan");
  const phone = h("div.sr-cam", page, scan, flash, h("span.sr-corner.a"), h("span.sr-corner.b"), h("span.sr-corner.c"), h("span.sr-corner.d"));
  const legend = h("div.sr-legend", t("legend").map(([k, v]) => h("span", h("b.k" + k, k), v)));
  put(body, h("div.sr-desk", phone, h("div.sr-deskside", legend, h("p.sr-small", t("madeFor")))));
  const sp = say("desk", 0, tok);
  await wait(2600, tok);
  flash.classList.add("go"); SFX.shutter();
  await wait(300, tok);
  phone.classList.add("snapped"); scan.classList.add("go");
  await sp;
  const sp2 = say("desk", 1, tok);
  const lines = page.children;
  for (const n of snap.notes ?? []) {
    await wait(1300, tok);
    const ln = lines[n.line]; if (!ln) continue;
    ln.classList.add("hit", n.kind === "good" ? "good" : "fix");
    ln.append(h("span.sr-margin.k" + (n.level ?? "S"), h("b", n.level ?? "S"), L(n.text).replace(/^[SCE] · /, "")));
    SFX.tap();
  }
  await sp2;
}

async function sEssay(body, tok) {
  const st = step("essay");
  const fan = h("div.sr-fan", st.snaps.slice(0, 3).map((s, i) => h("div.sr-snap", { style: { "--i": i, "--r": `${(i - 1) * 6}deg` } },
    paper(s, ".mini"), h("p.sr-snap-l", h("b", String(i + 1)), L(s.name)), h("span.sr-snap-n", t("notes", s.notes?.length ?? 0)))));
  put(body, h("div.sr-essay", h("p.sr-quote", L(st.topic)), fan));
  const sp = say("essay", 0, tok);
  for (const s of fan.children) { await wait(800, tok); s.classList.add("in"); SFX.flip(); }
  await sp;
  fan.classList.add("lit"); SFX.shine(); burst(fan.lastChild, 14);
  await say("essay", 1, tok);
}

async function sCards(body, tok) {
  const st = step("keep"), c = st.cards[0];
  const card = h("button.sr-card", { type: "button", "aria-label": t("flip") },
    h("div.sr-card-in", h("div.sr-face.front", h("p.sr-qlabel", t("front")), h("p.sr-qtext.sm", L(c.q)), h("small", t("flip"))),
      h("div.sr-face.back", h("p.sr-small.q", L(c.q)), h("p.sr-ans", L(c.options[c.answer])), h("p.sr-small", L(c.why)))));
  const sched = h("div.sr-sched",
    h("div.sr-path.miss", h("b", t("missed")), h("span.sr-arrow"), h("span.sr-when", t("tomorrow"))),
    h("div.sr-path.knew", h("b", t("knew")), h("span.sr-arrow.long"), h("span.sr-when", t("later"))));
  put(body, h("div.sr-cards", card, sched));
  let flipped = false;
  const doFlip = () => { if (flipped) return; flipped = true; card.classList.add("flipped"); SFX.flip(); };
  card.addEventListener("click", doFlip);
  const sp = say("cards", 0, tok);
  await wait(3200, tok); doFlip();
  await sp;
  const sp2 = say("cards", 1, tok);
  await wait(400, tok); sched.children[0].classList.add("in"); SFX.drop();
  await wait(2200, tok); sched.children[1].classList.add("in"); SFX.drop();
  await sp2;
}

async function sPods(body, tok) {
  const cols = ["#F0A04B", "#5DD39E", "#9FB4FF", "#FF8FB1", "#FFC66B", "#7FD6E0", "#C9A0FF"];
  const ring = h("div.sr-ring", h("div.sr-ring-c", h("b", t("pod")), h("small", t("podSize"))),
    cols.map((c, i) => h("span.sr-av", { style: { "--i": i, "--n": cols.length, "--c": c } }, h("i"))));
  const acts = h("div.sr-acts", t("podActs").map((a) => h("span.sr-act", a)));
  put(body, h("div.sr-pods", ring, h("div.sr-podside", acts, h("p.sr-noscore", t("noScores")), h("p.sr-small", t("illus")))));
  const sp = say("pods", 0, tok);
  await wait(500, tok); ring.classList.add("in"); SFX.whoosh();
  await sp;
  const sp2 = say("pods", 1, tok);
  for (const a of acts.children) { await wait(700, tok); a.classList.add("in"); SFX.tap(); }
  await sp2;
}

async function sChotu(body, tok) {
  const cup = h("div.sr-chotu-cup", kulhad("warm", 96));
  const chat = h("div.sr-chat");
  put(body, h("div.sr-chotu", h("div.sr-chotu-l", cup, h("p.sr-chotu-n", t("buddy"))), chat, h("p.sr-quiet-chip", t("quiet"))));
  const sp = say("chotu", 0, tok);
  await wait(1600, tok);
  chat.append(h("p.sr-msg.me", t("chotuQ"))); SFX.tap();
  await sp;
  const sp2 = say("chotu", 1, tok);
  await wait(300, tok);
  const typing = h("p.sr-msg.him.typing", h("i"), h("i"), h("i")); chat.append(typing);
  await wait(1100, tok);
  typing.replaceWith(h("p.sr-msg.him", t("chotuA"))); SFX.right();
  await sp2;
}

async function sVariety(body, tok) {
  const names = t("trophies"), ics = ["guess", "read", "video", "gov", "pyq", "mains", "desk", "essay", "cards", "pods", "chotu", "read", "pyq", "sort"];
  const tiles = names.map((n, i) => h("div.sr-tile", h("span.sr-medal.sm", icon(ics[i], 18)), h("span", n)));
  put(body, h("div.sr-variety", h("h2.sr-big", { html: t("oneTopic") }), h("div.sr-tiles", tiles)));
  const sp = say("variety", 0, tok);
  for (const tl of tiles) { await wait(RM() ? 0 : 260, tok); tl.classList.add("in"); SFX.tick(); }
  SFX.win();
  await sp;
}

async function sFinale(body, tok) {
  const id = topic.id;
  const plan = (cls, name, price, list, note) => h("div.sr-plan-c" + cls, h("p.sr-plan-n", name), price, h("ul", list.map((x) => h("li", icon("check", 16), x))), note && h("p.sr-small", note));
  const joinBtn = h("a.sr-join", { href: "#", onclick: () => joining("finale") }, t("join"), icon("next", 22));
  put(body, h("section.sr-fin",
    h("h1.sr-hero.fin", { html: t("finTitle") }),
    h("div.sr-plans",
      plan(".free", t("free"), h("p.sr-price", "₹0"), t("freeList")),
      plan(".plus", t("plus"), h("p.sr-price", "₹3,999", h("small", t("perYear")), h("span", t("perDay"))), t("plusList"), t("plusNote"))),
    h("div.sr-cta", joinBtn, h("p.sr-small", t("noCard"))),
    h("div.sr-after", h("button.sr-link", { type: "button", onclick: () => go(0) }, icon("replay", 16), t("again")),
      h("a.sr-link", { href: "#try/" + encodeURIComponent(id), onclick: () => track("tour_try", {}) }, t("yourself"), " →"))));
  SFX.win(); burst(joinBtn, 22);
  await say("finale", 0, tok);
  await say("finale", 1, tok);
  joinBtn.classList.add("pulse");
  await say("finale", 2, tok);
}

// --- Styles -----------------------------------------------------------------------------------------------------------

let styled = false;
function css() {
  if (styled) return; styled = true;
  const s = document.createElement("style");
  s.textContent = `
html.sr-on, html.sr-on body { overflow: hidden; height: 100%; overscroll-behavior: none; }
.sr { --bg: #070A18; --card: #121836; --card2: #1A2150; --line: #2A3366; --ink: #F4F1FA; --muted: #AEB4D6; --sun: #F0A04B; --gold: #FFC66B;
  --ok: #5DD39E; --bad: #FF7A6B; --on-sun: #1B1205; --top: 56px; --ctl: 76px;
  position: fixed; inset: 0; z-index: 50; background: var(--bg); color: var(--ink); color-scheme: dark; font-size: 16px; line-height: 1.45; overflow: hidden; }
.sr * { box-sizing: border-box; }
:where(.sr) button { font: inherit; color: inherit; cursor: pointer; }
.sr-bg { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(1000px 520px at 20% -10%, #2B2470aa, transparent 70%), radial-gradient(800px 500px at 100% 110%, #6B3A1866, transparent 70%),
    radial-gradient(circle at 50% 50%, transparent 55%, #000a 100%); }
.sr-loading { display: grid; place-items: center; height: 100%; color: var(--muted); gap: 12px; text-align: center; padding: 24px; }
.sr-ic { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

/* Top bar */
.sr-top { position: absolute; top: 0; left: 0; right: 0; height: var(--top); display: flex; align-items: center; gap: 12px; padding: 0 16px;
  background: #070A18e6; border-bottom: 1px solid #ffffff14; z-index: 5; backdrop-filter: blur(8px); }
.sr-logo { display: flex; align-items: center; gap: 8px; color: var(--ink); text-decoration: none; font-family: var(--head-font, Georgia); font-weight: 800; font-size: 18px; flex: none; }
.sr-mark svg { width: 28px; height: 28px; display: block; }
.sr-prog { flex: 1; display: flex; gap: 4px; list-style: none; margin: 0; padding: 0; min-width: 0; }
.sr-prog li { flex: 1; min-width: 0; }
.sr-seg { display: block; width: 100%; height: 22px; border: 0; background: none; padding: 9px 0; }
.sr-seg::before { content: ""; display: block; height: 4px; border-radius: 4px; background: #ffffff22; transition: background .3s; }
.sr-seg.done::before { background: var(--sun); opacity: .8; }
.sr-seg.on::before { background: var(--gold); box-shadow: 0 0 12px #FFC66Bc0; }
.sr-lang { display: flex; border: 1px solid #ffffff2a; border-radius: 99px; overflow: hidden; flex: none; }
.sr-lang button { background: none; border: 0; padding: 6px 11px; min-height: 36px; font-size: 14px; color: var(--muted); }
.sr-lang button.on { background: #ffffff1c; color: var(--ink); font-weight: 700; }
.sr-icon { flex: none; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 99px; background: #ffffff10; border: 1px solid #ffffff22; }
.sr-icon[aria-pressed="true"] { color: var(--gold); border-color: #FFC66B88; }
.sr-pill { flex: none; background: var(--sun); color: var(--on-sun); font-weight: 800; text-decoration: none; padding: 9px 16px; border-radius: 99px; white-space: nowrap; font-size: 14px; }

/* Main: stage + side comments */
.sr-main { position: absolute; top: var(--top); bottom: var(--ctl); left: 0; right: 0; display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px;
  padding: 18px 24px 12px; max-width: 1320px; margin: 0 auto; }
.sr-stage { min-height: 0; overflow: hidden; position: relative; display: flex; flex-direction: column; gap: 14px; }
.sr-stage[data-scene=intro] { grid-column: 1 / -1; }
.sr-main:has(.sr-stage[data-scene=intro]) .sr-side { position: absolute; right: 24px; bottom: 12px; width: 340px; }
.sr-main:has(.sr-cover:not(.playing)) { grid-template-columns: 1fr; }
.sr-body { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: safe center; }
.sr-in { animation: srIn .6s cubic-bezier(.2,.8,.2,1); }
@keyframes srIn { from { opacity: 0; transform: scale(1.05); filter: blur(8px); } }
.sr-shake { animation: srShake .4s; }
@keyframes srShake { 20% { transform: translate(-6px, 2px); } 40% { transform: translate(5px, -3px); } 60% { transform: translate(-3px, 1px); } 80% { transform: translate(2px, 0); } }

.sr-side { display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; min-height: 0; overflow: hidden; }
.sr-bub { position: relative; display: flex; gap: 10px; align-items: flex-start; background: linear-gradient(160deg, #FFF6E3, #FFE2B0); color: #2A1B12; border-radius: 18px 18px 18px 4px;
  padding: 12px 14px; font-weight: 700; font-size: 17px; line-height: 1.4; box-shadow: 0 10px 30px #0008, 0 0 0 2px #FFC66B; transform-origin: 0 100%;
  animation: srPop .5s cubic-bezier(.2,1.6,.4,1); transition: opacity .3s, transform .3s; }
.sr-bub p { margin: 0; }
.sr-bub.old { opacity: .5; transform: scale(.94); font-size: 15px; box-shadow: none; }
.sr-host { flex: none; width: 28px; height: 28px; border-radius: 99px; background: #2A1B12; color: var(--gold); display: grid; place-items: center; }
.sr-host .sr-ic { fill: currentColor; stroke: none; }
@keyframes srPop { from { opacity: 0; transform: scale(.6) rotate(-4deg) translateY(20px); } }

/* Bottom controls: always on top, never covered */
.sr-ctl { position: absolute; left: 0; right: 0; bottom: 0; height: var(--ctl); display: flex; align-items: center; justify-content: center; gap: 12px; padding: 0 16px;
  background: #070A18f2; border-top: 1px solid #ffffff18; z-index: 6; padding-bottom: env(safe-area-inset-bottom); }
.sr-nav { display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 18px; border-radius: 99px; background: #ffffff12; border: 1px solid #ffffff2a; font-weight: 700; }
.sr-nav:disabled { opacity: .35; cursor: default; }
.sr-nav.next { background: var(--ink); color: var(--bg); border-color: var(--ink); min-width: 220px; justify-content: space-between; }
.sr-nav-l { display: flex; flex-direction: column; line-height: 1.15; text-align: left; }
.sr-nav-l small { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; opacity: .7; font-weight: 700; }
.sr-play { width: 56px; height: 56px; border-radius: 99px; display: grid; place-items: center; background: var(--sun); color: var(--on-sun); border: 0; box-shadow: 0 0 24px #F0A04B66; }
.sr-play .sr-ic, .sr-go-ic .sr-ic, .sr-vplay .sr-ic { fill: currentColor; stroke: none; }
.sr button:focus-visible, .sr a:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }

/* Trophy title */
.sr-trophy { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; align-items: center; flex: none; }
.sr-medal { width: 56px; height: 56px; border-radius: 99px; display: grid; place-items: center; color: #2A1B12; grid-row: span 1;
  background: radial-gradient(circle at 35% 30%, #FFF1C9, #FFC66B 45%, #C8862E); box-shadow: 0 0 0 3px #FFC66B44, 0 8px 28px #FFC66B55; animation: srMedal .7s cubic-bezier(.2,1.5,.4,1); }
.sr-medal.sm { width: 34px; height: 34px; box-shadow: none; animation: none; }
@keyframes srMedal { from { transform: scale(.3) rotate(-90deg); opacity: 0; } }
.sr-trophy-t .sr-kick { margin: 0; }
.sr-trophy h2 { margin: 0; font-family: var(--head-font, Georgia); font-weight: 800; font-size: clamp(26px, 3.4vw, 40px); line-height: 1.1; color: var(--ink); }
.sr-shine { background: linear-gradient(100deg, var(--ink) 40%, #FFE7A8 50%, var(--ink) 60%) 0 0 / 250% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: srShine 1.6s .2s ease-out both; }
@keyframes srShine { from { background-position: 100% 0; } to { background-position: 0 0; } }
.sr-help { grid-column: 1 / -1; margin: 6px 0 0; padding: 8px 12px; border-left: 4px solid var(--gold); background: #FFC66B14; border-radius: 0 10px 10px 0; font-size: 15.5px; color: var(--ink); }
.sr-help b { color: var(--gold); font-size: 12px; text-transform: uppercase; letter-spacing: .07em; display: block; }
.sr-help.glow { animation: srGlow 1.4s; }
@keyframes srGlow { 30% { background: #FFC66B40; box-shadow: 0 0 30px #FFC66B55; } }
.sr-kick { color: var(--gold); font-size: 12.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; margin: 0; }

/* Cover and intro */
.sr-cover { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px; padding: 40px 16px; }
.sr-letter { position: absolute; left: -24px; right: -24px; height: 28px; background: #000; }
.sr-letter.top { top: -18px; } .sr-letter.bot { bottom: -12px; }
.sr-cover.playing .sr-letter { animation: srBars 1.2s ease-out; }
@keyframes srBars { from { height: 50%; } }
.sr-hero { font-family: var(--head-font, Georgia); font-weight: 800; font-size: clamp(34px, 6vw, 72px); line-height: 1.05; margin: 0; max-width: 16ch; color: var(--ink); }
html[lang=hi] .sr-hero, html[lang=hi] .sr-big { line-height: 1.32; }
html[lang=hi] .sr-trophy h2 { line-height: 1.3; }
.sr-hero em { font-style: normal; color: var(--gold); text-shadow: 0 0 30px #FFC66B66; }
.sr-cover .sr-hero { animation: srRise .9s cubic-bezier(.2,.8,.2,1) both; }
@keyframes srRise { from { opacity: 0; transform: translateY(30px) scale(.96); letter-spacing: .04em; } }
.sr-topic { color: var(--muted); margin: 0; font-size: 18px; }
.sr-start { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 16px; }
.sr-go { display: flex; align-items: center; gap: 14px; padding: 14px 28px 14px 14px; border-radius: 99px; border: 0; background: var(--sun); color: var(--on-sun); text-align: left;
  box-shadow: 0 0 0 6px #F0A04B33, 0 16px 40px #F0A04B55; animation: srBeat 2.4s ease-in-out infinite; }
.sr-go b { display: block; font-size: 22px; } .sr-go small { font-size: 13px; font-weight: 700; opacity: .75; }
.sr-go-ic { width: 54px; height: 54px; border-radius: 99px; background: var(--on-sun); color: var(--gold); display: grid; place-items: center; }
@keyframes srBeat { 50% { box-shadow: 0 0 0 14px #F0A04B14, 0 16px 40px #F0A04B55; } }
.sr-quiet { background: none; border: 0; color: var(--muted); text-decoration: underline; text-underline-offset: 3px; min-height: 44px; padding: 0 12px; }
.sr-reel { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 760px; }
.sr-reel span { padding: 6px 12px; border-radius: 99px; border: 1px solid #FFC66B55; color: var(--gold); font-size: 14px; font-weight: 700; animation: srPop .5s calc(var(--i) * .12s + .6s) both cubic-bezier(.2,1.6,.4,1); }

/* Shared bits */
.sr-q { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 16px 18px; position: relative; transition: opacity .4s, transform .4s; }
.sr-q.hidden { opacity: 0; transform: translateY(24px); pointer-events: none; height: 0; padding: 0; border: 0; overflow: hidden; }
.sr-qlabel { margin: 0 0 6px; color: var(--gold); font-size: 13px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.sr-qtext { margin: 0 0 12px; font-size: clamp(17px, 1.7vw, 21px); font-weight: 700; white-space: pre-line; }
.sr-qtext.sm { font-size: 16.5px; }
.sr-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sr-opt { position: relative; display: flex; gap: 10px; align-items: center; text-align: left; padding: 10px 12px; min-height: 48px; border-radius: 12px; background: var(--card2); border: 2px solid transparent;
  transition: background .3s, border-color .3s, opacity .3s, transform .3s; animation: srPop .45s calc(var(--i) * .08s) both; }
.sr-opt:not(:disabled):hover { border-color: var(--gold); transform: translateY(-2px); }
.sr-opt:disabled, .sr-choice:disabled { cursor: default; color: var(--ink); }
.sr-opt b { flex: none; width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; background: #ffffff14; font-size: 13px; }
.sr-opt.good { background: #5DD39E26; border-color: var(--ok); } .sr-opt.good b { background: var(--ok); color: #062014; }
.sr-opt.bad { background: #FF7A6B22; border-color: var(--bad); } .sr-opt.bad b { background: var(--bad); color: #2a0703; }
.sr-opt.dim { opacity: .4; }
.sr-why { margin: 12px 0 0; padding: 12px 14px; border-radius: 12px; background: #5DD39E14; border: 1px solid #5DD39E44; opacity: 0; transform: translateY(10px); transition: .4s; font-size: 15.5px; }
.sr-why.in { opacity: 1; transform: none; }
.sr-why:empty { display: none; }
.sr-tag { position: absolute; top: -12px; right: 10px; background: var(--gold); color: #2A1B12; font-size: 12px; font-weight: 800; padding: 3px 9px; border-radius: 99px; white-space: nowrap; z-index: 2;
  animation: srPop .45s cubic-bezier(.2,1.6,.4,1); box-shadow: 0 6px 16px #0007; }
.sr-tag.bad { right: auto; left: 8px; white-space: nowrap; }
.sr-tag.ok { background: var(--ok); color: #062014; } .sr-tag.bad { background: var(--bad); color: #2a0703; } .sr-tag.warn { background: var(--bad); color: #2a0703; right: -6px; top: -10px; }
.sr-small { font-size: 13px; color: var(--muted); margin: 6px 0 0; }
.sr-stamp { position: absolute; font-family: var(--head-font, Georgia); font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #1F6E4A; border: 3px solid currentColor; border-radius: 10px;
  padding: 4px 12px; transform: rotate(-8deg); background: #ffffffaa; white-space: nowrap; }
.sr-stamp.in { right: 14px; bottom: 14px; font-size: 13px; animation: srStamp .5s .5s both cubic-bezier(.2,1.3,.4,1); }
.sr-stamp.big { left: 50%; top: 62%; font-size: clamp(30px, 5vw, 52px); transform: translate(-50%, -50%) rotate(-10deg); animation: srStampBig .45s cubic-bezier(.2,1.3,.4,1); color: #17804F; background: #F5FFF8dd; }
.sr-stamp.big.no { color: #C0392B; background: #FFF4F2dd; }
@keyframes srStamp { from { transform: scale(3) rotate(-20deg); opacity: 0; } }
@keyframes srStampBig { from { transform: translate(-50%, -50%) scale(3) rotate(-25deg); opacity: 0; } }

/* Read */
.sr-read { display: flex; flex-direction: column; gap: 12px; }
.sr-text { background: #FBF6EC; color: #22201C; border-radius: 16px; padding: 16px 20px; max-height: 1000px; transition: max-height .6s, opacity .6s, transform .6s, filter .6s; overflow: hidden; }
.sr-text h3 { margin: 0 0 8px; font-size: 18px; color: #22201C; }
.sr-para { margin: 0 0 8px; font-size: 15.5px; transition: background .4s; border-radius: 6px; padding: 2px 4px; }
.sr-para strong { color: #7A3418; }
.sr-para.lit { background: #FFE39A; }
.sr-text.fold { max-height: 0; opacity: 0; padding: 0 20px; transform: scaleY(.6) translateY(-30px); filter: blur(6px); }

/* Video */
.sr-video { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.sr-film { position: relative; width: min(100%, 720px); transition: width .6s; }
.sr-film.small { width: min(100%, 420px); }
.sr-screen { position: relative; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; background: #000; box-shadow: 0 0 0 1px #ffffff22, 0 30px 80px #000c, 0 0 60px #9FB4FF33; }
.sr-screen img, .sr-screen video { width: 100%; height: 100%; object-fit: cover; display: block; }
.sr-screen img { animation: srKen 14s ease-out both; }
@keyframes srKen { from { transform: scale(1.12); } }
.sr-cap { position: absolute; left: 8%; right: 8%; bottom: 8%; margin: 0; text-align: center; font-weight: 700; font-size: clamp(14px, 1.6vw, 18px); background: #000c; padding: 6px 10px; border-radius: 8px; opacity: 0; }
.sr-cap.in { animation: srCap .4s both; } .sr-cap:empty { display: none; }
@keyframes srCap { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }
.sr-vplay { position: absolute; left: 14px; top: 14px; display: flex; align-items: center; gap: 8px; border: 0; padding: 8px 14px 8px 10px; border-radius: 99px; background: #ffffffee; color: #111; font-weight: 800; }
.sr-vplay small { font-weight: 600; opacity: .65; }
.sr-video .sr-q { width: min(100%, 720px); }
.sr-q.compact .sr-opts { grid-template-columns: repeat(4, 1fr); }

/* Governor */
.sr-gov { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.sr-bill { position: relative; background: #FBF6EC; color: #22201C; border-radius: 6px; padding: 18px 20px 24px; min-height: 220px; box-shadow: 0 20px 50px #000a; transform: rotate(-1.5deg);
  animation: srSlide .7s cubic-bezier(.2,.9,.3,1.1); }
@keyframes srSlide { from { transform: translateX(-60px) rotate(-12deg); opacity: 0; } }
.sr-bill-h { margin: 0; font-family: var(--head-font, Georgia); font-weight: 800; letter-spacing: .2em; color: #7A3418; }
.sr-bill-t { margin: 10px 0; font-size: 17px; font-weight: 700; }
.sr-bill { padding-bottom: 56px; }
.sr-bill-lines i { display: block; height: 7px; border-radius: 4px; background: #00000014; margin: 9px 0; } .sr-bill-lines i.s { width: 60%; }
.sr-choices { display: flex; flex-direction: column; gap: 8px; }
.sr-choice { text-align: left; padding: 12px 16px; min-height: 52px; border-radius: 14px; background: var(--card2); border: 2px solid var(--line); font-weight: 700; font-size: 16px; transition: .3s; }
.sr-choice:not(:disabled):hover { border-color: var(--gold); }
.sr-choice.on { border-color: var(--gold); background: #FFC66B22; } .sr-choice.dim { opacity: .4; }
.sr-gov .sr-why { grid-column: 1 / -1; }

/* Sort */
.sr-sort { display: flex; flex-direction: column; gap: 16px; }
.sr-tray { display: flex; flex-wrap: wrap; gap: 8px; min-height: 48px; justify-content: center; }
.sr-chip { position: relative; display: inline-block; padding: 9px 14px; border-radius: 99px; background: #FBF6EC; color: #22201C; font-weight: 700; font-size: 15px; box-shadow: 0 6px 16px #0007; }
.sr-chip.ok { background: #D9F7E8; }
.sr-bins { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.sr-bin { border: 2px dashed #ffffff33; border-radius: 16px; padding: 10px; min-height: 160px; transition: .4s; }
.sr-bin > p { margin: 0 0 8px; text-align: center; font-weight: 800; color: var(--gold); text-transform: uppercase; letter-spacing: .06em; font-size: 14px; }
.sr-bin-in { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.sr-bin.done { border-style: solid; border-color: var(--ok); background: #5DD39E10; }

/* GST */
.sr-gst { display: flex; flex-direction: column; gap: 12px; }
.sr-house { display: grid; grid-template-columns: 140px 1fr; gap: 14px; align-items: stretch; }
.sr-centre { border-radius: 16px; background: var(--card2); border: 2px solid var(--line); display: grid; place-items: center; align-content: center; gap: 4px; text-align: center; transition: .4s; }
.sr-centre b { font-size: 18px; } .sr-centre span { color: var(--gold); font-weight: 800; font-size: 26px; }
.sr-centre.no { border-color: var(--bad); background: #FF7A6B22; box-shadow: 0 0 30px #FF7A6B44; }
.sr-centre.no::after { content: "✕"; color: var(--bad); font-size: 28px; font-weight: 800; }
.sr-seats { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 10px 12px; }
.sr-seats p { margin: 0 0 8px; font-weight: 700; color: var(--muted); font-size: 14px; }
.sr-grid { display: grid; grid-template-columns: repeat(16, 1fr); gap: 5px; }
.sr-seat { aspect-ratio: 1; border-radius: 50% 50% 4px 4px; background: #ffffff1f; transition: background .25s, transform .25s; }
.sr-seat.yes { background: var(--ok); transform: scale(1.08); }
.sr-meter { position: relative; height: 22px; border-radius: 99px; background: #ffffff14; overflow: visible; }
.sr-meter-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; border-radius: 99px; background: linear-gradient(90deg, #3FB57F, var(--ok)); transition: width .1s; }
.sr-line { position: absolute; left: 75%; top: -6px; bottom: -6px; width: 3px; background: var(--gold); }
.sr-line small { position: absolute; left: 6px; top: -18px; white-space: nowrap; color: var(--gold); font-weight: 800; font-size: 12px; }
.sr-meter-l { margin: 0; color: var(--muted); } .sr-pct { color: var(--ink); font-size: 20px; }
.sr-verdict { position: relative; height: 70px; }

/* PYQ */
.sr-pyq .sr-qtext { font-size: clamp(16px, 1.5vw, 19px); }
.sr-confrow { display: flex; gap: 8px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
.sr-confrow { transition: opacity .4s, transform .4s; }
.sr-confrow.hidden { opacity: 0; transform: translateY(10px); }
.sr-opt.picked { border-color: var(--gold); }
.sr-confrow small { color: var(--muted); font-weight: 700; }
.sr-conf { padding: 6px 12px; border-radius: 99px; border: 1px solid #ffffff33; font-size: 14px; transition: .3s; }
.sr-conf.on { background: var(--gold); color: #2A1B12; border-color: var(--gold); font-weight: 800; transform: scale(1.06); }

/* Mains */
.sr-mains { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
.sr-mq { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 12px 16px; }
.sr-mq .sr-qtext { margin: 0; }
.sr-plan { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; min-height: 0; overflow: hidden; }
.sr-pt { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; background: #FBF6EC; color: #22201C; border-radius: 12px; padding: 8px 12px; animation: srPop .4s both; }
.sr-pt-n { min-width: 26px; height: 26px; padding: 0 6px; border-radius: 8px; background: #2A1B12; color: var(--gold); display: grid; place-items: center; font-size: 12px; }
.sr-pt-t { font-size: 14.5px; }
.sr-pt-why { display: inline-block; margin-left: 6px; background: var(--gold); color: #2A1B12; font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: 99px; animation: srPop .45s .3s both cubic-bezier(.2,1.6,.4,1); }
.sr-pt:not(.new) { opacity: .8; padding-top: 5px; padding-bottom: 5px; }
.sr-pt:not(.new) > div { display: flex; gap: 8px; align-items: center; min-width: 0; }
.sr-pt:not(.new) .sr-pt-t { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sr-pt:not(.new) .sr-pt-why { flex: none; animation: none; max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Marking desk + essay */
.sr-desk { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.sr-cam { position: relative; border-radius: 18px; padding: 14px; background: #0d0f1c; border: 1px solid #ffffff22; overflow: hidden; }
.sr-corner { position: absolute; width: 22px; height: 22px; border: 3px solid var(--gold); transition: .4s; }
.sr-corner.a { left: 8px; top: 8px; border-right: 0; border-bottom: 0; } .sr-corner.b { right: 8px; top: 8px; border-left: 0; border-bottom: 0; }
.sr-corner.c { left: 8px; bottom: 8px; border-right: 0; border-top: 0; } .sr-corner.d { right: 8px; bottom: 8px; border-left: 0; border-top: 0; }
.sr-cam.snapped .sr-corner { opacity: 0; }
.sr-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
.sr-flash.go { animation: srFlash .5s; }
@keyframes srFlash { 10% { opacity: .95; } }
.sr-scan { position: absolute; left: 0; right: 0; top: 0; height: 40px; background: linear-gradient(180deg, transparent, #9FB4FF66, transparent); opacity: 0; pointer-events: none; }
.sr-scan.go { animation: srScan 1.6s ease-in-out; }
@keyframes srScan { 0% { opacity: 1; top: 0; } 100% { opacity: 0; top: 100%; } }
.sr-paper { background: #FBF6EC repeating-linear-gradient(transparent 0 29px, #C9D6EE 29px 30px); color: #1F2A44; border-radius: 6px; padding: 10px 14px 12px 34px; position: relative;
  font-family: "Kalam", "Segoe Print", "Bradley Hand", cursive; box-shadow: inset 26px 0 0 -24px #E89A9A; }
.sr-ln { margin: 0; min-height: 30px; line-height: 30px; font-size: 16px; position: relative; display: flex; flex-wrap: wrap; gap: 0 8px; align-items: baseline; }
.sr-ln.strike > span { text-decoration: line-through; text-decoration-color: #C0392B; text-decoration-thickness: 2px; }
.sr-ln.hit.fix > span { background: #FFB4A855; } .sr-ln.hit.good > span { background: #B7F0D355; }
.sr-margin { font-family: system-ui, sans-serif; font-size: 12.5px; line-height: 1.3; color: #7a1e12; background: #FFF0EC; border: 1px solid #F3B7AA; border-radius: 8px; padding: 3px 8px; margin: 2px 0 4px; animation: srPop .4s both; }
.sr-margin b { margin-right: 6px; } .sr-ln.good .sr-margin { color: #0E5A37; background: #E9FBF2; border-color: #9EE0BF; }
.sr-legend { display: flex; flex-direction: column; gap: 8px; }
.sr-legend span { display: flex; align-items: center; gap: 10px; font-weight: 700; }
.sr-legend b { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; background: var(--gold); color: #2A1B12; }
.sr-essay { display: flex; flex-direction: column; gap: 14px; align-items: center; }
.sr-quote { margin: 0; font-family: Georgia, "Noto Serif Devanagari", serif; font-style: italic; font-size: clamp(18px, 2vw, 24px); color: var(--gold); text-align: center; }
.sr-fan { display: flex; gap: 14px; justify-content: center; width: 100%; }
.sr-snap { flex: 1; max-width: 250px; opacity: 0; transform: translateY(40px) rotate(var(--r)); transition: transform .6s cubic-bezier(.2,1.3,.4,1), opacity .4s; position: relative; }
.sr-snap.in { opacity: 1; transform: rotate(var(--r)); }
.sr-fan.lit .sr-snap { box-shadow: 0 0 0 3px var(--gold), 0 0 40px #FFC66B55; border-radius: 8px; }
.sr-paper.mini { padding: 8px 8px 8px 16px; font-size: 0; height: 170px; overflow: hidden; }
.sr-paper.mini .sr-ln { font-size: 10.5px; min-height: 20px; line-height: 20px; }
.sr-snap-l { margin: 8px 0 0; text-align: center; font-weight: 800; } .sr-snap-l b { color: var(--gold); margin-right: 6px; }
.sr-snap-n { position: absolute; top: -10px; right: -6px; background: var(--bad); color: #fff; font-size: 11.5px; font-weight: 800; padding: 3px 8px; border-radius: 99px; }

/* Cards */
.sr-cards { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: center; }
.sr-card { perspective: 1200px; background: none; border: 0; padding: 0; height: 240px; text-align: left; }
.sr-card-in { position: relative; width: 100%; height: 100%; transition: transform .8s cubic-bezier(.3,1.3,.5,1); transform-style: preserve-3d; }
.sr-card.flipped .sr-card-in { transform: rotateY(180deg); }
.sr-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 18px; padding: 18px; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.sr-face.front { background: var(--card2); border: 2px solid var(--gold); }
.sr-face.front small { color: var(--muted); }
.sr-face.back { background: #FBF6EC; color: #22201C; transform: rotateY(180deg); }
.sr-ans { margin: 0; font-family: var(--head-font, Georgia); font-weight: 800; font-size: 28px; color: #17804F; }
.sr-face.back .sr-small { color: #4a4436; font-size: 15px; }
.sr-sched { display: flex; flex-direction: column; gap: 14px; }
.sr-path { display: grid; grid-template-columns: 110px 1fr auto; gap: 10px; align-items: center; opacity: 0; transform: translateX(30px); transition: .5s; }
.sr-path.in { opacity: 1; transform: none; }
.sr-arrow { height: 3px; background: currentColor; position: relative; } .sr-arrow::after { content: ""; position: absolute; right: -2px; top: -5px; border: 6px solid transparent; border-left-color: currentColor; border-right: 0; }
.sr-path.miss { color: var(--bad); } .sr-path.knew { color: var(--ok); }
.sr-path b { color: var(--ink); } .sr-when { color: var(--ink); font-weight: 800; background: #ffffff12; padding: 6px 10px; border-radius: 10px; font-size: 14px; }

/* Pods */
.sr-pods { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: center; }
.sr-ring { --R: 112px; position: relative; width: 300px; max-width: 100%; aspect-ratio: 1; margin: 0 auto; }
.sr-ring-c { position: absolute; inset: 28%; border-radius: 99px; background: radial-gradient(circle, #FFC66B33, transparent 70%); display: grid; place-items: center; align-content: center; text-align: center; }
.sr-ring-c b { font-family: var(--head-font, Georgia); font-size: 22px; } .sr-ring-c small { color: var(--muted); font-size: 12px; max-width: 13ch; }
.sr-av { position: absolute; left: 50%; top: 50%; width: 52px; height: 52px; margin: -26px; border-radius: 99px; background: var(--c); display: grid; place-items: center;
  transform: rotate(calc(var(--i) / var(--n) * 360deg)) translateY(calc(var(--R) * -1)) rotate(calc(var(--i) / var(--n) * -360deg)) scale(0); transition: transform .7s calc(var(--i) * .08s) cubic-bezier(.2,1.4,.4,1); }
.sr-av i { width: 40%; height: 40%; border-radius: 99px; background: #ffffff88; }
.sr-ring.in .sr-av { transform: rotate(calc(var(--i) / var(--n) * 360deg)) translateY(calc(var(--R) * -1)) rotate(calc(var(--i) / var(--n) * -360deg)) scale(1); }
.sr-acts { display: flex; flex-direction: column; gap: 8px; }
.sr-act { padding: 10px 14px; border-radius: 12px; background: var(--card2); border-left: 4px solid var(--ok); opacity: 0; transform: translateX(20px); transition: .4s; font-weight: 700; }
.sr-act.in { opacity: 1; transform: none; }
.sr-noscore { margin: 12px 0 0; font-weight: 800; color: var(--gold); font-size: 18px; }

/* Chotu */
.sr-chotu { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 20px; align-items: center; }
.sr-chotu-l { text-align: center; }
.sr-chotu-cup { animation: srBob 2.6s ease-in-out infinite; }
@keyframes srBob { 50% { transform: translateY(-8px); } }
.sr-chotu-n { margin: 4px 0 0; font-weight: 800; color: var(--gold); font-size: 14px; }
.sr-chat { display: flex; flex-direction: column; gap: 10px; }
.sr-msg { margin: 0; padding: 12px 14px; border-radius: 16px; max-width: 46ch; animation: srPop .4s both; font-size: 16px; }
.sr-msg.me { align-self: flex-end; background: var(--card2); border-radius: 16px 16px 4px 16px; }
.sr-msg.him { align-self: flex-start; background: #FBF6EC; color: #22201C; border-radius: 16px 16px 16px 4px; }
.sr-msg.typing { display: flex; gap: 5px; } .sr-msg.typing i { width: 8px; height: 8px; border-radius: 99px; background: #7a6a52; animation: srDot 1s infinite; }
.sr-msg.typing i:nth-child(2) { animation-delay: .15s; } .sr-msg.typing i:nth-child(3) { animation-delay: .3s; }
@keyframes srDot { 50% { transform: translateY(-5px); opacity: .5; } }
.sr-quiet-chip { grid-column: 1 / -1; justify-self: start; margin: 0; padding: 8px 14px; border-radius: 99px; background: #9FB4FF1f; border: 1px solid #9FB4FF55; color: #CFD9FF; font-weight: 700; font-size: 14px; }

/* Variety */
.sr-variety { display: flex; flex-direction: column; gap: 16px; align-items: center; justify-content: center; flex: 1; }
.sr-big { margin: 0; font-family: var(--head-font, Georgia); font-weight: 800; font-size: clamp(28px, 4vw, 48px); text-align: center; color: var(--ink); }
.sr-big em { font-style: normal; color: var(--gold); }
.sr-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; width: 100%; max-width: 900px; }
.sr-tile { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: var(--card); border: 1px solid var(--line); font-weight: 700; font-size: 15px;
  opacity: .25; transform: scale(.92); transition: .35s cubic-bezier(.2,1.5,.4,1); }
.sr-tile.in { opacity: 1; transform: none; border-color: #FFC66B77; box-shadow: 0 0 22px #FFC66B22; }

/* Finale */
.sr-fin { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; text-align: center; max-width: 900px; margin: 0 auto; width: 100%; }
.sr-hero.fin { max-width: 20ch; }
.sr-plans { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: 100%; text-align: left; }
.sr-plan-c { border-radius: 18px; padding: 16px 18px; background: var(--card); border: 1px solid var(--line); }
.sr-plan-c.plus { border: 2px solid var(--gold); background: linear-gradient(160deg, #2A2350, var(--card)); box-shadow: 0 0 40px #FFC66B22; }
.sr-plan-n { margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--gold); font-size: 13px; }
.sr-price { margin: 2px 0 8px; font-family: var(--head-font, Georgia); font-weight: 800; font-size: 32px; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.sr-price small { font-size: 15px; color: var(--muted); } .sr-price span { font-family: system-ui, sans-serif; font-size: 13px; color: var(--gold); font-weight: 700; }
.sr-plan-c ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; font-size: 15px; }
.sr-plan-c li { display: flex; gap: 8px; align-items: flex-start; } .sr-plan-c li .sr-ic { color: var(--ok); flex: none; margin-top: 3px; }
.sr-cta { display: flex; flex-direction: column; align-items: center; }
.sr-join { position: relative; display: inline-flex; align-items: center; gap: 12px; padding: 16px 36px; border-radius: 99px; background: var(--sun); color: var(--on-sun); font-weight: 800; font-size: 22px; text-decoration: none;
  box-shadow: 0 0 0 6px #F0A04B33, 0 18px 44px #F0A04B66; }
.sr-join.pulse { animation: srBeat 1.6s ease-in-out infinite; }
.sr-after { display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; }
.sr-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: 0; color: var(--muted); text-decoration: underline; text-underline-offset: 3px; min-height: 44px; font-size: 15px; }

.sr-burst { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; z-index: 3; }
.sr-burst i { position: absolute; width: 8px; height: 8px; border-radius: 2px; background: var(--c); animation: srBurst 1s ease-out forwards; }
@keyframes srBurst { to { transform: translate(var(--dx), var(--dy)) rotate(200deg); opacity: 0; } }

/* Phone and narrow laptop */
@media (max-width: 1100px) { .sr-main { grid-template-columns: minmax(0, 1fr) 280px; } .sr-bub { font-size: 15.5px; } }
@media (max-width: 820px) {
  .sr { --top: 52px; --ctl: 68px; --side: 104px; }
  .sr-main { display: block; padding: 10px 16px 0; }
  .sr-stage { position: absolute; top: 10px; left: 16px; right: 16px; bottom: calc(var(--side) + 6px); gap: 10px; }
  .sr-side { position: absolute !important; left: 16px !important; right: 16px !important; bottom: 6px !important; width: auto !important; height: var(--side); justify-content: flex-end; }
  .sr-main:has(.sr-cover:not(.playing)) .sr-stage { bottom: 0; }
  .sr-bub { font-size: 14.5px; padding: 9px 12px; border-radius: 14px 14px 14px 4px; }
  .sr-bub.old { display: none; }
  .sr-host { width: 24px; height: 24px; }
  .sr-top { gap: 8px; padding: 0 12px; }
  .sr-logo span:last-child { display: none; }
  .sr-prog { gap: 2px; }
  .sr-pill { padding: 8px 12px; font-size: 13px; }
  .sr-icon { width: 36px; height: 36px; }
  .sr-lang button { padding: 5px 9px; min-height: 34px; font-size: 13px; }
  .sr-ctl { gap: 8px; padding: 0 12px; }
  .sr-nav { min-height: 48px; padding: 0 14px; }
  .sr-nav:not(.next) .sr-nav-l { display: none; }
  .sr-nav.next { min-width: 0; flex: 1; max-width: 260px; }
  .sr-nav.next .sr-nav-l { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sr-play { width: 50px; height: 50px; }
  .sr-medal { width: 40px; height: 40px; } .sr-medal .sr-ic { width: 20px; height: 20px; }
  .sr-trophy { gap: 2px 10px; }
  .sr-trophy h2 { font-size: 23px; }
  .sr-help { font-size: 13.5px; padding: 6px 10px; margin-top: 4px; }
  .sr-help b { font-size: 10.5px; }
  .sr-q { padding: 12px; border-radius: 14px; }
  .sr-qtext { font-size: 15.5px; margin-bottom: 8px; } .sr-qtext.sm { font-size: 14.5px; }
  .sr-opts, .sr-q.compact .sr-opts { grid-template-columns: 1fr 1fr; gap: 6px; }
  .sr-opt { min-height: 42px; padding: 7px 9px; font-size: 14px; gap: 7px; } .sr-opt b { width: 22px; height: 22px; font-size: 12px; }
  .sr-why { font-size: 13.5px; padding: 8px 10px; margin-top: 8px; }
  .sr-qlabel { font-size: 11.5px; margin-bottom: 4px; }
  .sr-para { font-size: 13.5px; margin-bottom: 4px; } .sr-text { padding: 10px 12px; } .sr-text h3 { font-size: 15px; margin-bottom: 4px; }
  .sr-gov { grid-template-columns: 1fr; gap: 10px; }
  .sr-bill { min-height: 0; padding: 12px 14px 14px; } .sr-bill-t { font-size: 14.5px; margin: 6px 0; padding-right: 0; } .sr-bill-lines { display: none; }
  .sr-stamp.in { position: static; display: inline-block; margin-top: 4px; }
  .sr-choice { min-height: 42px; padding: 8px 12px; font-size: 14.5px; }
  .sr-choices .sr-qlabel { display: none; }
  .sr-choice.dim { display: none; }
  .sr-stamp.big { font-size: 26px; top: 66%; }
  .sr-video { gap: 8px; } .sr-film.small { width: 52%; } .sr-film.small .sr-cap, .sr-film.small .sr-vplay small { display: none; }
  .sr-film.small .sr-vplay { left: 6px; top: 6px; padding: 5px 9px 5px 6px; font-size: 12px; }
  .sr-sort { gap: 10px; } .sr-chip { padding: 6px 10px; font-size: 13px; border-radius: 12px; text-align: center; max-width: 100%; } .sr-bin { min-height: 120px; padding: 8px 4px; } .sr-bin > p { font-size: 11.5px; }
  .sr-house { grid-template-columns: 88px 1fr; gap: 8px; } .sr-grid { grid-template-columns: repeat(8, 1fr); gap: 4px; }
  .sr-centre b { font-size: 15px; } .sr-centre span { font-size: 20px; }
  .sr-verdict { height: 54px; }
  .sr-confrow { margin-top: 6px; } .sr-conf { font-size: 12.5px; padding: 4px 9px; }
  .sr-pyq .sr-qtext { font-size: 14px; }
  .sr-mq { padding: 8px 12px; } .sr-pt { padding: 6px 10px; } .sr-pt-t { font-size: 13px; } .sr-pt-why { font-size: 11px; }
  .sr-mq .sr-qtext { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .sr-plan { gap: 4px; } .sr-pt:not(.new) { padding-top: 3px; padding-bottom: 3px; }
  .sr-pt.new .sr-pt-t { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .sr-desk { grid-template-columns: 1fr; gap: 8px; } .sr-deskside { display: flex; gap: 10px; align-items: center; }
  .sr-legend { flex-direction: row; gap: 10px; font-size: 13px; } .sr-legend b { width: 24px; height: 24px; } .sr-deskside { display: none; }
  .sr-cam { padding: 8px; } .sr-ln { font-size: 13.5px; min-height: 24px; line-height: 24px; } .sr-paper { background-size: auto; padding-left: 24px; }
  .sr-margin { font-size: 10.5px; padding: 2px 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .sr-ln { min-height: 22px; line-height: 22px; font-size: 13px; } .sr-paper { padding-top: 6px; padding-bottom: 6px; }
  .sr-fan { gap: 6px; } .sr-paper.mini { height: 120px; } .sr-paper.mini .sr-ln { font-size: 7.5px; min-height: 14px; line-height: 14px; } .sr-snap-l { font-size: 13px; } .sr-snap-n { font-size: 10px; }
  .sr-cards { grid-template-columns: 1fr; gap: 12px; } .sr-card { height: 190px; } .sr-ans { font-size: 22px; } .sr-face { padding: 14px; } .sr-face.back .sr-small { font-size: 13.5px; }
  .sr-path { grid-template-columns: 82px 1fr auto; } .sr-when { font-size: 12.5px; }
  .sr-pods { grid-template-columns: 1fr; gap: 6px; } .sr-ring { width: 190px; --R: 70px; } .sr-av { width: 38px; height: 38px; margin: -19px; } .sr-ring-c b { font-size: 17px; }
  .sr-acts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .sr-act { font-size: 13px; padding: 7px 10px; } .sr-noscore { font-size: 15px; margin-top: 6px; }
  .sr-chotu { grid-template-columns: 1fr; gap: 10px; } .sr-chotu-l { display: flex; align-items: center; gap: 10px; } .sr-chotu-cup svg { width: 56px; height: 56px; }
  .sr-msg { font-size: 14.5px; padding: 9px 12px; }
  .sr-tiles { grid-template-columns: 1fr 1fr; gap: 6px; } .sr-tile { padding: 6px 8px; font-size: 13px; } .sr-medal.sm { width: 26px; height: 26px; } .sr-medal.sm .sr-ic { width: 14px; height: 14px; }
  .sr-plans { grid-template-columns: 1fr 1fr; gap: 8px; } .sr-plan-c { padding: 10px; } .sr-plan-c ul { font-size: 12.5px; gap: 3px; } .sr-price { font-size: 22px; margin-bottom: 4px; }
  .sr-plan-c .sr-small { display: none; }
  .sr-fin { gap: 10px; } .sr-hero.fin { font-size: 30px; } .sr-join { font-size: 19px; padding: 12px 26px; }
  .sr-hero { font-size: 38px; } .sr-go b { font-size: 19px; } .sr-go-ic { width: 46px; height: 46px; }
  .sr-reel span { font-size: 12.5px; padding: 4px 9px; }
}
@media (max-width: 820px) and (max-height: 700px) {
  .sr-help { display: none; } .sr-card { height: 160px; } .sr-ring { width: 150px; --R: 56px; } .sr-plan-c ul li:nth-child(n+5) { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sr *, .sr *::before, .sr *::after { animation: none !important; transition: none !important; }
  .sr-shine { color: var(--ink); background: none; }
}
`;
  document.head.append(s);
}
