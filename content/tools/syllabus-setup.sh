#!/bin/bash
# Sets up a machine to render the "Syllabus in a minute" series. Run from the repo root:  bash content/tools/syllabus-setup.sh
# Installs Kokoro (local TTS) and its models, and assembles the render root (engine, tokens, audio, illustrations)
# at $RENDER_ROOT (default ~/syllabus-root). Needs ffmpeg, Node with Playwright (Chromium), Python 3, and GitHub access.
set -e
REPO=$(pwd); R=${RENDER_ROOT:-$HOME/syllabus-root}; K=${KOKORO_MODELS:-$HOME/kokoro}
pip install -q kokoro-onnx soundfile numpy 2>&1 | grep -v -i warning || true
mkdir -p "$K"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$K/$f" ] || curl -sSL --retry 4 -o "$K/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done
mkdir -p "$R/motion" "$R/audio" "$R/illustrations"
cp -r "$REPO/project-files/content/motion/engine" "$R/motion/"
cp "$REPO/content/tools/"{motion.js,shots-ca.js,player.html} "$R/motion/engine/"
cp "$REPO/project-files/content/tokens.json" "$R/"
cp -r "$REPO/server/content/preview-2026-10-10/audio/"* "$R/audio/"
cp -r "$REPO/project-files/content/illustrations/"* "$R/illustrations/"
ln -sfn "$REPO/content/illustrations/syllabus" "$R/illustrations/syllabus"
echo "ready: render root $R, models $K"
