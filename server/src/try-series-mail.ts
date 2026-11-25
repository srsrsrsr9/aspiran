// The K4 email series after the demo (artefacts/marketing-2026-11-21/K4/email.json, owner-made), days 0, 7, 14 and 30.
// Day 3 is the demo's live recall email (try-recall.ts). Generated from email.json; {{first_name}} isn't collected, so the
// greeting is always the fallback. Day 0 changed one line: the demo has no marked answer, it has a Mains answer plan.
// {{unsubscribe_url}} is filled in by try-series.ts.

type T = { en: string; hi: string };
export const SERIES_MAIL: Record<string, { day: number; subject: T; greeting: T; body: T; signoff: T; footer: T }> = {
  "k4-d00": {
    "day": 0,
    "subject": {
      "en": "You tried the demo. Here's what comes next",
      "hi": "आपने डेमो आज़माया, आगे क्या होगा"
    },
    "greeting": {
      "en": "Hi there,",
      "hi": "नमस्ते,"
    },
    "body": {
      "en": "Thank you for trying the Aspiran demo today.\n\nYou read a short note, answered a few questions, planned a Mains answer and kept a few cards. That is most of the app: short daily work that keeps what you study from slipping away.\n\nAspiran doesn't replace your coaching, your YouTube teacher or your books. It works next to them.\n\nOver the next month we'll send you four more short emails. In three days, we'll ask you some of today's questions again, so you can see what stayed.\n\nIf you want to go back to the demo before then, it's here: https://aspiran.in/?utm_source=email&utm_medium=email&utm_campaign=k4-demo&utm_content=d00",
      "hi": "आज Aspiran का डेमो आज़माने के लिए शुक्रिया।\n\nआपने एक छोटा नोट पढ़ा, कुछ सवालों के जवाब दिए, मेन्स के एक उत्तर का ढाँचा बनाया और कुछ कार्ड रखे। ऐप का ज़्यादातर काम यही है: रोज़ का छोटा काम, ताकि जो पढ़ा है वह हाथ से न निकले।\n\nAspiran आपकी कोचिंग, आपके YouTube शिक्षक या आपकी किताबों की जगह नहीं लेता। यह उनके साथ चलता है।\n\nअगले एक महीने में हम आपको चार और छोटे ईमेल भेजेंगे। तीन दिन बाद हम आज के कुछ सवाल फिर पूछेंगे, ताकि आप देख सकें कि क्या याद रहा।\n\nउससे पहले डेमो पर लौटना चाहें, तो यहाँ है: https://aspiran.in/?utm_source=email&utm_medium=email&utm_campaign=k4-demo&utm_content=d00"
    },
    "signoff": {
      "en": "Aspiran",
      "hi": "Aspiran"
    },
    "footer": {
      "en": "You're getting this because you tried the Aspiran demo. Stop these emails: {{unsubscribe_url}}",
      "hi": "यह ईमेल आपको इसलिए मिला, क्योंकि आपने Aspiran का डेमो आज़माया था। ये ईमेल बंद करें: {{unsubscribe_url}}"
    }
  },
  "k4-d07": {
    "day": 7,
    "subject": {
      "en": "Why you forget, and the simple fix",
      "hi": "हम क्यों भूलते हैं, और इसका आसान उपाय"
    },
    "greeting": {
      "en": "Hi there,",
      "hi": "नमस्ते,"
    },
    "body": {
      "en": "Most of what we read is gone within a few days. Not because we're careless. That's simply how memory works.\n\nThe fix is called spaced recall. It has two parts.\n\nFirst, recall, don't reread. Close the book and try to answer. The effort of pulling it out is what makes it stay.\n\nSecond, space it out. Try again after a day, then a few days, then a week or more. Each time it gets harder to forget, so the gaps can grow.\n\nDoing this by hand for a whole syllabus is a lot of bookkeeping. Aspiran keeps track for you and brings each question back just before you'd lose it.\n\nTry a round in the demo: https://aspiran.in/?utm_source=email&utm_medium=email&utm_campaign=k4-demo&utm_content=d07",
      "hi": "हम जो पढ़ते हैं, उसका ज़्यादातर हिस्सा कुछ दिनों में भूल जाते हैं। लापरवाही से नहीं, याददाश्त ऐसे ही काम करती है।\n\nइसका उपाय है अंतराल पर दोहराव (spaced recall)। इसके दो हिस्से हैं।\n\nपहला, दोबारा पढ़िए मत, याद कीजिए। किताब बंद कीजिए और जवाब देने की कोशिश कीजिए। याद से निकालने की यही मेहनत बात को टिकाती है।\n\nदूसरा, बीच में अंतर रखिए। एक दिन बाद फिर कोशिश कीजिए, फिर कुछ दिन बाद, फिर एक हफ़्ते या ज़्यादा बाद। हर बार भूलना मुश्किल होता जाता है, इसलिए अंतर बढ़ाया जा सकता है।\n\nपूरे पाठ्यक्रम के लिए यह हिसाब हाथ से रखना भारी काम है। Aspiran यह हिसाब आपके लिए रखता है और हर सवाल को ठीक भूलने से पहले लौटाता है।\n\nडेमो में एक दौर आज़माइए: https://aspiran.in/?utm_source=email&utm_medium=email&utm_campaign=k4-demo&utm_content=d07"
    },
    "signoff": {
      "en": "Aspiran",
      "hi": "Aspiran"
    },
    "footer": {
      "en": "You're getting this because you tried the Aspiran demo. Stop these emails: {{unsubscribe_url}}",
      "hi": "यह ईमेल आपको इसलिए मिला, क्योंकि आपने Aspiran का डेमो आज़माया था। ये ईमेल बंद करें: {{unsubscribe_url}}"
    }
  },
  "k4-d14": {
    "day": 14,
    "subject": {
      "en": "Who reads your Mains answers?",
      "hi": "आपके मेन्स के उत्तर कौन पढ़ता है?"
    },
    "greeting": {
      "en": "Hi there,",
      "hi": "नमस्ते,"
    },
    "body": {
      "en": "Many aspirants write Mains answers and then have nobody to show them to. So they stop writing.\n\nIn Aspiran, you write an answer in the app and it gets marked there. You see what the answer did well, what it missed, and where the structure slipped. Then you rewrite it, and the second version is marked too.\n\nOne answer a day is enough to start. Pick a past question, give it fifteen minutes, and read the marking before you rewrite.\n\nIt works the same in Hindi and in English.\n\nWrite your first answer in the demo: https://aspiran.in/?utm_source=email&utm_medium=email&utm_campaign=k4-demo&utm_content=d14",
      "hi": "बहुत से अभ्यर्थी मेन्स के उत्तर लिखते हैं, पर उन्हें दिखाने के लिए कोई नहीं होता। फिर धीरे-धीरे लिखना ही बंद हो जाता है।\n\nAspiran में आप ऐप में उत्तर लिखते हैं और वहीं उस पर अंक मिलते हैं। आप देखते हैं कि उत्तर में क्या अच्छा था, क्या रह गया, और ढाँचा कहाँ बिगड़ा। फिर आप उसे सुधारकर दोबारा लिखते हैं, और दूसरे उत्तर पर भी अंक मिलते हैं।\n\nशुरुआत के लिए रोज़ एक उत्तर काफ़ी है। पिछले वर्ष का कोई प्रश्न चुनिए, पंद्रह मिनट दीजिए, और दोबारा लिखने से पहले अंक और टिप्पणी पढ़िए।\n\nहिंदी और अंग्रेज़ी, दोनों में यह एक जैसा काम करता है।\n\nडेमो में अपना पहला उत्तर लिखिए: https://aspiran.in/?utm_source=email&utm_medium=email&utm_campaign=k4-demo&utm_content=d14"
    },
    "signoff": {
      "en": "Aspiran",
      "hi": "Aspiran"
    },
    "footer": {
      "en": "You're getting this because you tried the Aspiran demo. Stop these emails: {{unsubscribe_url}}",
      "hi": "यह ईमेल आपको इसलिए मिला, क्योंकि आपने Aspiran का डेमो आज़माया था। ये ईमेल बंद करें: {{unsubscribe_url}}"
    }
  },
  "k4-d30": {
    "day": 30,
    "subject": {
      "en": "A month since your demo",
      "hi": "आपके डेमो को एक महीना हुआ"
    },
    "greeting": {
      "en": "Hi there,",
      "hi": "नमस्ते,"
    },
    "body": {
      "en": "It's been a month since you tried Aspiran. This is the fifth and final email in this short series.\n\nIf the demo helped, Plus opens the whole app: Daily Chai, syllabus notes with audio, practice questions and mocks, past papers with UPSC's keys, Mains answers marked and rewritten, flashcards, and pods to study with. Plus is ₹3,999 a year.\n\nIf now isn't the right time, that's fine. The free demo stays open, and the method works without us: recall instead of rereading, and come back to things after a gap.\n\nWhatever you choose, we hope the prep goes well.\n\nSee what Plus includes: https://aspiran.in/?utm_source=email&utm_medium=email&utm_campaign=k4-demo&utm_content=d30",
      "hi": "Aspiran आज़माए आपको एक महीना हो गया। इस छोटी शृंखला का यह पाँचवाँ और आख़िरी ईमेल है।\n\nडेमो काम का लगा हो, तो Plus में पूरा ऐप खुल जाता है: डेली चाय, ऑडियो के साथ पाठ्यक्रम के नोट्स, अभ्यास प्रश्न और मॉक टेस्ट, यूपीएससी की उत्तर-कुंजी के साथ पिछले प्रश्नपत्र, मेन्स के उत्तरों पर अंक और सुधार, फ़्लैशकार्ड, और साथ पढ़ने के लिए पॉड। Plus ₹3,999 सालाना है।\n\nअभी सही समय नहीं है, तो कोई बात नहीं। मुफ़्त डेमो खुला रहेगा, और तरीक़ा हमारे बिना भी काम करता है: दोबारा पढ़ने की जगह याद कीजिए, और कुछ अंतर के बाद फिर लौटिए।\n\nआप जो भी चुनें, आपकी तैयारी अच्छी चले।\n\nPlus में क्या है, देखिए: https://aspiran.in/?utm_source=email&utm_medium=email&utm_campaign=k4-demo&utm_content=d30"
    },
    "signoff": {
      "en": "Aspiran",
      "hi": "Aspiran"
    },
    "footer": {
      "en": "You're getting this because you tried the Aspiran demo. Stop these emails: {{unsubscribe_url}}",
      "hi": "यह ईमेल आपको इसलिए मिला, क्योंकि आपने Aspiran का डेमो आज़माया था। ये ईमेल बंद करें: {{unsubscribe_url}}"
    }
  }
};
