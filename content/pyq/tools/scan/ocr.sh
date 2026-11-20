#!/bin/zsh
# ocr.sh <pdf> <outdir>: 300 dpi pages, tesseract eng+hin text per page
S=${TESSDIR:-$HOME/tessdata}  # folder with eng, hin and osd .traineddata (tessdata_fast)
pdf=$1; out=$2; mkdir -p $out
[ -f $out/done ] && exit 0
pdftoppm -r 300 -gray -png $pdf $out/p
for img in $out/p-*.png; do
  OMP_THREAD_LIMIT=1 TESSDATA_PREFIX=$S tesseract $img ${img%.png} -l eng+hin --psm 4 >/dev/null 2>&1
done
touch $out/done
