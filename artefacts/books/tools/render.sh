#!/bin/zsh
# Prints the workbook HTML files to A4 PDFs with Chrome (macOS). Run from anywhere.
cd "${0:A:h}/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for f in polity-workbook/polity-workbook-{en,hi}.html syllabus-companion/syllabus-companion-{en,hi}.html; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="${TMPDIR:-/tmp}/aspiran-book-chrome" \
    --virtual-time-budget=10000 --print-to-pdf="$PWD/${f:r}.pdf" "file://$PWD/$f" 2>/dev/null
  echo "${f:r}.pdf"
done
