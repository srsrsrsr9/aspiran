// Calm sounds, generated in the browser with Web Audio. No files, no network.
//
// Playbook G: sound is off until the member presses Play, volume is capped low, and nothing here claims
// to change brainwaves or treat anything. Calm tones are two close notes, one per ear (200 Hz and
// 200 + offset Hz), so they need headphones. Pink noise is a soft, even hiss.

const CARRIER = 200;
const GAIN = 0.35;      // the content team's sfx.json level for calm beds
const MAX = 0.3;        // the slider's top end, on top of GAIN: always quiet

export const CALM_SOUNDS = {
  "tones-4": { offset: 4, headphones: true },
  "tones-6": { offset: 6, headphones: true },
  "tones-8": { offset: 8, headphones: true },
  pink: { noise: true },
};

let ac = null, master = null, sources = [];

/** Ten seconds of pink noise (Paul Kellet's filter), looped. */
function pinkBuffer(ctx) {
  const len = ctx.sampleRate * 10, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  // Fade the loop's ends into each other so there's no click.
  const f = Math.floor(ctx.sampleRate * 0.05);
  for (let i = 0; i < f; i++) { d[i] *= i / f; d[len - 1 - i] *= i / f; }
  return buf;
}

function ctx() {
  ac ??= new (window.AudioContext || window.webkitAudioContext)();
  return ac;
}

export const calmAudio = {
  get playing() { return sources.length > 0; },

  /** Starts a sound with a two-second fade in. `volume` is 0..1 of the (already low) cap. */
  async play(kind, volume = 0.5) {
    const spec = CALM_SOUNDS[kind];
    if (!spec) return;
    this.stop(0);
    const c = ctx();
    await c.resume().catch(() => {});
    master = c.createGain();
    master.gain.setValueAtTime(0, c.currentTime);
    master.gain.linearRampToValueAtTime(GAIN * MAX * clamp(volume), c.currentTime + 2);
    master.connect(c.destination);
    if (spec.noise) {
      const src = c.createBufferSource();
      src.buffer = pinkBuffer(c); src.loop = true;
      src.connect(master); src.start();
      sources.push(src);
    } else {
      for (const [hz, pan] of [[CARRIER, -1], [CARRIER + spec.offset, 1]]) {
        const o = c.createOscillator(), p = c.createStereoPanner();
        o.type = "sine"; o.frequency.value = hz; p.pan.value = pan;
        o.connect(p).connect(master); o.start();
        sources.push(o);
      }
    }
  },

  setVolume(volume) {
    if (master && ac) master.gain.setTargetAtTime(GAIN * MAX * clamp(volume), ac.currentTime, 0.2);
  },

  /** Fades out, then lets go of the nodes. */
  stop(fade = 0.6) {
    if (!sources.length || !ac) return;
    const old = sources, m = master, t = ac.currentTime;
    sources = []; master = null;
    m.gain.cancelScheduledValues(t);
    m.gain.setValueAtTime(m.gain.value, t);
    m.gain.linearRampToValueAtTime(0, t + fade);
    setTimeout(() => { old.forEach((s) => { try { s.stop(); } catch {} }); m.disconnect(); }, fade * 1000 + 50);
  },

  /** A soft tone that rises as you breathe in and falls as you breathe out. Very quiet. */
  cue(phase, seconds, volume = 0.5) {
    if (phase === "hold" || !(seconds > 0)) return;
    const c = ctx();
    c.resume().catch(() => {});
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    const [from, to] = phase === "in" ? [196, 262] : [262, 196];
    o.type = "sine";
    o.frequency.setValueAtTime(from, t);
    o.frequency.linearRampToValueAtTime(to, t + seconds);
    const top = 0.08 * clamp(volume);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(top, t + Math.min(1, seconds / 3));
    g.gain.linearRampToValueAtTime(0, t + seconds);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + seconds + 0.05);
  },
};

const clamp = (v) => Math.max(0, Math.min(1, Number(v) || 0));
