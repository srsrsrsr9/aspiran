"""Turns a written note into a spoken script: numbers said in Indian style, symbols as words, short clean lines."""
import re

# ---------------- English ----------------
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()

def en_99(n):
    if n < 20: return ONES[n]
    t, o = divmod(n, 10)
    return TENS[t] + ("-" + ONES[o] if o else "")

def en_999(n):
    h, r = divmod(n, 100)
    if not h: return en_99(r)
    return ONES[h] + " hundred" + (" and " + en_99(r) if r else "")

def en_int(n):
    """Indian grouping: crore, lakh, thousand."""
    if n == 0: return "zero"
    parts = []
    cr, n = divmod(n, 10**7)
    lk, n = divmod(n, 10**5)
    th, n = divmod(n, 1000)
    if cr: parts.append(en_int(cr) + " crore")
    if lk: parts.append(en_99(lk) + " lakh")
    if th: parts.append(en_99(th) + " thousand")
    if n: parts.append(en_999(n) if (parts == [] or n >= 100) else "and " + en_99(n))
    return " ".join(parts)

def en_num(s):
    s = s.replace(",", "")
    if "." in s:
        a, b = s.split(".", 1)
        return en_int(int(a or 0)) + " point " + " ".join(ONES[int(c)] for c in b)
    return en_int(int(s))

FRACS_EN = {"1/2": "one half", "1/3": "one-third", "2/3": "two-thirds", "1/4": "one-quarter", "3/4": "three-quarters", "1/5": "one-fifth",
            "1/6": "one-sixth", "1/8": "one-eighth", "1/10": "one-tenth", "1/12": "one-twelfth", "4/5": "four-fifths"}
UNITS_EN = {"km/h": "kilometres per hour", "m/s": "metres per second", "km": "kilometres", "kg": "kilograms", "mm": "millimetres", "cm": "centimetres",
            "GW": "gigawatts", "MW": "megawatts", "sq km": "square kilometres", "ha": "hectares", "µg/m³": "micrograms per cubic metre"}

SAY_EN = {"NCIIPC": "N C I I P C", "CERT-In": "Sert In"}   # letter runs the voices stumble on

def money_en(m):
    cur, num, unit = m.group(1), m.group(2), (m.group(3) or "").strip()
    word = {"₹": "rupees", "Rs": "rupees", "Rs.": "rupees", "$": "dollars", "US$": "dollars"}.get(cur, "rupees")
    return f"{num}{(' ' + unit) if unit else ''} {word}"

def english(t):
    t = t.replace("•", "\n").replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    t = re.sub(r"(US\$|₹|Rs\.?|\$)\s?([\d.,]+)(\s?(?:lakh crore|crore|lakh|thousand|million|billion|trillion|bn|cr))?",
               lambda m: money_en(m).replace(" bn ", " billion ").replace(" cr ", " crore "), t)
    # Article references: 19(1)(a) -> 19 1 a ; 243-O -> 243 O ; 21A -> 21 A
    t = re.sub(r"\b(\d+)([A-Z]{0,2})\((\d+[A-Z]?)\)(?:\(([a-z]{1,3})\))?",
               lambda m: f"{m.group(1)} {m.group(2) + ' ' if m.group(2) else ''}{m.group(3)}{' ' + ' '.join(m.group(4)) if m.group(4) else ''}", t)
    t = re.sub(r"(?<![\w.])([A-Z])\.\s?(?=[A-Z])", r"\1 ", t)
    t = re.sub(r"\b(\d+)-([A-Z])\b", r"\1 \2", t)
    t = re.sub(r"\b(\d{2,3})([A-Z]{1,2})\b", lambda m: m.group(1) + " " + " ".join(m.group(2)), t)
    # fiscal years and ranges: 2024-25 -> 2024 to 2025 ; 1977-78 ; 10-15 -> 10 to 15
    t = re.sub(r"\b(1[89]|20)(\d\d)\s?[-–]\s?(\d\d)\b", lambda m: f"{m.group(1)}{m.group(2)} to {m.group(1)}{m.group(3)}", t)
    t = re.sub(r"(\d)\s?[–-]\s?(\d)", r"\1 to \2", t)
    t = re.sub(r"\b(\d+)s\b", r"\1s", t)
    for k, v in FRACS_EN.items(): t = re.sub(rf"(?<![\d/]){re.escape(k)}(?![\d/])", v, t)
    t = re.sub(r"(?<=\d)\s?°C", " degrees Celsius", t)
    t = re.sub(r"(?<=\d)\s?°", " degrees", t)
    for k, v in sorted(UNITS_EN.items(), key=lambda kv: -len(kv[0])): t = re.sub(rf"(?<=\d)\s?{re.escape(k)}\b", " " + v, t)
    t = re.sub(r"(?<=\d)\s?×", " times", t)
    t = t.replace("×", " times ").replace("~", "about ").replace("≈", "about ").replace("≥", "at least ").replace("÷", " divided by ")
    t = t.replace(" = ", " equals ").replace("=", " equals ").replace(" + ", " plus ").replace("&", " and ").replace("−", "minus ").replace("‰", " per thousand")
    t = re.sub(r"(?<=\d)\+(?=\d)", " plus ", t)
    t = re.sub(r"(?<=[A-Za-z])/(?=[A-Za-z])", " or ", t)
    t = re.sub(r"(?<=\d)/(?=\d)", " by ", t)
    # Big comma numbers in Indian style words; keep plain years and small numbers for the voice.
    t = re.sub(r"\b\d{1,3}(?:,\d{2,3})+(?:\.\d+)?\b", lambda m: en_num(m.group(0)), t)
    t = re.sub(r"\b\d{6,}\b", lambda m: en_num(m.group(0)), t)
    t = re.sub(r"\bGS(\d)\b", r"G S \1", t)
    t = re.sub(r"\b(COP|G|PSLV-C|SLV-|GSLV-|Chandrayaan-|Gaganyaan-|Mangalyaan-|INS-)(\d+)", lambda m: m.group(1).rstrip("-") + " " + m.group(2), t)
    for k, v in SAY_EN.items(): t = t.replace(k, v)
    t = re.sub(r"\bvs\.?\s", "versus ", t)
    t = t.replace("e.g.", "for example").replace("i.e.", "that is").replace("etc.", "and so on")
    return tidy(t)

def tidy(t):
    t = re.sub(r"\(([^()]*)\)", r", \1,", t)          # parentheses become a short aside
    t = t.replace("'", "") if False else t
    t = re.sub(r"\s*;\s*", ". ", t)
    t = re.sub(r",\s*,", ",", t)
    t = re.sub(r",\s*([.:!?।])", r"\1", t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r" ?\n ?", "\n", t)
    t = re.sub(r"\n{2,}", "\n", t)
    return t.strip()

# ---------------- Hindi ----------------
HI = ("शून्य एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस बीस इक्कीस बाईस तेईस चौबीस पच्चीस "
      "छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस चालीस इकतालीस बयालीस तैंतालीस चवालीस "
      "पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरेपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ साठ इकसठ बासठ तिरेसठ चौंसठ "
      "पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उनासी अस्सी इक्यासी बयासी "
      "तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानवे बानवे तिरानवे चौरानवे पंचानवे छियानवे सत्तानवे अट्ठानवे निन्यानवे").split()
assert len(HI) == 100

def hi_int(n):
    if n < 100: return HI[n]
    parts = []
    cr, n = divmod(n, 10**7)
    lk, n = divmod(n, 10**5)
    th, n = divmod(n, 1000)
    h, n = divmod(n, 100)
    if cr: parts.append(hi_int(cr) + " करोड़")
    if lk: parts.append(HI[lk] + " लाख")
    if th: parts.append(HI[th] + " हज़ार")
    if h: parts.append(HI[h] + " सौ")
    if n: parts.append(HI[n])
    return " ".join(parts)

def hi_year(n):
    if 1100 <= n <= 1999 and n % 100 != 0 or n in (1100,1200,1300,1400,1500,1600,1700,1800,1900):
        a, b = divmod(n, 100)
        return HI[a] + " सौ" + (" " + HI[b] if b else "")
    return hi_int(n)

def hi_num(s, year_ok=True):
    s = s.replace(",", "")
    if "." in s:
        a, b = s.split(".", 1)
        if b == "5" and a in ("1", "2"): return {"1": "डेढ़", "2": "ढाई"}[a]
        return hi_int(int(a or 0)) + " दशमलव " + " ".join(HI[int(c)] for c in b)
    n = int(s)
    if year_ok and 1100 <= n <= 2099 and len(s) == 4: return hi_year(n)
    return hi_int(n)

FRACS_HI = {"1/2": "आधा", "1/3": "एक-तिहाई", "2/3": "दो-तिहाई", "1/4": "एक-चौथाई", "3/4": "तीन-चौथाई", "1/5": "पाँचवाँ हिस्सा", "1/6": "छठा हिस्सा",
            "1/8": "आठवाँ हिस्सा", "1/10": "दसवाँ हिस्सा", "1/12": "बारहवाँ हिस्सा", "4/5": "चार-पाँचवाँ"}
UNITS_HI = {"km/h": "किलोमीटर प्रति घंटा", "m/s": "मीटर प्रति सेकंड", "km": "किलोमीटर", "kg": "किलोग्राम", "mm": "मिलीमीटर", "cm": "सेंटीमीटर",
            "GW": "गीगावाट", "MW": "मेगावाट", "sq km": "वर्ग किलोमीटर", "ha": "हेक्टेयर", "µg/m³": "माइक्रोग्राम प्रति घन मीटर"}

def hindi(t):
    t = t.replace("•", "\n").replace("’", "").replace("‘", "").replace("“", "").replace("”", "").replace("'", "").replace('"', "")
    # ₹2.5 लाख करोड़ -> ढाई लाख करोड़ रुपये
    t = re.sub(r"(₹|Rs\.?)\s?([\d.,]+)(\s?(?:लाख करोड़|करोड़|लाख|हज़ार|हजार|lakh crore|crore|lakh))?",
               lambda m: f"{m.group(2)}{m.group(3) or ''} रुपये", t)
    t = re.sub(r"(US\$|\$)\s?([\d.,]+)(\s?(?:ट्रिलियन|बिलियन|मिलियन|trillion|billion|million))?", lambda m: f"{m.group(2)}{m.group(3) or ''} डॉलर", t)
    t = re.sub(r"\b(\d+)([A-Z]{0,2})\((\d+[A-Z]?)\)(?:\(([a-z]{1,3})\))?",
               lambda m: f"{m.group(1)} {m.group(2) + ' ' if m.group(2) else ''}{m.group(3)}{' ' + ' '.join(m.group(4)) if m.group(4) else ''}", t)
    t = re.sub(r"(\d)-([A-Z])\b", r"\1 \2", t)
    t = re.sub(r"(\d{2,3})([A-Z]{1,2})\b", lambda m: m.group(1) + " " + " ".join(m.group(2)), t)
    t = re.sub(r"\b(1[89]|20)(\d\d)\s?[-–]\s?(\d\d)\b", lambda m: f"{m.group(1)}{m.group(2)} से {m.group(1)}{m.group(3)}", t)
    t = re.sub(r"(\d)\s?[–-]\s?(\d)", r"\1 से \2", t)
    for k, v in FRACS_HI.items(): t = re.sub(rf"(?<![\d/]){re.escape(k)}(?![\d/])", v, t)
    t = re.sub(r"(?<=\d)\s?°C", " डिग्री सेल्सियस", t)
    t = re.sub(r"(?<=\d)\s?°", " डिग्री", t)
    for k, v in sorted(UNITS_HI.items(), key=lambda kv: -len(kv[0])): t = re.sub(rf"(?<=\d)\s?{re.escape(k)}\b", " " + v, t)
    t = re.sub(r"(?<=\d)\s?%", " प्रतिशत", t)
    t = t.replace("~", "लगभग ").replace("≈", "लगभग ").replace("×", " गुना ").replace("≥", "कम से कम ").replace("÷", " भाग ")
    t = t.replace(" = ", " बराबर ").replace("=", " बराबर ").replace(" + ", " और ").replace("&", " और ").replace("−", "ऋण ").replace("‰", " प्रति हज़ार")
    t = re.sub(r"(?<=\d)\+(?=\d)", " और ", t)
    t = re.sub(r"(?<=[A-Za-z])/(?=[A-Za-z])", " या ", t)
    t = re.sub(r"(?<=\d)/(?=\d)", " बटा ", t)
    t = re.sub(r"\bGS(\d)\b", r"GS \1", t)
    t = re.sub(r"(COP|G|PSLV-C|SLV-|GSLV-|चंद्रयान-|गगनयान-)(\d+)", lambda m: m.group(1).rstrip("-") + " " + m.group(2), t)
    t = re.sub(r"(?<![\w.])([A-Z])\.\s?(?=[A-Z])", r"\1 ", t)
    # every number becomes words; an ordinal suffix (वें, वाँ, वीं) stays attached
    t = re.sub(r"\d+(?:,\d{2,3})*(?:\.\d+)?", lambda m: hi_num(m.group(0)), t)
    return tidy(t)

def speak(text, lang):
    return english(text) if lang == "en" else hindi(text)

if __name__ == "__main__":
    print(english("The Centre set aside ₹2.5 lakh crore in 2024-25. Article 280(3)(bb), Articles 243 to 243-O, 21A. About 1,20,000 villages; ~6,371 km. L. M. Singhvi. COP29, GS2, 1/3 seats, 5+3+3+4. 25°C."))
    print(hindi("केंद्र ने ₹2.5 लाख करोड़ रखे। 2024-25 में महँगाई 4.3% रही। 73वें संशोधन ने अनुच्छेद 243 से 243-O जोड़े। अनुच्छेद 280(3)(bb)। लगभग 1,20,000 गाँव। 1986 में, 2025 में, 1947, 1/3 सीटें, COP29"))
