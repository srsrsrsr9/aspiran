const out = document.getElementById("out");
const el = (tag, text) => { const e = document.createElement(tag); if (text != null) e.textContent = text; return e; };
chrome.runtime.sendMessage({ type: "status" }, (s) => {
  out.replaceChildren();
  if (!s) { out.textContent = "Not set up yet. Open the UPSC Pods app once."; return; }
  const left = s.until - Date.now();
  out.append(el("p", left > 0 ? `Focus block on${s.label ? `: ${s.label}` : ""}. ${Math.ceil(left / 60000)} min left. ${s.blocklist.length} sites closed.` : "No focus block running."));
  const lim = Object.entries(s.limits);
  if (lim.length) {
    out.append(el("strong", "Today's limits"));
    const ul = el("ul");
    for (const [d, m] of lim) ul.append(el("li", `${d}: ${Math.round((s.usage.sites[d] ?? 0) / 60)} of ${m} min`));
    out.append(ul);
  }
});
