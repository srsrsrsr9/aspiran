// UPSC Pods Focus. During a focus block (or mock paper) the blocklist redirects to a calm page; daily
// limits close a site for the rest of the day once its minutes are used. Everything is kept in
// chrome.storage.local; nothing is sent anywhere.

const ALLOW_MINUTES = 5;
const today = () => new Date().toLocaleDateString("en-CA");

async function state() {
  const s = await chrome.storage.local.get(null);
  return {
    until: s.until ?? 0, label: s.label ?? "", blocklist: s.blocklist ?? [], limits: s.limits ?? {}, pauseSeconds: s.pauseSeconds ?? 10,
    usage: s.usage?.day === today() ? s.usage : { day: today(), sites: {} }, allow: s.allow ?? {},
  };
}

const matches = (host, domain) => host === domain || host.endsWith("." + domain);
const esc = (d) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Which domains are closed right now, and why. */
function closed(s, now = Date.now()) {
  const out = new Map();
  if (s.until > now) for (const d of s.blocklist) out.set(d, "focus");
  for (const [d, min] of Object.entries(s.limits)) if ((s.usage.sites[d] ?? 0) >= min * 60 && !out.has(d)) out.set(d, "limit");
  for (const [d, t] of Object.entries(s.allow)) if (t > now) out.delete(d);
  return out;
}

async function apply() {
  const s = await state();
  const list = [...closed(s)];
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  const page = chrome.runtime.getURL("blocked.html");
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: old.map((r) => r.id),
    addRules: list.map(([d, why], i) => ({
      id: i + 1,
      priority: 1,
      action: { type: "redirect", redirect: { regexSubstitution: `${page}?why=${why}&site=${encodeURIComponent(d)}#\\0` } },
      condition: { regexFilter: `^https?://([^/]*\\.)?${esc(d)}(:\\d+)?(/.*)?$`, resourceTypes: ["main_frame"] },
    })),
  });
  // Wake again when the block ends or the next allowance runs out.
  const next = [s.until, ...Object.values(s.allow)].filter((t) => t > Date.now()).sort((a, b) => a - b)[0];
  if (next) chrome.alarms.create("recheck", { when: next + 500 });
  // Tabs already open on a closed site move to the calm page too.
  if (list.length) {
    for (const tab of await chrome.tabs.query({})) {
      try {
        const u = new URL(tab.url ?? "");
        const hit = list.find(([d]) => matches(u.hostname, d));
        if (hit && /^https?:$/.test(u.protocol)) chrome.tabs.update(tab.id, { url: `${page}?why=${hit[1]}&site=${encodeURIComponent(hit[0])}#${tab.url}` });
      } catch { /* chrome:// pages and the like */ }
    }
  }
}

// Count a minute against a limited site when it's the active tab of a focused window and the person is active.
async function countMinute() {
  const s = await state();
  if (!Object.keys(s.limits).length) return;
  if ((await chrome.idle.queryState(60)) !== "active") return;
  const win = await chrome.windows.getLastFocused().catch(() => null);
  if (!win?.focused) return;
  const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
  let host;
  try { host = new URL(tab?.url ?? "").hostname; } catch { return; }
  const d = Object.keys(s.limits).find((x) => matches(host, x));
  if (!d) return;
  const before = s.usage.sites[d] ?? 0;
  s.usage.sites[d] = before + 60;
  await chrome.storage.local.set({ usage: s.usage });
  if (before < s.limits[d] * 60 && s.usage.sites[d] >= s.limits[d] * 60) await apply();
}

const boot = () => { chrome.alarms.create("minute", { periodInMinutes: 1 }); apply(); };
chrome.runtime.onInstalled.addListener(boot);
chrome.runtime.onStartup.addListener(boot);
chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name === "minute") {
    // A new day: limits reset.
    if ((await chrome.storage.local.get("usage")).usage?.day !== today()) {
      await chrome.storage.local.set({ usage: { day: today(), sites: {} } });
      await apply();
    }
    await countMinute();
  }
  if (a.name === "recheck") apply();
});

chrome.runtime.onMessage.addListener((m, sender, reply) => {
  (async () => {
    if (m.type === "config") {
      // Only from the bridge, which runs on UPSC Pods pages.
      if (!sender.tab) return reply({ ok: false });
      await chrome.storage.local.set({ until: m.until, label: m.label, blocklist: m.blocklist, limits: m.limits, pauseSeconds: m.pauseSeconds });
      await apply();
      return reply({ ok: true });
    }
    if (m.type === "status") {
      const s = await state();
      return reply({ until: s.until, label: s.label, pauseSeconds: s.pauseSeconds, usage: s.usage, limits: s.limits, blocklist: s.blocklist, closed: [...closed(s)] });
    }
    if (m.type === "allow") {
      // "I really need it": a few minutes, after the pause on the calm page.
      const s = await state();
      if (typeof m.site !== "string" || !closed(s).has(m.site)) return reply({ ok: false });
      s.allow[m.site] = Date.now() + ALLOW_MINUTES * 60_000;
      await chrome.storage.local.set({ allow: s.allow });
      await apply();
      return reply({ ok: true, minutes: ALLOW_MINUTES });
    }
    reply({ ok: false });
  })();
  return true;
});
