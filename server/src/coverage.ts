import { type Env } from "./shared";

/**
 * Coverage: per paper and syllabus topic, how many items exist and how far each language has got. Feeds the desk's
 * Coverage tab and the admin Content section. Library items and Chai cards (rejected ones left out) are counted.
 *
 * The papers and topics are the app's own (android .../data/Syllabus.kt), and an item counts under a topic the way
 * Prep's Syllabus tab places it (PrepHome.kt topicPieces): its subject is one the topic draws on, and the topic's
 * words, if it has any, are in its title. Items with syllabus nodes (gs2-1, pre-4: mocks, past papers) are placed by
 * those instead. An item can count under several topics. Topics with nothing at all are the gaps.
 * Keep SYLLABUS and subjectByWords in step with the Android files when either changes.
 */

type Topic = { name: string; subjects: string[]; words?: RegExp };
const t = (name: string, subjects: string[], words?: string): Topic => ({ name, subjects, words: words ? new RegExp(words, "i") : undefined });

export const SYLLABUS: { id: string; name: string; topics: Topic[] }[] = [
  { id: "prelims", name: "Prelims GS Paper I", topics: [
    t("Current events of national and international importance", ["ir", "eco", "env", "sci", "more"]),
    t("History of India and the Indian National Movement", ["his", "anc", "art"]),
    t("Indian and world geography", ["geo"]),
    t("Indian polity and governance", ["pol"]),
    t("Economic and social development", ["eco", "soc"]),
    t("Environment, biodiversity and climate change", ["env"]),
    t("General science", ["sci"]),
  ] },
  { id: "csat", name: "Prelims Paper II (CSAT)", topics: [
    t("Comprehension", ["csat"], "comprehen|passage|read"),
    t("Logical reasoning and analytical ability", ["csat"], "logic|reason|syllog|puzzle|series"),
    t("Decision making and problem solving", ["csat"], "decision|problem"),
    t("General mental ability", ["csat"], "mental|pattern|direction|blood|calendar|clock"),
    t("Basic numeracy and data interpretation", ["csat"], "number|numer|data|percent|ratio|average|graph|table"),
    t("Interpersonal and communication skills", ["csat"], "communicat|interpersonal"),
  ] },
  { id: "gs1", name: "Mains GS Paper I", topics: [
    t("Indian culture: art forms, literature and architecture", ["art", "anc"]),
    t("Modern Indian history, mid-18th century on", ["his"], "british|company|1857|colonial|reform|modern|plassey|governor"),
    t("The freedom struggle and its contributors", ["his"], "freedom|congress|gandhi|swadeshi|movement|quit|nehru|bose|satyagraha"),
    t("Post-independence consolidation", ["his"], "partition|integration|states reorgan|independence|1947|princely"),
    t("World history: revolutions, wars, colonisation", ["his"], "world|revolution|war|french|russian|industrial"),
    t("Indian society, diversity, women, population and urbanisation", ["soc"]),
    t("Physical geography of the world", ["geo"], "plate|ocean|current|atmos|climate|earth|wind|monsoon|nino"),
    t("Resources and location of industries", ["geo"], "resource|mineral|industr|agri|crop|energy"),
    t("Earthquakes, tsunamis, cyclones and other phenomena", ["geo"], "earthquake|tsunami|cyclone|volcan|flood|landslide"),
  ] },
  { id: "gs2", name: "Mains GS Paper II", topics: [
    t("Constitution: making, features, amendments, basic structure", ["pol"], "constitution|preamble|amendment|basic structure|right|article|duty|directive"),
    t("Federalism and Centre–State relations", ["pol"], "federal|state|governor|centre|finance commission|schedule"),
    t("Parliament and state legislatures", ["pol"], "parliament|lok sabha|rajya|bill|session|legislat|speaker|committee|defection"),
    t("Executive and judiciary", ["pol"], "president|prime minister|cabinet|court|judic|judge|pil|executive"),
    t("Elections and the Representation of the People Act", ["pol"], "election|vote|electoral|eci|representation"),
    t("Constitutional, statutory and regulatory bodies", ["pol"], "commission|cag|upsc|niti|lokpal|nhrc|cic|tribunal|body"),
    t("Governance, transparency, e-governance and civil services", ["pol", "soc"], "governance|rti|transparen|citizen|civil service|accountab"),
    t("Welfare schemes, health, education, poverty and hunger", ["soc", "eco"], "scheme|welfare|health|education|poverty|hunger|nutrition|shg|ngo"),
    t("India and its neighbourhood", ["ir"], "neighbour|pakistan|china|nepal|bangladesh|sri lanka|bhutan|myanmar|maldives|afghan"),
    t("Groupings, agreements and international institutions", ["ir"], "\\bun\\b|wto|imf|brics|quad|sco|g20|asean|saarc|agreement|treaty|summit"),
    t("Indian diaspora and other countries' policies", ["ir"], "diaspora|us |usa|russia|europe|gulf|policy"),
  ] },
  { id: "gs3", name: "Mains GS Paper III", topics: [
    t("Economy: growth, planning, employment and inclusion", ["eco"], "growth|gdp|plan|employ|inclus|inflation|monetary|rbi|bank"),
    t("Government budgeting and taxation", ["eco"], "budget|tax|gst|fiscal|deficit"),
    t("Agriculture: crops, irrigation, MSP, PDS, food processing", ["eco", "geo"], "agri|crop|farm|irrigat|msp|pds|food|land reform"),
    t("Industry, liberalisation and infrastructure", ["eco"], "industr|liberal|infra|road|rail|port|invest|ppp"),
    t("Science and technology: space, IT, biotech, IPR", ["sci"]),
    t("Conservation, pollution and environmental impact", ["env"]),
    t("Disaster management", ["env", "geo"], "disaster|flood|cyclone|drought|earthquake|ndma"),
    t("Internal security: extremism, borders, cyber, money laundering", ["ir", "sci"], "security|terror|extrem|border|cyber|naxal|insurg|laundering"),
  ] },
  { id: "gs4", name: "Mains GS Paper IV: Ethics", topics: [
    t("Ethics and human interface", ["eth"], "ethic|moral|value|human"),
    t("Attitude, aptitude and foundational values", ["eth"], "attitude|aptitude|integrity|impartial|empathy|tolerance|compassion"),
    t("Emotional intelligence", ["eth"], "emotion"),
    t("Moral thinkers of India and the world", ["eth"], "thinker|gandhi|kant|aristotle|buddha|ambedkar|philosoph"),
    t("Public service values, probity and accountability", ["eth"], "probity|public service|accountab|corruption|code of conduct|governance"),
    t("Case studies", ["eth"], "case|dilemma"),
  ] },
  { id: "essay", name: "Essay paper", topics: [
    t("Essays on varied topics", ["ess"]),
    t("Answer structure and writing practice", ["mains"]),
  ] },
];

const SUBJECTS = ["pol", "his", "anc", "art", "geo", "env", "eco", "sci", "ir", "soc", "eth", "mains", "ess", "csat"];

/** The app's subject guess from a title (android .../data/Prep.kt subjectByWords). */
export function subjectByWords(text: string): string {
  const s = text.toLowerCase();
  if (/constitution|article|parliament|preamble|governor|president|court|amendment|citizenship|election|schedule|federal|defection|bill/.test(s)) return "pol";
  if (/monsoon|river|cyclone|lake|strait|map|geograph|soil|climate|nino/.test(s)) return "geo";
  if (/mughal|harappa|vedic|maurya|gupta|ancient|medieval/.test(s)) return "anc";
  if (/ethic|dilemma|integrity|virtue/.test(s)) return "eth";
  if (/answer|directive|essay|mains/.test(s)) return "mains";
  if (/scheme|gdp|inflation|bank|tax|economy|budget/.test(s)) return "eco";
  if (/forest|tiger|wildlife|biodiversity|pollution|stubble|environment/.test(s)) return "env";
  if (/1857|congress|gandhi|freedom|reform|british|colonial/.test(s)) return "his";
  return "more";
}

const text = (v: any): string => (typeof v === "string" ? v : typeof v?.en === "string" ? v.en : "");

/** The app's subject for an item (Prep.kt subjectOf): the id's first part if it names a subject, else from the words. */
function subjectOf(data: any, rowId: string, title: string): string {
  const id = typeof data?.id === "string" && data.id ? data.id : rowId.replace(/^[^:]*:/, "");
  const p = id.split("-")[0];
  if (SUBJECTS.includes(p)) return p;
  return subjectByWords(`${text(data?.title) || title} ${id}`);
}

/** Where a node id sits (Syllabus.kt syllabusNode): "gs2-1" is GS2's first topic; "pre-pol" the Prelims topic drawing on polity. */
function nodeCell(node: string): [string, number] | null {
  const key = node.split("-")[0].toLowerCase();
  const paper = ({ pre: "prelims", prelims: "prelims", gs: "prelims", csat: "csat", gs1: "gs1", gs2: "gs2", gs3: "gs3", gs4: "gs4", ethics: "gs4", essay: "essay" } as Record<string, string>)[key];
  const p = SYLLABUS.find((x) => x.id === paper);
  if (!p) return null;
  const rest = node.includes("-") ? node.slice(node.indexOf("-") + 1) : "";
  const n = Number(rest);
  if (Number.isInteger(n) && n >= 1 && n <= p.topics.length) return [p.id, n - 1];
  const w = rest.replace(/-/g, " ").toLowerCase();
  if (!w) return null;
  let i = p.topics.findIndex((x) => x.name.toLowerCase().includes(w));
  if (i < 0) i = p.topics.findIndex((x) => x.subjects.some((s) => w.startsWith(s)));
  return i < 0 ? null : [p.id, i];
}

/** Every syllabus node anywhere in an item (a mock or past paper has one list per question). */
function nodesOf(data: unknown): string[] {
  const out = new Set<string>();
  const walk = (v: any, key = "") => {
    if (Array.isArray(v)) {
      if (key === "nodes" || key === "syllabusNodes") v.forEach((x) => typeof x === "string" && out.add(x));
      else v.forEach((x) => walk(x));
    } else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
    else if (key === "node" && typeof v === "string") out.add(v);
  };
  walk(data);
  return [...out];
}

/** The (paper, topic index) cells an item counts in. `papers` limits a Chai card to its own paper (and Prelims). */
export function placeItem(data: any, rowId: string, title: string, papers?: string[]): [string, number][] {
  const fromNodes = nodesOf(data).map(nodeCell).filter((c): c is [string, number] => !!c);
  if (fromNodes.length) return [...new Map(fromNodes.map((c) => [c.join("|"), c])).values()];
  const subject = subjectOf(data, rowId, title);
  const words = `${text(data?.title) || title} ${rowId.replace(/-/g, " ")}`;
  const out: [string, number][] = [];
  for (const p of SYLLABUS) {
    if (papers && !papers.includes(p.id)) continue;
    p.topics.forEach((tp, i) => { if (tp.subjects.includes(subject) && (!tp.words || tp.words.test(words))) out.push([p.id, i]); });
  }
  return out;
}

interface Row {
  topic: string; subjects: string[]; total: number; hidden: number;
  en: { approved: number; waiting: number };
  hi: { approved: number; waiting: number; missing: number };
  kinds: Record<string, number>;
  status?: "gap" | "drafts" | "hindi" | "ok";
}

export async function coverage(env: Env) {
  const blank = (topic: string, subjects: string[]): Row => ({ topic, subjects, total: 0, hidden: 0, en: { approved: 0, waiting: 0 }, hi: { approved: 0, waiting: 0, missing: 0 }, kinds: {} });
  const grid = new Map(SYLLABUS.map((p) => [p.id, p.topics.map((tp) => blank(tp.name, tp.subjects))]));
  const nowhere = blank("Not under any syllabus topic", []);

  type Item = { kind: string; id: string; title: string; data: any; hidden: boolean; en: boolean; hiOk: boolean; hasHi: boolean; papers?: string[] };
  const items: Item[] = [];
  const lib = await env.DB.prepare("SELECT id, kind, title, json, status, en_editor, hi_editor FROM library").all<any>().catch(() => ({ results: [] as any[] }));
  for (const r of lib.results) {
    let data: any = {};
    try { data = JSON.parse(r.json); } catch {}
    items.push({ kind: r.kind, id: r.id, title: r.title, data, hidden: r.status === "hidden", en: !!r.en_editor, hiOk: !!r.hi_editor, hasHi: r.json.includes('"hi"') });
  }
  const cards = await env.DB.prepare("SELECT id, title, card_json, en_editor, hi_editor FROM candidates WHERE status != 'rejected'").all<any>().catch(() => ({ results: [] as any[] }));
  for (const r of cards.results) {
    let c: any = {};
    try { c = JSON.parse(r.card_json); } catch {}
    const headline = c.headline || r.title || "";
    // A card names its GS paper; it also counts as Prelims current events material.
    const gs = String(c.gsPaper ?? "").toLowerCase().replace(/\s+/g, "");
    items.push({ kind: "chai", id: "", title: `${headline} ${c.topic ?? ""}`, data: { title: `${headline} ${c.topic ?? ""}` }, hidden: false, en: !!r.en_editor, hiOk: !!r.hi_editor, hasHi: !!c.hi,
      papers: ["prelims", ...(/^gs[1-4]$/.test(gs) ? [gs] : [])] });
  }

  for (const it of items) {
    const cells = placeItem(it.data, it.id, it.title, it.papers);
    const rows = cells.length ? cells.map(([p, i]) => grid.get(p)![i]) : [nowhere];
    for (const row of rows) {
      row.total++;
      row.kinds[it.kind] = (row.kinds[it.kind] || 0) + 1;
      if (it.hidden) { row.hidden++; continue; }
      if (it.en) row.en.approved++; else row.en.waiting++;
      if (it.hiOk) row.hi.approved++; else if (it.hasHi) row.hi.waiting++; else row.hi.missing++;
    }
  }

  const status = (r: Row) => (r.total - r.hidden === 0 ? "gap" : r.en.approved === 0 ? "drafts" : r.hi.approved < r.en.approved ? "hindi" : "ok") as Row["status"];
  const papers = SYLLABUS.map((p) => ({ id: p.id, name: p.name, rows: grid.get(p.id)!.map((r) => ({ ...r, status: status(r) })) }));
  const all = papers.flatMap((p) => p.rows);
  return {
    papers,
    nowhere: nowhere.total ? { ...nowhere, status: status(nowhere) } : null,
    totals: {
      items: items.length,
      live: items.filter((i) => i.en && !i.hidden).length,
      hindiLive: items.filter((i) => i.hiOk && !i.hidden).length,
      waiting: items.filter((i) => !i.en && !i.hidden).length,
      topics: all.length,
      gaps: all.filter((r) => r.status === "gap").length,
      draftsOnly: all.filter((r) => r.status === "drafts").length,
    },
  };
}
