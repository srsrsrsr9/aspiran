/**
 * The 30 "wave 2" content types are configurations of nine interaction engines. On import (and
 * on every desk edit) each item gets a `play` object in its engine's shape, so the app has one
 * player per engine and a new type on an existing engine needs no app update.
 *
 * Every text in `play` is { en, hi?, te?, ... }. A language is dropped later by the public /library
 * route unless an editor for it approved it, like the rest of the item.
 *
 * toPlay reads English and Hindi. Other languages (translation files laid in with applyTranslation) are
 * added by addLangToPlay: it builds the play again from a view of the item where that language sits in the
 * English slot, then copies those texts in beside the English. Fixed labels come from LABELS.
 */

type Bi = { en: string; hi?: string; [lang: string]: string | undefined };
type BiList = { en: string[]; hi?: string[]; [lang: string]: string[] | undefined };

export const ENGINE_SCHEMAS: Record<string, { kind: string; engine: string; name: string }> = {};
const add = (engine: string, list: [string, string][]) => {
  for (const [kind, name] of list) ENGINE_SCHEMAS[`upsc-pods/${kind}@1`] = { kind, engine, name };
};
add("choose", [["trap-spotter", "Trap spotter"], ["better-answer", "Better answer"], ["odd-one-out", "Odd one out"], ["two-truths", "Two truths and a lie"],
  ["who-am-i", "Who am I?"], ["assertion-reason", "Assertion and reason"], ["how-many-correct", "How many are correct?"]]);
add("sort", [["bucket-sort", "Sort into buckets"], ["union-state-list", "Union, State or Concurrent"], ["fact-or-opinion", "Fact or opinion"]]);
add("order", [["rank-it", "Rank it"], ["timeline-shuffle", "Timeline shuffle"]]);
add("match", [["pair-up", "Pair up"], ["committee-match", "Committee match"]]);
add("reveal", [["flashcards", "Flashcards"], ["mnemonic", "Mnemonic"], ["acronym-unpack", "Acronym unpacked"], ["landmark-case", "Landmark case"],
  ["scheme-snapshot", "Scheme snapshot"], ["index-card", "Index card"], ["word-bank", "Word bank"], ["directive-word", "Directive words"], ["two-levels", "Two levels"]]);
add("steps", [["story-beats", "Story beats"], ["ethics-dilemma", "Ethics dilemma"], ["answer-skeleton", "Answer skeleton"]]);
add("compare", [["versus", "Versus"], ["before-after", "Before and after"]]);
add("hub", [["link-web", "Link web"]]);
add("cloze", [["fill-the-gap", "Fill the gap"]]);
add("picture", [["hidden-why", "The Hidden Why"]]);

export const ENGINE_KINDS: Record<string, string> = Object.fromEntries(Object.values(ENGINE_SCHEMAS).map((e) => [e.kind, e.engine]));
export const ENGINE_NAMES: Record<string, string> = Object.fromEntries(Object.values(ENGINE_SCHEMAS).map((e) => [e.kind, e.name]));

/** A field from a parallel { en: {...}, hi: {...} } pair. */
const f = (o: any, key: string): Bi => {
  const out: Bi = { en: String(o?.en?.[key] ?? "") };
  if (o?.hi?.[key] != null) out.hi = String(o.hi[key]);
  return out;
};
const fl = (o: any, key: string): BiList => {
  const out: BiList = { en: (o?.en?.[key] ?? []).map(String) };
  if (Array.isArray(o?.hi?.[key])) out.hi = o.hi[key].map(String);
  return out;
};
/** A top-level { en, hi } text, or a plain string. */
const t = (v: any): Bi => (typeof v === "string" ? { en: v } : { en: String(v?.en ?? ""), ...(v?.hi != null ? { hi: String(v.hi) } : {}) });
/** A fixed label. While addLangToPlay builds a language's view, the English slot holds that language's label. */
let viewLang = "en";
const lit = (en: string, hi: string): Bi => ({ en: viewLang === "en" ? en : LABELS[viewLang]?.[en] ?? en, hi });

/** Labels in languages beyond English and Hindi, keyed by the English. Telugu needs a Telugu editor's check. */
export const LABELS: Record<string, Record<string, string>> = {
  te: {
    "Extreme word": "అతి పదం", "Right fact, wrong reason": "సరైన వాస్తవం, తప్పు కారణం", "Scope swap": "పరిధి మార్పు",
    "Outdated": "పాత సమాచారం", "Half true": "సగం నిజం", "Sounds familiar": "తెలిసినట్టే ఉంది", "Correct": "సరైనది",
    "Which is the better answer?": "ఏది మెరుగైన సమాధానం?", "Which is the odd one out?": "వీటిలో భిన్నమైనది ఏది?",
    "Two are true. Which is the lie?": "రెండు నిజం. అబద్ధం ఏది?", "Who am I?": "నేను ఎవరు?",
    "Assertion (A)": "ప్రకటన (A)", "Reason (R)": "కారణం (R)", "Fact": "వాస్తవం", "Opinion": "అభిప్రాయం",
    "Put these in order, oldest first.": "వీటిని క్రమంలో పెట్టండి, పాతది మొదట.", "Committee": "కమిటీ", "What it studied": "ఏ అంశంపై",
    "The question": "ప్రశ్న", "What the court held": "కోర్టు ఏం చెప్పింది", "Why it matters": "ఇది ఎందుకు ముఖ్యం",
    "Ministry": "మంత్రిత్వ శాఖ", "Launched": "ప్రారంభం", "Aim": "లక్ష్యం", "Who it's for": "ఎవరి కోసం", "Key number": "ముఖ్య సంఖ్య",
    "Exam angle": "పరీక్ష కోణం", "Who publishes it": "ఎవరు విడుదల చేస్తారు", "What it measures": "ఇది ఏమి కొలుస్తుంది",
    "Where India stands": "భారత్ స్థానం", "Careful": "జాగ్రత్త", "Do": "చేయండి", "Avoid": "చేయకండి", "Simply put": "సులభంగా చెప్పాలంటే",
    "For the exam": "పరీక్ష కోసం", "Keywords": "ముఖ్య పదాలు", "Introduction": "పరిచయం", "Conclusion": "ముగింపు",
    "Keywords to use": "వాడదగిన పదాలు",
  },
};
/** Joins texts line by line in both languages; Hindi only when every part has it. */
const join = (parts: Bi[], sep = "\n"): Bi => {
  const out: Bi = { en: parts.map((p) => p.en).filter(Boolean).join(sep) };
  if (parts.every((p) => p.hi != null || !p.en)) out.hi = parts.map((p) => p.hi ?? "").filter(Boolean).join(sep);
  return out;
};
const label = (l: Bi, v: Bi): Bi => join([l, v], ": ");
const numbered = (l: BiList): Bi => ({ en: l.en.map((s, i) => `${i + 1}. ${s}`).join("\n"), ...(l.hi ? { hi: l.hi.map((s, i) => `${i + 1}. ${s}`).join("\n") } : {}) });
const listOf = (items: Bi[]): BiList => {
  const out: BiList = { en: items.map((i) => i.en) };
  if (items.every((i) => i.hi != null)) out.hi = items.map((i) => i.hi!);
  return out;
};

const TRAPS: Record<string, [string, string]> = {
  "extreme-word": ["Extreme word", "अति-शब्द"],
  "right-fact-wrong-reason": ["Right fact, wrong reason", "सही तथ्य, ग़लत कारण"],
  "scope-swap": ["Scope swap", "दायरे की अदला-बदली"],
  "outdated": ["Outdated", "पुराना तथ्य"],
  "half-true": ["Half true", "आधा सच"],
  "sounds-familiar": ["Sounds familiar", "जाना-पहचाना लगता है"],
  "none": ["Correct", "सही"],
};
/** Paper keys from templates/exam-formats.json, as chips. */
const PAPERS: Record<string, [string, string]> = {
  "prelims-gs1": ["Prelims GS1", "प्रारंभिक GS1"], "prelims-csat": ["CSAT", "CSAT"], "mains-gs1": ["GS1", "GS1"], "mains-gs2": ["GS2", "GS2"],
  "mains-gs3": ["GS3", "GS3"], "mains-gs4": ["GS4", "GS4"], "mains-essay": ["Essay", "निबंध"], "interview": ["Interview", "साक्षात्कार"],
};
const trapName = (k: string): Bi => (TRAPS[k] ? lit(...TRAPS[k]) : { en: k.replace(/-/g, " ") });

export function toPlay(kind: string, d: any): any {
  const engine = ENGINE_KINDS[kind];
  if (!engine) return null;
  switch (kind) {
    // --- Choose: one right option per round, a soft nudge and an explanation when wrong -------
    case "trap-spotter":
      return { engine, rounds: (d.questions ?? []).map((q: any) => ({
        prompt: f(q, "question"), options: fl(q, "options"), answer: q.answerIndex, why: f(q, "why"),
        tags: (q.traps ?? []).map(trapName),
      })) };
    case "better-answer":
      return { engine, rounds: (d.pairs ?? []).map((p: any) => ({
        prompt: join([lit("Which is the better " + (d.kind ?? "answer") + "?", "कौन-सा बेहतर है?"), f(p, "question")]),
        options: listOf([f(p, "a"), f(p, "b")]), answer: p.better, why: f(p, "why"),
      })) };
    case "odd-one-out":
      return { engine, rounds: (d.rounds ?? []).map((r: any) => ({
        prompt: lit("Which is the odd one out?", "इनमें से अलग कौन है?"), options: fl(r, "items"), answer: r.odd, why: f(r, "why"),
      })) };
    case "two-truths":
      return { engine, rounds: (d.rounds ?? []).map((r: any) => ({
        prompt: lit("Two are true. Which is the lie?", "दो सच हैं। झूठ कौन-सा है?"), options: fl(r, "statements"), answer: r.lie, why: f(r, "fix"),
      })) };
    case "who-am-i":
      return { engine, rounds: (d.rounds ?? []).map((r: any) => ({
        prompt: lit("Who am I?", "मैं कौन हूँ?"), clues: fl(r, "clues"), options: fl(r, "options"), answer: r.answer, why: f(r, "reveal"),
      })) };
    case "assertion-reason": {
      const keys = ["a", "b", "c", "d"];
      return { engine, rounds: (d.items ?? []).map((i: any) => ({
        prompt: join([label(lit("Assertion (A)", "कथन (A)"), f(i, "assertion")), label(lit("Reason (R)", "कारण (R)"), f(i, "reason"))], "\n\n"),
        options: t2l(d.optionText), answer: keys.indexOf(i.key), why: f(i, "why"),
      })) };
    }
    case "how-many-correct": {
      const opts = t2l(d.optionText);
      return { engine, rounds: (d.items ?? []).map((i: any) => {
        const n = (i.truth ?? []).filter(Boolean).length;
        return { prompt: join([f(i, "stem"), numbered(fl(i, "statements"))], "\n\n"), options: opts, answer: n === 0 ? opts.en.length - 1 : n - 1, why: f(i, "why") };
      }) };
    }

    // --- Sort: tap an item, then tap its bucket ------------------------------------------------
    case "bucket-sort":
      return { engine, buckets: t2l(d.buckets), items: (d.items ?? []).map((i: any) => ({ text: f(i, "text"), bucket: i.bucket, why: f(i, "why") })) };
    case "union-state-list": {
      const keys = ["union", "state", "concurrent"];
      return { engine, buckets: t2l(d.bucketNames), items: (d.items ?? []).map((i: any) => ({ text: f(i, "text"), bucket: keys.indexOf(i.list), why: f(i, "note") })) };
    }
    case "fact-or-opinion":
      return { engine, buckets: listOf([lit("Fact", "तथ्य"), lit("Opinion", "राय")]),
        items: (d.items ?? []).map((i: any) => ({ text: f(i, "text"), bucket: i.kind === "opinion" ? 1 : 0, why: f(i, "why") })) };

    // --- Order: items come in the right order; the app shuffles them --------------------------
    case "rank-it": {
      const unit = t(d.unit);
      return { engine, prompt: t(d.prompt), items: (d.items ?? []).map((i: any) => ({
        label: f(i, "label"), value: { en: `${Number(i.value).toLocaleString("en-IN")} ${unit.en}`, ...(unit.hi ? { hi: `${Number(i.value).toLocaleString("en-IN")} ${unit.hi}` } : {}) },
      })), takeaway: d.takeaway ? t(d.takeaway) : null };
    }
    case "timeline-shuffle":
      return { engine, prompt: lit("Put these in order, oldest first.", "इन्हें क्रम में रखिए, सबसे पुराना पहले।"),
        items: (d.items ?? []).map((i: any) => ({ label: f(i, "event"), value: { en: String(i.year) } })), takeaway: d.takeaway ? t(d.takeaway) : null };

    // --- Match: tap a left item, then its partner ----------------------------------------------
    case "pair-up":
      return { engine, left: f(d.heads, "left"), right: f(d.heads, "right"), pairs: (d.pairs ?? []).map((p: any) => ({ left: f(p, "left"), right: f(p, "right") })) };
    case "committee-match":
      return { engine, left: lit("Committee", "समिति"), right: lit("What it studied", "किस विषय पर"),
        pairs: (d.pairs ?? []).map((p: any) => {
          const c = f(p, "committee");
          return { left: { en: `${c.en} (${p.year})`, ...(c.hi ? { hi: `${c.hi} (${p.year})` } : {}) }, right: f(p, "subject") };
        }) };

    // --- Reveal: cards that turn over, one at a time -------------------------------------------
    case "flashcards":
      return { engine, cards: (d.cards ?? []).map((c: any) => ({ front: f(c, "front"), back: f(c, "back") })) };
    case "mnemonic":
      return { engine, intro: join([t(d.mnemonic), t(d.for)]), cards: (d.letters ?? []).map((l: any) => ({ front: f(l, "key"), back: f(l, "stands") })), outro: d.note ? t(d.note) : null };
    case "acronym-unpack":
      return { engine, intro: { en: d.acronym }, cards: (d.letters ?? []).map((l: any) => ({ front: f(l, "letter"), back: f(l, "word") })),
        outro: join([f(d, "what"), f(d, "fact")], "\n\n") };
    case "landmark-case":
      return { engine, intro: { en: `${t(d.case).en} (${d.year})`, ...(t(d.case).hi ? { hi: `${t(d.case).hi} (${d.year})` } : {}) }, cards: [
        { front: lit("The question", "सवाल"), back: f(d, "question") },
        { front: lit("What the court held", "अदालत ने क्या कहा"), back: f(d, "held") },
        { front: lit("Why it matters", "यह क्यों मायने रखता है"), back: f(d, "matters") },
      ] };
    case "scheme-snapshot":
      return { engine, intro: f(d, "name"), cards: [
        { front: lit("Ministry", "मंत्रालय"), back: f(d, "ministry") },
        { front: lit("Launched", "शुरुआत"), back: { en: String(d.launched ?? "") } },
        { front: lit("Aim", "उद्देश्य"), back: f(d, "aim") },
        { front: lit("Who it's for", "किसके लिए"), back: f(d, "who") },
        { front: lit("Key number", "मुख्य आँकड़ा"), back: f(d, "keyNumber") },
        { front: lit("Exam angle", "परीक्षा का नज़रिया"), back: f(d, "examAngle") },
      ].filter((c) => c.back.en) };
    case "index-card":
      return { engine, intro: f(d, "index"), cards: [
        { front: lit("Who publishes it", "कौन जारी करता है"), back: f(d, "publisher") },
        { front: lit("What it measures", "यह क्या मापता है"), back: f(d, "measures") },
        { front: lit("Where India stands", "भारत कहाँ है"), back: f(d, "indiaPoint") },
        { front: lit("Careful", "सावधानी"), back: f(d, "caution") },
      ].filter((c) => c.back.en) };
    case "word-bank":
      return { engine, cards: (d.words ?? []).map((w: any) => ({ front: f(w, "term"), back: join([f(w, "meaning"), f(w, "example")], "\n\n") })) };
    case "directive-word":
      return { engine, cards: (d.words ?? []).map((w: any) => ({ front: f(w, "word"),
        back: join([f(w, "means"), label(lit("Do", "करें"), f(w, "do")), label(lit("Avoid", "न करें"), f(w, "avoid"))], "\n\n") })) };
    case "two-levels":
      return { engine, intro: t(d.concept), cards: [
        { front: lit("Simply put", "आसान भाषा में"), back: f(d, "simple") },
        { front: lit("For the exam", "परीक्षा के लिए"), back: f(d, "exam") },
      ], outro: join([lit("Keywords", "मुख्य शब्द"), { en: fl(d, "keywords").en.join(", "), ...(fl(d, "keywords").hi ? { hi: fl(d, "keywords").hi!.join(", ") } : {}) }], ": ") };

    // --- Steps: one beat at a time; the ethics dilemma has choices with no right answer --------
    case "story-beats":
      return { engine, beats: (d.beats ?? []).map((b: any) => ({ head: f(b, "head"), text: f(b, "text") })), outro: d.takeaway ? t(d.takeaway) : null };
    case "answer-skeleton": {
      const body = fl(d, "body");
      return { engine, intro: join([{ en: d.paper ? `${d.paper} · ` + f(d, "directive").en : f(d, "directive").en, hi: f(d, "directive").hi }, f(d, "question")], "\n"),
        beats: [
          { head: lit("Introduction", "भूमिका"), text: f(d, "intro") },
          ...body.en.map((s, i) => ({ head: { en: `Body, point ${i + 1}`, hi: `मुख्य भाग, बिंदु ${i + 1}` }, text: { en: s, ...(body.hi?.[i] ? { hi: body.hi[i] } : {}) } })),
          { head: lit("Conclusion", "निष्कर्ष"), text: f(d, "conclusion") },
        ],
        outro: join([lit("Keywords to use", "इस्तेमाल करने लायक शब्द"), { en: fl(d, "keywords").en.join(", "), ...(fl(d, "keywords").hi ? { hi: fl(d, "keywords").hi!.join(", ") } : {}) }], ": ") };
    }
    case "ethics-dilemma": {
      const en = d.en?.options ?? [];
      const hi = d.hi?.options ?? [];
      return { engine, intro: f(d, "scenario"), question: f(d, "question"), noRightAnswer: true,
        choices: en.map((o: any, i: number) => ({
          label: { en: o.label, ...(hi[i] ? { hi: hi[i].label } : {}) },
          outcome: { en: o.outcome, ...(hi[i] ? { hi: hi[i].outcome } : {}) },
          values: { en: o.values, ...(hi[i] ? { hi: hi[i].values } : {}) },
        })), outro: f(d, "reflect") };
    }

    // --- Picture story: caption frames over one tall drawing, then three cards ------------------
    case "hidden-why":
      return { engine, image: d.illustration ?? null,
        frames: (d.frames ?? []).map((fr: any) => ({ text: t(fr), focus: Array.isArray(fr.focus) ? fr.focus.map(Number) : [180, 320, 1] })),
        named: t(d.named), sayItSmart: t(d.sayItSmart), careful: t(d.careful),
        followUp: { q: t(d.followUp?.q), hint: t(d.followUp?.hint) },
        useItIn: (d.useItIn ?? []).map((u: any) => ({ paper: PAPERS[u.paper] ? lit(...PAPERS[u.paper]) : { en: String(u.paper ?? "") }, text: t(u) })),
        sources: (d.sources ?? []).map((s: any) => ({ label: String(s?.label ?? s ?? ""), verify: !!s?.verify })) };

    // --- Compare: two columns, row by row ------------------------------------------------------
    case "versus":
      return { engine, a: f(d, "a"), b: f(d, "b"), rows: zipRows(d, "rows", (r) => [r.label, r.a, r.b]), takeaway: f(d, "takeaway") };
    case "before-after":
      return { engine, heading: join([f(d, "law"), f(d, "amendment")]), a: { en: `Before ${d.year}`, hi: `${d.year} से पहले` }, b: { en: `After ${d.year}`, hi: `${d.year} के बाद` },
        rows: [{ label: { en: "" }, a: f(d, "before"), b: f(d, "after") }], takeaway: f(d, "why") };

    // --- Link web: one topic in the middle, spokes to other papers -----------------------------
    case "link-web":
      return { engine, center: f(d, "center"), spokes: zipRows(d, "spokes", (s) => [s.label, s.link]).map(([l, k]: Bi[]) => ({ label: l, link: k })), question: f(d, "question") };

    // --- Fill the gap: tap a gap, then a word from the bank ------------------------------------
    case "fill-the-gap":
      return { engine, text: f(d, "text"), bank: fl(d, "bank"), answers: d.answers ?? [], why: f(d, "why") };
  }
  return null;
}

/** A copy of the item with `lang` in every English slot, so toPlay builds that language's texts. */
function viewIn(v: any, lang: string): any {
  if (Array.isArray(v)) return v.map((x) => viewIn(x, lang));
  if (!v || typeof v !== "object") return v;
  const out: any = {};
  for (const [k, x] of Object.entries(v)) if (k !== lang) out[k] = viewIn(x, lang);
  if ("en" in v && v[lang] != null) out.en = viewIn(v[lang], lang);
  return out;
}

/** Copies the `en` texts of `from` (a play built in another language's view) into `into` as `lang`. */
function mergeLang(into: any, from: any, lang: string) {
  if (Array.isArray(into)) return into.forEach((x, i) => mergeLang(x, from?.[i], lang));
  if (!into || typeof into !== "object" || !from || typeof from !== "object") return;
  if ("en" in into && (typeof into.en === "string" || Array.isArray(into.en)) && from.en != null) into[lang] = from.en;
  for (const [k, x] of Object.entries(into)) if (k !== "en" && k !== lang && typeof x === "object") mergeLang(x, from[k], lang);
}

/** Adds one more language to an item's play, from its texts laid in beside the English. */
export function addLangToPlay(kind: string, d: any, lang: string) {
  if (!d.play || lang === "en" || lang === "hi") return;
  viewLang = lang;
  try {
    mergeLang(d.play, toPlay(kind, viewIn(d, lang)), lang);
  } finally {
    viewLang = "en";
  }
}

/** A { en: [...], hi: [...] } list at the top level. */
function t2l(v: any): BiList {
  return { en: (v?.en ?? []).map(String), ...(Array.isArray(v?.hi) ? { hi: v.hi.map(String) } : {}) };
}

/** Rows that live inside en/hi objects ({ en: { rows: [...] }, hi: { rows: [...] } }), zipped by index. */
function zipRows(d: any, key: string, pick: (r: any) => any[]): any {
  const en = d.en?.[key] ?? [];
  const hi = d.hi?.[key] ?? [];
  const rows = en.map((r: any, i: number) => {
    const e = pick(r);
    const h = hi[i] ? pick(hi[i]) : [];
    return e.map((v: any, j: number) => ({ en: String(v ?? ""), ...(h[j] != null ? { hi: String(h[j]) } : {}) }));
  });
  return key === "rows" ? rows.map(([label, a, b]: Bi[]) => ({ label, a, b })) : rows;
}

/** What an editor should fix before approving, per engine. */
export function checkPlay(kind: string, d: any): string[] {
  const p = d.play;
  if (!ENGINE_KINDS[kind]) return [];
  if (!p) return ["The app can't play this item: its fields don't match the template"];
  const flags: string[] = [];
  const n = (a: any) => (Array.isArray(a) ? a.length : 0);
  switch (p.engine) {
    case "choose":
      if (!n(p.rounds)) flags.push("Add at least one question");
      p.rounds.forEach((r: any, i: number) => {
        if (!(r.answer >= 0 && r.answer < n(r.options.en))) flags.push(`Question ${i + 1}: the right answer isn't one of the options`);
      });
      break;
    case "sort":
      p.items.forEach((it: any, i: number) => { if (!(it.bucket >= 0 && it.bucket < n(p.buckets.en))) flags.push(`Item ${i + 1}: its bucket doesn't exist`); });
      break;
    case "order":
      if (n(p.items) < 3) flags.push("Put in order needs at least 3 items");
      break;
    case "match":
      if (n(p.pairs) < 3) flags.push("Match needs at least 3 pairs");
      break;
    case "reveal":
      if (!n(p.cards)) flags.push("Add at least one card");
      break;
    case "steps":
      if (!n(p.beats) && !n(p.choices)) flags.push("Add at least one step");
      break;
    case "picture": {
      const fr = Array.isArray(p.frames) ? p.frames : [];
      if (fr.length < 5 || fr.length > 8) flags.push("The Hidden Why needs 5 to 8 frames");
      fr.forEach((x: any, i: number) => {
        const [fx, fy, z] = x.focus ?? [];
        if (!(fx >= 0 && fx <= 360 && fy >= 0 && fy <= 640)) flags.push(`Frame ${i + 1}: focus must be inside the 360×640 drawing`);
        if (!(z >= 1 && z <= 2.5)) flags.push(`Frame ${i + 1}: zoom must be between 1 and 2.5`);
        if (String(x.text?.en ?? "").trim().split(/\s+/).filter(Boolean).length > 16) flags.push(`Frame ${i + 1}: the English caption is over 16 words`);
      });
      if (!p.careful?.en) flags.push("Add the Careful note");
      if (!p.followUp?.q?.en || !p.followUp?.hint?.en) flags.push("Add the follow-up question and its hint");
      if (!n(p.sources)) flags.push("Add at least one source");
      if (p.sources?.some((s: any) => s.verify)) flags.push("A source is marked verify: check it before approving");
      const texts: Bi[] = [...fr.map((x: any) => x.text), p.named, p.sayItSmart, p.careful, p.followUp?.q, p.followUp?.hint, ...(p.useItIn ?? []).map((u: any) => u.text)].filter((x) => x?.en);
      const hi = texts.filter((x) => x.hi != null);
      if (hi.length && hi.length < texts.length) flags.push("Some texts have Hindi and some don't: the English and Hindi lists must match");
      if (hi.some((x) => x.hi && !/[ऀ-ॿ]/.test(x.hi))) flags.push("A Hindi text has no Devanagari");
      break;
    }
    case "cloze": {
      const gaps = [...String(p.text.en).matchAll(/\[\[(\d+)\]\]/g)].map((m) => Number(m[1]));
      if (gaps.length !== n(p.answers)) flags.push("The number of gaps doesn't match the answers");
      if (p.answers.some((a: number) => !(a >= 0 && a < n(p.bank.en)))) flags.push("An answer points outside the word bank");
      break;
    }
  }
  return flags;
}

/** A blank draft shaped like an existing item: every English and Hindi text emptied, numbers and keys kept. */
export function blankFrom(d: any): any {
  const walk = (v: any, inText: boolean): any => {
    if (typeof v === "string") return inText ? "" : v;
    if (Array.isArray(v)) return v.map((x) => walk(x, inText));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, inText || k === "en" || k === "hi")]));
    return v;
  };
  const out = walk(structuredClone(d), false);
  delete out.play;
  delete out.sounds;
  delete out.provenance;
  out.review = { en: { checkedBy: null, checkedOn: null }, hi: { checkedBy: null, checkedOn: null } };
  return out;
}
