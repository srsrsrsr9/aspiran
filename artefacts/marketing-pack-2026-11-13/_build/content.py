# The words on every image in the pack, English and Hindi side by side. build.py turns these into PNGs.
# Slide kinds: hook, text, quiz, answer, list, sheet, marks, pair, door, quote.

DOOR = {
    "en": {"t": "door", "h": "Try one topic free.", "sub": "One whole topic, start to finish, in about 20 minutes. No sign-up.", "btn": "Try one topic free, no sign-up"},
    "hi": {"t": "door", "h": "एक टॉपिक मुफ़्त आज़माइए।", "sub": "एक पूरा टॉपिक, शुरू से अंत तक, क़रीब 20 मिनट में। साइन-अप नहीं।", "btn": "एक टॉपिक मुफ़्त आज़माएँ, बिना साइन-अप"},
}

CAROUSELS = {
    "C1-the-leak": {
        "en": [
            {"t": "hook", "kick": "THE LEAK", "h1": ["What you read in October", "is gone by March."], "sub": "Here is why, and what to do about it."},
            {"t": "text", "kick": "FACT · GS2 · PREAMBLE", "h": "First, remember this.", "body": ["The Preamble has been amended exactly once: in 1976, by the 42nd Amendment.", "It added three words: socialist, secular and integrity."], "card": True},
            {"t": "text", "kick": "WHY IT LEAKS", "h": "Re-reading feels like learning.", "body": ["The page looks familiar, so you feel you know it.", "Familiar is not the same as being able to pull it out in the exam hall."]},
            {"t": "quiz", "kick": "QUICK. DON'T SWIPE BACK.", "q": "In which year was the Preamble amended?", "opts": ["1971", "1976", "1978", "No idea"], "note": "Answer in your head first. Then swipe."},
            {"t": "answer", "kick": "THE ANSWER", "big": "1976", "body": ["The 42nd Amendment.", "That small effort of pulling it out is the whole trick. It does more than reading the line five more times."]},
            {"t": "list", "kick": "WHAT WORKS", "h": "Three habits that stop the leak.", "items": ["Close the book and say it back.", "Come back to it just before you would forget: a day, a week, then months.", "Use it in an answer."]},
            {"t": "text", "kick": "HOW ASPIRAN DOES IT", "h": "You answer first. Then you look.", "body": ["A short review each day, 10 to 20 minutes.", "Everything you studied comes back on the right day. And it ends."]},
        ],
        "hi": [
            {"t": "hook", "kick": "रिसाव", "h1": ["अक्टूबर में पढ़ा,", "मार्च तक ग़ायब।"], "sub": "ऐसा क्यों होता है, और इसका क्या करें।"},
            {"t": "text", "kick": "तथ्य · GS2 · प्रस्तावना", "h": "पहले, इसे याद रखिए।", "body": ["प्रस्तावना में ठीक एक बार संशोधन हुआ है: 1976 में, 42वें संशोधन से।", "इसने तीन शब्द जोड़े: समाजवादी, पंथनिरपेक्ष और अखंडता।"], "card": True},
            {"t": "text", "kick": "रिसता क्यों है", "h": "दोबारा पढ़ना, सीखने जैसा लगता है।", "body": ["पन्ना जाना-पहचाना लगता है, तो लगता है कि आता है।", "जाना-पहचाना होना और परीक्षा हॉल में याद से निकाल पाना, दो अलग बातें हैं।"]},
            {"t": "quiz", "kick": "जल्दी। पीछे मत जाइए।", "q": "प्रस्तावना में संशोधन किस वर्ष हुआ?", "opts": ["1971", "1976", "1978", "पता नहीं"], "note": "पहले मन में जवाब दीजिए। फिर आगे बढ़िए।"},
            {"t": "answer", "kick": "उत्तर", "big": "1976", "body": ["42वाँ संशोधन।", "याद से निकालने की यही छोटी मेहनत असली तरकीब है। यह उस पंक्ति को पाँच बार और पढ़ने से ज़्यादा काम करती है।"]},
            {"t": "list", "kick": "क्या काम करता है", "h": "रिसाव रोकने की तीन आदतें।", "items": ["किताब बंद कीजिए और बोलकर दोहराइए।", "ठीक भूलने से पहले उस पर लौटिए: एक दिन, एक हफ़्ता, फिर महीने।", "उसे किसी उत्तर में इस्तेमाल कीजिए।"]},
            {"t": "text", "kick": "ASPIRAN में यह कैसे होता है", "h": "पहले जवाब। फिर देखना।", "body": ["रोज़ एक छोटा रिव्यू, 10 से 20 मिनट।", "जो पढ़ा, वह सही दिन लौटकर आता है। और रिव्यू रोज़ ख़त्म होता है।"]},
        ],
    },
    "C2-how-sure-are-you": {
        "en": [
            {"t": "hook", "kick": "PRELIMS · NEGATIVE MARKING", "h1": ["Are you as sure", "as you feel?"], "sub": "One statement. True or false. And how sure are you?"},
            {"t": "text", "kick": "THE ARITHMETIC", "h": "A wrong answer costs a third.", "body": ["Right: +2. Wrong: −0.66. Left blank: 0.", "Three confident mistakes cancel one correct answer."]},
            {"t": "quiz", "kick": "TRUE OR FALSE?", "q": "The President can dissolve the Rajya Sabha.", "opts": ["True, and I'm sure", "True, not sure", "False, not sure", "False, and I'm sure"], "note": "Pick one in your head. Then swipe."},
            {"t": "answer", "kick": "THE ANSWER", "big": "False", "body": ["The Rajya Sabha is a permanent House. It is never dissolved.", "One-third of its members retire every second year."]},
            {"t": "text", "kick": "WHAT MATTERS MORE", "h": "Not only right or wrong.", "body": ["Sure and right: keep going.", "Sure and wrong: this is the one that costs marks. Fix it first.", "Not sure and right: you got lucky. Review it."]},
            {"t": "text", "kick": "HOW ASPIRAN DOES IT", "h": "You say how sure you are, every time.", "body": ["Then you see your own record, privately: when you were sure, how often were you right?", "Your confident mistakes come back first."]},
        ],
        "hi": [
            {"t": "hook", "kick": "प्रीलिम्स · नेगेटिव मार्किंग", "h1": ["जितना यक़ीन लगता है,", "उतना है भी?"], "sub": "एक कथन। सही या ग़लत। और आपको कितना यक़ीन है?"},
            {"t": "text", "kick": "हिसाब", "h": "ग़लत उत्तर, एक-तिहाई अंक ले जाता है।", "body": ["सही: +2। ग़लत: −0.66। छोड़ा: 0।", "पूरे यक़ीन से की गई तीन ग़लतियाँ, एक सही उत्तर को बराबर कर देती हैं।"]},
            {"t": "quiz", "kick": "सही या ग़लत?", "q": "राष्ट्रपति राज्यसभा को भंग कर सकते हैं।", "opts": ["सही, पूरा यक़ीन है", "सही, पर यक़ीन नहीं", "ग़लत, पर यक़ीन नहीं", "ग़लत, पूरा यक़ीन है"], "note": "मन में एक चुनिए। फिर आगे बढ़िए।"},
            {"t": "answer", "kick": "उत्तर", "big": "ग़लत", "body": ["राज्यसभा स्थायी सदन है। वह कभी भंग नहीं होती।", "उसके एक-तिहाई सदस्य हर दूसरे वर्ष सेवानिवृत्त होते हैं।"]},
            {"t": "text", "kick": "इससे ज़्यादा ज़रूरी क्या है", "h": "सिर्फ़ सही या ग़लत नहीं।", "body": ["यक़ीन था और सही निकला: चलते रहिए।", "यक़ीन था और ग़लत निकला: अंक यही काटता है। इसे सबसे पहले सुधारिए।", "यक़ीन नहीं था और सही निकला: क़िस्मत थी। दोहराइए।"]},
            {"t": "text", "kick": "ASPIRAN में यह कैसे होता है", "h": "हर बार आप बताते हैं कि कितना यक़ीन है।", "body": ["फिर आप अपना रिकॉर्ड देखते हैं, सिर्फ़ आप: जब यक़ीन था, तब कितनी बार सही थे?", "पूरे यक़ीन वाली ग़लतियाँ सबसे पहले लौटती हैं।"]},
        ],
    },
    "C3-mark-it-yourself": {
        "en": [
            {"t": "hook", "kick": "MAINS · ANSWER WRITING", "h1": ["Mark this answer", "before we do."], "sub": "Your own eye is the skill that matters on the day."},
            {"t": "sheet", "kick": "THE QUESTION · 150 WORDS", "q": "Explain the role of the Finance Commission in India's fiscal federalism.", "answer": "The Finance Commission is set up every five years under Article 280. It recommends how taxes are shared between the Centre and the states and among the states. It uses criteria like population, area and income distance. It also recommends grants. So it is very important for federalism.", "note": "A sample answer, written for this post."},
            {"t": "list", "kick": "YOUR TURN", "h": "Give it 1 to 5 on each line.", "items": ["Directive: did it do what \"explain\" asks?", "Structure", "Content", "Examples", "Conclusion"], "foot": "Decide your five numbers. Then swipe."},
            {"t": "marks", "kick": "A SECOND OPINION (AI)", "rows": [["Directive", 2], ["Structure", 2], ["Content", 3], ["Examples", 1], ["Conclusion", 1]], "foot": "A sample of what the app shows next to your own marks."},
            {"t": "text", "kick": "THE ONE FIX", "h": "It describes the Commission. The question asked for its role.", "body": ["Say what it does for the balance between the Centre and the states, and among the states.", "Add one real example. End on the question, not on \"it is very important\"."]},
            {"t": "text", "kick": "WHY MARK FIRST", "h": "The gap between your marks and ours is the real skill.", "body": ["Over months you watch it shrink.", "Then you rewrite only the weakest part. Five minutes. Feedback you don't act on is just reading."]},
        ],
        "hi": [
            {"t": "hook", "kick": "मेन्स · उत्तर लेखन", "h1": ["हमसे पहले,", "इस उत्तर को आप जाँचिए।"], "sub": "परीक्षा के दिन आपकी अपनी नज़र ही काम आती है।"},
            {"t": "sheet", "kick": "प्रश्न · 150 शब्द", "q": "भारत के राजकोषीय संघवाद में वित्त आयोग की भूमिका स्पष्ट कीजिए।", "answer": "वित्त आयोग का गठन अनुच्छेद 280 के तहत हर पाँच वर्ष में होता है। यह सिफ़ारिश करता है कि कर केंद्र और राज्यों के बीच तथा राज्यों में आपस में कैसे बँटें। यह जनसंख्या, क्षेत्रफल और आय-अंतर जैसे मानदंड अपनाता है। यह अनुदानों की भी सिफ़ारिश करता है। इसलिए यह संघवाद के लिए बहुत महत्वपूर्ण है।", "note": "इस पोस्ट के लिए लिखा गया नमूना उत्तर।"},
            {"t": "list", "kick": "आपकी बारी", "h": "हर पंक्ति पर 1 से 5 अंक दीजिए।", "items": ["निर्देश: क्या \"स्पष्ट कीजिए\" का काम हुआ?", "संरचना", "विषय-वस्तु", "उदाहरण", "निष्कर्ष"], "foot": "अपने पाँच अंक तय कीजिए। फिर आगे बढ़िए।"},
            {"t": "marks", "kick": "दूसरी राय (AI)", "rows": [["निर्देश", 2], ["संरचना", 2], ["विषय-वस्तु", 3], ["उदाहरण", 1], ["निष्कर्ष", 1]], "foot": "ऐप आपके अपने अंकों के बग़ल में जो दिखाता है, उसका नमूना।"},
            {"t": "text", "kick": "एक सुधार", "h": "उत्तर आयोग का वर्णन करता है। प्रश्न ने उसकी भूमिका पूछी थी।", "body": ["लिखिए कि वह केंद्र और राज्यों के बीच, और राज्यों में आपस में, संतुलन के लिए क्या करता है।", "एक असली उदाहरण जोड़िए। अंत प्रश्न पर कीजिए, \"बहुत महत्वपूर्ण है\" पर नहीं।"]},
            {"t": "text", "kick": "पहले ख़ुद क्यों जाँचें", "h": "आपके और हमारे अंकों का अंतर ही असली कौशल है।", "body": ["महीनों में आप उसे घटता देखते हैं।", "फिर आप सिर्फ़ सबसे कमज़ोर हिस्सा दोबारा लिखते हैं। पाँच मिनट। जिस फ़ीडबैक पर अमल न हो, वह सिर्फ़ पढ़ना है।"]},
        ],
    },
    "C4-directive-words": {
        "en": [
            {"t": "hook", "kick": "MAINS · THE DIRECTIVE WORD", "h1": ["The question tells you", "what to do."], "sub": "Six words UPSC uses, and what each one wants."},
            {"t": "pair", "kick": "1 OF 6", "a": "Discuss", "b": "Look at it from several sides, for and against, and reach a view."},
            {"t": "pair", "kick": "2 OF 6", "a": "Examine", "b": "Look closely at how it works: causes, parts, effects. Stay on the facts."},
            {"t": "pair", "kick": "3 OF 6", "a": "Critically examine", "b": "Do the same, then weigh it: what holds, what doesn't, and your judgement."},
            {"t": "pair", "kick": "4 OF 6", "a": "Comment", "b": "Give your considered opinion, backed by reasons or examples."},
            {"t": "pair", "kick": "5 OF 6", "a": "Elucidate", "b": "Make it clear, with examples. No judgement needed."},
            {"t": "pair", "kick": "6 OF 6", "a": "Evaluate", "b": "Judge how well it worked against its aim, with evidence on both sides."},
            {"t": "text", "kick": "HOW ASPIRAN DOES IT", "h": "Two minutes, skeleton only.", "body": ["Before you write, decode the question: the directive word, the demand, six lines of skeleton.", "Many cheap repetitions. Then the full answer, by hand."]},
        ],
        "hi": [
            {"t": "hook", "kick": "मेन्स · निर्देशक शब्द", "h1": ["प्रश्न ख़ुद बताता है", "कि करना क्या है।"], "sub": "UPSC के छह शब्द, और हर एक क्या चाहता है।"},
            {"t": "pair", "kick": "6 में से 1", "a": "चर्चा कीजिए", "b": "कई पहलुओं से देखिए, पक्ष और विपक्ष दोनों, और एक मत तक पहुँचिए।"},
            {"t": "pair", "kick": "6 में से 2", "a": "परीक्षण कीजिए", "b": "बारीकी से देखिए कि यह कैसे काम करता है: कारण, हिस्से, असर। तथ्यों पर टिके रहिए।"},
            {"t": "pair", "kick": "6 में से 3", "a": "समालोचनात्मक परीक्षण कीजिए", "b": "वही कीजिए, फिर तौलिए: क्या ठीक है, क्या नहीं, और आपका निर्णय।"},
            {"t": "pair", "kick": "6 में से 4", "a": "टिप्पणी कीजिए", "b": "अपनी सोची-समझी राय दीजिए, कारणों या उदाहरणों के साथ।"},
            {"t": "pair", "kick": "6 में से 5", "a": "स्पष्ट कीजिए", "b": "उदाहरणों से साफ़ समझाइए। निर्णय देने की ज़रूरत नहीं।"},
            {"t": "pair", "kick": "6 में से 6", "a": "मूल्यांकन कीजिए", "b": "उद्देश्य के सामने रखकर परखिए कि यह कितना सफल रहा, दोनों तरफ़ के प्रमाण के साथ।"},
            {"t": "text", "kick": "ASPIRAN में यह कैसे होता है", "h": "दो मिनट, सिर्फ़ ढाँचा।", "body": ["लिखने से पहले प्रश्न खोलिए: निर्देशक शब्द, माँग, छह पंक्तियों का ढाँचा।", "कई छोटे अभ्यास। फिर पूरा उत्तर, हाथ से।"]},
        ],
    },
    "C5-never-here": {
        "en": [
            {"t": "hook", "kick": "THE ANTI-ED-TECH", "h1": ["Things you will", "never see here."], "sub": "They keep you on an app. They don't get you through an exam."},
            {"t": "pair", "kick": "1", "a": "Streaks you are scared to break", "b": "Missing a day is not a failure. The review simply waits for you.", "strike": True},
            {"t": "pair", "kick": "2", "a": "Leaderboards and public ranks", "b": "You are compared with one person: yourself, last month.", "strike": True},
            {"t": "pair", "kick": "3", "a": "\"Your selection chance: 73%\"", "b": "Nobody honest can know that. We don't pretend to.", "strike": True},
            {"t": "pair", "kick": "4", "a": "\"Only 4 seats left\" countdowns", "b": "No timers on offers. Decide when you are ready.", "strike": True},
            {"t": "pair", "kick": "5", "a": "Notifications that chase you", "b": "One chai nudge in the morning, if you want it. That's all.", "strike": True},
            {"t": "pair", "kick": "6", "a": "Your number sold to a call centre", "b": "Your email is only for signing in. Nobody calls you.", "strike": True},
        ],
        "hi": [
            {"t": "hook", "kick": "एड-टेक का उलटा", "h1": ["जो यहाँ", "कभी नहीं दिखेगा।"], "sub": "ये चीज़ें आपको ऐप पर रोकती हैं। परीक्षा पार नहीं करातीं।"},
            {"t": "pair", "kick": "1", "a": "टूटने से डराने वाली स्ट्रीक", "b": "एक दिन छूटना हार नहीं है। रिव्यू बस आपका इंतज़ार करता है।", "strike": True},
            {"t": "pair", "kick": "2", "a": "लीडरबोर्ड और पब्लिक रैंक", "b": "आपकी तुलना एक ही इंसान से होती है: पिछले महीने के आप।", "strike": True},
            {"t": "pair", "kick": "3", "a": "\"आपके चयन की संभावना: 73%\"", "b": "यह कोई ईमानदारी से नहीं जान सकता। हम जानने का दिखावा नहीं करते।", "strike": True},
            {"t": "pair", "kick": "4", "a": "\"सिर्फ़ 4 सीटें बचीं\" वाली उलटी गिनती", "b": "ऑफ़र पर कोई टाइमर नहीं। जब तैयार हों, तब तय कीजिए।", "strike": True},
            {"t": "pair", "kick": "5", "a": "पीछा करने वाली नोटिफ़िकेशन", "b": "सुबह चाय की एक याद, अगर आप चाहें। बस।", "strike": True},
            {"t": "pair", "kick": "6", "a": "कॉल सेंटर को बेचा गया आपका नंबर", "b": "आपका ईमेल सिर्फ़ साइन-इन के लिए है। कोई फ़ोन नहीं करता।", "strike": True},
        ],
    },
    "C6-companion-to-your-books": {
        "en": [
            {"t": "hook", "kick": "WHAT ASPIRAN IS", "h1": ["You read the books.", "We make it stay."], "sub": "Not coaching. Not a course. A companion to your own prep."},
            {"t": "text", "kick": "1 · REMEMBER IT", "h": "A short review each day.", "body": ["10 to 20 minutes. What you studied comes back just before you would forget it.", "It ends every day. Nothing piles up into guilt."]},
            {"t": "text", "kick": "2 · USE IT", "h": "Write, mark, rewrite.", "body": ["Mains answers on paper. Mark your own first, then see a second opinion (AI) next to your marks.", "Then rewrite the weakest part. In English or in Hindi."]},
            {"t": "text", "kick": "3 · NOT ALONE", "h": "Six to eight people. One pod.", "body": ["Aspirants at your stage. Write the same question alone, then compare.", "No ranks. No performing. Just \"this one, because\"."]},
            {"t": "list", "kick": "AND", "h": "Around those three.", "items": ["A few current-affairs cards a day, each tied to its syllabus line.", "The whole syllabus as a garden: 297 lines, a leaf for each.", "Chotu · AI, a study buddy for everyday doubts."]},
            {"t": "text", "kick": "NEW, AND HONEST ABOUT IT", "h": "We opened in 2026.", "body": ["No toppers to show you yet, and we won't borrow anyone else's.", "Try one topic and judge it yourself."]},
        ],
        "hi": [
            {"t": "hook", "kick": "ASPIRAN क्या है", "h1": ["किताबें आप पढ़ते हैं।", "याद हम रखवाते हैं।"], "sub": "कोचिंग नहीं। कोर्स नहीं। आपकी अपनी तैयारी का साथी।"},
            {"t": "text", "kick": "1 · याद रहे", "h": "रोज़ एक छोटा रिव्यू।", "body": ["10 से 20 मिनट। जो पढ़ा, वह ठीक भूलने से पहले लौटकर आता है।", "यह रोज़ ख़त्म होता है। कुछ भी जमा होकर बोझ नहीं बनता।"]},
            {"t": "text", "kick": "2 · काम आए", "h": "लिखिए, जाँचिए, फिर लिखिए।", "body": ["मेन्स का उत्तर काग़ज़ पर। पहले ख़ुद जाँचिए, फिर अपने अंकों के बग़ल में दूसरी राय (AI) देखिए।", "फिर सबसे कमज़ोर हिस्सा दोबारा लिखिए। हिंदी में या अंग्रेज़ी में।"]},
            {"t": "text", "kick": "3 · अकेले नहीं", "h": "छह से आठ लोग। एक पॉड।", "body": ["आपके ही स्टेज के अभ्यर्थी। एक ही प्रश्न पहले अकेले लिखिए, फिर तुलना कीजिए।", "न रैंक, न दिखावा। बस \"यह वाला, क्योंकि\"।"]},
            {"t": "list", "kick": "और", "h": "इन तीनों के आसपास।", "items": ["रोज़ कुछ करेंट अफ़ेयर्स कार्ड, हर एक अपनी सिलेबस-पंक्ति से जुड़ा।", "पूरा सिलेबस एक बग़ीचे की तरह: 297 पंक्तियाँ, हर एक की एक पत्ती।", "चोटू · AI, रोज़मर्रा की शंकाओं के लिए स्टडी साथी।"]},
            {"t": "text", "kick": "नया है, और यह छिपाता नहीं", "h": "हम 2026 में खुले हैं।", "body": ["दिखाने को अभी हमारे पास टॉपर नहीं हैं, और किसी और के उधार नहीं लेंगे।", "एक टॉपिक आज़माइए और ख़ुद परखिए।"]},
        ],
    },
    "C7-hindi-medium": {
        "en": [
            {"t": "hook", "kick": "HINDI MEDIUM", "h1": ["Write in Hindi.", "Get marked in Hindi."], "sub": "The same app, not a translation added later."},
            {"t": "text", "kick": "ANSWER MARKING", "h": "The same rubric. The same standard.", "body": ["Directive, structure, content, examples, conclusion.", "The second opinion (AI) on a Hindi answer comes back in Hindi, with one fix for each part."]},
            {"t": "text", "kick": "TERMS", "h": "The right word, in both languages.", "body": ["राजकोषीय घाटा / fiscal deficit.", "Because the books are in one language and the exam may be in the other."]},
            {"t": "text", "kick": "HONEST LABELS", "h": "If a Hindi editor hasn't checked it, it says so.", "body": ["Every note and card shows whether an editor has checked it, in each language."]},
        ],
        "hi": [
            {"t": "hook", "kick": "हिंदी माध्यम", "h1": ["हिंदी में लिखिए।", "जाँच भी हिंदी में।"], "sub": "वही ऐप, बाद में जोड़ा गया अनुवाद नहीं।"},
            {"t": "text", "kick": "उत्तर की जाँच", "h": "वही कसौटी। वही स्तर।", "body": ["निर्देश, संरचना, विषय-वस्तु, उदाहरण, निष्कर्ष।", "हिंदी उत्तर पर दूसरी राय (AI) हिंदी में ही आती है, हर हिस्से के एक सुधार के साथ।"]},
            {"t": "text", "kick": "शब्दावली", "h": "सही शब्द, दोनों भाषाओं में।", "body": ["राजकोषीय घाटा / fiscal deficit.", "क्योंकि किताबें एक भाषा में हैं और परीक्षा दूसरी में हो सकती है।"]},
            {"t": "text", "kick": "ईमानदार लेबल", "h": "हिंदी संपादक ने नहीं जाँचा, तो वही लिखा रहता है।", "body": ["हर नोट और कार्ड पर लिखा होता है कि संपादक ने उसे जाँचा है या नहीं, हर भाषा में।"]},
        ],
    },
}

# Single cards (1080x1350) and their story versions (1080x1920).
QUOTES = [
    ("Q1-october-march", {"en": ["What you read in October", "is gone by March."], "hi": ["अक्टूबर में पढ़ा,", "मार्च तक ग़ायब।"]}),
    ("Q2-rereading", {"en": ["Re-reading feels like learning.", "Recalling is learning."], "hi": ["दोबारा पढ़ना सीखने जैसा लगता है।", "याद से निकालना ही सीखना है।"]}),
    ("Q3-answer-first", {"en": ["Answer first.", "Then look."], "hi": ["पहले जवाब।", "फिर देखना।"]}),
    ("Q4-mark-it", {"en": ["Mark it yourself", "before we do."], "hi": ["हमसे पहले,", "ख़ुद जाँचिए।"]}),
    ("Q5-sure", {"en": ["Are you as sure", "as you feel?"], "hi": ["जितना यक़ीन लगता है,", "उतना है भी?"]}),
    ("Q6-books", {"en": ["You read the books.", "We make it stay."], "hi": ["किताबें आप पढ़ते हैं।", "याद हम रखवाते हैं।"]}),
    ("Q7-pod", {"en": ["Six people. One pod.", "No leaderboard."], "hi": ["छह लोग। एक पॉड।", "कोई लीडरबोर्ड नहीं।"]}),
    ("Q8-not-behind", {"en": ["You're not behind.", "You're only measured against yesterday."], "hi": ["आप पीछे नहीं हैं।", "आपकी तुलना सिर्फ़ कल के आप से है।"]}),
]

# Plain images for friends to post from their own accounts. No Chotu, no brand night sky: a paper note.
FRIENDS = [
    ("F1-recall-question", {"en": {"k": "TRY THIS", "h": "In which year was the Preamble amended, and what did it add?", "b": "Answer before you look it up. That small effort is the whole method."},
                            "hi": {"k": "इसे आज़माइए", "h": "प्रस्तावना में संशोधन किस वर्ष हुआ, और क्या जोड़ा गया?", "b": "देखने से पहले जवाब दीजिए। यही छोटी मेहनत पूरा तरीक़ा है।"}}),
    ("F2-true-false", {"en": {"k": "TRUE OR FALSE?", "h": "The President can dissolve the Rajya Sabha.", "b": "And how sure are you? In Prelims, a confident wrong answer costs a third of the marks."},
                       "hi": {"k": "सही या ग़लत?", "h": "राष्ट्रपति राज्यसभा को भंग कर सकते हैं।", "b": "और आपको कितना यक़ीन है? प्रीलिम्स में पूरे यक़ीन वाला ग़लत उत्तर एक-तिहाई अंक काटता है।"}}),
    ("F3-rereading", {"en": {"k": "A THOUGHT", "h": "Re-reading feels like learning. Recalling is learning.", "b": "Close the book. Say it back. Check."},
                      "hi": {"k": "एक बात", "h": "दोबारा पढ़ना सीखने जैसा लगता है। याद से निकालना ही सीखना है।", "b": "किताब बंद कीजिए। बोलकर दोहराइए। फिर मिलाइए।"}}),
]
