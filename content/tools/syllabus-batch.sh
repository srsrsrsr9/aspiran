#!/bin/bash
# Renders one batch of the "Syllabus in a minute" series and files it in the repo. Run from the repo root:
#   bash content/tools/syllabus-batch.sh b07_psir 2000-07        (JOBS=3 by default)
# Writes content/motion/syllabus/<week>/: <nn>-<id>.mp4 (720x1280), .vtt, .jpg, manifest.json (ca-week@1), and
# stories/<nn>-<id>/{story.json,timing.json}. Run syllabus-setup.sh once first. Safe to re-run: unchanged videos are skipped.
set -e
REPO=$(pwd); R=${RENDER_ROOT:-$HOME/syllabus-root}; export KOKORO_MODELS=${KOKORO_MODELS:-$HOME/kokoro}
B=$1; W=$2; OUT="$REPO/content/motion/syllabus/$W"; mkdir -p "$OUT/stories" "$R/specs"
(cd "$REPO/content/motion/syllabus/src" && python3 "$B.py" > "$R/specs/$B.json")
python3 "$REPO/content/tools/build-syllabus-series.py" "$R" "$R/specs/$B.json" "$W" --jobs "${JOBS:-3}"
SRC="$R/motion/ca/$W"
cp "$SRC"/*.mp4 "$SRC"/*.vtt "$SRC"/*.jpg "$SRC/manifest.json" "$OUT/"
for d in "$SRC"/*/; do n=$(basename "$d"); mkdir -p "$OUT/stories/$n"; cp "$d"story.json "$d"timing.json "$OUT/stories/$n/"; done
echo "filed $(ls "$OUT"/*.mp4 | wc -l) videos in $OUT"
