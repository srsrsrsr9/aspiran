// The demo stage: how a visitor (no account) walks the Express route of "Try one topic" (try.js hands over here).
// Rebuilt on 21 Nov 2026 from the owner's review: a demo is a sales floor, not a classroom. So:
// - One linear tour, chapter by chapter. The games, the video and the essay pages are chapters, never side doors, and
//   there is no "Back to the topic" anywhere. Every chapter ends with one big button that names what comes next.
// - "Study with Chotu" (owner's pick, 21 Nov 2026; replaced the chatty side guide and the flashlight tour): nobody
//   talks while the visitor works. Chotu sits small at the bottom (buddy.js) and speaks only to help someone stuck: a
//   nudge after a stall or a miss, never the answer, never praise. A tap on him asks for a nudge. A stuck visitor always
//   has a way on: the nudge, a "Show me" on the GST vote, and the big button (it says Skip until the chapter is done).
// - What the visitor works out is written into "My notes" as it happens (a paper beside the work on a laptop, a chip
//   and a sheet on a phone). The finish page is that page, then one join button and the two plans.
// - One quiet line closes each finished chapter (CODA). On Federalism, a shorter route skips to the games.
// - Sound effects are off by default. Chotu's voice is on from the first click (the owner's one exception); the
//   speaker button turns both off. Reduced motion is respected. No timers, no streaks; tallies are private.
// - No feedback questions and no survey: we learn from anonymous funnel events (track), never from nagging.
// Members never see this; they get the in-app route (try.js), where the side doors and the "why" notes still live.

import * as B from "./buddy.js";
import { kulhad } from "./kulhad.js";

let X = null;
/** try.js hands over its helpers: see the call in try.js (S.init). */
export function init(ctx) { X = ctx; css(); B.init(ctx); }
const h = (...a) => X.h(...a);
const put = (...a) => X.put(...a);
const L = (v) => X.L(v);
const hi = () => X.lang() === "hi";
const RM = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
const later = (fn, ms) => { const id = setTimeout(fn, RM() ? 0 : ms); timers.push(id); return id; };
let timers = [];
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
const track = (name, props = {}) => X.track(name, props);

// --- Words ------------------------------------------------------------------------------------------------------------

const W = {
  en: {
    chapterOf: (i, n) => `Chapter ${i} of ${n}`, start: (m) => `Start the ${m}-minute tour`, resume: "Carry on where you left off",
    whole: (m) => `or learn the whole topic (${m} min, three sittings)`, allTopics: "Other topics", join: "Join free", sound: "Sound effects",
    skip: "Skip", nextUp: (t) => `Next: ${t}`, nextQ: "Next question", seeHow: "See how I did", back: "Back",
    right: "Right!", notQuite: "Not quite.", yourPick: "your pick", howSure: "Lock it in. How sure are you?", sure3: ["Sure", "Ruled some out", "Pure guess"],
    qOf: (i, n) => `${i} of ${n}`,
    tapPlay: "Play", captions: "captions on", soundTap: "sound on tap", readIt: "Read it instead", close: "Close", yourTurn: "Your turn",
    fromVideo: "The question the video ends on", oneMore: "One more, from the same story",
    bill: (i, n) => `Bill ${i} of ${n}`, whatDo: "What will you do?", nextBill: "Next bill", playAgain: "Play again", allowed: "Allowed", notAllowed: "Not allowed",
    tray: "Subjects", trayHint: "Drag each one into its list. Or tap it, then tap the list.", dropHere: "Drop here", check: "Check my lists",
    sortedAll: "All in the right list. Sharp.", sortedSome: (n) => `${n} to look at again. These are exactly the lookalikes Prelims uses.`, tryWrong: "Try those again", itsIn: "It's",
    tallyRight: (r, n) => `${r} of ${n} right`, sureWrong: (n) => n ? `${n} you were sure of went wrong. Those cost marks in Prelims, and they're the ones you'll now remember best.` : "Nothing you were sure of went wrong. That's calibration.",
    guessedRight: (n) => n ? `${n} pure guess${n > 1 ? "es" : ""} came good. You know more than you think.` : "", onlyYou: "Only you see this.",
    centre: "Centre", centreVotes: "Centre votes", yes: "Yes", no: "No", allYes: "All states yes", allNo: "All states no", statesYes: "States voting yes",
    weighted: "Weighted votes", need: "needs 75%", passed: "Passed", blocked: "Blocked", tapSeats: "Tap a seat to flip its vote.", find: "Find these three",
    found: "Found!", lastQ: "Last one", build: "Build the plan", building: "Building…", whichEnd: "Which ending would you write?", tryOwn: "I'd rather plan my own first",
    ownHolder: "Opening line…\n1.\n2.\n3.\nWay forward…", open: "Open", way: "Way forward", trap: "The usual trap", whatAsks: "What it asks",
    otherQ: "Try the other question", marks: (m, w) => `${m} marks · ${w} words`, page: (n) => `Page ${n}`, nextPage: (t) => `Next page: ${t}`, howMarked: "How marking works",
    evaluator: "What an evaluator looks for", snapTitle: "Your page, marked", snap1: "Snap your page", snap2: "We read it", snap3: "It comes back marked",
    snapJoke: "Writing a whole essay in the middle of a demo? Legend. But nobody does, so here's what happens when you do it in the app.",
    snapHow: "Write by hand, the way the exam wants. Photograph the page in the app. Chotu, your study buddy, reads your handwriting and marks it against the same checklist: structure, content and expression, with notes in the margin like these.",
    remember: "Remember these? You guessed them at the start.", card: (i, n) => `Card ${i} of ${n}`, nextCard: "Next card", saveCards: "Save my cards",
    schedule: "When each card comes back", tomorrow: "Tomorrow", inDays: (n) => `In ${n} days`, saved: (n) => `${n} cards saved in this browser. Join free and they go straight into your Review.`, skipped: "Skipped", goBack: "Go back", plans: "Two plans. Start free.",
    free: "Free", plus: "Plus", perYear: "/year", perDay: "about ₹11 a day", freeList: ["Your pod of 6 to 8 aspirants", "Daily review of everything you keep", "Chai: news cards tied to the syllabus", "Practice questions and past papers", "Chotu, your study buddy"],
    plusList: ["Everything in Free", "Unlimited answer marking", "Every mock"], plusNote: "Start free. Upgrade inside the app whenever you're ready.",
    joinKeep: (n) => n ? `Join free, keep your ${n} cards` : "Join free, keep your progress", noCard: "Free to join. No card needed.",
    finTitle: "Here's what you worked out.",
    moreTopics: "Try another topic", wholeTopic: "Do the whole topic",
    name: { warmup: "Guess first", read: "Read smart", video: "Watch", "sim-governor": "The Governor's desk", sort: "Sort the lists", pyq: "Real PYQs", "sim-gst": "The GST vote", mains: "Plan a Mains answer", essay: "The marking desk", keep: "Make it stick", finish: "My notes" },
    sub: { warmup: "Three questions before any teaching. Guess freely; nothing is scored.", read: "One short read. Then the text folds away and you're tested from memory.",
      video: "Under a minute. Then your turn.", "sim-governor": "You're the Governor. Four bills land on your desk. Your call.", sort: "Six lookalike subjects. Drag each one into its list.",
      pyq: "Real Prelims questions, official answer keys. Pick, say how sure you are, and if you miss, have one more go.", "sim-gst": "31 states, one Centre. Flip the votes and find out who can block what.",
      mains: "A real Mains question, planned point by point in front of you.", essay: "Three handwritten pages of one essay, marked in the margin.", keep: "Your first guesses come back. Then a few memory cards." },
    notes: "My notes", notesN: (n) => `My notes · ${n}`, notesEmpty: "What you work out gets written down here as you go.", added: "Added to My notes",
    short: (m) => `Short on time? The ${m}-minute version: the two games, the marking desk and your cards`, long: (m) => `Back to the full ${m} minutes`,
    chotuHi: "Hi, I'm Chotu. I'll sit with you while you try this. If you get stuck, I'll give you a nudge, not the answer.",
    chotuNight: "I'm Chotu. It's late, so I'll stay quiet. Tap me at the bottom if you want a nudge.",
    notThat: "Not that one. One more try.", second: "On the second try.",
    plusLine: "Want your own page marked like this? Write by hand and snap it in the app. Plus marks every answer you send: ₹3,999 a year, about ₹11 a day.",
    finLead2: "Every line here is something you worked out in the last few minutes.", skippedSome: "You skipped:", keepGoing: "Carry on in the app",
    podLine: "In the app you study in a pod of 6 to 8 aspirants at your stage, not a group of 50,000.",
    coverKick: "Free demo · no account", coverSub: (n, m) => `${m} minutes. ${n} kinds of learning. One whole topic.`,
  },
  hi: {
    chapterOf: (i, n) => `अध्याय ${i} / ${n}`, start: (m) => `${m} मिनट का टूर शुरू कीजिए`, resume: "जहाँ छोड़ा था, वहीं से",
    whole: (m) => `या पूरा topic सीखिए (${m} मिनट, तीन बैठकें)`, allTopics: "दूसरे topics", join: "मुफ़्त जुड़िए", sound: "आवाज़ें",
    skip: "छोड़िए", nextUp: (t) => `आगे: ${t}`, nextQ: "अगला सवाल", seeHow: "मेरा कैसा रहा?", back: "पीछे",
    right: "सही!", notQuite: "पूरा सही नहीं।", yourPick: "आपका चुनाव", howSure: "पक्का कीजिए। आप कितने पक्के हैं?", sure3: ["पक्का", "कुछ हटा सका", "पूरा अंदाज़ा"],
    qOf: (i, n) => `${i} / ${n}`,
    tapPlay: "चलाइए", captions: "captions चालू", soundTap: "आवाज़ टैप पर", readIt: "पढ़कर देखिए", close: "बंद कीजिए", yourTurn: "आपकी बारी",
    fromVideo: "जिस सवाल पर video ख़त्म होता है", oneMore: "उसी कहानी से एक और",
    bill: (i, n) => `विधेयक ${i} / ${n}`, whatDo: "आप क्या करेंगे?", nextBill: "अगला विधेयक", playAgain: "फिर से खेलिए", allowed: "अनुमति है", notAllowed: "अनुमति नहीं",
    tray: "विषय", trayHint: "हर एक को उसकी सूची में खींचिए। या उस पर टैप कीजिए, फिर सूची पर।", dropHere: "यहाँ छोड़िए", check: "मेरी सूचियाँ जाँचिए",
    sortedAll: "सब सही सूची में। बढ़िया।", sortedSome: (n) => `${n} दोबारा देखने लायक। Prelims यही मिलते-जुलते विषय पूछता है।`, tryWrong: "इन्हें फिर से कीजिए", itsIn: "सही:",
    tallyRight: (r, n) => `${n} में से ${r} सही`, sureWrong: (n) => n ? `${n} पर आप पक्के थे पर ग़लत हुए। Prelims में ये महँगे पड़ते हैं, और अब यही सबसे अच्छे से याद रहेंगे।` : "जिन पर आप पक्के थे, उनमें कोई ग़लत नहीं हुआ। यही सही अंदाज़ा है।",
    guessedRight: (n) => n ? `${n} अंदाज़े सही निकले। आपको जितना लगता है, उससे ज़्यादा पता है।` : "", onlyYou: "यह सिर्फ़ आप देखते हैं।",
    centre: "केंद्र", centreVotes: "केंद्र का वोट", yes: "हाँ", no: "ना", allYes: "सब राज्य हाँ", allNo: "सब राज्य ना", statesYes: "हाँ कहने वाले राज्य",
    weighted: "भारित वोट", need: "75% चाहिए", passed: "पारित", blocked: "रुका", tapSeats: "किसी सीट पर टैप करके उसका वोट बदलिए।", find: "ये तीन खोजिए",
    found: "मिल गया!", lastQ: "आख़िरी सवाल", build: "ढाँचा बनाइए", building: "बन रहा है…", whichEnd: "आप कौन-सा निष्कर्ष लिखेंगे?", tryOwn: "पहले मैं अपना ढाँचा बनाऊँगा",
    ownHolder: "शुरुआत…\n1.\n2.\n3.\nआगे का रास्ता…", open: "शुरुआत", way: "आगे का रास्ता", trap: "आम ग़लती", whatAsks: "सवाल क्या माँगता है",
    otherQ: "दूसरा सवाल आज़माइए", marks: (m, w) => `${m} अंक · ${w} शब्द`, page: (n) => `पेज ${n}`, nextPage: (t) => `अगला पेज: ${t}`, howMarked: "जाँच कैसे होती है",
    evaluator: "परीक्षक क्या देखता है", snapTitle: "आपका पेज, जाँचा हुआ", snap1: "पेज की फ़ोटो लीजिए", snap2: "हम उसे पढ़ते हैं", snap3: "जाँच के साथ लौटता है",
    snapJoke: "Demo के बीच पूरा निबंध लिखना? कमाल। पर कोई लिखता नहीं, इसलिए देखिए app में लिखने पर क्या होता है।",
    snapHow: "हाथ से लिखिए, जैसे परीक्षा चाहती है। App में पेज की फ़ोटो लीजिए। आपका study साथी Chotu आपकी लिखावट पढ़ता है और उसी checklist पर जाँचता है: ढाँचा, सामग्री और अभिव्यक्ति, हाशिये में ऐसी ही टिप्पणियों के साथ।",
    remember: "ये याद हैं? शुरू में आपने इन पर अंदाज़ा लगाया था।", card: (i, n) => `Card ${i} / ${n}`, nextCard: "अगला card", saveCards: "मेरे cards सहेजिए",
    schedule: "हर card कब लौटेगा", tomorrow: "कल", inDays: (n) => `${n} दिन बाद`, saved: (n) => `${n} cards इस browser में सहेजे गए। मुफ़्त जुड़िए, और वे सीधे आपके Review में जाएँगे।`, skipped: "छोड़ा", goBack: "वापस जाइए", plans: "दो plan। मुफ़्त से शुरू कीजिए।",
    free: "Free", plus: "Plus", perYear: "/साल", perDay: "लगभग ₹11 रोज़", freeList: ["6 से 8 उम्मीदवारों का आपका pod", "जो रखा, उसका रोज़ का review", "Chai: syllabus से जुड़े news cards", "अभ्यास सवाल और पिछले papers", "Chotu, आपका study साथी"],
    plusList: ["Free में जो है, सब", "असीमित उत्तर-जाँच", "सारे mock"], plusNote: "मुफ़्त से शुरू कीजिए। जब चाहें, app के अंदर से upgrade कीजिए।",
    joinKeep: (n) => n ? `मुफ़्त जुड़िए, अपने ${n} cards रखिए` : "मुफ़्त जुड़िए, अपनी प्रगति रखिए", noCard: "जुड़ना मुफ़्त। कोई card नहीं चाहिए।",
    finTitle: "आपने यह सब समझा।",
    moreTopics: "दूसरा topic आज़माइए", wholeTopic: "पूरा topic कीजिए",
    name: { warmup: "पहले अंदाज़ा", read: "समझकर पढ़िए", video: "देखिए", "sim-governor": "राज्यपाल की मेज़", sort: "सूचियाँ छाँटिए", pyq: "असली PYQ", "sim-gst": "GST का वोट", mains: "Mains उत्तर का ढाँचा", essay: "जाँच की मेज़", keep: "याद पक्की कीजिए", finish: "मेरे नोट्स" },
    sub: { warmup: "पढ़ाने से पहले तीन सवाल। खुलकर अंदाज़ा लगाइए; कोई अंक नहीं।", read: "एक छोटा पाठ। फिर पाठ छिप जाता है और याद से जाँच होती है।",
      video: "एक मिनट से कम। फिर आपकी बारी।", "sim-governor": "आप राज्यपाल हैं। आपकी मेज़ पर चार विधेयक। फ़ैसला आपका।", sort: "छह मिलते-जुलते विषय। हर एक को उसकी सूची में खींचिए।",
      pyq: "असली Prelims सवाल, आधिकारिक उत्तर-कुंजी। चुनिए, बताइए कितने पक्के हैं, और चूकें तो एक बार और।", "sim-gst": "31 राज्य, एक केंद्र। वोट बदलिए और देखिए कौन क्या रोक सकता है।",
      mains: "एक असली Mains सवाल, आपके सामने बिंदु-दर-बिंदु ढाँचा।", essay: "एक निबंध के तीन हाथ से लिखे पेज, हाशिये में जाँच के साथ।", keep: "आपके पहले अंदाज़े लौटते हैं। फिर कुछ memory cards।" },
    notes: "मेरे नोट्स", notesN: (n) => `मेरे नोट्स · ${n}`, notesEmpty: "आप जो समझते जाएँगे, वह यहाँ लिखा जाता रहेगा।", added: "मेरे नोट्स में जुड़ा",
    short: (m) => `समय कम है? ${m} मिनट वाला रूप: दोनों खेल, जाँच की मेज़ और आपके cards`, long: (m) => `पूरे ${m} मिनट पर लौटिए`,
    chotuHi: "नमस्ते, मैं छोटू हूँ। आप यह करके देखिए, मैं साथ बैठा हूँ। कहीं अटकें तो एक इशारा दूँगा, जवाब नहीं।",
    chotuNight: "मैं छोटू हूँ। रात हो गई है, इसलिए चुप रहूँगा। इशारा चाहिए तो नीचे मुझ पर टैप कीजिए।",
    notThat: "यह नहीं। एक बार और।", second: "दूसरी कोशिश में।",
    plusLine: "अपना पेज भी ऐसे जँचवाना है? हाथ से लिखिए और app में फ़ोटो लीजिए। Plus में हर उत्तर जाँचा जाता है: ₹3,999 साल का, लगभग ₹11 रोज़।",
    finLead2: "यहाँ की हर पंक्ति आपने पिछले कुछ मिनटों में ख़ुद समझी है।", skippedSome: "आपने छोड़ा:", keepGoing: "App में आगे बढ़िए",
    podLine: "App में आप अपने स्तर के 6 से 8 उम्मीदवारों के pod में पढ़ते हैं, 50,000 लोगों के group में नहीं।",
    coverKick: "मुफ़्त demo · बिना account", coverSub: (n, m) => `${m} मिनट। सीखने के ${n} तरीक़े। एक पूरा topic।`,
  },
};
const t = (k, ...a) => { const v = (W[X.lang()] ?? W.en)[k] ?? W.en[k]; return typeof v === "function" ? v(...a) : v; };

// Why each line of the Mains plan is there: shown beside the line as it arrives.
const MB = {
  en: { intro: "First line answers the question in one breath. No \"since time immemorial\".", p0: "Every point carries a hook: an Article, a formula, a year. Examiners reward specifics.",
    p1: "Exact numbers, current to the latest Finance Commission. Old figures quietly cost marks.", p2: "Both sides inside one point. \"Examine\" means weigh, not list.",
    p3: "A counter-trend. This is the point that lifts an answer from average to good.", way: "A way forward that says who should do what. Not \"Centre and states should work together\".",
    trap: "And the trap most people fall into, flagged before you fall in." },
  hi: { intro: "पहली पंक्ति एक साँस में सवाल का जवाब देती है। \"अनादि काल से\" नहीं।", p0: "हर बिंदु के साथ एक पकड़: अनुच्छेद, सूत्र, वर्ष। परीक्षक ठोस बातों को अंक देते हैं।",
    p1: "सटीक आँकड़े, नवीनतम वित्त आयोग तक। पुराने आँकड़े चुपचाप अंक काटते हैं।", p2: "एक ही बिंदु में दोनों पक्ष। \"परीक्षण\" का मतलब तौलना है, गिनाना नहीं।",
    p3: "उलटा रुझान। यही बिंदु उत्तर को औसत से अच्छा बनाता है।", way: "आगे का रास्ता जो बताए कि कौन क्या करे। \"केंद्र और राज्य मिलकर काम करें\" नहीं।",
    trap: "और वह ग़लती जिसमें ज़्यादातर लोग गिरते हैं, गिरने से पहले ही बताई गई।" },
};
const mb = (k) => (MB[X.lang()] ?? MB.en)[k] ?? MB.en[k];

// One quiet line under a finished chapter (borrowed from the keynote idea: the work, then one sentence, then on).
// It says what the visitor did, never how well, and never sells.
const CODA = {
  en: { warmup: "Three guesses, made before any teaching. They come back at the end.", read: "Read once, then recalled. Recalling is the part that sticks.",
    video: "Under a minute, then a question. Answering is where it lands.", "sim-governor": "Article 200, decided four times, from the Governor's chair.",
    sort: "Lookalikes are where Prelims sets its traps. Now you've handled them.", pyq: "Real papers, official keys, and you know which ones you were guessing.",
    "sim-gst": "Neither side can pass anything alone. You worked that out yourself.", mains: "Answer first, a hook on every point, and an ending that says who does what.",
    essay: "Structure, content, expression. Every page you write gets read this way.", keep: "These come back by themselves, just before you'd forget them." },
  hi: { warmup: "तीन अंदाज़े, पढ़ाई से पहले। अंत में ये लौटेंगे।", read: "एक बार पढ़ा, फिर याद से बताया। याद करना ही टिकता है।",
    video: "एक मिनट से कम, फिर एक सवाल। जवाब देने पर ही बात बैठती है।", "sim-governor": "अनुच्छेद 200, चार बार, राज्यपाल की कुर्सी से तय किया।",
    sort: "मिलते-जुलते विषयों में ही Prelims जाल बिछाता है। अब आप उनसे निपट चुके हैं।", pyq: "असली papers, आधिकारिक कुंजी, और आपको पता है कि कहाँ अंदाज़ा था।",
    "sim-gst": "कोई भी पक्ष अकेले कुछ पारित नहीं कर सकता। यह आपने ख़ुद खोजा।", mains: "पहले जवाब, हर बिंदु पर एक पकड़, और अंत में कौन क्या करे।",
    essay: "ढाँचा, सामग्री, अभिव्यक्ति। आपका हर पेज ऐसे ही पढ़ा जाता है।", keep: "ये अपने आप लौटेंगे, ठीक भूलने से पहले।" },
};

// "My notes": what the visitor works out lands here as it happens, in handwriting, and the finish page is the whole
// page. Stored as keys (so a language switch rewrites them). The Federalism topic has its own lines; every other topic
// gets lines made from its own content (the read's "remember", the sort's lists, the right answer).
const NOTES = {
  "path-pol-federalism": {
    w: [{ en: "Subjects in no list (residuary powers) go to Parliament. Article 248.", hi: "किसी सूची में न आने वाले विषय (अवशिष्ट शक्तियाँ) संसद के पास। अनुच्छेद 248।" },
      { en: "GST Council: ¾ of the weighted votes. Centre ⅓, states ⅔.", hi: "GST परिषद: भारित वोटों का ¾। केंद्र ⅓, राज्य ⅔।" },
      { en: "Bommai (1994): a majority is tested on the floor of the Assembly.", hi: "बोम्मई (1994): बहुमत की जाँच विधानसभा के पटल पर।" }],
    "video-governor": [{ en: "Governor's assent: Article 200. Sign, withhold, or reserve for the President.", hi: "राज्यपाल की स्वीकृति: अनुच्छेद 200। स्वीकृति, रोकना, या राष्ट्रपति के लिए आरक्षित।" },
      { en: "Nov 2025 opinion: a court can only ask for a decision in reasonable time. No deadline, no deemed assent.", hi: "नवंबर 2025 की राय: अदालत सिर्फ़ उचित समय में फ़ैसले का निर्देश दे सकती है। न समय-सीमा, न मानित स्वीकृति।" }],
    gov: [null, { en: "Passed again after a return? The Governor can't refuse it.", hi: "लौटाने के बाद दोबारा पारित? राज्यपाल मना नहीं कर सकते।" },
      { en: "A bill that weakens the High Court must go to the President.", hi: "हाई कोर्ट को कमज़ोर करने वाला विधेयक राष्ट्रपति के पास जाना ही चाहिए।" },
      { en: "A money bill can't be sent back for reconsideration.", hi: "धन विधेयक पुनर्विचार के लिए लौटाया नहीं जा सकता।" }],
    pyq: { 0: { en: "Of the three councils, only the Inter-State Council is in the Constitution (Article 263).", hi: "तीनों में से सिर्फ़ अंतर-राज्य परिषद संविधान में है (अनुच्छेद 263)।" },
      1: { en: "Article 356: the state's law-making goes to Parliament's authority. The Assembly isn't dissolved by itself.", hi: "अनुच्छेद 356: राज्य का क़ानून बनाना संसद के अधिकार में जाता है। विधानसभा अपने आप भंग नहीं होती।" },
      2: { en: "Only the Governor can reserve a state bill. The Constitution does name the Governor's discretion.", hi: "राज्य का विधेयक सिर्फ़ राज्यपाल आरक्षित कर सकते हैं। संविधान राज्यपाल के विवेक का ज़िक्र करता है।" } },
    x: { veto: { en: "All 31 states together make 66.7%, short of 75%. The Centre can block alone.", hi: "सभी 31 राज्य मिलकर 66.7%, 75% से कम। केंद्र अकेले रोक सकता है।" },
      fewest: { en: "With the Centre for it, 20 states pass a decision. 19 fall just short.", hi: "केंद्र साथ हो तो 20 राज्य फ़ैसला पारित करते हैं। 19 पर थोड़ा कम पड़ता है।" },
      block: { en: "The states need 12 of them together to block.", hi: "रोकने के लिए 12 राज्यों का साथ चाहिए।" } },
    xq: { en: "Council recommendations persuade; they don't bind (Mohit Minerals, 2022).", hi: "परिषद की सिफ़ारिशें प्रेरक हैं, बाध्यकारी नहीं (मोहित मिनरल्स, 2022)।" },
  },
};
const NOTE_ANY = {
  m: { en: "Mains: answer in the first line. A hook on every point: an Article, a year, a number. End with who should do what.", hi: "Mains: पहली पंक्ति में जवाब। हर बिंदु पर एक पकड़: अनुच्छेद, वर्ष, आँकड़ा। अंत में कौन क्या करे।" },
  e: { en: "Essay: take a side you can argue, then go beyond politics: economy, society, ethics.", hi: "निबंध: ऐसा पक्ष लीजिए जिस पर तर्क दे सकें, फिर राजनीति से आगे: अर्थव्यवस्था, समाज, नैतिकता।" },
};

// The question the Governor video ends on, so the first question under the player is the one the viewer just heard.
// (The path file carries it too, marked fromVideo; this covers a copy imported before that.)
const VIDEO_Q = {
  "video-governor": {
    fromVideo: true,
    q: { en: "Which Article covers the Governor's assent to bills?", hi: "राज्यपाल की विधेयकों पर स्वीकृति किस अनुच्छेद में है?" },
    options: [{ en: "Article 200", hi: "अनुच्छेद 200" }, { en: "Article 201", hi: "अनुच्छेद 201" }, { en: "Article 143", hi: "अनुच्छेद 143" }, { en: "Article 356", hi: "अनुच्छेद 356" }],
    answer: 0,
    why: { en: "Article 200: the Governor can assent, withhold assent, or reserve the bill for the President. Article 201 takes over once a bill is reserved; Article 143 is the President asking the Supreme Court for an opinion (that's how the November 2025 opinion came about); Article 356 is President's Rule.",
      hi: "अनुच्छेद 200: राज्यपाल स्वीकृति दे सकते हैं, रोक सकते हैं, या विधेयक राष्ट्रपति के लिए आरक्षित कर सकते हैं। आरक्षण के बाद अनुच्छेद 201 लागू होता है; अनुच्छेद 143 में राष्ट्रपति सुप्रीम कोर्ट से राय माँगते हैं (नवंबर 2025 की राय ऐसे ही आई); अनुच्छेद 356 राष्ट्रपति शासन है।" },
  },
};

// --- Icons (stroke, 24 grid) and sounds --------------------------------------------------------------------------------

const ICON = {
  warmup: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z",
  read: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  video: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 8.5v7l6-3.5z",
  "sim-governor": "M7 21h10M5 17h14v-3H5zM9.5 14l.8-4.5a1.8 1.8 0 1 1 3.4 0l.8 4.5",
  sort: "M4 4h4.5v16H4zM9.75 4h4.5v16h-4.5zM15.5 4H20v16h-4.5z",
  pyq: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  "sim-gst": "M4 12h16v8H4zM8 12V4h8v8M10 8l1.5 1.5L14 6.5",
  mains: "M4 20l4-1 11-11-3-3L5 16zM14 7l3 3",
  essay: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5",
  keep: "M8 3h12v14H8zM4 7v14h12",
  finish: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9.5 17h5",
  on: "M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11", off: "M4 9h4l5-4v14l-5-4H4zM16 9.5l5 5M21 9.5l-5 5",
  back: "M15 5l-7 7 7 7", arrow: "M5 12h14M13 6l6 6-6 6", check: "M5 12.5l4.5 4.5L19 7.5", x: "M6 6l12 12M18 6L6 18", play: "M8 5v14l11-7z",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z", scan: "M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M4 12h16",
};
const NS = "http://www.w3.org/2000/svg";
function svg(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) { if (k.startsWith("on")) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); }
  for (const k of kids.flat()) if (k) el.append(k);
  return el;
}
const icon = (name, s = 20) => svg("svg", { viewBox: "0 0 24 24", width: s, height: s, "aria-hidden": "true", class: "sc-ic" }, svg("path", { d: ICON[name] ?? ICON.arrow }));
const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M14 3c-2 3 2 4 0 7M20 2c-2 3 2 4 0 8M26 3c-2 3 2 4 0 7" fill="none" stroke="#F0A04B" stroke-width="2" stroke-linecap="round"/><path d="M5 15h30l-4.5 20.5a3 3 0 0 1-3 2.5H12.5a3 3 0 0 1-3-2.5z" fill="#C8693A"/><rect x="4" y="13" width="32" height="4.5" rx="2.2" fill="#E08A55"/><rect x="14" y="22" width="3.2" height="5" rx="1.6" fill="#2A1B12"/><rect x="22.8" y="22" width="3.2" height="5" rx="1.6" fill="#2A1B12"/></svg>`;
function logoMark() { const s = h("span.sc-logo-mark"); s.innerHTML = LOGO; return s; }

let ac = null;
const sfxOn = () => !!X.store.get("try:sfx", false);
// The speaker button: on while either sound is on. Turning it off silences both (remembered); on turns both on.
const soundOn = () => sfxOn() || B.voiceOn();
const setSound = (on) => { X.store.set("try:sfx", on); X.store.set("try:voice", on); if (!on) B.stopVoice(); else B.relock(); };
function tone(f, d, type = "sine", g = 0.06, when = 0, slide = 0) {
  if (!sfxOn()) return;
  try {
    ac ??= new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ac.currentTime + when, o = ac.createOscillator(), v = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
    v.gain.setValueAtTime(g, t0); v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(v).connect(ac.destination); o.start(t0); o.stop(t0 + d + 0.03);
  } catch {}
}
const SFX = {
  tap: () => tone(700, 0.05, "triangle", 0.035), drop: () => tone(520, 0.09, "sine", 0.06, 0, 380),
  right: () => { tone(660, 0.12, "sine", 0.06); tone(990, 0.2, "sine", 0.05, 0.09); }, wrong: () => tone(220, 0.25, "triangle", 0.07, 0, 150),
  stamp: () => { tone(120, 0.16, "square", 0.05, 0, 60); tone(70, 0.3, "sine", 0.12); }, flip: () => tone(500, 0.05, "triangle", 0.03, 0, 800),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, "triangle", 0.05, i * 0.09)), whoosh: () => tone(300, 0.25, "sine", 0.03, 0, 900),
};

/** A small burst of sparks from an element (skipped when motion is reduced). */
function burst(el) {
  if (RM() || !el) return;
  const box = h("span.sc-burst", { "aria-hidden": "true" });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, d = 40 + Math.random() * 40;
    box.append(h("i", { style: { "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, "--c": ["#FFC66B", "#F0A04B", "#5DD39E", "#9FB4FF"][i % 4] } }));
  }
  el.append(box); setTimeout(() => box.remove(), 1100);
}
/** Counts a number up when it scrolls into view. */
function countUp(el, to, suffix = "") {
  const fin = () => (el.textContent = to.toLocaleString("en-IN") + suffix);
  if (RM() || !("IntersectionObserver" in window)) return fin();
  el.textContent = "0" + suffix;
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return;
    io.disconnect();
    const t0 = performance.now(), dur = 1300;
    const step = (now) => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e).toLocaleString("en-IN") + suffix; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  io.observe(el);
}

// --- The sequence --------------------------------------------------------------------------------------------------
// The Express route, with each step's playable side doors (the games, a video, the essay pages) pulled into the line
// right after the step that offered them. On a topic that rich, the long read is left for the whole-topic route: the
// demo shows reading through its checks and the guide, and keeps the 15 minutes for the things nobody else has.

const PLAYABLE = new Set(["sim-gst", "sim-governor", "essay", "video"]);
function seq(whole = false) {
  const d = X.data(), out = [], seen = new Set();
  for (const id of d.routes.express.steps) {
    const st = X.stepById(id) && X.view(X.stepById(id));
    if (!st || seen.has(id)) continue;
    out.push(id); seen.add(id);
    for (const door of st.doors ?? []) {
      const did = typeof door === "string" ? door : door.id, ds = X.stepById(did);
      if (ds && PLAYABLE.has(ds.type) && !seen.has(did)) { out.push(did); seen.add(did); }
    }
  }
  const rich = out.filter((id) => PLAYABLE.has(X.stepById(id)?.type)).length >= 3;
  const all = rich ? out.filter((id) => X.stepById(id)?.type !== "read") : out;
  return !whole && hasShort(all) && X.getA("route:short") ? all.filter((id) => SHORT.has(X.stepById(id)?.type)) : all;
}
// The shorter route (from the "opening taps" idea): only where the topic has the games, so it really is different.
const SHORT = new Set(["warmup", "sim-governor", "sim-gst", "essay", "keep", "finish"]);
const SHORT_MIN = 8;
const hasShort = (all) => all.length > 7 && all.filter((id) => SHORT.has(X.stepById(id)?.type)).length >= 5;
const nameOf = (st) => (st.type === "video" ? `${t("name").video}: ${L(st.title)}` : t("name")[st.type] ?? L(st.title));
const doneKey = (st) => "sc:done:" + st.id;
const isDone = (st) => !!X.getA(doneKey(st));

// --- Frame: top bar, stage (the work, and My notes beside it), bottom bar with Chotu ----------------------------------

let root = null, barEl = null, chapterAt = null, codaEl = null, notesEl = null, chipEl = null, toastEl = null, curSt = null;
let action = { label: "", run: null, ready: false };
// How Chotu helps in the chapter on screen: each chapter sets `nudge()` as it draws, returning { key, action? } for
// where the visitor is now (or null). A still screen for WAIT seconds counts as stuck. No clock is ever shown.
let nudge = null;
const WAIT = { warmup: 20, read: 20, video: 20, "sim-governor": 25, sort: 15, pyq: 25, "sim-gst": 12, mains: 15, keep: 20 };

export function draw(into, strip) {
  root = into;
  document.documentElement.classList.add("sc-on");
  root.classList.add("sc-root");
  const p = X.prog();
  const list = seq();
  const at = p.show == null || p.show < 0 || p.route !== "express" ? -1 : Math.min(p.show, list.length - 1);
  B.listen();
  const fresh = at !== chapterAt;
  if (fresh) { clearTimers(); B.newChapter(); chapterAt = at; }
  if (at < 0) { curSt = null; B.unwatch(); put(root, strip, topBar(list, -1), cover(list)); return; }
  const st = curSt = X.view(X.stepById(list[at]));
  action = { label: "", run: null, ready: false };
  nudge = null;
  const fin = st.type === "finish";
  const body = (CH[st.type] ?? CH.fallback)(st, at, list);
  codaEl = h("p.sc-coda", { "aria-live": "polite" });
  notesEl = null;
  put(root, strip, topBar(list, at),
    h("div.sc-stage" + (fin ? ".solo" : ""), h("article.sc-main", { lang: X.lang() }, head(st, at, list), body, codaEl), !fin && notesPanel()),
    bottomBar(list, at));
  if (isDone(st)) paintCoda(st, false);
  if (WAIT[st.type]) B.watch(() => (isDone(st) ? null : nudge?.()), WAIT[st.type] * 1000); else B.unwatch();
  if (fresh) later(() => B.say(fin ? "bye" : "hello"), fin ? 1400 : 600);
}
// Leaving #try puts the page width back, and Chotu stops watching.
addEventListener("hashchange", () => { if (!/^#try\//.test(location.hash)) { document.documentElement.classList.remove("sc-on"); B.unwatch(); B.hush(); } });

/** What a tap on Chotu says: the nudge for right now, or where to go next. */
function askChotu() {
  const st = curSt;
  if (!st) return null;
  if (st.type === "finish") return { key: "bye" };
  if (!isDone(st)) { const n = nudge?.(); if (n) return n; if (st.type === "essay") return { key: "essay" }; }
  return { key: "next" };
}

function goShow(i) {
  const p = X.prog(), list = seq();
  p.route = "express"; p.door = null;
  if (i < 0) { p.show = -1; p.pos = -1; X.save(p); X.redraw(); return X.top(); }
  p.show = Math.min(i, list.length - 1); p.showLast = p.show;
  const id = list[p.show], ex = X.data().routes.express.steps.indexOf(id);
  if (ex >= 0) p.pos = ex;
  const first = !(p.counted ?? {})["show:" + id];
  p.counted = { ...(p.counted ?? {}), ["show:" + id]: true };
  X.save(p); X.redraw(); X.top();
  if (first) {
    track("try_step", { route: X.getA("route:short") ? "short" : "express", n: p.show + 1, of: list.length, step: id, demo: 3 });
    if (X.stepById(id)?.type === "finish") track("try_finish", { route: "express", demo: 3 });
  }
}

function topBar(list, at) {
  const snd = soundOn();
  const sound = h("button.sc-iconbtn", { type: "button", "aria-pressed": String(snd), title: t("sound"), "aria-label": t("sound"),
    onclick: () => { setSound(!snd); if (!snd) { SFX.tap(); track("demo_act", { act: "sound_on" }); } else track("demo_act", { act: "sound_off" }); X.redraw(); } }, icon(snd ? "on" : "off", 20));
  const rail = at >= 0 && h("div.sc-rail", { "aria-label": t("chapterOf", at + 1, list.length) },
    h("div.sc-segs", list.map((id, i) => h("button.sc-seg" + (i === at ? ".on" : isDone(X.stepById(id)) ? ".done" : ""), {
      type: "button", title: nameOf(X.stepById(id)), "aria-label": nameOf(X.stepById(id)), onclick: () => goShow(i) }))),
    h("div.sc-rail-label", h("b", t("qOf", at + 1, list.length)), " · ", nameOf(X.view(X.stepById(list[at])))));
  return h("header.sc-top",
    h("a.sc-logo", { href: X.homeHref(), "aria-label": "Aspiran" }, logoMark(), h("span", "Aspiran")),
    rail || h("div.sc-rail"),
    sound, X.langSwitch() && h("button.sc-iconbtn.sc-lang", { type: "button", lang: hi() ? "en" : "hi", "aria-label": hi() ? "Switch to English" : "हिन्दी में देखिए",
      onclick: () => { B.hush(); X.store.set("try:lang", hi() ? "en" : "hi"); track("demo_act", { act: "lang_" + (hi() ? "en" : "hi") }); X.redraw(); } }, hi() ? "EN" : "हि"),
    h("a.sc-join-pill", { href: "#", onclick: () => X.joining("top") }, t("join")));
}

function head(st, at, list) {
  chipEl = st.type !== "finish" ? h("button.sc-notes-chip", { type: "button", onclick: openNotes }, icon("read", 16), h("span", t("notesN", myNotes().length))) : null;
  return h("div.sc-head",
    h("div.sc-kick", h("span.sc-kick-ic", icon(st.type, 18)), h("span", t("chapterOf", at + 1, list.length)), chipEl),
    h("h1", { tabindex: "-1" }, st.type === "finish" ? t("finTitle") : nameOf(st)),
    st.type !== "finish" && h("p.sc-sub", t("sub")[st.type] ?? L(st.lead)));
}

/** The chapter sets what the big button says and does. Not ready = it still works, but quietly ("Skip"). */
function act(label, run, ready = true) {
  action = { label, run, ready };
  if (barEl) paintBar();
}
let barList = null, barAt = null;
function bottomBar(list, at) {
  barList = list; barAt = at;
  barEl = h("nav.sc-bar", { "aria-label": "Tour" });
  paintBar();
  return barEl;
}
function paintBar() {
  const list = barList, at = barAt;
  const next = at + 1 < list.length ? X.stepById(list[at + 1]) : null;
  const st = X.stepById(list[at]);
  let { label, run, ready } = action;
  if (!run) { run = () => goShow(at + 1); ready = isDone(st); label = next ? t("nextUp", nameOf(X.view(next))) : ""; if (!ready && next) label = t("skip") + " · " + t("nextUp", nameOf(X.view(next))); }
  const fin = st.type === "finish";
  toastEl ??= h("div.sc-toast", { role: "status", "aria-live": "polite" });
  put(barEl, h("div.sc-bar-in",
    B.mount(askChotu),
    h("div.sc-bar-r",
      h("button.sc-back", { type: "button", "aria-label": t("back"), onclick: () => goShow(at - 1) }, icon("back", 20), h("span", t("back"))),
      fin ? h("a.sc-go.ready", { href: "#", onclick: () => X.joining("bar") }, h("span", t("joinKeep", X.cardsHere())), icon("arrow", 20))
        : label && h("button.sc-go" + (ready ? ".ready" : ""), { type: "button", onclick: () => { SFX.whoosh(); run(); } }, h("span", label), icon("arrow", 20))),
    toastEl));
}

/** The closing line under a finished chapter. */
function paintCoda(st, anim = true) {
  const line = (CODA[X.lang()] ?? CODA.en)[st.type];
  if (!codaEl || !line) return;
  codaEl.textContent = line;
  codaEl.classList.toggle("in", anim);
  codaEl.classList.add("on");
}

// --- My notes --------------------------------------------------------------------------------------------------------

const myNotes = () => (X.getA("notes", []) ?? []).filter((k) => noteText(k));
const clip = (s, n = 64) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n)) + "…").replace(/[:\s]+$/, "");
const stepV = (id) => { const s = X.stepById(id); return s && X.view(s); };
const ansOf = (q) => q && L(q.options[q.answer]);
/** A note's words, in the language on screen. Keys: w:i, r:step, v:step:n, g:i, s:step, p:step:i, x:step:id, xq:step:n, m, e. */
function noteText(k) {
  const mine = NOTES[X.id()] ?? {}, [kind, a, b] = String(k).split(":");
  const pick = (o) => (o ? L(o) : null);
  switch (kind) {
    case "w": { const q = stepV("warmup")?.questions?.[a]; return pick(mine.w?.[a]) ?? (q && `${clip(L(q.q))} → ${ansOf(q)}`); }
    case "r": { const r = stepV(a)?.remember; return r ? L(r).replace(/^\*\*[^*]+\*\*\s*/, "").replace(/\*\*/g, "") : null; }
    case "v": return pick(mine[a]?.[b]) ?? ansOf(stepV(a)?.questions?.[b]);
    case "g": return pick(mine.gov?.[a]);
    case "s": {
      const st = stepV(a); if (!st) return null;
      const idx = st.only ?? st.items.map((_, i) => i);
      return st.buckets.map((bk, bi) => { const its = idx.filter((i) => st.items[i].bucket === bi).map((i) => L(st.items[i].text)); return its.length ? `${L(bk)}: ${its.join(", ")}` : null; }).filter(Boolean).join(" · ");
    }
    case "p": return pick(mine.pyq?.[b]) ?? ansOf(stepV(a)?.questions?.[b]);
    case "x": return pick(mine.x?.[b]) ?? pick(stepV(a)?.challenges?.find((c) => c.id === b)?.aha);
    case "xq": return pick(mine.xq) ?? ansOf(stepV(a)?.questions?.[b]);
    case "m": case "e": return L(NOTE_ANY[kind]);
  }
  return null;
}
/** Write a line into My notes (once). On a phone, where the paper isn't on screen, a small toast says so. */
function addNote(k) {
  const all = X.getA("notes", []) ?? [];
  if (all.includes(k) || !noteText(k)) return;
  X.setA("notes", [...all, k]);
  fillNotes(k);
  if (chipEl) { chipEl.querySelector("span").textContent = t("notesN", myNotes().length); chipEl.classList.remove("bump"); void chipEl.offsetWidth; chipEl.classList.add("bump"); }
  if (toastEl && matchMedia("(max-width: 999px)").matches) {
    toastEl.textContent = t("added"); toastEl.classList.remove("in"); void toastEl.offsetWidth; toastEl.classList.add("in");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove("in"), 2200);
  }
}
function notesList(fresh) {
  const ns = myNotes();
  return ns.length ? h("ol.sc-notes-list", ns.map((k) => h("li" + (k === fresh ? ".new" : ""), { lang: X.lang() }, noteText(k)))) : h("p.sc-notes-empty", t("notesEmpty"));
}
function notesPanel() {
  handFont();
  notesEl = h("aside.sc-notes", { "aria-label": t("notes") });
  fillNotes();
  return notesEl;
}
function fillNotes(fresh) {
  if (!notesEl) return;
  put(notesEl, h("h2.sc-notes-h", t("notes")), notesList(fresh));
  // The newest line is the one that matters: keep the bottom of the paper in view.
  const el = notesEl; requestAnimationFrame(() => el.scrollTo?.({ top: el.scrollHeight, behavior: fresh && !RM() ? "smooth" : "auto" }));
}
function openNotes() {
  handFont();
  track("demo_act", { act: "notes_open" });
  const dlg = h("dialog.sc-dialog.sc-notes-sheet", { "aria-label": t("notes") },
    h("div.sc-notes", h("h2.sc-notes-h", t("notes")), notesList()),
    h("form", { method: "dialog" }, h("button.sc-chip", t("close"))));
  dlg.addEventListener("close", () => dlg.remove());
  root.append(dlg); dlg.showModal?.();
}

// --- Cover -----------------------------------------------------------------------------------------------------------

function cover(list) {
  const d = X.data(), c = d.cover ?? {}, p = X.prog();
  const kinds = list.filter((id) => X.stepById(id)?.type !== "finish");
  const canShort = hasShort(seq(true)), short = canShort && !!X.getA("route:short");
  const full = d.routes.express.minutes ?? 15, minutes = short ? SHORT_MIN : full;
  const resume = p.showLast != null && p.showLast > 0 && p.showLast < list.length;
  const setShort = (on) => { X.setA("route:short", on || null); const q = X.prog(); q.showLast = null; X.save(q); track("demo_act", { act: on ? "route_short" : "route_full" }); X.redraw(); };
  const night = B.quiet();
  return h("div.sc-stage.solo",
    h("section.sc-cover",
      h("div.sc-kick", h("span.sc-kick-ic", icon("finish", 18)), h("span", t("coverKick"), " · ", L(d.short ?? d.title))),
      h("h1.sc-hero", { tabindex: "-1" }, L(c.headline ?? d.title)),
      h("p.sc-hero-sub", t("coverSub", kinds.length, minutes)),
      h("div.sc-chotu-hi", kulhad(night ? "night" : "warm", 56), h("p", { lang: X.lang() }, night ? t("chotuNight") : t("chotuHi"))),
      h("div.sc-row",
        h("button.sc-go.ready.sc-start", { type: "button", onclick: () => { SFX.whoosh(); track("try_route", { route: short ? "short" : "express", demo: 3 }); goShow(resume ? p.showLast : 0); } },
          h("span", resume ? t("resume") : t("start", minutes)), icon("arrow", 22))),
      canShort && h("button.sc-link.sc-short", { type: "button", onclick: () => setShort(!short) }, short ? t("long", full) : t("short", SHORT_MIN)),
      h("div.sc-path", kinds.map((id, i) => { const st = X.view(X.stepById(id)); return h("button.sc-path-step", { type: "button", style: { "--i": i }, onclick: () => goShow(i) },
        h("span.sc-path-ic", icon(st.type, 22)), h("span.sc-path-n", String(i + 1)), h("span", nameOf(st))); })),
      h("p.sc-cover-pitch", L(c.pitch ?? d.promise)),
      h("div.sc-cover-links",
        d.routes.full && h("button.sc-link", { type: "button", onclick: () => X.goFull() }, t("whole", d.routes.full.minutes)),
        h("a.sc-link", { href: "#try" }, t("allTopics")))));
}

// --- One question ----------------------------------------------------------------------------------------------------
// Pick, and the answer shows straight away with its reason. With `sure`, the pick waits for "how sure?", which then
// reveals: answering first and rating it second is the natural order, and still comes before seeing the key.

function question(q, k, { sure = false, onDone, label, retry = null } = {}) {
  const box = h("div.sc-q");
  let pending = null;
  // With `retry` (the PYQs): a first wrong answer is crossed out and Chotu gives a nudge; the second answer reveals.
  // The first answer is kept (k:first) and is the one the tally counts.
  const settle = (i) => {
    const ok = i === q.answer, first = X.getA(k + ":first");
    if (!ok && retry && first == null) {
      X.setA(k + ":first", i); SFX.wrong(); drawQ(true);
      track("demo_act", { act: "pyq_retry" });
      B.say(retry(i), { again: true });
      return;
    }
    if (first == null) X.setA(k + ":first", i);
    X.setA(k + ":pick", i); (ok ? SFX.right : SFX.wrong)(); drawQ(true); showWhy(box); onDone?.(ok);
  };
  const drawQ = (fresh = false) => {
    const picked = X.getA(k + ":pick"), done = picked != null, first = X.getA(k + ":first");
    const crossed = retry && !done && first != null ? first : null, again = crossed != null;
    put(box,
      label && h("div.sc-q-label", label),
      q.source?.label && h("div.sc-q-src", L(q.source.label)),
      h("p.sc-stem", L(q.q)),
      h("div.sc-opts", { role: "group" }, q.options.map((o, i) => {
        const cls = done ? (i === q.answer ? ".right" : i === picked || i === first ? ".wrong" : ".dim") : i === crossed ? ".crossed" : pending === i ? ".picked" : "";
        return h("button.sc-opt" + cls + (fresh && (done ? i === picked || i === q.answer : i === crossed) ? ".pop" : ""), { type: "button", disabled: done || i === crossed,
          onclick: () => {
            SFX.tap();
            if (sure && !again) { pending = i; drawQ(); box.querySelector(".sc-sure")?.scrollIntoView?.({ block: "nearest", behavior: RM() ? "auto" : "smooth" }); return; }
            settle(i);
          } },
          h("span.sc-letter", "ABCD"[i]), h("span.sc-opt-t", L(o)),
          done && i === q.answer && h("span.sc-flag.ok", icon("check", 18)), (done ? i === picked && i !== q.answer : i === crossed) && h("span.sc-flag.no", icon("x", 18)));
      })),
      again && h("p.sc-again", { role: "status" }, t("notThat")),
      sure && !done && !again && pending != null && h("div.sc-sure", h("span", t("howSure")),
        h("div.sc-sure-row", t("sure3").map((lbl, lvl) => h("button.sc-chip", { type: "button", onclick: () => { X.setA(k + ":sure", 2 - lvl); const i = pending; pending = null; settle(i); } }, lbl)))),
      done && h("div.sc-why" + (picked === q.answer ? ".ok" : ".no"), { role: "status" },
        h("b", (picked === q.answer ? (first != null && first !== picked ? t("second") : t("right")) : t("notQuite")) + " "), L(q.why)));
  };
  drawQ();
  return box;
}
/** After an answer, bring its explanation into view (it sits under the options, and on a laptop under the fold). */
function showWhy(box) { requestAnimationFrame(() => box.querySelector(".sc-why")?.scrollIntoView?.({ block: "nearest", behavior: RM() ? "auto" : "smooth" })); }

/** Questions one at a time inside a chapter; the big button walks them, then names the next chapter. */
/** Questions one at a time inside a chapter. `onEach(n, ok)` after each answer (notes); `stall` is Chotu's line for an
 *  unanswered question (a key, or a function giving one or null); `retry` gives the PYQs their second try. */
function questionRun(st, qs, keyOf, { sure = false, labels, onAll, tally, onEach, stall, retry } = {}) {
  const box = h("div");
  const atKey = st.id + ":sc-at";
  const drawR = () => {
    const at = Math.min(X.getA(atKey, 0), qs.length);
    if (at >= qs.length) {
      if (!isDone(st)) markDone(st);
      put(box, tally ? tally() : question(qs[qs.length - 1], keyOf(qs.length - 1), { sure, label: labels?.(qs.length - 1) }));
      act("", null);
      return;
    }
    const k = keyOf(at), q = qs[at];
    const answered = () => X.getA(k + ":pick") != null;
    const next = () => { X.setA(atKey, at + 1); drawR(); if (at + 1 < qs.length) X.top(); };
    nudge = () => { if (answered()) return null; const key = typeof stall === "function" ? stall(at) : stall; return key ? { key } : null; };
    put(box, h("div.sc-dots", qs.map((_, i) => h("i" + (i < at ? ".done" : i === at ? ".on" : "")))),
      question(q, k, { sure, label: labels?.(at), retry: retry && ((i) => retry(at, i)), onDone: (ok) => { onEach?.(at, ok); updateAct(); if (at + 1 >= qs.length) onAll?.(); } }));
    const updateAct = () => {
      const last = at + 1 >= qs.length;
      if (!answered()) return act(t("skip"), next, false);
      if (last && !tally) { X.setA(atKey, qs.length); if (!isDone(st)) markDone(st); return act("", null); }
      act(last ? t("seeHow") : t("nextQ"), next, true);
    };
    updateAct();
  };
  drawR();
  return box;
}

function markDone(st) {
  X.setA(doneKey(st), true);
  track("demo_act", { step: st.id, act: "done" });
  B.hush();
  if (st.id === curSt?.id) paintCoda(st);
  if (barEl) { action = { label: "", run: null, ready: true }; paintBar(); barEl.querySelector(".sc-go")?.classList.add("pulse"); }
}

// --- Chapters --------------------------------------------------------------------------------------------------------

const CH = {
  fallback: (st) => [h("p", L(st.lead))],

  warmup: (st) => questionRun(st, st.questions, (n) => `${st.id}:${n}`, { stall: "warmup", onEach: (n) => addNote("w:" + n) }),

  read(st) {
    const box = h("div");
    const drawR = () => {
      const tested = X.getA(st.id + ":tested", false);
      if (!tested || !(st.check ?? []).length) {
        put(box, h("div.sc-reader", L(st.body).split(/\n\n+/).map((p) => h("p", X.rich(p)))), st.chart && X.chart(st.chart), st.remember && h("div.sc-remember", X.rich(L(st.remember))));
        nudge = () => ({ key: "read" });
        if ((st.check ?? []).length) act(hi() ? "पढ़ लिया: अब जाँचिए" : "Done reading: test me", () => { X.setA(st.id + ":tested", true); addNote("r:" + st.id); drawR(); X.top(); }, true);
        else { addNote("r:" + st.id); if (!isDone(st)) markDone(st); }
        return;
      }
      put(box, questionRun(st, st.check, (n) => `${st.id}:${n}`, { stall: "retry" }));
    };
    drawR();
    return box;
  },

  video(st) {
    const v = st.video;
    const qs = st.questions?.some((q) => q.fromVideo) ? st.questions : [VIDEO_Q[st.id], ...(st.questions ?? [])].filter(Boolean);
    const stage = h("div.sc-player");
    let played = false;
    const showPoster = () => put(stage,
      h("img.sc-player-glow", { src: v.poster, alt: "", "aria-hidden": "true" }),
      h("div.sc-phone",
        h("img.sc-poster", { src: v.poster, alt: "" }),
        h("div.sc-player-shade"),
        h("button.sc-playbtn", { type: "button", "aria-label": `${t("tapPlay")}: ${L(v.title)}`, onclick: play }, h("span.sc-ring"), icon("play", 34)),
        h("div.sc-player-cap", h("div.sc-chips", h("span", `${v.seconds ?? 50} s`), h("span", t("captions")), h("span", t("soundTap"))))));
    const play = () => {
      track("demo_act", { step: st.id, act: "video_play" });
      played = true; B.hush();
      const el = h("video", { controls: true, playsinline: true, preload: "auto", poster: v.poster, "aria-label": L(v.title) },
        h("source", { src: v.mp4, type: "video/mp4" }), v.vtt && h("track", { kind: "captions", src: v.vtt, srclang: "en", label: "English", default: true }));
      el.addEventListener("ended", () => { track("demo_act", { step: st.id, act: "video_end" }); document.querySelector(".sc-vq")?.classList.add("glow"); }, { once: true });
      put(stage, h("img.sc-player-glow", { src: v.poster, alt: "", "aria-hidden": "true" }), h("div.sc-phone.playing", el));
      el.play?.()?.catch?.(() => {});
    };
    showPoster();
    const transcript = v.transcript && (() => {
      const dlg = h("dialog.sc-dialog", h("p", L(v.transcript)), h("form", { method: "dialog" }, h("button.sc-chip", t("close"))));
      return [h("button.sc-link", { type: "button", onclick: () => { document.body.append(dlg); dlg.showModal?.(); } }, t("readIt"))];
    })();
    return h("div.sc-video",
      h("div.sc-video-left", stage, transcript),
      h("div.sc-vq", h("h2.sc-h2", t("yourTurn")),
        questionRun(st, qs, (n) => `${st.id}:${qs[n].fromVideo ? "vq" : n - (qs[0]?.fromVideo ? 1 : 0)}`, { labels: (n) => (qs[n].fromVideo ? t("fromVideo") : t("oneMore")),
          stall: () => (played ? null : "video"), onEach: (n) => addNote(`v:${st.id}:${n}`) })));
  },

  "sim-governor"(st) {
    const box = h("div.sc-desk");
    const drawG = (stampNow = false) => {
      const at = Math.min(X.getA(st.id + ":at", 0), st.rounds.length);
      if (at >= st.rounds.length) {
        if (!isDone(st)) markDone(st);
        put(box, h("div.sc-wrap", h("p", L(st.wrap))),
          h("button.sc-link", { type: "button", onclick: () => { X.setA(st.id + ":at", 0); st.rounds.forEach((_, i) => X.setA(`${st.id}:${i}`, null)); drawG(); } }, t("playAgain")));
        act("", null);
        return;
      }
      const r = st.rounds[at], pick = X.getA(`${st.id}:${at}`), o = pick != null ? r.options[pick] : null;
      put(box,
        h("div.sc-dots", st.rounds.map((_, i) => h("i" + (i < at ? ".done" : i === at ? ".on" : "")))),
        h("div.sc-bill" + (stampNow ? ".slide" : ""),
          h("div.sc-bill-top", h("span.sc-bill-n", t("bill", at + 1, st.rounds.length)), h("span.sc-bill-stamp", L(r.stamp))),
          h("p.sc-bill-text", L(r.bill)),
          r.note && h("p.sc-bill-note", L(r.note)),
          o && h("div.sc-seal" + (o.ok ? ".ok" : ".no") + (stampNow ? ".hit" : ""), h("span", L(o.label)), h("small", o.ok ? t("allowed") : t("notAllowed")))),
        h("p.sc-ask", t("whatDo")),
        h("div.sc-stamps", r.options.map((op, i) => h("button.sc-stampbtn" + (pick == null ? "" : i === pick ? (op.ok ? ".ok" : ".no") : ".dim"), { type: "button", disabled: pick != null,
          onclick: () => { X.setA(`${st.id}:${at}`, i); SFX.stamp(); later(() => (op.ok ? SFX.right : SFX.wrong)(), 260); addNote("g:" + at); drawG(true); } }, L(op.label)))),
        o && h("div.sc-why" + (o.ok ? ".ok" : ".no"), { role: "status" }, h("b", (o.ok ? t("right") : t("notQuite")) + " "), L(o.result), r.law && h("div.sc-law", L(r.law))));
      nudge = () => (X.getA(`${st.id}:${at}`) == null ? { key: "governor" } : null);
      if (pick == null) act(t("skip"), () => { X.setA(st.id + ":at", at + 1); drawG(); }, false);
      else if (at + 1 < st.rounds.length) act(t("nextBill"), () => { X.setA(st.id + ":at", at + 1); drawG(); X.top(); }, true);
      else act(hi() ? "डेस्क समेटिए" : "Close the file", () => { X.setA(st.id + ":at", at + 1); drawG(); X.top(); }, true);
    };
    drawG();
    return box;
  },

  sort(st) {
    const items = (st.only ?? st.items.map((_, i) => i)).map((i) => [i, st.items[i]]);
    const box = h("div.sc-sort");
    let sel = null, justDragged = false;
    const K = st.id;
    const tones = ["union", "state", "conc"];
    const place = (i, b) => { const pl = X.getA(K + ":place", {}); pl[i] = b; X.setA(K + ":place", pl); SFX.drop(); sel = null; drawS(); };
    const startDrag = (e, i, el) => {
      if (X.getA(K + ":checked") || e.button > 0) return;
      const r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top, x0 = e.clientX, y0 = e.clientY;
      let ghost = null, over = null;
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
        if (!ghost) { ghost = el.cloneNode(true); ghost.classList.add("sc-ghost"); ghost.style.width = r.width + "px"; document.body.append(ghost); el.classList.add("lifted"); box.classList.add("dragging"); }
        ghost.style.transform = `translate(${ev.clientX - ox}px, ${ev.clientY - oy}px) rotate(-3deg)`;
        const bin = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.(".sc-bin");
        if (bin !== over) { over?.classList.remove("over"); over = bin; over?.classList.add("over"); }
        ev.preventDefault();
      };
      const up = () => {
        removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
        if (!ghost) return;
        ghost.remove(); el.classList.remove("lifted"); box.classList.remove("dragging"); over?.classList.remove("over");
        justDragged = true; setTimeout(() => (justDragged = false), 50);
        if (over) place(i, Number(over.dataset.b));
      };
      addEventListener("pointermove", move, { passive: false }); addEventListener("pointerup", up); addEventListener("pointercancel", up);
    };
    const tile = (i, it, inBin) => {
      const b = h("button.sc-tile" + (sel === i ? ".sel" : ""), { type: "button", "aria-pressed": inBin ? null : String(sel === i),
        onclick: () => { if (justDragged) return; if (inBin) { const pl = X.getA(K + ":place", {}); delete pl[i]; X.setA(K + ":place", pl); SFX.tap(); drawS(); return; } sel = sel === i ? null : i; SFX.tap(); drawS(); } }, L(it.text));
      b.addEventListener("pointerdown", (e) => startDrag(e, i, b));
      return b;
    };
    const drawS = () => {
      const pl = X.getA(K + ":place", {}), checked = X.getA(K + ":checked", false);
      const left = items.filter(([i]) => pl[i] == null);
      box.classList.toggle("checked", !!checked);
      const wrong = checked ? items.filter(([i, it]) => pl[i] !== it.bucket) : [];
      put(box,
        !checked && h("div.sc-tray" + (left.length ? "" : ".empty"),
          h("div.sc-tray-head", h("b", t("tray")), h("span", left.length ? t("trayHint") : "")),
          h("div.sc-tray-tiles", left.map(([i, it]) => tile(i, it, false)))),
        h("div.sc-bins", st.buckets.map((b, bi) => {
          const here = items.filter(([i]) => pl[i] === bi);
          return h("div.sc-bin." + tones[bi % 3] + (sel != null ? ".armed" : ""), { "data-b": bi, role: "button", tabindex: "0", "aria-label": L(b),
            onclick: () => { if (sel != null && !checked) place(sel, bi); }, onkeydown: (e) => { if ((e.key === "Enter" || e.key === " ") && sel != null && !checked) { e.preventDefault(); place(sel, bi); } } },
            h("div.sc-bin-head", h("b", L(b)), h("span", String(here.length))),
            h("div.sc-bin-body",
              here.map(([i, it]) => checked
                ? h("div.sc-tile.done" + (it.bucket === bi ? ".ok" : ".no"), h("span", L(it.text)), it.bucket !== bi && h("small", `${t("itsIn")} ${L(st.buckets[it.bucket])}`), h("small.sc-tile-why", L(it.why)))
                : tile(i, it, true)),
              !checked && !here.length && h("span.sc-drop", t("dropHere"))));
        })),
        checked && h("div.sc-why" + (wrong.length ? ".no" : ".ok"), { role: "status" }, wrong.length ? t("sortedSome", wrong.length) : t("sortedAll"),
          wrong.length > 0 && h("button.sc-chip", { type: "button", style: { marginLeft: "10px" }, onclick: () => { wrong.forEach(([i]) => delete pl[i]); X.setA(K + ":place", pl); X.setA(K + ":checked", false); drawS(); } }, t("tryWrong"))));
      nudge = () => (X.getA(K + ":checked") ? null : { key: "sort" });
      if (checked) { addNote("s:" + st.id); if (!isDone(st)) markDone(st); act("", null); }
      else if (!left.length) act(t("check"), () => { X.setA(K + ":checked", true); const bad = items.filter(([i, it]) => X.getA(K + ":place", {})[i] !== it.bucket).length; (bad ? SFX.wrong : SFX.win)(); if (!bad) burst(box); track("demo_act", { step: st.id, act: "sort_check", wrong: bad }); drawS(); }, true);
      else act(t("skip"), () => goShow(barAt + 1), false);
    };
    drawS();
    return box;
  },

  pyq(st) {
    const qs = (st.only ?? st.questions.map((_, i) => i)).map((i) => [i, st.questions[i]]);
    // A nudge of its own for each Federalism PYQ after a first miss (buddy.js "pyq-<n>"); elsewhere the general one.
    const own = X.id() === "path-pol-federalism";
    return questionRun(st, qs.map(([, q]) => q), (n) => `${st.id}:${qs[n][0]}`, { sure: true, stall: "pyq",
      retry: (n) => (own && qs[n][0] <= 2 ? `pyq-${qs[n][0]}` : "retry"), onEach: (n) => addNote(`p:${st.id}:${qs[n][0]}`), tally: () => {
      const res = qs.map(([i, q]) => ({ pick: X.getA(`${st.id}:${i}:first`) ?? X.getA(`${st.id}:${i}:pick`), sure: X.getA(`${st.id}:${i}:sure`), ans: q.answer })).filter((r) => r.pick != null);
      const right = res.filter((r) => r.pick === r.ans).length;
      const sw = res.filter((r) => r.sure === 2 && r.pick !== r.ans).length, gr = res.filter((r) => r.sure === 0 && r.pick === r.ans).length;
      const n = h("span.sc-big");
      const el = h("div.sc-tally", h("div.sc-tally-n", n, h("span", "/" + res.length)), h("div", h("b", t("tallyRight", right, res.length)), h("p", t("sureWrong", sw)), gr > 0 && h("p", t("guessedRight", gr)), h("small", t("onlyYou"))));
      countUp(n, right);
      return el;
    } });
  },

  "sim-gst": (st) => gstChamber(st),
  mains: (st) => mainsBuild(st),
  essay: (st) => essayDesk(st),
  keep: (st) => keepIt(st),
  finish: (st) => finale(st),
};

// --- The GST Council chamber ----------------------------------------------------------------------------------------
// 31 seats in a half-circle and the Centre's seat at the front. Tap seats to flip their vote; the weighted meter and a
// stamp answer at once. Three findings light up as they're found. Article 279A(9): three-fourths of the weighted votes
// of those present and voting; the Centre one-third, the states together two-thirds (all present here).

function gstChamber(st) {
  const total = st.states ?? 31, K = st.id + ":sc";
  const ROWS = [[72, 7], [104, 11], [136, 13]];
  const seats = [];
  for (const [r, n] of ROWS) for (let k = 0; k < n; k++) { const a = Math.PI - ((k + 0.5) * Math.PI) / n; seats.push([170 + r * Math.cos(a), 160 - r * Math.sin(a)]); }
  seats.sort((a, b) => Math.atan2(160 - a[1], a[0] - 170) - Math.atan2(160 - b[1], b[0] - 170)).reverse();
  const box = h("div.sc-gst");
  let lastPass = null;
  const stalls = {};
  const state = () => X.getA(K, { centre: true, yes: Array.from({ length: total }, (_, i) => i < 18) });
  const set = (s) => { X.setA(K, s); drawC(); };
  const drawC = () => {
    const s = state(), yes = s.yes.filter(Boolean).length;
    const share = (s.centre ? 1 / 3 : 0) + (2 / 3) * (yes / total), pass = share >= 0.75 - 1e-9;
    const found = X.getA(st.id + ":found", {});
    const hits = { veto: !s.centre && yes === total, fewest: s.centre && pass && yes === Math.ceil(0.625 * total - 1e-9), block: s.centre && !pass && yes === Math.ceil(0.625 * total - 1e-9) - 1 };
    let fresh = null;
    for (const [k, v] of Object.entries(hits)) if (v && !found[k]) { found[k] = true; fresh = k; }
    if (fresh) { X.setA(st.id + ":found", found); SFX.win(); track("demo_act", { step: st.id, act: "gst_" + fresh }); B.hush(); addNote(`x:${st.id}:${fresh}`); }
    const flipped = lastPass != null && lastPass !== pass; lastPass = pass;
    if (flipped) SFX.stamp();
    const map = svg("svg", { viewBox: "0 0 340 200", class: "sc-chamber", role: "img", "aria-label": `${yes} of ${total} states yes, Centre ${s.centre ? "yes" : "no"}` },
      svg("path", { d: "M66 160a104 104 0 0 1 208 0", class: "sc-arc" }),
      seats.map(([x, y], i) => svg("g", { class: "sc-seat" + (s.yes[i] ? " yes" : " no"), tabindex: "0", role: "button", "aria-label": `State ${i + 1}: ${s.yes[i] ? t("yes") : t("no")}`,
        onclick: () => { const y2 = s.yes.slice(); y2[i] = !y2[i]; SFX.tap(); set({ ...s, yes: y2 }); },
        onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const y2 = s.yes.slice(); y2[i] = !y2[i]; set({ ...s, yes: y2 }); } } },
        svg("circle", { cx: x, cy: y, r: 14, class: "hit" }), svg("circle", { cx: x, cy: y, r: 9 }))),
      svg("g", { class: "sc-centre" + (s.centre ? " yes" : " no"), role: "button", tabindex: "0", "aria-label": `${t("centre")}: ${s.centre ? t("yes") : t("no")}`, onclick: () => { SFX.tap(); set({ ...s, centre: !s.centre }); } },
        svg("rect", { x: 130, y: 166, width: 80, height: 30, rx: 10 }),
        Object.assign(svg("text", { x: 170, y: 186, "text-anchor": "middle" }), { textContent: t("centre") + " ⅓" })));
    put(box,
      h("div.sc-gst-grid",
        h("div.sc-gst-map", map, h("div.sc-stampmark" + (pass ? ".ok" : ".no") + (flipped ? ".hit" : ""), pass ? t("passed") : t("blocked")), h("p.sc-hint", t("tapSeats"))),
        h("div.sc-gst-side",
          h("div.sc-gst-row", h("span", t("centreVotes")), h("div.sc-seg2", [true, false].map((v) => h("button" + (s.centre === v ? ".on" : ""), { type: "button", onclick: () => { SFX.tap(); set({ ...s, centre: v }); } }, v ? t("yes") : t("no"))))),
          h("div.sc-gst-row", h("span", t("statesYes")), h("div.sc-step",
            h("button", { type: "button", "aria-label": "−", disabled: yes <= 0, onclick: () => { const y2 = s.yes.slice(); const j = y2.lastIndexOf(true); if (j >= 0) y2[j] = false; SFX.tap(); set({ ...s, yes: y2 }); } }, "−"),
            h("b", { "aria-live": "polite" }, String(yes)),
            h("button", { type: "button", "aria-label": "+", disabled: yes >= total, onclick: () => { const y2 = s.yes.slice(); const j = y2.indexOf(false); if (j >= 0) y2[j] = true; SFX.tap(); set({ ...s, yes: y2 }); } }, "+"))),
          h("div.sc-gst-row", h("button.sc-chip", { type: "button", onclick: () => set({ ...s, yes: s.yes.map(() => true) }) }, t("allYes")), h("button.sc-chip", { type: "button", onclick: () => set({ ...s, yes: s.yes.map(() => false) }) }, t("allNo"))),
          h("div.sc-meter", h("i.c", { style: { width: (s.centre ? 100 / 3 : 0) + "%" } }), h("i.s", { style: { width: (200 / 3) * (yes / total) + "%" } }), h("b")),
          h("div.sc-meter-l", h("span", `${t("weighted")}: `, h("strong", (Math.round(share * 1000) / 10).toLocaleString("en-IN") + "%")), h("span", t("need"))))),
      h("h3.sc-h3", t("find")),
      h("div.sc-finds", st.challenges.map((c) => h("div.sc-find" + (found[c.id] ? ".got" : "") + (fresh === c.id ? ".new" : ""),
        h("span.sc-find-ic", icon(found[c.id] ? "finish" : "pyq", 20)), h("div", h("b", L(c.ask)), found[c.id] && h("p", L(c.aha)))))),
      Object.keys(found).length >= st.challenges.length && [h("div.sc-why.ok", h("b", L(st.ahaTitle) + " "), L(st.aha)),
        (st.questions ?? []).map((q, n) => question(q, `${st.id}:q${n}`, { label: t("lastQ"), onDone: () => { addNote(`xq:${st.id}:${n}`); if (!isDone(st)) markDone(st); } }))]);
    if (fresh) burst(box.querySelector(".sc-find.new"));
    const allFound = Object.keys(found).length >= st.challenges.length;
    if (allFound && !(st.questions ?? []).length && !isDone(st)) markDone(st);
    // Chotu's nudges walk the three findings in order. If the same nudge comes round again, it carries a "Show me"
    // that sets the seats for that finding (the visitor still reads the meter and the finding themselves).
    const SHOW = { veto: () => ({ centre: false, yes: s.yes.map(() => true) }), fewest: () => ({ centre: true, yes: s.yes.map((_, i) => i < 20) }),
      block: () => ({ centre: true, yes: s.yes.map((_, i) => i < 19) }) };
    nudge = () => {
      const f = X.getA(st.id + ":found", {}), now = state();
      const next = ["veto", "fewest", "block"].find((k) => !f[k]);
      if (!next) return X.getA(`${st.id}:q0:pick`) == null && (st.questions ?? []).length ? { key: "gst-last" } : null;
      const key = next === "veto" ? (now.centre ? "gst-start" : "gst-all") : next === "fewest" ? "gst-close" : "gst-flip";
      const n = (stalls[key] = (stalls[key] ?? 0) + 1);
      return n < 2 ? { key } : { key, again: true, action: { label: B.showMe(), run: () => { track("demo_act", { step: st.id, act: "gst_show_" + next }); X.setA(K, SHOW[next]()); drawC(); } } };
    };
    if (!isDone(st)) act(t("skip"), () => goShow(barAt + 1), false); else act("", null);
  };
  drawC();
  return box;
}

// --- Mains: the plan builds itself, point by point, with the guide explaining each move -----------------------------

function mainsBuild(st) {
  const box = h("div.sc-mains");
  const drawM = () => {
    const qid = X.getA("mains:pick") ?? st.questions[0].id;
    const q = st.questions.find((x) => x.id === qid) ?? st.questions[0];
    const sk = q.skeleton;
    const lines = [["intro", t("open"), L(sk.intro)], ...sk.points.map((p, i) => ["p" + i, String(i + 1), L(p)]), ["way", t("way"), L(sk.wayForward)], ["trap", t("trap"), L(q.commonMistake)]];
    const built = X.getA("mains:built:" + q.id, 0);
    const other = st.questions.find((x) => x.id !== q.id);
    const own = X.getA("mains:own", false);
    // Each line arrives with its reason beside it: the side comment the guide would otherwise say out of sync.
    const why = (k) => mb(k);
    const board = h("ol.sc-plan", lines.slice(0, built).map(([k, tag, text], i) => h("li.sc-plan-li." + (k === "trap" ? "trap" : k === "way" ? "way" : "pt") + (i === built - 1 ? ".new" : ""),
      h("span.sc-plan-tag", tag), h("div.sc-plan-body", h("span", text), why(k) && h("small.sc-plan-why", icon("warmup", 14), why(k))))));
    const pair = st.conclusions?.pairs?.[0];
    put(box,
      h("div.sc-qcard",
        h("div.sc-chips", h("span.hot", L(q.source.label)), h("span", t("marks", q.marks, q.words))),
        h("p.sc-stem.big", L(q.q)),
        h("p.sc-asks", h("b", t("whatAsks") + ": "), L(q.directive)),
        h("div.sc-row",
          other && built === 0 && h("button.sc-link", { type: "button", onclick: () => { X.setA("mains:pick", other.id); drawM(); } }, t("otherQ")),
          built === 0 && !own && h("button.sc-link", { type: "button", onclick: () => { X.setA("mains:own", true); drawM(); } }, t("tryOwn")))),
      own && built === 0 && (() => { const ta = h("textarea.sc-own", { rows: 6, placeholder: t("ownHolder"), oninput: (e) => X.setA("mains:plan:" + q.id, e.target.value) }); ta.value = X.getA("mains:plan:" + q.id, ""); return ta; })(),
      board,
      built >= lines.length && pair && h("div.sc-concl", h("h3.sc-h3", t("whichEnd")),
        (() => {
          const pk = X.getA("mains:concl:0");
          return [["a", 0], ["b", 1]].map(([side, i]) => h("button.sc-opt" + (pk == null ? "" : i === pair.better ? ".right" : i === pk ? ".wrong" : ".dim"), { type: "button", disabled: pk != null,
            onclick: () => { X.setA("mains:concl:0", i); (i === pair.better ? SFX.right : SFX.wrong)(); if (!isDone(st)) markDone(st); drawM(); } },
            h("span.sc-letter", side.toUpperCase()), h("span.sc-opt-t", L(pair[side]))));
        })(),
        X.getA("mains:concl:0") != null && h("div.sc-why" + (X.getA("mains:concl:0") === pair.better ? ".ok" : ".no"), h("b", (X.getA("mains:concl:0") === pair.better ? t("right") : t("notQuite")) + " "), L(pair.why))));
    const step = () => {
      const n = X.getA("mains:built:" + q.id, 0);
      if (n >= lines.length) { if (!pair && !isDone(st)) markDone(st); return drawM(); }
      X.setA("mains:built:" + q.id, n + 1); SFX.flip();
      drawM();
      box.querySelector(n + 1 >= lines.length && pair ? ".sc-concl" : ".sc-plan-li.new")?.scrollIntoView?.({ block: "nearest", behavior: RM() ? "auto" : "smooth" });
      if (n + 1 < lines.length) later(step, 2600); else { addNote("m"); if (!pair && !isDone(st)) markDone(st); }
    };
    nudge = () => { const b = X.getA("mains:built:" + q.id, 0); return b === 0 ? { key: "mains" } : b >= lines.length && pair && X.getA("mains:concl:0") == null ? { key: "ending" } : null; };
    if (built >= lines.length) addNote("m");
    if (built === 0) act(t("build"), () => { track("demo_act", { step: st.id, act: "mains_build" }); act(t("building"), () => {}, false); step(); }, true);
    else if (built < lines.length) act(t("building"), () => { clearTimers(); while (X.getA("mains:built:" + q.id, 0) < lines.length) { const n = X.getA("mains:built:" + q.id, 0); X.setA("mains:built:" + q.id, n + 1); } drawM(); }, false);
    else if (pair && X.getA("mains:concl:0") == null) act(t("skip"), () => goShow(barAt + 1), false);
    else act("", null);
  };
  drawM();
  return box;
}

// --- The marking desk: three pages as trophies; notes appear in the margin one by one -----------------------------------

let fontsAsked = false;
function handFont() { if (fontsAsked) return; fontsAsked = true; document.head.append(h("link", { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap" })); }

function paper(snap, shown, { mini = false } = {}) {
  return h("div.sc-paper" + (mini ? ".mini" : ""), { "aria-label": L(snap.alt) },
    snap.lines.map((ln, i) => {
      const o = typeof ln === "object" ? ln : {};
      const notes = (snap.notes ?? []).filter((n) => n.line === i);
      return h("div.sc-line" + (o.strike ? ".strike" : "") + (o.indent ? ".indent" : ""), h("span.sc-hand", L(o.t ?? ln)),
        !mini && notes.map((n) => { const idx = snap.notes.indexOf(n); return idx < shown && h("span.sc-margin" + (n.kind === "good" ? ".good" : "") + (idx === shown - 1 ? ".new" : ""), h("b", n.level ?? "S"), L(n.text).replace(/^[SCE] · /, "")); }));
    }));
}

function essayDesk(st) {
  handFont();
  const box = h("div.sc-essay");
  const n = st.snaps.length;
  const drawE = () => {
    const lvl = Math.min(X.getA(st.id + ":lvl", 0), n);
    const shownKey = st.id + ":shown:" + lvl;
    const trophies = h("div.sc-snaps", st.snaps.map((s, i) => h("button.sc-snap" + (i === lvl ? ".on" : "") + (X.getA(st.id + ":shown:" + i, 0) >= (s.notes?.length ?? 0) ? ".seen" : ""), { type: "button", style: { "--r": `${(i - 1) * 3}deg` },
      onclick: () => { X.setA(st.id + ":lvl", i); SFX.flip(); drawE(); } }, paper(s, 0, { mini: true }), h("span.sc-snap-l", h("b", String(i + 1)), L(s.name)))),
      h("button.sc-snap.how" + (lvl === n ? ".on" : ""), { type: "button", style: { "--r": "4deg" }, onclick: () => { X.setA(st.id + ":lvl", n); drawE(); } }, h("span.sc-snap-cam", icon("camera", 34)), h("span.sc-snap-l", h("b", "?"), t("howMarked"))));
    const topic = h("div.sc-essay-topic", h("small", L(st.topicLabel)), h("b", L(st.topic)));
    if (lvl === n) {
      addNote("e");
      put(box, topic, trophies, howMarking(st));
      if (!isDone(st)) markDone(st);
      act("", null);
      return;
    }
    const s = st.snaps[lvl], total = s.notes?.length ?? 0, shown = X.getA(shownKey, 0);
    put(box, topic, trophies,
      h("div.sc-essay-stage",
        h("div.sc-essay-page", h("p.sc-snap-what", h("b", L(s.name) + ": "), L(s.what)), paper(s, shown), s.caption && h("p.sc-cap", L(s.caption))),
        h("div.sc-essay-side", h("h3.sc-h3", t("evaluator")), h("ul.sc-ticks", s.watch.map((w) => h("li", icon("check", 16), L(w)))), s.flaws && h("p.sc-slip", L(s.flaws)))));
    if (shown < total) later(() => { X.setA(shownKey, X.getA(shownKey, 0) + 1); SFX.flip(); drawE(); box.querySelector(".sc-margin.new")?.scrollIntoView?.({ block: "nearest", behavior: RM() ? "auto" : "smooth" }); }, shown === 0 ? 900 : 1800);
    act(lvl + 1 < n ? t("nextPage", L(st.snaps[lvl + 1].name)) : t("howMarked"), () => { clearTimers(); X.setA(shownKey, total); X.setA(st.id + ":lvl", lvl + 1); track("demo_act", { step: st.id, act: "snap_" + (lvl + 1) }); drawE(); X.top(); }, shown >= total);
  };
  drawE();
  return box;
}

function howMarking(st) {
  const s = st.snaps[st.snaps.length - 1];
  const sample = { ...s, lines: s.lines.slice(0, 5), notes: (s.notes ?? []).filter((x) => x.line < 5).slice(0, 2) };
  return h("div.sc-how",
    h("p.sc-joke", t("snapJoke")),
    h("div.sc-how-steps",
      h("div.sc-how-step.s1", h("div.sc-how-art", paper(sample, 0, { mini: true }), h("span.sc-flash")), h("b", h("span.sc-how-n", "1"), t("snap1"))),
      h("div.sc-how-step.s2", h("div.sc-how-art", paper(sample, 0, { mini: true }), h("span.sc-scan")), h("b", h("span.sc-how-n", "2"), t("snap2"))),
      h("div.sc-how-step.s3", h("div.sc-how-art", paper(sample, sample.notes.length)), h("b", h("span.sc-how-n", "3"), t("snap3")))),
    h("p", t("snapHow")),
    h("div.sc-plusline", h("span.sc-plus-tag", t("plus")), h("p", t("plusLine"))));
}

// --- Keep it: the start's guesses come back, then the cards; then where each card goes in time ------------------------

function keepIt(st) {
  const box = h("div.sc-keep");
  const warm = X.stepById("warmup")?.questions ?? [];
  const cards = st.onlyCards ? st.cards.filter((c) => st.onlyCards.includes(c.id)) : st.cards;
  const items = [...warm.map((q, i) => ({ q, k: `keep:warm:${i}`, warm: true })), ...cards.map((c) => ({ q: c, k: `keep:${c.id}`, card: c }))];
  const drawK = () => {
    const kept = X.getA("keep:done");
    const at = Math.min(X.getA("keep:at", 0), items.length);
    if (!kept && at < items.length) {
      const it = items[at], answered = () => X.getA(it.k + ":pick") != null;
      const next = () => { X.setA("keep:at", at + 1); drawK(); X.top(); };
      const label = it.warm ? t("remember") : t("card", at - warm.length + 1, cards.length);
      put(box, h("div.sc-dots", items.map((_, i) => h("i" + (i < at ? ".done" : i === at ? ".on" : "")))),
        h("div.sc-flipcard" + (RM() ? "" : ".flip-in"), { key: at }, question(it.q, it.k, { label, onDone: (ok) => { if (it.card) X.grade(it.card, ok); upd(); } })));
      nudge = () => (answered() ? null : { key: "keep" });
      const upd = () => answered() ? act(at + 1 < items.length ? t("nextCard") : t("saveCards"), at + 1 < items.length ? next : () => { X.setA("keep:at", items.length); drawK(); X.top(); }, true) : act(t("skip"), next, false);
      upd();
      return;
    }
    if (!kept) { X.setA("keep:done", X.keepCards(st, cards)); SFX.win(); track("demo_act", { step: st.id, act: "kept", n: cards.length }); return drawK(); }
    // Where each card lands: grouped by the day it comes back.
    const all = X.store.get("reviews", {}) ?? {}, today = X.today();
    const by = {};
    for (const c of cards) { const f = all[`${X.id()}:${c.id}`]?.f; const due = f?.due ?? today; (by[due] ??= []).push({ c, ok: X.getA(`keep:${c.id}:pick`) === c.answer }); }
    const days = Object.keys(by).sort();
    const label = (d) => { const n = Math.round((Date.parse(d + "T12:00:00") - Date.parse(today + "T12:00:00")) / 864e5); return n <= 1 ? t("tomorrow") : t("inDays", n); };
    put(box,
      h("h2.sc-h2", t("schedule")),
      h("div.sc-sched", days.map((d, di) => h("div.sc-sched-col", { style: { "--d": di } },
        h("div.sc-sched-day", h("b", label(d)), h("small", new Date(d + "T12:00:00").toLocaleDateString(hi() ? "hi-IN" : "en-IN", { day: "numeric", month: "short" }))),
        by[d].map(({ c, ok }, j) => h("div.sc-mini-card" + (ok ? ".ok" : ".no"), { style: { "--j": di * 3 + j } }, h("span", icon(ok ? "check" : "x", 14)), L(c.q)))))),
      h("p.sc-saved", t("saved", cards.length)));
    if (!isDone(st)) markDone(st);
    act("", null);
  };
  drawK();
  return box;
}

// --- The finale: the visitor's own notes page, then one join button and the two plans ------------------------------

function finale(st) {
  const list = seq();
  const skipped = list.map((id, i) => [i, X.view(X.stepById(id))]).filter(([, s]) => s.type !== "finish" && !isDone(s));
  const n = X.cardsHere();
  handFont();
  return [
    h("p.sc-sub", t("finLead2")),
    h("div.sc-notes.page", notesList()),
    skipped.length > 0 && h("p.sc-skipped", h("span", t("skippedSome")), skipped.map(([i, s]) => h("button.sc-link", { type: "button", onclick: () => goShow(i) }, nameOf(s)))),
    n > 0 && h("p.sc-saved", t("saved", n)),
    h("h2.sc-h2", t("keepGoing")),
    h("a.sc-go.ready.sc-join-big", { href: "#", onclick: () => X.joining("finish") }, h("span", t("joinKeep", n)), icon("arrow", 20)),
    h("p.sc-nocard", t("noCard")),
    h("p.sc-pod", t("podLine")),
    h("div.sc-plans.compact",
      h("div.sc-planc", h("div.sc-plan-name", t("free")), h("div.sc-price", "₹0"), h("ul.sc-ticks", t("freeList").map((x) => h("li", icon("check", 16), x)))),
      h("div.sc-planc.plus", h("div.sc-plan-name", t("plus")), h("div.sc-price", "₹3,999", h("small", t("perYear"))), h("div.sc-perday", t("perDay")),
        h("ul.sc-ticks", t("plusList").map((x) => h("li", icon("check", 16), x))), h("small", t("plusNote")))),
    X.day3Box("finish"),
    h("div.sc-cover-links", X.data().routes.full && h("button.sc-link", { type: "button", onclick: () => X.goFull() }, t("wholeTopic")), h("a.sc-link", { href: "#try" }, t("moreTopics"))),
  ];
}

// --- Look ------------------------------------------------------------------------------------------------------------

function css() {
  if (document.getElementById("sc-css")) return;
  document.head.append(h("style", { id: "sc-css" }, `
.sc-on main { max-width: 1240px; padding-top: 0; }
html.sc-on { scroll-padding: 80px 0 120px; }
@media (max-width: 999px) { html.sc-on { scroll-padding-bottom: 130px; } }
.sc-root { --sc-bg: #070A18; --sc-card: #121836; --sc-card2: #19204A; --sc-line: #2A3366; --sc-ink: #F2EFF9; --sc-muted: #A8AED0;
  --sc-sun: #F0A04B; --sc-gold: #FFC66B; --sc-ok: #5DD39E; --sc-bad: #FF7A6B; --sc-on-sun: #1B1205;
  max-width: 1200px !important; color: var(--sc-ink); padding-bottom: 130px; position: relative; color-scheme: dark; }
.sc-root::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background: radial-gradient(900px 500px at 85% -10%, #3A2A6A55, transparent 60%), radial-gradient(700px 420px at -10% 110%, #F0A04B22, transparent 60%), linear-gradient(180deg, #0B0F24, #070A18); }
.sc-root h1, .sc-root h2, .sc-root h3 { color: var(--sc-ink); }
.sc-root button { color: inherit; }
.sc-ic { fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; flex: none; }
/* top bar */
.sc-top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 14px; padding: 10px 2px; margin: 0 0 18px;
  background: linear-gradient(#070A18f2, #070A18cc); backdrop-filter: blur(10px); border-bottom: 1px solid #ffffff12; }
.sc-logo { flex: none; display: flex; align-items: center; gap: 8px; color: var(--sc-ink); text-decoration: none; font-family: var(--head-font); font-weight: 800; font-size: 18px; }
.sc-logo-mark svg { width: 28px; height: 28px; display: block; }
.sc-rail { flex: 1; min-width: 0; display: grid; gap: 4px; }
.sc-segs { display: flex; gap: 4px; }
.sc-seg { flex: 1; height: 6px; min-height: 0; padding: 0; border: 0; border-radius: 99px; background: #ffffff1c; cursor: pointer; transition: background .3s; }
.sc-seg.done { background: var(--sc-sun); opacity: .75; }
.sc-seg.on { background: var(--sc-gold); box-shadow: 0 0 10px #FFC66Bb0; }
.sc-rail-label { font-size: 12.5px; color: var(--sc-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sc-rail-label b { color: var(--sc-ink); }
.sc-iconbtn { width: 40px; height: 40px; min-height: 0; padding: 0; display: grid; place-items: center; border-radius: 50%; background: #ffffff0d; border: 1px solid #ffffff1f; }
.sc-lang { font-weight: 800; font-size: 14px; }
.sc-iconbtn[aria-pressed="true"] { color: var(--sc-gold); border-color: var(--sc-gold); }
.sc-root .try-lang .chip { color: var(--sc-ink); border-color: #ffffff2a; min-height: 40px; }
.sc-root .try-lang .chip[aria-pressed="true"] { background: #ffffff18; border-color: var(--sc-gold); }
.sc-join-pill { background: var(--sc-sun); color: var(--sc-on-sun); font-weight: 700; text-decoration: none; padding: 9px 16px; border-radius: 99px; white-space: nowrap; font-size: 14px; }
/* stage */
.sc-stage { display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 32px; align-items: start; } .sc-stage.solo { grid-template-columns: minmax(0, 1fr); }
.sc-main { min-width: 0; }
.sc-head { margin-bottom: 18px; }
.sc-kick { display: flex; align-items: center; gap: 8px; color: var(--sc-gold); font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.sc-kick-ic { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: #F0A04B26; color: var(--sc-gold); }
.sc-head h1 { font-size: clamp(28px, 4.2vw, 40px); line-height: 1.12; margin: 10px 0 6px; animation: sc-rise .5s both; }
.sc-sub { color: var(--sc-muted); font-size: 17px; margin: 0; animation: sc-rise .5s .08s both; }
.sc-h2 { font-size: 24px; margin: 28px 0 12px; } .sc-h2.center { text-align: center; } .sc-h3 { font-size: 18px; margin: 22px 0 10px; }
.sc-gold { color: var(--sc-gold); }
.sc-root .sc-link { background: none; border: 0; color: var(--sc-gold); text-decoration: underline; text-underline-offset: 3px; padding: 6px 2px; min-height: 0; font-size: 15px; cursor: pointer; }
.sc-chip { border: 1px solid #ffffff2e; background: #ffffff0f; border-radius: 99px; padding: 8px 14px; font-size: 14px; color: var(--sc-ink); }
.sc-chip:hover { border-color: var(--sc-gold); }
.sc-row { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
.sc-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.sc-chips span { font-size: 12.5px; padding: 3px 10px; border-radius: 99px; background: #ffffff14; color: var(--sc-ink); }
.sc-chips span.hot { background: #F0A04B2e; color: var(--sc-gold); font-weight: 700; }
/* bottom bar */
.sc-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; background: #070A18e8; backdrop-filter: blur(12px); border-top: 1px solid #ffffff16; }
.sc-bar-in { position: relative; max-width: 1200px; margin: 0 auto; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sc-bar-r { display: flex; align-items: center; gap: 10px; min-width: 0; }
.sc-back { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #ffffff26; min-height: 48px; padding: 0 16px; border-radius: 99px; }
.sc-go { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 0 22px; border-radius: 99px; font-weight: 800; font-size: 16.5px;
  border: 1px solid #ffffff30; background: #ffffff10; color: var(--sc-ink); text-decoration: none; max-width: 70vw; min-width: 0; transition: transform .15s, box-shadow .3s; }
.sc-go span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sc-go.ready { background: linear-gradient(135deg, #FFC66B, #F0A04B 55%, #E07B2A); color: var(--sc-on-sun); border-color: transparent; box-shadow: 0 8px 30px -8px #F0A04Bb0; }
.sc-go.ready:hover { transform: translateY(-1px); }
.sc-go.pulse { animation: sc-pulse 1.6s ease-out 2; }
.sc-go.wide { width: 100%; max-width: none; }
/* Chotu's corner sits in the bar (buddy.js styles the cup and bubble); here, where the bubble goes */
.sc-bar .bd-corner { position: static; }
.sc-bar .bd-bub { left: 16px; bottom: calc(100% + 8px); }
.sc-toast { position: absolute; right: 16px; bottom: calc(100% + 8px); background: #FBF5E8; color: #2A1B12; font-family: "Kalam", cursive; font-size: 16px; padding: 6px 14px; border-radius: 99px;
  box-shadow: 0 10px 30px -10px #000; opacity: 0; transform: translateY(6px); transition: opacity .25s, transform .25s; pointer-events: none; }
.sc-toast.in { opacity: 1; transform: none; }
/* My notes: a sheet of paper beside the work, in handwriting */
.sc-notes { position: sticky; top: 84px; background: #FBF5E8; color: #2A1B12; border-radius: 6px; padding: 16px 18px 18px 40px; box-shadow: 0 24px 50px -28px #000, 0 0 0 1px #e8dcc0;
  background-image: linear-gradient(to right, transparent 26px, #f2b8b8 26px, #f2b8b8 27px, transparent 27px); max-height: calc(100vh - 210px); overflow-y: auto; transform: rotate(.6deg); }
.sc-notes-h { font-family: "Kalam", cursive; font-weight: 700; font-size: 24px; margin: 0 0 6px; color: #2A1B12 !important; }
.sc-notes-list { margin: 0; padding: 0 0 0 18px; display: grid; gap: 8px; }
.sc-notes-list li { font-family: "Kalam", "Segoe Print", cursive; font-size: 17px; line-height: 1.4; color: #1f2a44; padding-left: 2px; }
.sc-notes-list li[lang=hi] { font-family: "Kalam", "Noto Sans Devanagari", sans-serif; }
.sc-notes-list li::marker { color: #B5562B; font-weight: 700; }
.sc-notes-list li.new { animation: sc-ink .9s both; background: linear-gradient(transparent 62%, #FFD98A99 62%); }
.sc-notes-empty { font-family: "Kalam", cursive; font-size: 17px; color: #7a6a52; margin: 4px 0 0; }
.sc-notes.page { position: static; transform: none; max-height: none; margin: 18px 0 14px; padding: 22px 24px 24px 52px; background-image: linear-gradient(to right, transparent 36px, #f2b8b8 36px, #f2b8b8 37px, transparent 37px), repeating-linear-gradient(#FBF5E8 0 33px, #e3d9c4 33px 34px); }
.sc-notes.page .sc-notes-list li { font-size: 19px; line-height: 34px; }
.sc-notes-chip { display: none; margin-left: auto; align-items: center; gap: 6px; min-height: 34px; padding: 0 12px; border-radius: 99px; border: 1px solid #FBF5E866; background: #FBF5E814; color: #FBF5E8;
  font-size: 13px; font-weight: 700; letter-spacing: 0; text-transform: none; }
.sc-notes-chip.bump { animation: sc-pop .5s; }
.sc-kick > span:first-of-type + span { min-width: 0; }
.sc-notes-sheet { width: min(560px, calc(100vw - 24px)); max-height: 80vh; background: transparent; border: 0; padding: 0; }
.sc-notes-sheet .sc-notes { position: static; max-height: 66vh; transform: none; }
.sc-notes-sheet form { text-align: right; margin-top: 10px; }
/* the closing line under a finished chapter */
.sc-coda { display: none; font-family: Georgia, "Noto Serif Devanagari", serif; font-style: italic; font-size: 21px; line-height: 1.45; color: var(--sc-gold); margin: 26px 0 0; padding-top: 16px; border-top: 1px solid #ffffff1a; max-width: 52ch; }
.sc-coda.on { display: block; } .sc-coda.in { animation: sc-rise .8s .3s both; }
/* cover: Chotu says hello */
.sc-chotu-hi { display: flex; gap: 14px; align-items: center; max-width: 620px; margin: 0 0 20px; animation: sc-rise .6s .15s both; }
.sc-chotu-hi svg { flex: none; } .sc-chotu-hi p { margin: 0; background: #FBF5E8; color: #2A1B12; border-radius: 16px 16px 16px 4px; padding: 12px 14px; font-size: 16px; line-height: 1.5; }
.sc-short { display: block; margin-top: 10px; text-align: left; }
/* PYQ second try */
.sc-opt.crossed { opacity: .55; text-decoration: line-through; text-decoration-color: var(--sc-bad); border-color: #FF7A6B55; }
.sc-again { color: var(--sc-gold); font-weight: 700; margin: 10px 0 0; }
/* marking desk: the Plus line */
.sc-plusline { display: flex; gap: 12px; align-items: flex-start; margin-top: 6px; padding: 14px; border-radius: 16px; background: linear-gradient(135deg, #9F7BFF22, #ffffff06); border: 1px solid #9F7BFF77; }
.sc-plusline p { margin: 0; } .sc-plus-tag { flex: none; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #C7B5FF; font-size: 13px; padding-top: 2px; }
/* finish */
.sc-skipped { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; color: var(--sc-muted); margin: 0 0 8px; }
.sc-join-big { width: 100%; max-width: 520px; min-height: 60px; font-size: 18px; }
.sc-nocard { color: var(--sc-muted); font-size: 14px; margin: 8px 0 0; } .sc-pod { font-size: 16.5px; line-height: 1.55; max-width: 62ch; margin: 18px 0; }
.sc-plans.compact .sc-planc { padding: 16px 18px; gap: 8px; } .sc-plans.compact .sc-price { font-size: 32px; }
/* questions */
.sc-dots { display: flex; gap: 6px; margin: 0 0 12px; } .sc-dots i { width: 26px; height: 5px; border-radius: 99px; background: #ffffff1f; }
.sc-dots i.done { background: var(--sc-sun); } .sc-dots i.on { background: var(--sc-gold); }
.sc-q { background: var(--sc-card); border: 1px solid var(--sc-line); border-radius: 20px; padding: 18px; animation: sc-rise .4s both; }
.sc-q-label { color: var(--sc-gold); font-size: 13px; font-weight: 700; margin-bottom: 4px; } .sc-q-src { color: var(--sc-muted); font-size: 13px; }
.sc-stem { font-size: 18px; font-weight: 700; line-height: 1.45; margin: 6px 0 14px; white-space: pre-line; } .sc-stem.big { font-size: 20px; }
.sc-opts { display: grid; gap: 8px; }
.sc-opt { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; background: var(--sc-card2); border: 1.5px solid #ffffff14; border-radius: 14px; padding: 11px 14px; min-height: 52px; font-size: 16px; transition: border-color .2s, transform .15s, background .2s; }
.sc-opt:not(:disabled):hover { border-color: #F0A04B99; transform: translateX(2px); }
.sc-opt:disabled { opacity: 1; cursor: default; }
.sc-letter { flex: none; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 14px; background: #F0A04B22; color: var(--sc-gold); border: 1px solid #F0A04B66; }
.sc-opt-t { flex: 1; }
.sc-opt.picked { border-color: var(--sc-gold); background: #F0A04B18; }
.sc-opt.right { border-color: var(--sc-ok); background: #5DD39E1c; } .sc-opt.right .sc-letter { background: var(--sc-ok); color: #06210f; border-color: var(--sc-ok); }
.sc-opt.wrong { border-color: var(--sc-bad); background: #FF7A6B18; } .sc-opt.wrong .sc-letter { background: var(--sc-bad); color: #2a0703; border-color: var(--sc-bad); }
.sc-opt.dim { opacity: .5; } .sc-opt.wrong.pop { animation: sc-shake .4s; } .sc-opt.right.pop { animation: sc-pop .4s; }
.sc-flag.ok { color: var(--sc-ok); } .sc-flag.no { color: var(--sc-bad); }
.sc-sure { margin-top: 12px; padding: 12px; border-radius: 14px; background: #FFC66B14; border: 1px dashed #FFC66B88; animation: sc-rise .3s both; }
.sc-sure > span { font-weight: 700; color: var(--sc-gold); } .sc-sure-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.sc-sure-row .sc-chip { font-size: 15px; padding: 10px 16px; }
.sc-why { margin-top: 12px; padding: 12px 14px; border-radius: 14px; border-left: 4px solid var(--sc-sun); background: #ffffff0a; line-height: 1.5; animation: sc-rise .35s both; }
.sc-why.ok { border-color: var(--sc-ok); } .sc-why.no { border-color: var(--sc-bad); }
.sc-why b { color: var(--sc-ink); } .sc-law { color: var(--sc-muted); font-size: 14px; margin-top: 6px; }
.sc-tally { display: flex; gap: 20px; align-items: center; background: var(--sc-card); border: 1px solid var(--sc-line); border-radius: 20px; padding: 20px; animation: sc-rise .4s both; }
.sc-tally-n { font-family: var(--head-font); font-weight: 800; color: var(--sc-gold); white-space: nowrap; } .sc-big { font-size: 64px; } .sc-tally-n span:last-child { font-size: 28px; color: var(--sc-muted); }
.sc-tally p { margin: 6px 0; } .sc-tally small { color: var(--sc-muted); }
/* video */
.sc-video { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 28px; align-items: start; }
.sc-video-left { display: grid; justify-items: center; gap: 6px; }
.sc-player { position: relative; width: 100%; max-width: 260px; }
.sc-player-glow { position: absolute; inset: 8% -6%; width: 112%; height: 84%; object-fit: cover; filter: blur(38px) saturate(1.6); opacity: .55; z-index: 0; }
.sc-phone { position: relative; z-index: 1; aspect-ratio: 9 / 16; border-radius: 28px; overflow: hidden; background: #000; border: 6px solid #1d2142; box-shadow: 0 30px 60px -20px #000, inset 0 0 0 1px #ffffff22; }
.sc-phone video, .sc-poster { width: 100%; height: 100%; object-fit: cover; display: block; }
.sc-player-shade { position: absolute; inset: 0; background: linear-gradient(180deg, #0000 45%, #000c); }
.sc-playbtn { position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%); width: 84px; height: 84px; padding: 0; min-height: 0; border-radius: 50%; border: 0; display: grid; place-items: center;
  background: linear-gradient(135deg, #FFC66B, #F0A04B); color: var(--sc-on-sun); box-shadow: 0 10px 40px #F0A04B99; }
.sc-playbtn .sc-ic { fill: currentColor; stroke: none; margin-left: 5px; }
.sc-ring { position: absolute; inset: -8px; border-radius: 50%; border: 2px solid #FFC66B; animation: sc-ring 1.8s ease-out infinite; }
.sc-player-cap { position: absolute; left: 14px; right: 14px; bottom: 14px; display: grid; gap: 8px; } .sc-player-cap b { font-family: var(--head-font); font-size: 19px; line-height: 1.2; }
.sc-vq.glow .sc-q { box-shadow: 0 0 0 2px var(--sc-gold), 0 0 40px -10px var(--sc-gold); }
.sc-vq .sc-h2 { margin-top: 0; }
.sc-dialog { max-width: 560px; background: var(--sc-card); color: var(--sc-ink); border: 1px solid var(--sc-line); border-radius: 18px; padding: 20px; line-height: 1.6; }
.sc-dialog::backdrop { background: #000a; }
/* governor */
.sc-bill { position: relative; background: #FFF8E8; color: #2a2118; border-radius: 6px; padding: 18px 20px 70px; min-height: 180px; box-shadow: 0 24px 50px -24px #000, 0 0 0 1px #e8dcc0; overflow: hidden;
  background-image: repeating-linear-gradient(#0000 0 27px, #e9dfc8 27px 28px); }
.sc-bill.slide { animation: sc-slide .45s both; }
.sc-bill-top { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 8px; }
.sc-bill-n { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: #7a6a52; }
.sc-bill-stamp { white-space: nowrap; flex: none; font-size: 11.5px; letter-spacing: .08em; text-transform: uppercase; border: 2px solid #2d5aa0; color: #2d5aa0; padding: 2px 8px; border-radius: 4px; transform: rotate(-2deg); }
.sc-bill-text { font-family: Georgia, serif; font-size: 19px; line-height: 1.45; margin: 4px 0; } .sc-bill-note { font-style: italic; color: #7a4b12; margin: 8px 0 0; }
.sc-seal { position: absolute; right: 16px; bottom: 14px; transform: rotate(-12deg); border: 3px solid; border-radius: 10px; padding: 6px 12px; text-align: center; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; background: #fff8e8cc; max-width: 55%; }
.sc-seal small { display: block; font-size: 10.5px; font-weight: 700; } .sc-seal.ok { color: #1b7a43; } .sc-seal.no { color: #b42318; }
.sc-seal.hit { animation: sc-stamp .45s cubic-bezier(.2,1.6,.4,1) both; }
.sc-ask { font-weight: 800; font-size: 17px; margin: 18px 0 10px; }
.sc-stamps { display: flex; flex-wrap: wrap; gap: 10px; }
.sc-stampbtn { min-height: 50px; padding: 0 18px; border-radius: 12px; border: 2px dashed #ffffff40; background: #ffffff0a; font-weight: 700; font-size: 15.5px; }
.sc-stampbtn:not(:disabled):hover { border-style: solid; border-color: var(--sc-gold); transform: translateY(-2px); }
.sc-stampbtn.ok { border: 2px solid var(--sc-ok); background: #5DD39E22; opacity: 1; } .sc-stampbtn.no { border: 2px solid var(--sc-bad); background: #FF7A6B22; opacity: 1; } .sc-stampbtn.dim { opacity: .4; }
.sc-wrap { background: var(--sc-card); border: 1px solid var(--sc-line); border-radius: 20px; padding: 18px; font-size: 17px; line-height: 1.55; }
/* sort */
.sc-tray { border: 2px dashed #ffffff30; border-radius: 20px; padding: 14px; background: #ffffff06; margin-bottom: 14px; transition: opacity .3s; }
.sc-tray.empty { display: none; }
.sc-tray-head { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; margin-bottom: 10px; } .sc-tray-head span { color: var(--sc-muted); font-size: 14px; }
.sc-tray-tiles { display: flex; flex-wrap: wrap; gap: 8px; }
.sc-tile { touch-action: none; user-select: none; cursor: grab; display: inline-flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; padding: 10px 14px; min-height: 44px;
  border-radius: 12px; background: linear-gradient(180deg, #232B5C, #1A2150); border: 1px solid #ffffff2a; box-shadow: 0 4px 0 #0c1030, 0 8px 18px -10px #000; font-weight: 600; font-size: 15px; }
.sc-tile:hover { border-color: var(--sc-gold); } .sc-tile.sel { border-color: var(--sc-gold); box-shadow: 0 0 0 3px #FFC66B55, 0 4px 0 #0c1030; transform: translateY(-2px); }
.sc-tile.lifted { opacity: .3; }
.sc-ghost { position: fixed; left: 0; top: 0; z-index: 100; pointer-events: none; box-shadow: 0 20px 40px -10px #000; border-color: var(--sc-gold); }
.sc-bins { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.sc-bin { --c: #7C9CFF; border-radius: 20px; padding: 12px; background: color-mix(in srgb, var(--c) 9%, #0d1230); border: 2px solid color-mix(in srgb, var(--c) 45%, transparent); min-height: 170px; transition: transform .2s, box-shadow .2s, border-color .2s; cursor: default; }
.sc-bin.union { --c: #7C9CFF; } .sc-bin.state { --c: #5DD39E; } .sc-bin.conc { --c: #FFC66B; }
.sc-bin.armed, .sc-sort.dragging .sc-bin { cursor: pointer; border-style: dashed; animation: sc-breathe 1.4s ease-in-out infinite; }
.sc-bin.over { transform: scale(1.03); box-shadow: 0 0 0 3px var(--c), 0 0 40px -6px var(--c); border-style: solid; animation: none; }
.sc-bin-head { display: flex; justify-content: space-between; align-items: center; color: var(--c); font-size: 17px; margin-bottom: 8px; }
.sc-bin-head span { font-size: 13px; background: color-mix(in srgb, var(--c) 22%, transparent); color: var(--sc-ink); border-radius: 99px; padding: 1px 9px; }
.sc-bin-body { display: flex; flex-direction: column; gap: 6px; align-items: stretch; }
.sc-bin-body .sc-tile { width: 100%; }
.sc-drop { display: grid; place-items: center; min-height: 100px; border: 1.5px dashed color-mix(in srgb, var(--c) 50%, transparent); border-radius: 14px; color: color-mix(in srgb, var(--c) 80%, #fff); font-size: 14px; opacity: .8; }
.sc-tile.done { cursor: default; box-shadow: none; } .sc-tile.ok { border-color: var(--sc-ok); background: #5DD39E1a; } .sc-tile.no { border-color: var(--sc-bad); background: #FF7A6B1a; animation: sc-shake .4s; }
.sc-tile small { font-weight: 400; font-size: 13px; color: var(--sc-bad); } .sc-tile small.sc-tile-why { color: var(--sc-muted); }
/* gst */
.sc-gst-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 18px; align-items: center; background: var(--sc-card); border: 1px solid var(--sc-line); border-radius: 22px; padding: 16px; }
.sc-gst-map { position: relative; }
.sc-chamber { width: 100%; height: auto; display: block; }
.sc-arc { fill: none; stroke: #ffffff0c; stroke-width: 86; }
.sc-seat { cursor: pointer; } .sc-seat .hit { fill: transparent; }
.sc-seat circle:not(.hit) { transition: fill .25s, r .2s; stroke: #0007; stroke-width: 1; }
.sc-seat.yes circle:not(.hit) { fill: #5DD39E; } .sc-seat.no circle:not(.hit) { fill: #FF7A6B; }
.sc-seat:hover circle:not(.hit), .sc-seat:focus circle:not(.hit) { r: 11; }
.sc-centre { cursor: pointer; } .sc-centre rect { stroke-width: 2; transition: fill .25s; } .sc-centre text { font-weight: 800; font-size: 14px; fill: #0b0e1c; }
.sc-centre.yes rect { fill: #5DD39E; stroke: #b8f5d8; } .sc-centre.no rect { fill: #FF7A6B; stroke: #ffc2b8; }
.sc-stampmark { position: absolute; right: 2%; top: 4%; transform: rotate(10deg); border: 3px solid; border-radius: 10px; padding: 4px 12px; font-weight: 900; font-size: 22px; letter-spacing: .08em; text-transform: uppercase; }
.sc-stampmark.ok { color: var(--sc-ok); } .sc-stampmark.no { color: var(--sc-bad); } .sc-stampmark.hit { animation: sc-stamp .45s cubic-bezier(.2,1.6,.4,1) both; }
.sc-hint { color: var(--sc-muted); font-size: 13.5px; text-align: center; margin: 4px 0 0; }
.sc-gst-side { display: grid; gap: 12px; }
.sc-gst-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.sc-seg2 { display: flex; border: 1px solid #ffffff2a; border-radius: 99px; overflow: hidden; } .sc-seg2 button { border: 0; border-radius: 0; min-height: 40px; padding: 0 16px; background: transparent; }
.sc-seg2 button.on { background: var(--sc-sun); color: var(--sc-on-sun); font-weight: 800; }
.sc-step { display: flex; align-items: center; gap: 10px; } .sc-step button { width: 40px; height: 40px; padding: 0; min-height: 0; border-radius: 50%; font-size: 20px; background: #ffffff12; border: 1px solid #ffffff2a; }
.sc-step b { font-size: 24px; min-width: 2ch; text-align: center; font-variant-numeric: tabular-nums; }
.sc-meter { position: relative; height: 18px; border-radius: 99px; background: #ffffff14; display: flex; overflow: visible; }
.sc-meter i { display: block; height: 100%; transition: width .45s cubic-bezier(.2,.9,.3,1); } .sc-meter i.c { background: #9F7BFF; border-radius: 99px 0 0 99px; } .sc-meter i.s { background: var(--sc-sun); }
.sc-meter b { position: absolute; left: 75%; top: -5px; bottom: -5px; width: 3px; background: #fff; border-radius: 2px; box-shadow: 0 0 8px #fff; }
.sc-meter-l { display: flex; justify-content: space-between; font-size: 14px; color: var(--sc-muted); } .sc-meter-l strong { color: var(--sc-ink); font-size: 18px; }
.sc-finds { display: grid; gap: 10px; }
.sc-find { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 16px; background: #ffffff08; border: 1px solid #ffffff16; position: relative; transition: background .4s, border-color .4s; }
.sc-find-ic { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: #ffffff10; color: var(--sc-muted); flex: none; }
.sc-find.got { background: linear-gradient(135deg, #FFC66B22, #F0A04B0d); border-color: #FFC66B88; } .sc-find.got .sc-find-ic { background: var(--sc-gold); color: var(--sc-on-sun); }
.sc-find.new { animation: sc-pop .5s; } .sc-find p { margin: 4px 0 0; color: var(--sc-ink); }
/* mains */
.sc-qcard { background: var(--sc-card); border: 1px solid var(--sc-line); border-radius: 20px; padding: 18px; }
.sc-asks { color: var(--sc-muted); margin: 0 0 6px; } .sc-asks b { color: var(--sc-ink); }
.sc-own { width: 100%; margin-top: 10px; background: #ffffff0a; color: var(--sc-ink); border: 1px solid var(--sc-line); border-radius: 14px; padding: 12px; }
.sc-plan { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 10px; }
.sc-plan-li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 16px; background: #ffffff0a; border: 1px solid #ffffff16; line-height: 1.5; }
.sc-plan-body { display: grid; gap: 6px; }
.sc-plan-why { display: flex; gap: 6px; align-items: flex-start; color: var(--sc-gold); font-size: 13.5px; line-height: 1.4; font-style: italic; }
.sc-plan-why .sc-ic { margin-top: 2px; }
.sc-plan-li.new .sc-plan-why { animation: sc-rise .5s .7s both; }
.sc-plan-li.new { animation: sc-write .6s both; border-color: var(--sc-gold); }
.sc-plan-tag { flex: none; min-width: 30px; height: 30px; padding: 0 8px; border-radius: 99px; display: grid; place-items: center; background: #F0A04B26; color: var(--sc-gold); font-weight: 800; font-size: 13px; }
.sc-plan-li.way { border-color: #5DD39E55; } .sc-plan-li.way .sc-plan-tag { background: #5DD39E26; color: var(--sc-ok); }
.sc-plan-li.trap { border-color: #FF7A6B66; background: #FF7A6B10; } .sc-plan-li.trap .sc-plan-tag { background: #FF7A6B26; color: var(--sc-bad); }
.sc-concl .sc-opt { align-items: flex-start; }
/* essay */
.sc-essay-topic { display: grid; gap: 4px; padding: 14px 18px; border-radius: 18px; background: var(--sc-card); border: 1px solid var(--sc-line); margin-bottom: 18px; }
.sc-essay-topic small { color: var(--sc-muted); } .sc-essay-topic b { font-family: var(--head-font); font-size: 20px; }
.sc-snaps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
.sc-snap { position: relative; padding: 8px 8px 0; min-height: 0; border-radius: 10px; background: #fffdf6; border: 0; transform: rotate(var(--r)); box-shadow: 0 14px 30px -14px #000; transition: transform .25s, box-shadow .25s; overflow: hidden; color: #1f2a44; text-align: left; }
.sc-root .sc-snap { color: #1f2a44; } .sc-root .sc-snap.how { color: var(--sc-ink); }
.sc-snap:hover { transform: rotate(0) translateY(-4px); }
.sc-snap.on { transform: rotate(0) translateY(-6px) scale(1.04); box-shadow: 0 0 0 3px var(--sc-gold), 0 20px 40px -14px #000; }
.sc-snap.seen::after { content: "✓"; position: absolute; top: 6px; right: 8px; width: 22px; height: 22px; border-radius: 50%; background: var(--sc-ok); color: #06210f; font-size: 13px; font-weight: 900; display: grid; place-items: center; }
.sc-snap-l { display: flex; gap: 6px; align-items: center; padding: 8px 4px; font-weight: 700; font-size: 14px; background: #fffdf6; position: relative; }
.sc-snap-l b { width: 22px; height: 22px; border-radius: 50%; background: #F0A04B; color: #1B1205; display: grid; place-items: center; font-size: 12px; }
.sc-snap.how { background: linear-gradient(160deg, #2B3470, #1A2150); color: var(--sc-ink); display: grid; } .sc-snap.how .sc-snap-l { background: transparent; }
.sc-snap-cam { display: grid; place-items: center; height: 92px; color: var(--sc-gold); }
.sc-paper { background: #fffdf6; color: #1f2a44; border-radius: 6px; padding: 12px 14px 14px 42px; position: relative;
  background-image: linear-gradient(to right, transparent 30px, #f2b8b8 30px, #f2b8b8 31px, transparent 31px), repeating-linear-gradient(#fffdf6 0 29px, #cfdcec 29px 30px); }
.sc-paper.mini { padding: 4px 4px 4px 14px; height: 92px; overflow: hidden; background-image: linear-gradient(to right, transparent 10px, #f2b8b8 10px, #f2b8b8 11px, transparent 11px), repeating-linear-gradient(#fffdf6 0 11px, #cfdcec 11px 12px); }
.sc-paper.mini .sc-line { min-height: 12px; line-height: 12px; } .sc-paper.mini .sc-hand { font-size: 8px; }
.sc-line { min-height: 30px; line-height: 30px; } .sc-line.indent { padding-left: 1.4em; } .sc-line.strike .sc-hand { text-decoration: line-through; text-decoration-color: #b33; }
.sc-hand { font-family: "Kalam", "Segoe Print", "Bradley Hand", cursive; font-size: 18px; }
.sc-margin { display: block; font-family: "Kalam", cursive; font-size: 15px; line-height: 1.35; color: #b42318; margin: 2px 0 8px; padding: 2px 0 2px 10px; border-left: 3px solid currentColor; }
.sc-margin b { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid currentColor; font-size: 11px; margin-right: 6px; font-family: system-ui; }
.sc-margin.good { color: #1b7a43; } .sc-margin.new { animation: sc-ink .7s both; }
.sc-essay-stage { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 18px; align-items: start; }
.sc-snap-what { color: var(--sc-muted); margin: 0 0 8px; } .sc-snap-what b { color: var(--sc-ink); }
.sc-essay-side { background: var(--sc-card); border: 1px solid var(--sc-line); border-radius: 18px; padding: 4px 16px 12px; }
.sc-ticks { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; } .sc-ticks li { display: flex; gap: 8px; align-items: flex-start; line-height: 1.45; } .sc-ticks .sc-ic { color: var(--sc-ok); margin-top: 3px; }
.sc-cap { color: var(--sc-muted); font-size: 13px; margin: 6px 0 0; }
.sc-slip { color: var(--sc-bad); font-size: 14.5px; }
.sc-how { background: var(--sc-card); border: 1px solid var(--sc-line); border-radius: 20px; padding: 18px; line-height: 1.55; }
.sc-joke { font-size: 18px; font-weight: 700; margin-top: 0; }
.sc-how-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 14px 0; }
.sc-how-step { display: grid; gap: 8px; } .sc-how-step > b { display: flex; gap: 8px; align-items: center; font-size: 14.5px; }
.sc-how-n { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--sc-sun); color: var(--sc-on-sun); font-size: 12px; flex: none; }
.sc-how-art { position: relative; border-radius: 10px; overflow: hidden; height: 150px; background: #fffdf6; }
.sc-how-art .sc-paper { height: 150px; overflow: hidden; } .sc-how-art .sc-paper:not(.mini) { padding-left: 30px; font-size: 12px; }
.sc-how-step.s3 .sc-hand { font-size: 12px; } .sc-how-step.s3 .sc-line { min-height: 20px; line-height: 20px; } .sc-how-step.s3 .sc-margin { font-size: 11px; margin: 0 0 3px; }
.sc-how-step.s3 .sc-paper { background-image: repeating-linear-gradient(#fffdf6 0 19px, #cfdcec 19px 20px); padding-left: 10px; }
.sc-how-art .sc-paper.mini { height: 150px; } .sc-how-art .sc-paper.mini .sc-line { min-height: 20px; line-height: 20px; } .sc-how-art .sc-paper.mini .sc-hand { font-size: 12px; }
.sc-flash { position: absolute; inset: 0; background: #fff; opacity: 0; animation: sc-flash 3s 1s infinite; }
.sc-how-art::before { content: ""; position: absolute; inset: 10px; border: 2px solid #F0A04B; border-radius: 8px; z-index: 2; }
.sc-how-step.s3 .sc-how-art::before { display: none; }
.sc-scan { position: absolute; left: 0; right: 0; height: 26px; top: 0; background: linear-gradient(#5DD39E00, #5DD39E66, #5DD39E00); animation: sc-scan 2.2s ease-in-out infinite; }
/* keep */
.sc-flipcard.flip-in { animation: sc-flip .5s both; transform-origin: 50% 50%; }
.sc-sched { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.sc-sched-col { background: var(--sc-card); border: 1px solid var(--sc-line); border-radius: 18px; padding: 12px; display: grid; gap: 8px; align-content: start; animation: sc-rise .45s calc(var(--d) * .15s) both; }
.sc-sched-day b { display: block; color: var(--sc-gold); font-size: 17px; } .sc-sched-day small { color: var(--sc-muted); }
.sc-mini-card { display: flex; gap: 8px; align-items: flex-start; font-size: 13.5px; line-height: 1.35; padding: 8px 10px; border-radius: 12px; background: var(--sc-card2); border: 1px solid #ffffff18; animation: sc-fly .55s calc(.3s + var(--j) * .12s) both; }
.sc-mini-card.ok .sc-ic { color: var(--sc-ok); } .sc-mini-card.no .sc-ic { color: var(--sc-bad); }
.sc-saved { margin-top: 14px; font-size: 16px; }
/* finale */
.sc-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 18px; }
.sc-planc { display: grid; gap: 10px; align-content: start; padding: 20px; border-radius: 22px; background: var(--sc-card); border: 2px solid var(--sc-sun); }
.sc-planc.plus { border-color: #9F7BFF; background: linear-gradient(160deg, #9F7BFF1c, var(--sc-card)); }
.sc-plan-name { font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--sc-gold); } .sc-planc.plus .sc-plan-name { color: #C7B5FF; }
.sc-price { font-family: var(--head-font); font-size: 40px; font-weight: 800; } .sc-price small { font-size: 16px; color: var(--sc-muted); } .sc-perday { color: var(--sc-muted); margin-top: -8px; }
.sc-planc > small { color: var(--sc-muted); }
.sc-root .try-day3 { background: var(--sc-card); border-color: var(--sc-line); color: var(--sc-ink); border-radius: 20px; }
.sc-root .try-day3 input[type=email] { width: 100%; background: #ffffff0d; color: var(--sc-ink); border: 1px solid var(--sc-line); border-radius: 12px; padding: 10px; }
.sc-root .try-day3 button.primary { background: var(--sc-sun); color: var(--sc-on-sun); border-color: var(--sc-sun); }
.sc-root .try-day3 .muted, .sc-root .try-day3 .small.muted { color: var(--sc-muted); }
/* cover */
.sc-cover { padding: 10px 0 20px; }
.sc-hero { font-size: clamp(34px, 6vw, 60px); line-height: 1.06; margin: 14px 0 12px; letter-spacing: -.02em; background: linear-gradient(120deg, #fff 30%, #FFC66B 70%, #F0A04B); -webkit-background-clip: text; background-clip: text; color: transparent !important; animation: sc-rise .6s both; }
.sc-hero-sub { font-size: 20px; color: var(--sc-muted); margin: 0 0 22px; animation: sc-rise .6s .1s both; }
.sc-start { font-size: 18px; min-height: 60px; padding: 0 30px; animation: sc-rise .6s .2s both, sc-pulse 2s 1.2s ease-out 2; }
.sc-path { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin: 28px 0 18px; }
.sc-path-step { position: relative; display: grid; gap: 6px; justify-items: start; text-align: left; padding: 14px; border-radius: 16px; background: #ffffff08; border: 1px solid #ffffff18; min-height: 0; font-weight: 700; font-size: 14.5px; animation: sc-rise .5s calc(.3s + var(--i) * .06s) both; }
.sc-path-step:hover { border-color: var(--sc-gold); background: #F0A04B12; }
.sc-path-ic { color: var(--sc-gold); } .sc-path-n { position: absolute; top: 10px; right: 12px; color: var(--sc-muted); font-size: 12px; font-weight: 600; }
.sc-cover-pitch { color: var(--sc-muted); max-width: 62ch; line-height: 1.55; }
.sc-cover-links { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 14px; }
.sc-reader p { font-size: 17.5px; line-height: 1.75; } .sc-remember { padding: 14px; border-radius: 16px; background: #F0A04B14; border: 1px solid #F0A04B55; }
/* sparks */
.sc-burst { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; z-index: 5; }
.sc-burst i { position: absolute; width: 8px; height: 8px; border-radius: 2px; background: var(--c); animation: sc-spark .9s ease-out forwards; }
.sc-find, .sc-sort { position: relative; }
/* motion */
@keyframes sc-rise { from { opacity: 0; transform: translateY(12px); } }
@keyframes sc-pop { 0% { opacity: 0; transform: scale(.85); } 70% { transform: scale(1.03); } }
@keyframes sc-shake { 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
@keyframes sc-pulse { 0% { box-shadow: 0 0 0 0 #F0A04Bcc; } 100% { box-shadow: 0 0 0 18px #F0A04B00; } }
@keyframes sc-ring { from { transform: scale(.9); opacity: .9; } to { transform: scale(1.35); opacity: 0; } }
@keyframes sc-stamp { 0% { opacity: 0; transform: rotate(-12deg) scale(2.4); } 60% { opacity: 1; transform: rotate(-12deg) scale(.92); } 100% { transform: rotate(-12deg) scale(1); } }
.sc-stampmark.hit { animation-name: sc-stamp2; } @keyframes sc-stamp2 { 0% { opacity: 0; transform: rotate(10deg) scale(2.4); } 60% { opacity: 1; transform: rotate(10deg) scale(.92); } 100% { transform: rotate(10deg) scale(1); } }
@keyframes sc-slide { from { opacity: 0; transform: translateX(40px) rotate(2deg); } }
@keyframes sc-breathe { 50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 30%, transparent); } }
@keyframes sc-write { from { opacity: 0; transform: translateX(-14px); clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes sc-ink { from { opacity: 0; clip-path: inset(0 100% 0 0); } to { opacity: 1; clip-path: inset(0 0 0 0); } }
@keyframes sc-flash { 0%, 8%, 100% { opacity: 0; } 4% { opacity: .9; } }
@keyframes sc-scan { 0% { top: -26px; } 100% { top: 150px; } }
@keyframes sc-flip { from { opacity: 0; transform: perspective(900px) rotateY(-70deg); } }
@keyframes sc-fly { from { opacity: 0; transform: translateY(-30px) scale(.9); } }
@keyframes sc-spark { to { transform: translate(var(--dx), var(--dy)) rotate(200deg); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .sc-root *, .sc-root *::before, .sc-root *::after { animation: none !important; transition: none !important; } }
/* phones and small laptops */
@media (max-width: 999px) {
  .sc-stage { grid-template-columns: minmax(0, 1fr); }
  .sc-root { padding-bottom: 120px; }
  .sc-notes:not(.page) { display: none; } .sc-notes-chip { display: inline-flex; }
  .sc-sheet .sc-notes, .sc-notes-sheet .sc-notes { display: block; }
  .sc-video { grid-template-columns: minmax(0, 1fr); } .sc-player { max-width: 260px; margin: 0 auto; }
  .sc-gst-grid, .sc-essay-stage { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .sc-top { gap: 8px; } .sc-logo > span:not(.sc-logo-mark) { display: none; }
  .sc-sort:not(.checked) .sc-bins { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .sc-sort:not(.checked) .sc-bin { padding: 8px 6px; min-height: 150px; border-radius: 14px; }
  .sc-sort:not(.checked) .sc-bin-head { font-size: 14px; } .sc-sort:not(.checked) .sc-bin .sc-tile { font-size: 12.5px; padding: 8px; }
  .sc-tray .sc-tile { font-size: 14px; padding: 7px 11px; min-height: 38px; } .sc-tray-head span { font-size: 13px; }
  .sc-sort:not(.checked) .sc-drop { min-height: 90px; font-size: 12px; text-align: center; } .sc-rail-label { font-size: 12px; }
  .sc-join-pill { padding: 8px 12px; font-size: 13px; }
  .sc-back span { display: none; } .sc-back { padding: 0 12px; } .sc-bar-in { gap: 8px; padding-left: 10px; padding-right: 10px; } .sc-bar-r { gap: 8px; }
  .sc-bar .bd-bub { left: 10px; } .sc-coda { font-size: 19px; } .sc-chotu-hi p { font-size: 15px; }
  .sc-go { font-size: 15px; padding: 0 14px; max-width: none; }
  .sc-snaps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sc-how-steps { grid-template-columns: minmax(0, 1fr); }
  .sc-stem { font-size: 17px; } .sc-opt { font-size: 15px; }
  .sc-tally { flex-direction: column; align-items: flex-start; } .sc-big { font-size: 52px; }
}
`));
}
