#!/usr/bin/env python3
"""Cleans the six marketing batches the content account delivered on 21 Nov 2026 (K1 to K6).

Reads   docs/content/2026-11-21/aspiran-K<n>/K<n>/*.json and preview.md (in the main checkout; the zips aren't in git)
Writes  artefacts/marketing-2026-11-21/K<n>/  the same files with the fixes below applied, plus fixes.log

Every fix is an exact string replacement that must match at least once (the script stops if one doesn't), applied to
every string in the JSON and to preview.md, so the preview shows what the cleaned JSON says.
Run:  python3 -I artefacts/marketing-2026-11-21/clean.py [<folder with aspiran-K1..K6>]
"""
import json, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
try:
    common = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "--git-common-dir"], capture_output=True, text=True).stdout.strip()
    MAIN = (ROOT / common).resolve().parent if common else ROOT
except Exception:
    MAIN = ROOT
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else next(
    p for p in [ROOT / "docs/content/2026-11-21", MAIN / "docs/content/2026-11-21"] if (p / "aspiran-K1").exists())

# (batch, files it applies to or None for all, only items whose id contains this or None, old, new, why)
CHAI3 = "Daily Chai is three cards a day (live since 15 Nov), not 3 to 7"
FIXES = [
    # ---- K1 ----
    ("K1", None, None, "Daily Chai gives you 3 to 7 current-affairs cards", "Daily Chai gives you 3 current-affairs cards", CHAI3),
    ("K1", None, None, "समसामयिक घटनाओं के 3 से 7 कार्ड आते हैं", "समसामयिक घटनाओं के 3 कार्ड आते हैं", CHAI3),
    ("K1", None, None, "Each syllabus note also has audio: listen on the bus, read at your desk.",
     "Many syllabus notes also have audio: listen on the bus, read at your desk.", "Not every note has audio yet (31 still to record)"),
    ("K1", None, None, "पाठ्यक्रम के हर नोट का ऑडियो भी है: बस में सुनिए, मेज़ पर पढ़िए।",
     "पाठ्यक्रम के कई नोट्स का ऑडियो भी है: बस में सुनिए, मेज़ पर पढ़िए।", "Not every note has audio yet"),
    ("K1", ["whatsapp.json"], "k1-d03", "पाटन की रानी की वाव एक बावड़ी है, जिसकी रचना उल्टे मंदिर जैसी है।",
     "पाटन की रानी की वाव एक बावड़ी है, जो उल्टे मंदिर जैसी है।", "WhatsApp day 3 Hindi was 605 characters (limit 600)"),
    # ---- K2: match the live For coaching page and pamphlet (free 30-day pilot, no price yet: owner's decision 9) ----
    ("K2", None, None, "A free partner plan for coaching centres and self-study libraries.",
     "For coaching centres and self-study libraries. Start with a free 30-day pilot.", "Partner pricing isn't decided; the site offers a free 30-day pilot"),
    ("K2", None, None, "The partner plan is free. When one of your students takes Plus (₹3,999 a year), your centre earns a share of it. The share is set out in the partner agreement.",
     "Start with a free 30-day pilot, with one or two batches. After it, we agree a price for your centre's size. If it doesn't fit, you owe nothing.",
     "Revenue share isn't decided (decision 9); copy now says what aspiran.in/for-coaching says"),
    ("K2", None, None, "पार्टनर प्लान मुफ़्त है। आपका कोई छात्र Plus (₹3,999 सालाना) लेता है, तो उसमें आपके संस्थान का हिस्सा होता है। यह हिस्सा पार्टनर समझौते में लिखा है।",
     "शुरुआत 30 दिन के मुफ़्त पायलट से, एक या दो बैच के साथ। उसके बाद आपके संस्थान के आकार के हिसाब से कीमत तय करेंगे। जमे नहीं, तो कुछ नहीं देना।", "Same, Hindi"),
    ("K2", None, None, "We never advertise to your students. The partner plan is free, and your centre earns a share of every Plus subscription your students take.",
     "We never advertise to your students. Start with a free 30-day pilot, and decide after it.", "Same, video narration"),
    ("K2", None, None, "हम आपके छात्रों को कभी विज्ञापन नहीं दिखाते। पार्टनर प्लान मुफ़्त है। और आपके छात्र जो भी Plus सदस्यता लें, उसमें आपके संस्थान का हिस्सा होता है।",
     "हम आपके छात्रों को कभी विज्ञापन नहीं दिखाते। 30 दिन का मुफ़्त पायलट कीजिए, फिर तय कीजिए।", "Same, video narration Hindi"),
    ("K2", None, None, "We never advertise to your students\nPartner plan: free", "We never advertise to your students\nFree 30-day pilot", "Same, on-screen text"),
    ("K2", None, None, "They don't have to. The partner plan is free for your centre, and anyone can try the free demo at aspiran.in.",
     "They don't have to. Joining Aspiran is free, and the pilot is free for your centre.", "Same, objection reply"),
    ("K2", None, None, "Your logo inside Aspiran. Your students see your centre's name every time they open the app.",
     "Your name and logo inside Aspiran. Your invite page carries your logo and colour, and your students see your centre's name in the app.",
     "What's built: invite page in the centre's logo and colour; name on Adda and the side menu"),
    ("K2", None, None, "Aspiran के भीतर आपका लोगो। छात्र जब भी ऐप खोलें, उन्हें आपके संस्थान का नाम दिखे।",
     "Aspiran के भीतर आपका नाम और लोगो। आपका इनवाइट पेज आपके लोगो और रंग में होता है, और छात्रों को ऐप में आपके संस्थान का नाम दिखता है।", "Same, Hindi"),
    ("K2", None, None, "Reply to us on WhatsApp, or write to us at aspiran.in.", "Reply to us on WhatsApp, or fill the short form at aspiran.in/for-coaching.",
     "The centre form on aspiran.in/for-coaching is the real way in (it emails the owner each lead)"),
    ("K2", None, None, "हमें WhatsApp पर जवाब दीजिए, या aspiran.in पर लिखिए।", "हमें WhatsApp पर जवाब दीजिए, या aspiran.in/for-coaching पर छोटा फ़ॉर्म भरिए।", "Same, Hindi"),
    ("K2", None, None, "To start, reply to this message on WhatsApp, or write to us at aspiran.in.",
     "To start, reply to this message on WhatsApp, or fill the short form at aspiran.in/for-coaching.", "Same, video"),
    ("K2", None, None, "शुरू करने के लिए इसी संदेश का WhatsApp पर जवाब दीजिए, या aspiran.in पर हमें लिखिए।",
     "शुरू करने के लिए इसी संदेश का WhatsApp पर जवाब दीजिए, या aspiran.in/for-coaching पर छोटा फ़ॉर्म भरिए।", "Same, video Hindi"),
    ("K2", None, None, "Reply on WhatsApp\nor write to us: aspiran.in", "Reply on WhatsApp\nor aspiran.in/for-coaching", "Same, on-screen (31 characters)"),
    ("K2", None, None, "WhatsApp पर जवाब दें\nया लिखें: aspiran.in", "WhatsApp पर जवाब दें\nया aspiran.in/for-coaching", "Same, on-screen Hindi"),
    # ---- K3 ----
    ("K3", None, None, "Daily Chai: 3 to 7 current-affairs cards a day", "Daily Chai: 3 current-affairs cards a day", CHAI3),
    ("K3", None, None, "डेली चाय: रोज़ 3 से 7 करंट अफ़ेयर्स कार्ड", "डेली चाय: रोज़ 3 करंट अफ़ेयर्स कार्ड", CHAI3),
    ("K3", None, None, "The demo is free. Aspiran Plus costs ₹3,999 a year, and the price is the same for everyone.",
     "Joining is free, and no card is asked. Aspiran Plus is ₹3,999 a year, the same for everyone: one payment, no auto-renewal, refund within 7 days.",
     "There is a free plan, not only a demo; adds the refund terms the site already states"),
    ("K3", None, None, "डेमो मुफ़्त है। Aspiran Plus ₹3,999 सालाना है, और कीमत सबके लिए एक ही है।",
     "जुड़ना मुफ़्त है, कोई कार्ड नहीं माँगा जाता। Aspiran Plus ₹3,999 सालाना है, सबके लिए एक ही कीमत: एक बार का पेमेंट, अपने-आप रिन्यू नहीं, 7 दिन में रिफ़ंड।", "Same, Hindi"),
    ("K3", None, None, "Facts that can change, like laws and schemes, are dated, so you know when they were last read.",
     "Facts that change, like the Supreme Court's strength or the repo rate, are watched every day and updated when they change.",
     "A visible 'last read' date isn't confirmed; the daily fact watch is live"),
    ("K3", None, None, "जो तथ्य बदल सकते हैं, जैसे क़ानून और योजनाएँ, उन पर तारीख़ दी जाती है ताकि पता रहे कि उन्हें आख़िरी बार कब पढ़ा गया।",
     "जो तथ्य बदलते हैं, जैसे सुप्रीम कोर्ट में जजों की संख्या या रेपो रेट, उन पर रोज़ नज़र रखी जाती है और बदलते ही उन्हें अपडेट किया जाता है।", "Same, Hindi"),
    ("K3", None, None, "Plus is Aspiran for a full year, beside your coaching, YouTube teacher or books. The free demo lets you try the app first.",
     "Plus is a year of Aspiran without the free plan's weekly limits, beside your coaching, YouTube teacher or books. Start free first.",
     "Free plan exists; Plus adds to it (see includes below)"),
    ("K3", None, None, "Plus यानी पूरे एक साल का Aspiran, आपकी कोचिंग, यूट्यूब शिक्षक या किताबों के साथ। पहले मुफ़्त डेमो में ऐप आज़मा सकते हैं।",
     "Plus यानी पूरे एक साल का Aspiran, फ़्री प्लान की हफ़्ते वाली सीमाओं के बिना, आपकी कोचिंग, यूट्यूब शिक्षक या किताबों के साथ। पहले फ़्री में शुरू कीजिए।", "Same, Hindi"),
    # ---- K5 ----
    ("K5", None, None, "Daily Chai: 3 to 7 current-affairs cards a day", "Daily Chai: 3 current-affairs cards a day", CHAI3),
    ("K5", None, None, "डेली चाय: रोज़ 3 से 7 करंट अफ़ेयर्स कार्ड", "डेली चाय: रोज़ 3 करंट अफ़ेयर्स कार्ड", CHAI3),
    ("K5", None, None, "Current affairs, 3 to 7 a day", "3 current-affairs cards a day", CHAI3 + " (29 characters)"),
    ("K5", None, None, "रोज़ 3 से 7 करंट अफ़ेयर्स", "रोज़ 3 करंट अफ़ेयर्स कार्ड", CHAI3),
    ("K5", None, None, "Daily Chai card stack (3 to 7 current-affairs cards)", "Daily Chai card stack (3 current-affairs cards)", CHAI3),
    ("K5", None, None, "PRICE\nThe demo is free. Aspiran Plus is ₹3,999 a year.\n\nTry the free demo, then decide. More at aspiran.in",
     "PRICE\nFree to join, no card. Aspiran Plus is ₹3,999 a year.\n\nStart free, then decide. More at aspiran.in\n\nAspiran is an independent app. It is not linked to UPSC or any government body.",
     "Free plan, not only a demo; Play asks apps about government exams to say they aren't official"),
    ("K5", None, None, "कीमत\nडेमो मुफ़्त है। Aspiran Plus ₹3,999 सालाना है।\n\nपहले मुफ़्त डेमो आज़माइए, फिर तय कीजिए। ज़्यादा जानकारी aspiran.in पर।",
     "कीमत\nजुड़ना मुफ़्त है, कोई कार्ड नहीं। Aspiran Plus ₹3,999 सालाना है।\n\nपहले फ़्री में शुरू कीजिए, फिर तय कीजिए। ज़्यादा जानकारी aspiran.in पर।\n\nAspiran एक स्वतंत्र ऐप है। इसका UPSC या किसी सरकारी संस्था से कोई संबंध नहीं है।", "Same, Hindi"),
    # ---- K6: the 1857 pilot walks through a Mains question (2016 GS I), not a Prelims one ----
    ("K6", None, "1857", "One past Prelims question, walked through", "One past Mains question, walked through", "1857 script uses Mains 2016 GS I"),
    ("K6", None, "1857", "Then one past Prelims question, walked through", "Then one past Mains question, walked through", "Same, description"),
    ("K6", None, "1857", "पिछले वर्षों का एक प्रारंभिक प्रश्न, हल सहित", "पिछले वर्षों का एक मुख्य परीक्षा प्रश्न, हल सहित", "Same, Hindi chapter"),
    ("K6", None, "1857", "पिछले वर्षों का एक प्रारंभिक परीक्षा प्रश्न, कदम-दर-कदम हल", "पिछले वर्षों का एक मुख्य परीक्षा प्रश्न, कदम-दर-कदम हल", "Same, Hindi description"),
    ("K6", None, "federalism", "UPSC Prelims GS2", "UPSC GS2 Polity", "Prelims has no GS2 paper"),
    ("K6", None, "1857-en", "UPSC Prelims GS1", "UPSC Mains GS1", "1857 is the Mains video"),
]


def fix_strings(o, fn):
    if isinstance(o, dict):
        return {k: fix_strings(v, fn) for k, v in o.items()}
    if isinstance(o, list):
        return [fix_strings(v, fn) for v in o]
    return fn(o) if isinstance(o, str) else o


def item_id(o):
    return o.get("id", "") if isinstance(o, dict) else ""


def main():
    log, hits = [], {i: 0 for i in range(len(FIXES))}
    for n in range(1, 7):
        b = f"K{n}"
        src, out = SRC / f"aspiran-{b}" / b, HERE / b
        (out / "checks").mkdir(parents=True, exist_ok=True)
        for f in sorted(src.glob("*.json")) + sorted(src.glob("checks/*")):
            rel = f.relative_to(src)
            if f.suffix != ".json" or rel.parts[0] == "checks":
                (out / rel).write_bytes(f.read_bytes())
                continue
            data = json.loads(f.read_text("utf-8"))
            for i, (fb, files, scope, old, new, why) in enumerate(FIXES):
                if fb != b or (files and f.name not in files):
                    continue
                def rep(s, i=i, old=old, new=new):
                    if old in s:
                        hits[i] += s.count(old)
                        return s.replace(old, new)
                    return s
                def scoped(o, scope=scope, rep=rep):
                    # Items are dicts with an id; a scope limits a fix to items whose id contains it.
                    if isinstance(o, dict) and "items" in o and isinstance(o["items"], list) and scope:
                        o = dict(o)
                        o["items"] = [fix_strings(x, rep) if scope in item_id(x) else x for x in o["items"]]
                        return o
                    return fix_strings(o, rep)
                data = scoped(data)
            if b == "K3" and f.name == "web.json":
                # The K3 Plus page put every feature under Plus. Free already has daily revision, Chai, notes, PYQs,
                # pods, 3 answers checked a week and 1 mock a month (aspiran.in price block), so list what Plus adds.
                data["plusPage"]["includesHeading"] = {"en": "What Plus adds to the free plan", "hi": "फ़्री प्लान के ऊपर Plus में क्या मिलता है"}
                data["plusPage"]["includes"] = [
                    {"en": "Unlimited answer checking and rewrites", "hi": "अनलिमिटेड आंसर की जाँच और रीराइट"},
                    {"en": "All 35 mocks, with your mistake types", "hi": "सारे 35 मॉक, आपकी ग़लतियों के टाइप के साथ"},
                    {"en": "Essays marked from 3 photos", "hi": "3 फ़ोटो से एसे की जाँच"},
                    {"en": "More help from Chotu", "hi": "छोटू से और ज़्यादा मदद"},
                ]
                data["plusPage"]["factsToCheck"] = []
                log.append("K3\t1x\tPlus page list replaced with what Plus adds (the site's own list), heading changed")
            (out / f.name).write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", "utf-8")
        # preview.md: unscoped fixes only, same text
        pv = (src / "preview.md").read_text("utf-8")
        for (fb, files, scope, old, new, why) in FIXES:
            if fb == b and not files:
                pv = pv.replace(old, new) if not scope else pv
        (out / "preview.md").write_text(pv, "utf-8")
    missing = [FIXES[i] for i, c in hits.items() if c == 0]
    for i, (b, files, scope, old, new, why) in enumerate(FIXES):
        log.append(f"{b}\t{hits[i]}x\t{why}\n\t- {old!r}\n\t+ {new!r}")
    (HERE / "fixes.log").write_text("\n".join(log) + "\n", "utf-8")
    if missing:
        sys.exit("These fixes matched nothing:\n" + "\n".join(repr(m[3]) for m in missing))
    print(f"{len(FIXES)} fixes, {sum(hits.values())} replacements. Wrote {HERE}")


if __name__ == "__main__":
    main()
