#!/bin/zsh
# Prints "PACK 2001-NN ready" once each pack of ten explainers is fully rendered (all ten have out/length.json and a
# social cut, and nothing in them changed in the last 3 minutes). Remembers what it has announced in
# content/motion/explainers/.packs-announced so a restarted watch doesn't repeat itself. Loops until all ten are announced.
E=${0:A:h}/../../motion/explainers
STATE=$E/.packs-announced
touch $STATE
while true; do
  left=0
  for k in {20..29}; do
    w=2001-$k
    grep -qx $w $STATE && continue
    left=1
    first=$(( 201 + (k - 20) * 10 )); n=0; fresh=0
    for v in {$first..$(( first + 9 ))}; do
      d=$(ls -d $E/${v}-*(/N) | head -1)
      [[ -n $d && -f $d/out/length.json ]] && ls $d/out/*.social.mp4(N) >/dev/null 2>&1 && [[ -n $(echo $d/out/*.social.mp4(N)) ]] && n=$((n + 1))
      [[ -n $d && -n $(find $d/out -newermt "$(date -v-3M '+%Y-%m-%d %H:%M:%S')" -type f 2>/dev/null | head -1) ]] && fresh=1
    done
    if (( n == 10 && fresh == 0 )); then echo $w >> $STATE; echo "PACK $w ready (videos $first-$(( first + 9 )))"; fi
  done
  (( left == 0 )) && { echo "ALL PACKS announced"; exit 0; }
  if [[ -z $(find $E -path '*/out/*' -newermt "$(date -v-90M '+%Y-%m-%d %H:%M:%S')" -type f 2>/dev/null | head -1) ]]; then
    echo "STALLED: no video rendered in 90 minutes, packs still open"; exit 1
  fi
  sleep 60
done
