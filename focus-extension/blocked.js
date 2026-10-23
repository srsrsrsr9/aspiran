const q = new URLSearchParams(location.search);
const site = q.get("site") ?? "";
const why = q.get("why");
const target = location.hash.slice(1);
const $ = (id) => document.getElementById(id);
const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

chrome.runtime.sendMessage({ type: "status" }, (s) => {
  if (!s) return;
  if (why === "focus") {
    $("title").textContent = s.label ? `You're in a focus block: ${s.label}` : "You're in a focus block";
    $("why").textContent = `${site} is closed until it ends.`;
    const t = () => { const left = s.until - Date.now(); $("left").textContent = left > 0 ? mmss(left) : ""; if (left <= 0 && /^https?:/.test(target)) location.replace(target); };
    t(); setInterval(t, 1000);
  } else {
    $("title").textContent = `That's your ${s.limits[site] ?? ""} minutes of ${site} for today`;
    $("why").textContent = "It opens again tomorrow.";
  }
  // A short pause before opening anyway, so it's a choice and not a reflex.
  let wait = s.pauseSeconds;
  const btn = $("open");
  const step = () => {
    btn.textContent = wait > 0 ? `Open for 5 minutes (${wait})` : "Open for 5 minutes";
    btn.disabled = wait > 0;
    if (wait-- > 0) setTimeout(step, 1000);
  };
  step();
});

$("back").onclick = () => { chrome.tabs.getCurrent((t) => { if (history.length > 2) history.go(-2); else if (t) chrome.tabs.remove(t.id); }); };
$("open").onclick = () => chrome.runtime.sendMessage({ type: "allow", site }, (r) => { if (r?.ok && /^https?:/.test(target)) location.replace(target); });
