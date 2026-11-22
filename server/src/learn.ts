// Public topic pages, for search engines and for people who haven't signed in: one page per syllabus topic at
// /learn/<node id>-<slug>, an index at /learn, and /learn/sitemap.xml.
//
// What a topic page shows is a taste, never the library: UPSC's own syllabus lines for the topic, how often UPSC has
// asked it and in which papers, its past questions, and for each approved long read its title, its one-line promise,
// its opening lines and its outline. The rest of every read, the practice and the review stay in the app, behind
// sign-in (isContentRoute in auth.ts).
// UPSC's own papers are public in full (sales build order, step 2): /learn/papers lists them by year, each paper has a
// page (/learn/papers/<paper id>) and each question its own (/learn/papers/<paper id>/<n>), with UPSC's official answer
// where UPSC published a key, and never an answer of ours. Approved content only, the same rule as /library.
// Cached for an hour.

import { publicLibrary } from "./content";
import { type Env } from "./shared";
import { flags } from "./staff";
import { NODES, PAPERS } from "../public/app/syllabus.js";
import { LINES } from "../public/app/syllabus-lines.js";

type Item = { id: string; kind: string; data: any };
type Node = { id: string; name: string; paper: { id: string; short: string; name: string; lead: string } };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
export const learnPath = (n: { id: string; name: string }) => `/learn/${n.id}-${slug(n.name)}`;
const en = (v: any): string => (typeof v === "string" ? v : v?.en ?? "");
/** The opening of a read: about `n` words, cut at a sentence end where there is one. */
function opening(text: string, n = 90): string {
  const words = String(text ?? "").replace(/\s+/g, " ").trim().split(" ");
  if (words.length <= n) return words.join(" ");
  const cut = words.slice(0, n).join(" ");
  const stop = cut.lastIndexOf(". ");
  return (stop > cut.length * 0.5 ? cut.slice(0, stop + 1) : cut + " …");
}
const clip = (s: string, n: number) => { const x = s.replace(/\s+/g, " ").trim(); return x.length <= n ? x : x.slice(0, x.lastIndexOf(" ", n - 1) > n * 0.6 ? x.lastIndexOf(" ", n - 1) : n - 1) + " …"; };
const nodesOf = (d: any): string[] => [...new Set([d?.node, ...(Array.isArray(d?.nodes) ? d.nodes : [])].filter((x) => typeof x === "string"))];

const KIND_WORDS: Record<string, [string, string]> = {
  read: ["long read", "long reads"], mock: ["mock paper", "mock papers"], flashcards: ["flashcard deck", "flashcard decks"],
  "mains-skeleton": ["Mains answer frame", "Mains answer frames"], "topic-path": ["start-to-finish topic", "start-to-finish topics"],
  "gs4-case": ["ethics case", "ethics cases"], essay: ["essay", "essays"], printable: ["printable sheet", "printable sheets"],
  "audio-lecture": ["audio talk", "audio talks"], terms: ["term list", "term lists"],
};

interface Asked { paper: Paper; q: Q }
interface Topic { node: Node; reads: Item[]; pyqs: { text: string; year: number; exam: string; n: string }[]; pyqTotal: number; byYear: Record<string, number>; asked: Asked[]; counts: Record<string, number>; hasPath: boolean }
interface Q { n: string; nodes: string[]; marks?: number; words?: number; en: { q: string; options?: string[] }; answer?: number | null; explain?: Explain }
/** Why UPSC's keyed answer is right, written for Aspiran. Shown only beside an official key, never instead of one. */
interface Explain { why: string; wrong: { option: number; text: string }[]; trap: string }
interface Paper { id: string; exam: "prelims" | "mains"; year: number; paper: string; title: string; sourceUrl: string; key: { status: string; url?: string; dropped?: string[]; provisional?: boolean }; questions: Q[] }

const PAPER_NAME: Record<string, string> = { prelims: "GS Paper I", csat: "CSAT (GS Paper II)", gs1: "GS Paper I", gs2: "GS Paper II", gs3: "GS Paper III", gs4: "GS Paper IV", essay: "Essay" };
const paperName = (p: Paper) => `UPSC ${p.exam === "mains" ? "Mains" : "Prelims"} ${p.year} · ${PAPER_NAME[p.paper] ?? p.paper}`;
const paperPath = (p: { id: string }) => `/learn/papers/${p.id}`;
const qPath = (p: { id: string }, q: { n: string }) => `/learn/papers/${p.id}/${encodeURIComponent(q.n)}`;
// The same papers are on aspiran.in/pyq (the website, since 22 Nov 2026), richer and in Hindi too: search engines are
// pointed there, and these pages leave the /learn sitemap. Slugs match the website's paperSlug (src/lib/content.ts).
const SITE_PYQ = "https://aspiran.in/pyq/";
const sitePaper = (p: { exam: string; year: number; paper: string }) => `${SITE_PYQ}${p.exam}-${p.year}-${p.paper === "prelims" ? "gs1" : p.paper}/`;
const siteQ = (p: { exam: string; year: number; paper: string }, q: { n: string | number }) => `${sitePaper(p)}q${q.n}/`;
const LETTER = "abcd";
/** Papers in reading order: newest year first, Prelims before Mains, then GS1, CSAT, GS2 … Essay. */
const ORDER = ["prelims", "csat", "gs1", "gs2", "gs3", "gs4", "essay"];
const byPaper = (a: Paper, b: Paper) => b.year - a.year || (a.exam === b.exam ? 0 : a.exam === "prelims" ? -1 : 1) || ORDER.indexOf(a.paper) - ORDER.indexOf(b.paper);
const nodeById = new Map((NODES as Node[]).map((n) => [n.id, n]));

function toExplain(x: any): Explain | undefined {
  const why = en(x?.why);
  if (!why) return undefined;
  const wrong = (Array.isArray(x.wrong) ? x.wrong : []).filter((w: any) => Number.isInteger(w?.option) && en(w)).map((w: any) => ({ option: w.option, text: en(w) }));
  return { why, wrong, trap: en(x.trap) };
}

function toPaper(d: any): Paper | null {
  if (!d || typeof d.id !== "string" || !/^cs[pm]-\d{4}-[a-z0-9]+$/.test(d.id) || d.sample || !Array.isArray(d.questions)) return null;
  const questions: Q[] = d.questions.filter((q: any) => q && typeof q.n === "string" && en(q.en?.q ?? q.q))
    .map((q: any) => ({ n: q.n, nodes: Array.isArray(q.nodes) ? q.nodes : [], marks: q.marks, words: q.words, en: { q: en(q.en?.q ?? q.q), options: Array.isArray(q.en?.options) ? q.en.options : undefined }, answer: q.answer, explain: toExplain(q.explain) }));
  return { id: d.id, exam: d.exam === "mains" ? "mains" : "prelims", year: Number(d.year), paper: d.paper, title: en(d.title), sourceUrl: d.source?.url ?? "", key: d.answerKey ?? { status: "none" }, questions };
}

async function gather(env: Env): Promise<{ topics: Map<string, Topic>; papers: Paper[] }> {
  const out = new Map<string, Topic>();
  const papers: Paper[] = [];
  for (const n of NODES as Node[]) out.set(n.id, { node: n, reads: [], pyqs: [], pyqTotal: 0, byYear: {}, asked: [], counts: {}, hasPath: false });
  if (!(await flags(env)).library) return { topics: out, papers };
  // If the library can't be read, the pages still stand on the syllabus alone.
  const { items } = await publicLibrary(env).then((r) => r.json<{ items: Item[] }>()).catch(() => ({ items: [] as Item[] }));
  for (const it of items) {
    if (it.kind === "pyq") {
      const p = toPaper(it.data);
      if (!p || papers.some((x) => x.id === p.id)) continue;
      papers.push(p);
      for (const q of p.questions) {
        for (const id of new Set(q.nodes)) {
          const t = out.get(id); if (!t) continue;
          t.pyqTotal++;
          t.byYear[p.year] = (t.byYear[p.year] ?? 0) + 1;
          t.asked.push({ paper: p, q });
          // Mains questions read well on their own as a sample; Prelims ones are listed with their options below.
          if (p.exam === "mains" && t.pyqs.length < 4) t.pyqs.push({ text: q.en.q, year: p.year, exam: "Mains", n: q.n });
        }
      }
      continue;
    }
    for (const id of nodesOf(it.data)) {
      const t = out.get(id); if (!t) continue;
      if (it.kind === "read" && t.reads.length < 12) t.reads.push(it);
      if (it.kind === "topic-path") t.hasPath = true;
      t.counts[it.kind] = (t.counts[it.kind] ?? 0) + 1;
    }
  }
  papers.sort(byPaper);
  for (const t of out.values()) t.asked.sort((a, b) => byPaper(a.paper, b.paper) || a.paper.questions.indexOf(a.q) - b.paper.questions.indexOf(b.q));
  return { topics: out, papers };
}

const indexable = (t: Topic) => t.reads.length > 0 || t.pyqTotal > 0;

const CSS = `:root{--bg:#0b0d1a;--card:#141830;--ink:#eef0ff;--mute:#a9b0d6;--chai:#f0b46a;--line:#262b4d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif}
main{max-width:760px;margin:0 auto;padding:20px 16px 64px}a{color:var(--chai)}h1{font:800 clamp(28px,6vw,40px)/1.15 Georgia,serif;margin:14px 0 8px}
h2{font:700 22px/1.25 Georgia,serif;margin:36px 0 10px}h3{font-size:18px;margin:0 0 6px}.crumb,.small{font-size:14px;color:var(--mute)}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0}
.btn{display:inline-block;background:var(--chai);color:#1b1205;font-weight:700;padding:12px 18px;border-radius:999px;text-decoration:none;margin:6px 8px 6px 0}
.btn.ghost{background:none;color:var(--ink);border:1px solid var(--line)}ul{padding-left:20px}li{margin:4px 0}
.lock{color:var(--mute)}.lock li::marker{content:"🔒 "}.top{display:flex;justify-content:space-between;align-items:center}
.brand{font:800 20px Georgia,serif;color:var(--ink);text-decoration:none}.q{border-left:3px solid var(--chai);padding-left:12px;margin:14px 0}
table{border-collapse:collapse}td,th{padding:4px 12px 4px 0;text-align:left;font-size:15px}footer{margin-top:48px;font-size:13px;color:var(--mute)}`;

function shell(env: Env, o: { title: string; desc: string; path: string; body: string; noindex?: boolean; ld?: unknown; canonical?: string }): Response {
  const base = (env.PUBLIC_BASE_URL || "https://app.aspiran.in").replace(/\/$/, "");
  const ph = /^phc_\w{20,80}$/.test(env.POSTHOG_KEY ?? "") ? `<script>!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled getFeatureFlag onFeatureFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init(${JSON.stringify(env.POSTHOG_KEY)},{api_host:${JSON.stringify(env.POSTHOG_HOST || "https://eu.i.posthog.com")},persistence:"memory",person_profiles:"identified_only"})</script>` : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${o.canonical ?? base + o.path}">${o.noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:type" content="article"><meta property="og:url" content="${o.canonical ?? base + o.path}"><meta property="og:image" content="https://aspiran.in/og.png">
<link rel="icon" href="/app/icon.svg" type="image/svg+xml"><meta name="theme-color" content="#0b0d1a"><style>${CSS}</style>
${o.ld ? `<script type="application/ld+json">${JSON.stringify(o.ld).replace(/</g, "\\u003c")}</script>` : ""}${ph}</head>
<body><main><div class="top"><a class="brand" href="https://aspiran.in/">Aspiran</a><a class="small" href="/learn">All UPSC topics</a></div>
${o.body}
<footer>Aspiran is a study app for UPSC Civil Services aspirants, in English and Hindi. Not affiliated with UPSC. Past questions are from UPSC's published papers.
<br><a href="https://aspiran.in/privacy">Privacy</a> · <a href="https://aspiran.in/terms">Terms</a></footer></main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600", "x-frame-options": "DENY", "referrer-policy": "strict-origin-when-cross-origin" } });
}

const CTA = (label = "Try one whole topic free, no sign-up") =>
  `<p><a class="btn" href="/app/#try" data-ph-capture-attribute-cta="try">${esc(label)}</a><a class="btn ghost" href="/app/" data-ph-capture-attribute-cta="app">Open Aspiran</a></p>`;

function topicPage(env: Env, t: Topic): Response {
  const n = t.node;
  const lines: string[] = (LINES as Record<string, string[]>)[n.id] ?? [];
  const years = Object.keys(t.byYear).sort();
  const inApp = Object.entries(t.counts).filter(([k]) => KIND_WORDS[k]).map(([k, c]) => `${c} ${KIND_WORDS[k][c === 1 ? 0 : 1]}`);
  if (t.pyqTotal) inApp.push(`${t.pyqTotal} past question${t.pyqTotal === 1 ? "" : "s"} with answers and review`);
  const reads = t.reads.map((r) => {
    // Two shapes are live: the library's ({ sections: { en: [{ heading, body }] }, recall: { en } }) and the pack's ({ en: { sections: [{ head, body }], dek } }).
    const d = r.data;
    const secs: { head: string; body: string }[] = ((Array.isArray(d.sections) ? d.sections : d.sections?.en) ?? d.en?.sections ?? []).map((x: any) => ({ head: x.heading ?? x.head ?? "", body: x.body ?? "" }));
    const dek = en(d.dek) || d.en?.dek || en(d.summary) || "";
    const recall = (d.recall?.en ?? d.en?.selfCheck ?? []).length;
    return `<div class="card"><h3>${esc(en(d.title))}</h3><p class="small">${d.minutes ? `${esc(d.minutes)} min read · ` : ""}Checked by ${esc(d.review?.en?.checkedBy ?? "our editors")}</p>
${dek ? `<p><em>${esc(dek)}</em></p>` : ""}${secs[0] ? `<p>${secs[0].head ? `<strong>${esc(secs[0].head)}.</strong> ` : ""}${esc(opening(secs[0].body))}</p>` : ""}
${secs.length > 1 ? `<p class="small">The rest of this read, in the app:</p><ul class="lock">${secs.slice(1).filter((x) => x.head).map((x) => `<li>${esc(x.head)}</li>`).join("")}${recall ? `<li>${recall} recall questions that come back before you forget</li>` : ""}</ul>` : ""}</div>`;
  }).join("");
  const body = `<p class="crumb"><a href="/learn">UPSC syllabus</a> › ${esc(n.paper.name)}</p>
<h1>${esc(n.name)}</h1>
<p>${esc(n.paper.short)} · ${esc(n.paper.lead)}</p>
${CTA()}
${lines.length ? `<h2>What UPSC's syllabus says</h2><ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}
${t.pyqTotal ? `<h2>Asked ${t.pyqTotal} time${t.pyqTotal === 1 ? "" : "s"} by UPSC</h2>
<table><tr><th>Year</th><th>Questions</th><th>Papers</th></tr>${years.slice().reverse().map((y) => {
    const ps = [...new Map(t.asked.filter((a) => String(a.paper.year) === y).map((a) => [a.paper.id, a.paper])).values()];
    return `<tr><td>${esc(y)}</td><td>${t.byYear[y]}</td><td>${ps.map((p) => `<a href="${paperPath(p)}">${esc(p.exam === "mains" ? "Mains" : "Prelims")} ${esc(PAPER_NAME[p.paper] ?? p.paper)}</a>`).join(", ")}</td></tr>`;
  }).join("")}</table>
<p class="small">Counted from the UPSC papers on Aspiran so far (<a href="/learn/papers">see which</a>), not every year UPSC has held.</p>
<h2>Every past question on this topic</h2><ul>${t.asked.slice(0, 80).map((a) => `<li><a href="${qPath(a.paper, a.q)}">${esc(a.paper.exam === "mains" ? "Mains" : "Prelims")} ${esc(a.paper.year)}${a.paper.paper === "csat" ? " CSAT" : a.paper.exam === "mains" ? ` ${esc(PAPER_NAME[a.paper.paper] ?? "")}` : ""}, Q${esc(a.q.n)}</a>: ${esc(clip(a.q.en.q, 150))}</li>`).join("")}</ul>${t.asked.length > 80 ? `<p class="small">And ${t.asked.length - 80} more in the papers.</p>` : ""}` : ""}
${reads ? `<h2>Start reading</h2>${reads}` : ""}
${inApp.length ? `<h2>In the app for this topic</h2><ul>${inApp.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
<h2>Remember it, don't just read it</h2>
<p>Most of what you read today is gone in a month unless something brings it back. Aspiran asks you first, then shows you, and brings each idea back just before you'd forget it. No streaks, no ranks.</p>
${CTA(t.hasPath ? "Do this topic start to finish, free" : undefined)}`;
  const desc = `${n.name} for UPSC ${n.paper.short}: the syllabus lines${t.pyqTotal ? `, ${t.pyqTotal} past questions` : ""}${t.reads.length ? ` and ${t.reads.length} short reads to start with` : ""}. Free to try, in English and Hindi.`;
  return shell(env, {
    title: `${n.name}: UPSC ${n.paper.short} syllabus, past questions and notes | Aspiran`, desc: desc.slice(0, 300), path: learnPath(n), body, noindex: !indexable(t),
    ld: { "@context": "https://schema.org", "@type": "LearningResource", name: `${n.name} (UPSC ${n.paper.short})`, description: desc, inLanguage: "en", educationalLevel: "UPSC Civil Services Examination", provider: { "@type": "Organization", name: "Aspiran", url: "https://aspiran.in" }, isAccessibleForFree: true },
  });
}

function keyNote(p: Paper): string {
  if (p.exam === "mains") return "Mains papers have no answer key: UPSC marks written answers.";
  if (p.key.status === "official") return `Answers are from <a href="${esc(p.key.url ?? "")}" rel="nofollow">UPSC's ${p.key.provisional ? "provisional" : "official"} answer key</a>${p.key.dropped?.length ? `. UPSC dropped question${p.key.dropped.length === 1 ? "" : "s"} ${esc(p.key.dropped.join(", "))}` : ""}.`;
  return "UPSC hasn't published an answer key for this paper that we hold, so no answers are shown. We never guess one.";
}
const answerLine = (p: Paper, q: Q) => p.exam !== "prelims" ? "" : (p.key.dropped ?? []).includes(q.n) ? `<p class="small">UPSC dropped this question in its key.</p>`
  : p.key.status === "official" && typeof q.answer === "number" ? `<p><strong>UPSC's answer: (${LETTER[q.answer]})</strong>${p.key.provisional ? ` <span class="small">(provisional key)</span>` : ""}</p>` : "";
/** The explanation, only when UPSC's key gives this question an answer (never for a dropped question or a paper with no key). */
const explainBlock = (p: Paper, q: Q) => !q.explain || p.key.status !== "official" || typeof q.answer !== "number" ? "" : `<h2>Why (${LETTER[q.answer]})</h2><p>${esc(q.explain.why)}</p>${q.explain.wrong.length ? `<ul>${q.explain.wrong.map((w) => `<li><strong>(${LETTER[w.option] ?? "?"})</strong> ${esc(w.text)}</li>`).join("")}</ul>` : ""}${q.explain.trap ? `<p><strong>The trap:</strong> ${esc(q.explain.trap)}</p>` : ""}`;
const qText = (s: string) => s.split("\n").map((l) => esc(l)).join("<br>");
const options = (q: Q) => q.en.options?.length ? `<ol type="a">${q.en.options.map((o) => `<li>${esc(o)}</li>`).join("")}</ol>` : "";
const topicLinks = (q: Q) => q.nodes.map((id) => nodeById.get(id)).filter(Boolean).map((n) => `<a href="${learnPath(n!)}">${esc(n!.name)}</a>`).join(", ");
const marksLine = (q: Q) => q.marks ? `<span class="small">${q.marks} marks${q.words ? ` · ${q.words} words` : ""}</span>` : "";

function papersIndex(env: Env, papers: Paper[]): Response {
  const years = [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a);
  const total = papers.reduce((s, p) => s + p.questions.length, 0);
  const body = `<p class="crumb"><a href="/learn">UPSC syllabus</a> › Past papers</p>
<h1>UPSC Civil Services past papers, by year</h1>
<p>${papers.length} papers and ${total} questions, word for word from UPSC's own question papers. Prelims answers come only from UPSC's official answer keys. Every question links to the syllabus topic it tests.</p>${CTA("Practise these with spaced review, free")}
${years.map((y) => `<h2>${y}</h2><ul>${papers.filter((p) => p.year === y).map((p) => `<li><a href="${paperPath(p)}">${esc(paperName(p))}</a> <span class="small">· ${p.questions.length} questions${p.exam === "prelims" ? (p.key.status === "official" ? " · UPSC key" : " · no key yet") : ""}</span></li>`).join("")}</ul>`).join("")}`;
  return shell(env, { title: "UPSC Civil Services past papers by year: Prelims, CSAT and Mains | Aspiran", desc: `${papers.length} UPSC Civil Services papers (Prelims GS, CSAT, Mains GS and Essay), word for word from UPSC, with UPSC's official answer keys and the syllabus topic of every question.`, path: "/learn/papers", body, noindex: !papers.length, canonical: SITE_PYQ });
}

function paperPage(env: Env, p: Paper): Response {
  const body = `<p class="crumb"><a href="/learn">UPSC syllabus</a> › <a href="/learn/papers">Past papers</a> › ${p.year}</p>
<h1>${esc(paperName(p))}</h1>
<p>${p.questions.length} questions, word for word from <a href="${esc(p.sourceUrl)}" rel="nofollow">UPSC's question paper</a>. ${keyNote(p)}</p>${CTA()}
${p.questions.map((q) => `<div class="card" id="q${esc(q.n)}"><h3><a href="${qPath(p, q)}">Question ${esc(q.n)}</a> ${marksLine(q)}</h3><p>${qText(q.en.q)}</p>${options(q)}${answerLine(p, q)}${q.nodes.length ? `<p class="small">Syllabus: ${topicLinks(q)}</p>` : ""}</div>`).join("")}
${CTA("Answer these in the app, with review that brings them back")}`;
  return shell(env, { title: `${paperName(p)}: all ${p.questions.length} questions${p.key.status === "official" ? " with UPSC's answer key" : ""} | Aspiran`, desc: `${paperName(p)}, word for word from UPSC: ${p.questions.length} questions${p.exam === "prelims" && p.key.status === "official" ? ", with UPSC's official answers" : ""}, each linked to its syllabus topic.`, path: paperPath(p), canonical: sitePaper(p), body,
    ld: { "@context": "https://schema.org", "@type": "LearningResource", name: paperName(p), learningResourceType: "Past exam paper", educationalLevel: "UPSC Civil Services Examination", inLanguage: "en", isAccessibleForFree: true, provider: { "@type": "Organization", name: "Aspiran", url: "https://aspiran.in" } } });
}

function questionPage(env: Env, p: Paper, q: Q, topics: Map<string, Topic>): Response {
  const i = p.questions.indexOf(q), prev = p.questions[i - 1], next = p.questions[i + 1];
  const asked = q.nodes.map((id) => topics.get(id)).filter((t): t is Topic => !!t && t.pyqTotal > 0)
    .map((t) => `<li><a href="${learnPath(t.node)}">${esc(t.node.name)}</a>: asked ${t.pyqTotal} time${t.pyqTotal === 1 ? "" : "s"} in the papers on Aspiran</li>`).join("");
  const body = `<p class="crumb"><a href="/learn/papers">Past papers</a> › <a href="${paperPath(p)}">${esc(paperName(p))}</a></p>
<h1>${esc(paperName(p))}, question ${esc(q.n)}</h1>
<div class="q"><p>${qText(q.en.q)}</p>${options(q)}<p>${marksLine(q)}</p></div>
${answerLine(p, q)}${explainBlock(p, q)}<p class="small">${p.exam === "prelims" ? keyNote(p) : "Word for word from UPSC's question paper."} <a href="${esc(p.sourceUrl)}" rel="nofollow">The paper on upsc.gov.in</a>.</p>
${asked ? `<h2>The syllabus topic it tests</h2><ul>${asked}</ul>` : ""}
${CTA(p.exam === "mains" ? "Write this answer in the app and mark it, free" : "Try questions like this with spaced review, free")}
<p>${prev ? `<a href="${qPath(p, prev)}">← Question ${esc(prev.n)}</a>` : ""}${prev && next ? " · " : ""}${next ? `<a href="${qPath(p, next)}">Question ${esc(next.n)} →</a>` : ""}</p>`;
  const lead = clip(q.en.q, 110);
  return shell(env, { title: `${lead} | ${paperName(p)} Q${q.n} | Aspiran`.slice(0, 180), desc: `${paperName(p)}, question ${q.n}: ${clip(q.en.q, 200)}${p.exam === "prelims" && typeof q.answer === "number" && p.key.status === "official" ? " With UPSC's official answer." : ""}`, path: qPath(p, q), canonical: siteQ(p, q), body,
    ld: { "@context": "https://schema.org", "@type": "Quiz", name: `${paperName(p)}, question ${q.n}`, educationalLevel: "UPSC Civil Services Examination", inLanguage: "en", isAccessibleForFree: true, provider: { "@type": "Organization", name: "Aspiran", url: "https://aspiran.in" } } });
}

function indexPage(env: Env, all: Map<string, Topic>, papers: Paper[]): Response {
  const body = `<h1>The UPSC syllabus, topic by topic</h1>
<p>Every topic of the Civil Services exam: what the syllabus says, what UPSC has asked, and where to start. Pick one.</p>${CTA()}
${papers.length ? `<p><a href="/learn/papers">All ${papers.length} UPSC past papers, by year</a>: ${papers.reduce((s, p) => s + p.questions.length, 0)} questions with UPSC's own answer keys.</p>` : ""}
${(PAPERS as any[]).map((p) => `<h2>${esc(p.name)}</h2><p class="small">${esc(p.lead)}</p><ul>${p.topics.map((name: string, i: number) => {
    const id = `${p.id === "prelims" ? "pre" : p.id}-${i + 1}`, t = all.get(id);
    return `<li><a href="${learnPath({ id, name })}">${esc(name)}</a>${t?.pyqTotal ? ` <span class="small">· asked ${t.pyqTotal} time${t.pyqTotal === 1 ? "" : "s"}</span>` : ""}</li>`;
  }).join("")}</ul>`).join("")}`;
  return shell(env, { title: "UPSC syllabus, topic by topic: past questions and notes | Aspiran", desc: "Every topic of the UPSC Civil Services syllabus, with UPSC's own wording, real past questions and short reads to start with. Free to try, in English and Hindi.", path: "/learn", body });
}

export async function learnRoute(req: Request, env: Env, path: string, ctx: ExecutionContext): Promise<Response | null> {
  if (path === "/robots.txt") {
    const base = (env.PUBLIC_BASE_URL || new URL(req.url).origin).replace(/\/$/, "");
    return new Response(`User-agent: *\nAllow: /learn\nAllow: /app/\nDisallow: /admin\nDisallow: /desk\nDisallow: /media/\n\nSitemap: ${base}/learn/sitemap.xml\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } });
  }
  if (path !== "/learn" && !path.startsWith("/learn/")) return null;
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  const cache = (globalThis as any).caches?.default as Cache | undefined;
  const key = new Request(new URL(path, req.url).toString());
  const hit = await cache?.match(key);
  if (hit) return hit;

  const { topics: all, papers } = await gather(env);
  let res: Response;
  if (path === "/learn") res = indexPage(env, all, papers);
  else if (path === "/learn/sitemap.xml") {
    const base = (env.PUBLIC_BASE_URL || new URL(req.url).origin).replace(/\/$/, "");
    const urls = ["/learn", ...[...all.values()].filter(indexable).map((t) => learnPath(t.node))];
    res = new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${base}${u}</loc></url>`).join("\n")}\n</urlset>\n`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
  } else if (path === "/learn/papers" || path === "/learn/papers/") {
    res = papersIndex(env, papers);
  } else if (path.startsWith("/learn/papers/")) {
    const m = path.match(/^\/learn\/papers\/(cs[pm]-\d{4}-[a-z0-9]+)(?:\/([0-9a-z]+))?\/?$/);
    const p = m ? papers.find((x) => x.id === m[1]) : undefined;
    if (!p) return new Response("Not found", { status: 404 });
    if (m![2]) {
      const q = p.questions.find((x) => x.n === m![2]);
      if (!q) return new Response("Not found", { status: 404 });
      res = questionPage(env, p, q, all);
    } else res = paperPage(env, p);
  } else {
    const id = path.match(/^\/learn\/([a-z0-9]+-\d+)(?:-[a-z0-9-]*)?$/)?.[1];
    const t = id ? all.get(id) : undefined;
    if (!t) return new Response("Not found", { status: 404 });
    if (path !== learnPath(t.node)) return Response.redirect(new URL(learnPath(t.node), req.url).toString(), 301);
    res = topicPage(env, t);
  }
  if (cache && res.status === 200) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
