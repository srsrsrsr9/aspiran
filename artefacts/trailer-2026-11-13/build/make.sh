#!/bin/zsh
# Rebuilds both cuts from the sources. No network needed (voice takes and effects are already in audio/).
# Run from anywhere: zsh artefacts/trailer-2026-11-13/build/make.sh
set -e
cd "${0:A:h}/.."
python3 build/prep_vo.py > /dev/null          # trim and pitch the chosen takes -> _work/vo, build/vo_timing.json
python3 build/timeline.py                     # place every line -> build/timeline.json, scenes/timeline.js
python3 build/mix.py                          # score + voice + effects -> _work/mix.wav
rm -rf _work/picture-*.frames
node build/render.mjs 1920 1080 _work/picture-1080p.mp4 --workers 5
node build/render.mjs 1080 1920 _work/picture-vertical.mp4 --workers 5
for cut in 1080p vertical; do
  ffmpeg -v error -y -i _work/picture-$cut.mp4 -i _work/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 \
    -movflags +faststart -shortest aspiran-trailer-$cut.mp4
done
ls -la aspiran-trailer-*.mp4
