# AI-voice readings with Cartesia

Voices the syllabus notes (library kind `read`) and the guided walks (`walk-script`) in Indian voices, checks every
chunk by speech-to-text, and attaches the finished file to the live library item as `data.audio.<lang>`
(`{ url, seconds, voice, ai: true, by, chapters, src, made }`). The web reader, the walk page and the Android
reader and walk screens show a **Listen · AI voice** player when it's there, and the phone/device voice otherwise.

- `cart.py`: Cartesia text-to-speech (`sonic-3`) and speech-to-text (`ink-whisper`). The API key is read from the macOS
  Keychain (service `cartesia-api-key`, account `aspiran`) inside the process. It's never printed or saved.
- `speak.py`: turns written text into a spoken script: ₹ and lakh/crore, Indian-grouped numbers, year ranges, article
  clauses, symbols and units as words. Hindi gets every number as Hindi words.
- `build.py`: one request per section (intro, sections, "test yourself" questions with pauses, ending). Each chunk is
  re-transcribed and compared with its script. Up to 3 takes; the best is kept; a chunk under the bar (en 0.90, hi 0.82)
  marks the reading as failed. Chunks are joined with short gaps, loudness-normalised, mono 64 kbps MP3.
- `publish.py`: uploads readings with no failed chunk to R2 `upsc-pods-media/audio-ai/2026-11/...` and updates the library
  row (also a `content_versions` row and an audit line, actor "Aspiran (owner publish)").
- The server keeps `audio` when an item is re-imported, language by language, only while the text it was made from is
  unchanged (`src` = first 16 hex of SHA-256 of the JSON of `sections.<lang>` or `script.<lang>`; `keepAudio` in content.ts).

Providers are tried in order per series (`CHAIN` in `build.py`) and the next one takes over when one is out of credits:
Cartesia, Inworld, Smallest, then Chariot (`prov.py`; keys from the Keychain, account `aspiran`, never printed). Notes in
English: Krishna, Saanvi, Aditi, Neha. Notes in Hindi: Kriti, Manoj, Kunal, Darshan. Walks: Siya / Siddharth / Nikhil in
English, Rehan / Meera / Seema in Hindi. Each reading records its `provider` and model (`by`). Fish Audio is not used here:
it is kept for Chotu, Jeetu and videos.
Checker: Deepgram nova-3 (en-IN, hi), bar en 0.88, hi 0.80, 0.12 lower for lines under 120 characters. When a chunk fails,
Chariot's speech-to-text gives a second opinion (`prov.chariot_stt`); a pass is stored as `check2` on the chunk and kept by
`--rescore`. `report.py` prints the table by paper and subject, the voices, and what is still to voice.

## Run (from the repo root)
    mkdir -p content/audio/cartesia
    (cd server && npx wrangler d1 execute upsc-pods --remote --env production --json --command "select id, kind, pack, title, json, en_editor, hi_editor, updated_at from library where kind in ('read','walk-script') and status='approved'") > content/audio/cartesia/lib.json
    python3 content/tools/cartesia/build.py --only walk-script      # or --ids a,b  or nothing for all
    python3 content/tools/cartesia/publish.py --dry                 # then without --dry
Generated files live in `content/audio/cartesia/` (git-ignored). `build.py` resumes where it stopped.
