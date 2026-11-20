#!/bin/zsh
# pocr.sh <pdf> <outdir>: English pages of a Prelims booklet, each column OCR'd to p-NN-0.tsv / p-NN-1.tsv
S=${TESSDIR:-$HOME/tessdata}  # folder with eng, hin and osd .traineddata (tessdata_fast)
pdf=$1; out=$2; mkdir -p $out
[ -f $out/done ] && exit 0
pdfinfo $pdf >/dev/null 2>&1 || exit 1
n=$(pdfinfo $pdf | awk '/^Pages/{print $2}')
for i in $(seq 1 $n); do
  pp=$(printf %02d $i)
  grep -q "^$pp " $out/pages.txt 2>/dev/null && continue
  pdftoppm -r 90 -gray -png -f $i -l $i -singlefile $pdf $out/s-$pp
  OMP_THREAD_LIMIT=1 tesseract $out/s-$pp.png - -l eng --psm 4 2>/dev/null > $out/p-$pp.all.txt
  rm -f $out/s-$pp.png
  eng=$(python3 -I -c "
import re;t=open('$out/p-$pp.all.txt',encoding='utf-8',errors='ignore').read().lower();w=re.findall(r'[a-z]+',t)
c=sum(1 for x in w if x in {'the','of','and','which','following','statements','is','in','to','only','with','are','a','correct','given','below','select','answer','code'})
print(1 if len(w)>40 and c/len(w)>0.12 else 0)")
  if [ $eng = 1 ]; then
    pdftoppm -r 300 -gray -png -f $i -l $i -singlefile $pdf $out/p-$pp
    w=$(magick identify -format %w $out/p-$pp.png); h=$((w/2))
    for c in 0 1; do
      magick $out/p-$pp.png -crop ${h}x100000+$((c*h))+0 +repage $out/c-$pp-$c.png
      OMP_THREAD_LIMIT=1 tesseract $out/c-$pp-$c.png $out/p-$pp-$c -l eng --psm 4 tsv >/dev/null 2>&1
      rm -f $out/c-$pp-$c.png
    done
    rm -f $out/p-$pp.png
  fi
  echo "$pp $eng" >> $out/pages.txt
done
touch $out/done
