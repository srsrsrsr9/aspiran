// What the app knows about you, kept in this browser (IndexedDB), like Room on the phone.
// profile_fields: one row per field, with where it came from. Only stage, attempt band, language and
// time band are ever sent to the server (synced = 1), and only for pod matching.
// memory: up to 10 short notes you agreed Chotu may keep. Never sent anywhere unless you turn on
// "Smarter Chotu" in Me → Privacy.

const DB = "upsc-profile";
const SYNCED = ["stage", "attempt_band", "lang", "time_band"];
export const MEMORY_MAX = 10;

let db = null;
const cache = { fields: new Map(), memory: [] };

function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore("profile_fields", { keyPath: "field" });
      r.result.createObjectStore("memory", { keyPath: "id" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const all = (store) => new Promise((res) => {
  const t = db.transaction(store).objectStore(store).getAll();
  t.onsuccess = () => res(t.result ?? []); t.onerror = () => res([]);
});
const write = (store, fn) => new Promise((res) => {
  if (!db) return res();
  const t = db.transaction(store, "readwrite"); fn(t.objectStore(store)); t.oncomplete = res; t.onerror = res;
});

/** Loads everything into memory once; the app reads synchronously after this. Works (in memory) if IndexedDB is blocked. */
export async function loadProfile() {
  try {
    db = await open();
    for (const f of await all("profile_fields")) cache.fields.set(f.field, f);
    cache.memory = (await all("memory")).sort((a, b) => a.at - b.at);
  } catch { db = null; }
}

export const fields = () => [...cache.fields.values()];
export const field = (name) => cache.fields.get(name) ?? null;
export const value = (name) => { const f = cache.fields.get(name); return f && !f.skipped ? f.value : null; };

/** source: asked | inferred | imported. confidence 0..1 (1 for things you told us). */
export function setField(name, val, source = "asked", confidence = 1) {
  const old = cache.fields.get(name);
  // Something you told us is never overwritten by a guess.
  if (source === "inferred" && old && old.source === "asked" && !old.skipped) return old;
  const row = { field: name, value: val, source, confidence, asked_at: old?.asked_at ?? (source === "asked" ? Date.now() : null), skipped: 0, skips: old?.skips ?? 0, synced: SYNCED.includes(name) ? 1 : 0, updated_at: Date.now() };
  cache.fields.set(name, row);
  write("profile_fields", (s) => s.put(row));
  return row;
}

export function skipField(name) {
  const old = cache.fields.get(name);
  const row = { field: name, value: null, source: "asked", confidence: 0, asked_at: Date.now(), skipped: 1, skips: (old?.skips ?? 0) + 1, synced: SYNCED.includes(name) ? 1 : 0, updated_at: Date.now() };
  cache.fields.set(name, row);
  write("profile_fields", (s) => s.put(row));
}

/** Deleting forgets the answer, and also that it was ever asked, so it may come up again later. */
export function deleteField(name) {
  cache.fields.delete(name);
  write("profile_fields", (s) => s.delete(name));
}

/** A question may be asked if never answered, skipped fewer than twice, and not skipped in the last 7 days. */
export function askable(name) {
  const f = cache.fields.get(name);
  if (!f) return true;
  if (!f.skipped) return false;
  return f.skips < 2 && Date.now() - (f.asked_at ?? 0) >= 7 * 86400_000;
}

/** The four matching fields, the only profile data the server ever gets. */
export function syncedFields() {
  const out = {};
  for (const k of SYNCED) { const v = value(k); if (v) out[k] = v; }
  return out;
}

export const memory = () => cache.memory.slice();
export function addMemory(text) {
  const t = String(text).trim().slice(0, 140);
  if (!t || cache.memory.length >= MEMORY_MAX || cache.memory.some((m) => m.text === t)) return false;
  const row = { id: Math.random().toString(36).slice(2, 10), text: t, at: Date.now() };
  cache.memory.push(row);
  write("memory", (s) => s.put(row));
  return true;
}
export function deleteMemory(id) {
  cache.memory = cache.memory.filter((m) => m.id !== id);
  write("memory", (s) => s.delete(id));
}

export async function forgetProfile() {
  cache.fields.clear(); cache.memory = [];
  try { db?.close(); } catch {}
  db = null;
  try { indexedDB.deleteDatabase(DB); } catch {}
}
