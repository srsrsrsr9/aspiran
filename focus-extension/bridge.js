// Runs only on UPSC Pods pages (checked by the page's marker). Passes focus settings from the web
// app to the extension and says hello so the app knows it's installed. Nothing else is read.
// APP_ORIGINS comes from config.js (the one place to change the app's domain).
const allowedOrigin = APP_ORIGINS.some((o) => (typeof o === "string" ? o === location.origin : o.test(location.origin)));
if (allowedOrigin && document.querySelector('meta[name="upsc-pods-app"]')) {
  const DOMAIN = /^[a-z0-9.-]+\.[a-z]{2,}$/;
  window.addEventListener("message", (e) => {
    if (e.source !== window || e.origin !== location.origin) return;
    const m = e.data;
    if (m?.source !== "upsc-pods-app" || m.type !== "focus") return;
    const limits = {};
    for (const [k, v] of Object.entries(m.limits ?? {})) if (DOMAIN.test(k) && Number(v) > 0) limits[k] = Math.min(24 * 60, Math.round(Number(v)));
    chrome.runtime.sendMessage({
      type: "config",
      until: Number(m.until) || 0,
      label: String(m.label ?? "").slice(0, 60),
      blocklist: (Array.isArray(m.blocklist) ? m.blocklist : []).filter((d) => typeof d === "string" && DOMAIN.test(d)).slice(0, 200),
      limits,
      pauseSeconds: Math.max(0, Math.min(60, Number(m.pauseSeconds) || 0)),
    });
  });
  window.postMessage({ source: "upsc-pods-focus", type: "hello", version: chrome.runtime.getManifest().version }, location.origin);
}
