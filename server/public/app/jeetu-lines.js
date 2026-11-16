// Jeetu's scripted lines and the streak double act, as plain data: the web app shows them (jeetu.js) and the server
// may voice exactly these, by key (src/voice.ts). Android keeps the same words in data/Jeetu.kt.

/** His lines, by moment. English and Hindi side by side, as the content packs are. */
export const LINES = {
  intro: { en: "Answer first. Then look. That's the whole method, beta.", hi: "पहले जवाब। फिर देखना। बस यही तरीक़ा है, बेटा।" },
  reviewStart: { en: "You don't have a reading problem, beta. You have a forgetting problem. Ten minutes: pull each one out of your head before you check.", hi: "पढ़ने में दिक़्क़त नहीं है, बेटा। भूलने में है। दस मिनट: हर एक को पहले अपने दिमाग़ से निकालो, फिर मिलाओ।" },
  reviewEnd: { en: "Bas. That's today. Each one comes back just when it's about to slip.", hi: "बस। आज का हो गया। हर एक ठीक तब लौटेगा जब फिसलने वाला होगा।" },
  selfMark: { en: "Be your own examiner first, beta. Did you answer what the directive word asked?", hi: "पहले ख़ुद परीक्षक बनो, बेटा। जो निर्देश-शब्द ने माँगा, क्या वही लिखा?" },
  second: { en: "Now the second opinion. Where you two differ, look again: neither is always right.", hi: "अब दूसरी राय। जहाँ तुम दोनों अलग हो, वहाँ फिर देखो: हमेशा कोई एक सही नहीं होता।" },
  rewrite: { en: "Rewrite only the weakest part. One fix, done well. बस, लिखो।", hi: "सिर्फ़ सबसे कमज़ोर हिस्सा दोबारा लिखो। एक सुधार, ठीक से। बस, लिखो।" },
  reread: { en: "Answer first, beta. Then look. Re-reading feels like learning; it isn't.", hi: "पहले जवाब, बेटा। फिर देखना। दोबारा पढ़ना सीखने जैसा लगता है; होता नहीं।" },
  rereadNote: { en: "Answer first, beta. Then look. Say the points out loud before you open your note.", hi: "पहले जवाब, बेटा। फिर देखना। नोट खोलने से पहले मुख्य बातें बोलकर कहो।" },
  sure: { en: "Prelims charges you for \"ish\". Say how sure you are before you look.", hi: "प्रीलिम्स \"शायद\" के भी नंबर काटता है। देखने से पहले बताओ कितने पक्के हो।" },
};

/** The double act from the trailer, in order: who speaks, then the line. Keys are what POST /voice takes. */
export const ACT = {
  streakAsk: { who: "chotu", en: "Jeetu bhaiya… can I have a streak? Just a tiny one?", hi: "Jeetu भैया… एक स्ट्रीक मिल सकती है? बस छोटी सी?" },
  streakNo: { who: "jeetu", en: "No. Drink your chai.", hi: "नहीं। चाय पियो।" },
  streakChai: { who: "chotu", en: "I AM the chai.", hi: "मैं ही तो चाय हूँ।" },
};
