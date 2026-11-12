// Public topic pages, for search engines and for people who haven't signed in: one page per syllabus topic at
// /learn/<node id>-<slug>, an index at /learn, and /learn/sitemap.xml.
//
// What a page shows is a taste, never the library: UPSC's own syllabus lines for the topic, a few real past questions
// (UPSC's public papers), and for each approved long read its title, its one-line promise, its opening lines and its
// outline. The rest of every read, the answers, the practice and the review stay in the app, behind sign-in
// (isContentRoute in auth.ts). Approved content only, the same rule as /library. Cached for an hour.

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
const nodesOf = (d: any): string[] => [...new Set([d?.node, ...(Array.isArray(d?.nodes) ? d.nodes : [])].filter((x) => typeof x === "string"))];

const KIND_WORDS: Record<string, [string, string]> = {
  read: ["long read", "long reads"], mock: ["mock paper", "mock papers"], flashcards: ["flashcard deck", "flashcard decks"],
  "mains-skeleton": ["Mains answer frame", "Mains answer frames"], "topic-path": ["start-to-finish topic", "start-to-finish topics"],
  "gs4-case": ["ethics case", "ethics cases"], essay: ["essay", "essays"], printable: ["printable sheet", "printable sheets"],
  "audio-lecture": ["audio talk", "audio talks"], terms: ["term list", "term lists"],
};

interface Topic { node: Node; reads: Item[]; pyqs: { text: string; year: number; exam: string; n: string }[]; pyqTotal: number; byYear: Record<string, number>; counts: Record<string, number>; hasPath: boolean }

async function gather(env: Env): Promise<Map<string, Topic>> {
  const out = new Map<string, Topic>();
  for (const n of NODES as Node[]) out.set(n.id, { node: n, reads: [], pyqs: [], pyqTotal: 0, byYear: {}, counts: {}, hasPath: false });
  if (!(await flags(env)).library) return out;
  // If the library can't be read, the pages still stand on the syllabus alone.
  const { items } = await publicLibrary(env).then((r) => r.json<{ items: Item[] }>()).catch(() => ({ items: [] as Item[] }));
  for (const it of items) {
    if (it.kind === "pyq") {
      for (const q of it.data?.questions ?? []) {
        for (const id of q.nodes ?? []) {
          const t = out.get(id); if (!t) continue;
          t.pyqTotal++;
          t.byYear[it.data.year] = (t.byYear[it.data.year] ?? 0) + 1;
          const text = en(q.en?.q ?? q.q);
          // Mains questions read well on their own; Prelims ones need their options, which stay in the app.
          if (text && it.data.exam === "mains" && t.pyqs.length < 4) t.pyqs.push({ text, year: it.data.year, exam: "Mains", n: String(q.n ?? "") });
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
  return out;
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

function shell(env: Env, o: { title: string; desc: string; path: string; body: string; noindex?: boolean; ld?: unknown }): Response {
  const base = (env.PUBLIC_BASE_URL || "https://app.aspiran.in").replace(/\/$/, "");
  const ph = /^phc_\w{20,80}$/.test(env.POSTHOG_KEY ?? "") ? `<script>!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled getFeatureFlag onFeatureFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init(${JSON.stringify(env.POSTHOG_KEY)},{api_host:${JSON.stringify(env.POSTHOG_HOST || "https://eu.i.posthog.com")},persistence:"memory",person_profiles:"identified_only"})</script>` : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${base}${o.path}">${o.noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:type" content="article"><meta property="og:url" content="${base}${o.path}"><meta property="og:image" content="https://aspiran.in/og.png">
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
${years.length ? `<h2>How often UPSC asks it</h2><table><tr><th>Year</th><th>Questions</th></tr>${years.map((y) => `<tr><td>${esc(y)}</td><td>${t.byYear[y]}</td></tr>`).join("")}</table><p class="small">Counted from the UPSC papers Aspiran holds so far, not every year.</p>` : ""}
${t.pyqs.length ? `<h2>Real questions from UPSC</h2>${t.pyqs.map((q) => `<div class="q"><p>${esc(q.text)}</p><p class="small">UPSC ${esc(q.exam)} ${esc(q.year)}${q.n ? `, question ${esc(q.n)}` : ""}</p></div>`).join("")}<p class="small">In the app: a frame for answering each one, then write, mark your own answer, and see a second opinion.</p>` : ""}
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

function indexPage(env: Env, all: Map<string, Topic>): Response {
  const body = `<h1>The UPSC syllabus, topic by topic</h1>
<p>Every topic of the Civil Services exam: what the syllabus says, what UPSC has asked, and where to start. Pick one.</p>${CTA()}
${(PAPERS as any[]).map((p) => `<h2>${esc(p.name)}</h2><p class="small">${esc(p.lead)}</p><ul>${p.topics.map((name: string, i: number) => {
    const id = `${p.id === "prelims" ? "pre" : p.id}-${i + 1}`, t = all.get(id);
    return `<li><a href="${learnPath({ id, name })}">${esc(name)}</a>${t?.pyqTotal ? ` <span class="small">· ${t.pyqTotal} past questions</span>` : ""}</li>`;
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

  const all = await gather(env);
  let res: Response;
  if (path === "/learn") res = indexPage(env, all);
  else if (path === "/learn/sitemap.xml") {
    const base = (env.PUBLIC_BASE_URL || new URL(req.url).origin).replace(/\/$/, "");
    const urls = ["/learn", ...[...all.values()].filter(indexable).map((t) => learnPath(t.node))];
    res = new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${base}${u}</loc></url>`).join("\n")}\n</urlset>\n`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
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
