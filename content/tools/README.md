# Current-affairs build tools

The motion workstream's tools, kept with the content: `build-ca-week.cjs` voices, renders and packages a week
(`upsc-pods/ca-week@1`), which `server/scripts/import-ca.mjs` uploads from the desk.

- Voices (`motion-vo.cjs`): `story.voice.provider` is `elevenlabs` (needs `ELEVENLABS_API_KEY`) or `sarvam` (Sarvam
  Bulbul, for Hindi; needs `SARVAM_API_KEY`). Sarvam gives no word timings, so captions are timed by word length: check
  the sync before approving a scene.
- `player.html` loads `vendor/d3-array.min.js`, `vendor/d3-geo.min.js` and `vendor/topojson-client.min.js`, which are not
  in this folder. Copy them from the motion workstream's vendor folder before rendering.
- Keys are typed into the shell by the owner, never into files.
