// "Try one topic": the open sample of the app (web app route #try). A visitor with no account works through one whole
// syllabus topic, a topic path (aspiran/topic-path@1, content/topic-paths/), from a warm-up guess to cards in their review.
//
//   GET /try              the approved topic paths, as { items: [{ id, title, node, languages }] }
//   GET /try/<id>         one approved path, with only the languages an editor approved (as /library does)
//   GET /try/<id>?preview=1  with a desk key (Authorization: Bearer ...): the newest version, draft or not, marked
//                         draft, so editors can walk it before approving. Never served to visitors.
//
// Like the Free Shelf, this needs no account and follows the library flag: if Ops pause the library, /try pauses too.

import { type LibraryRow, publicLibrary } from "./content";
import { staffFrom, flags } from "./staff";
import { type Env, json } from "./shared";

type Item = { id: string; kind: string; languages: string[]; data: any };

async function approvedPaths(env: Env): Promise<Item[]> {
  const data = await (await publicLibrary(env)).json<{ items: Item[] }>();
  return data.items.filter((i) => i.kind === "topic-path");
}

export async function tryRoute(req: Request, env: Env, path: string, url: URL): Promise<Response | null> {
  if (path !== "/try" && !path.startsWith("/try/")) return null;
  if (req.method !== "GET") return json({ error: "Use GET." }, 405);
  if (!(await flags(env)).library) return json({ items: [], paused: true });
  const id = decodeURIComponent(path.slice("/try/".length));

  if (path === "/try") {
    const items = (await approvedPaths(env)).map((i) => ({ id: i.data.id, title: i.data.title, node: i.data.node, languages: i.languages }));
    return json({ items });
  }

  if (url.searchParams.has("preview")) {
    const staff = await staffFrom(req, env);
    if (!staff) return json({ error: "Previewing a draft needs a desk key." }, 401);
    // The desk keeps items as "<kind>:<id>"; links use the short id.
    const row = await env.DB.prepare("SELECT * FROM library WHERE kind = 'topic-path' AND (id = ? OR id = ?)").bind(id, `topic-path:${id}`).first<LibraryRow>();
    if (!row) return json({ error: "No topic path with that id. Import it on the desk first." }, 404);
    const data = JSON.parse(row.json);
    return json({ id: data.id ?? row.id, kind: row.kind, draft: row.status !== "approved", status: row.status, languages: ["en", "hi"], data });
  }

  const item = (await approvedPaths(env)).find((i) => i.data.id === id || i.id === id);
  if (!item) return json({ error: "That topic isn't open yet." }, 404);
  return json({ ...item, id: item.data.id ?? item.id, draft: false });
}
