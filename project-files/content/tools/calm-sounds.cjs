// Calm beds for "Calm now": generated in code, so there is nothing to license.
// calm-tones-Nhz: a low carrier with an N Hz difference between the ears (needs headphones), with pink noise under it.
// pink-noise: pink noise alone. breath-pacer-6: a soft swell up for 4 s and down for 6 s, six times a minute.
// All are 60 s seamless loops, 48 kHz, peak-normalized to -10.5 dBFS like the other beds.
const fs = require("fs"), SR = 48000, LEN = 60, N = SR * LEN;
function pink(n, seed) { let s = seed; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; const o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const w = r(); b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; o[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
  return o; }
// Make noise loop seamlessly: render LEN + 2 s and crossfade the extra 2 s into the start.
function loopNoise(seed, fc) { const X = SR * 2, a = lowpass(pink(N + X + SR, seed), fc).subarray(SR); /* filter first, skip its warm-up second */ for (let i = 0; i < X; i++) { const t = i / X; a[i] = a[i] * Math.sqrt(t) + a[N + i] * Math.sqrt(1 - t); } return a.subarray(0, N); }
function lowpass(a, fc) { const k = Math.exp(-2 * Math.PI * fc / SR); let y = 0; const o = new Float32Array(a.length); for (let p = 0; p < 2; p++) for (let i = 0; i < a.length; i++) { y = (1 - k) * a[i] + k * y; o[i] = y; } return o; }
function norm(chs, db) { let pk = 0; chs.forEach((c) => c.forEach((v) => (pk = Math.max(pk, Math.abs(v))))); const g = Math.pow(10, db / 20) / pk; chs.forEach((c) => { for (let i = 0; i < c.length; i++) c[i] *= g; }); return chs; }
function wav(file, chs) { const n = chs[0].length, C = chs.length, b = Buffer.alloc(44 + n * C * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * C * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(C, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * C * 2, 28); b.writeUInt16LE(C * 2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * C * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < C; c++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, chs[c][i])) * 32767), 44 + (i * C + c) * 2);
  fs.writeFileSync(file, b); }
const out = {};
// Whole-number frequencies complete whole cycles every second, so the 60 s loop has no click.
for (const off of [4, 6, 8]) {
  const L = new Float32Array(N), R = new Float32Array(N), nz = loopNoise(off, 900), base = 200;
  for (let i = 0; i < N; i++) { const t = i / SR; L[i] = 0.5 * Math.sin(2 * Math.PI * base * t) + 0.35 * nz[i]; R[i] = 0.5 * Math.sin(2 * Math.PI * (base + off) * t) + 0.35 * nz[i]; }
  wav(`calm-tones-${off}hz.wav`, norm([L, R], -10.5)); out[`calm-tones-${off}hz`] = { channels: 2, carrierHz: base, offsetHz: off, headphones: true };
}
{ const a = loopNoise(42, 2500); wav("pink-noise.wav", norm([a], -10.5)); out["pink-noise"] = { channels: 1 }; }
{ // 10 s cycle: 4 s in (rising), 6 s out (falling), as a soft pad of two low tones with filtered noise.
  const a = new Float32Array(N), nz = loopNoise(7, 600);
  for (let i = 0; i < N; i++) { const t = i / SR, c = t % 10, env = c < 4 ? Math.sin((c / 4) * Math.PI / 2) ** 2 : Math.cos(((c - 4) / 6) * Math.PI / 2) ** 2;
    a[i] = env * (0.4 * Math.sin(2 * Math.PI * 174 * t) + 0.25 * Math.sin(2 * Math.PI * 261 * t)) * 0.8 + (0.15 + 0.35 * env) * nz[i]; }
  wav("breath-pacer-6.wav", norm([a], -10.5)); out["breath-pacer-6"] = { channels: 1, cycle: "4 s in, 6 s out", breathsPerMinute: 6 }; }
fs.writeFileSync("calm.json", JSON.stringify(out, null, 2));
console.log(Object.keys(out).join(", "));
