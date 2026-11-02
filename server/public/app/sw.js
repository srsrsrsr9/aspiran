// Offline for the desktop app: the whole shell is precached on install, so a second visit opens with no connection.
// The day-1 reads (today's brief, the library with PYQs, practice questions, /config) are network-first with the last
// copy as a fallback, so what the first online visit loaded stays readable offline. Only public reads are cached here:
// member routes (pods, Chotu, Plus, privacy), sockets and media pass straight through.
const SHELL = "upsc-shell-v21";
const FILES = ["./", "index.html", "app.js", "strings.js", "profile-db.js", "kulhad.js", "honest.js", "welcome.js", "auth.js", "metrics.js", "fsrs.js", "syllabus.js", "map.js", "videos.js", "calm-audio.js", "calm-scripts.js", "explore.js", "plus-page.js", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];
const DATA = /^\/(brief\/latest|library|practice\/questions|config)$/;

self.addEventListener("install", (e) => e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== "upsc-data").map((k) => caches.delete(k)))).then(() => self.clients.claim()),
));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (DATA.test(url.pathname)) {
    e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open("upsc-data").then((c) => c.put(url.pathname, copy)); } return r; })
      .catch(() => caches.match(url.pathname, { cacheName: "upsc-data" }).then((r) => r ?? Response.error())));
    return;
  }
  if (url.pathname.startsWith("/app/")) {
    // Network first so updates show at once; the cache is for offline.
    e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request).then((r) => r ?? caches.match("index.html"))));
  }
});
