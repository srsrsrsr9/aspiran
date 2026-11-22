#!/bin/zsh
# Prints every html/*.html to a PDF in pdf/ (needs Google Chrome).
cd "${0:A:h}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p pdf
for f in html/*.html; do
  n=${f:t:r}
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="${TMPDIR:-/tmp}/aspiran-pamphlet-chrome" \
    --print-to-pdf="pdf/Aspiran-$n.pdf" "file://$PWD/$f" 2>/dev/null
  echo "pdf/Aspiran-$n.pdf"
done
