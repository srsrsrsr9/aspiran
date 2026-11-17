// "Listen": Chotu's and Jeetu's AI voices (server POST /voice, Fish Audio). A small button on a message.
// It plays only when tapped, never by itself; a second tap stops it; one voice at a time. Always labelled "AI voice".
// The server only speaks its own words: a scripted line by key, or a reply it signed for this member (`sig`).
// No button at all while voices are off (/config voice), for visitors who aren't signed in, or on care replies
// (those never get a sig). Nothing here animates, so reduced motion needs no special case.

let C = null;
/** app.js hands over: h, voiceOn() (from /config), canListen() (a signed-in member, not result week), toast. */
export function init(ctx) { C = ctx; }

let audio = null, playing = null; // the one <audio> in use, and the button that started it
const made = new Map(); // what was already fetched this visit: request key → blob URL

function stop() {
  if (audio) { audio.pause(); audio = null; }
  if (playing) { playing.setIdle(); playing = null; }
}
// Leaving the screen stops the voice.
addEventListener("hashchange", stop);

/**
 * A Listen button for one line, or null when it shouldn't show.
 * req: { who: "chotu" | "jeetu", line, lang }  (scripted)  or  { who, text, sig }  (a reply the server signed).
 */
export function listen(req, { hi = false } = {}) {
  if (!C || !C.voiceOn() || !C.canListen() || !req?.who || !(req.line || (req.text && req.sig))) return null;
  const idle = hi ? "🔊 सुनें" : "🔊 Listen", busy = hi ? "आवाज़ बन रही है…" : "Getting the voice…", stopL = hi ? "■ रोकें" : "■ Stop";
  const b = C.h("button.ghost.small.voice-btn", { type: "button", "aria-pressed": "false" }, idle);
  b.setIdle = () => { b.textContent = idle; b.setAttribute("aria-pressed", "false"); b.disabled = false; };
  b.addEventListener("click", async () => {
    if (playing === b) return stop();
    stop();
    const key = JSON.stringify(req);
    let url = made.get(key);
    if (!url) {
      b.textContent = busy; b.disabled = true;
      try {
        const r = await fetch("/voice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req) });
        if (!r.ok) { const e = await r.json().catch(() => ({})); b.setIdle(); C.toast(e.error ?? "The voice couldn't be made just now."); return; }
        url = URL.createObjectURL(await r.blob());
        made.set(key, url);
      } catch { b.setIdle(); C.toast(hi ? "आवाज़ के लिए इंटरनेट चाहिए।" : "The voice needs a connection."); return; }
      b.disabled = false;
    }
    // Something else may have started while this one was being made.
    stop();
    audio = new Audio(url); playing = b;
    b.textContent = stopL; b.setAttribute("aria-pressed", "true");
    audio.addEventListener("ended", () => { if (playing === b) stop(); });
    audio.play().catch(() => { if (playing === b) stop(); });
  });
  return b;
}
