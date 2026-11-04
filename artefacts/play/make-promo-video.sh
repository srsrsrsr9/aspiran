F=(v00 v01 v02 v03 v04 v05 v06 v07 v99); D=(3.6 4.2 3.8 3.6 3.6 3.6 3.6 3.6 4.6); T=0.6
inputs=(); filt=""; i=0
for f in "${F[@]}"; do inputs+=(-loop 1 -framerate 30 -t ${D[$i]} -i $f.png); filt+="[$i:v]scale=1920:1080,zoompan=z='min(1+0.0004*on,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,format=yuv420p,setsar=1[s$i];"; i=$((i+1)); done
prev="s0"; off=0
for ((k=1;k<${#F[@]};k++)); do off=$(echo "$off + ${D[$((k-1))]} - $T" | bc); filt+="[$prev][s$k]xfade=transition=fade:duration=$T:offset=$off[x$k];"; prev="x$k"; done
filt+="[$prev]fade=t=in:d=0.5,fade=t=out:st=$(echo "$off + ${D[8]} - 0.8" | bc):d=0.8[v]"
OUT=/Users/srinivasvedantam/Documents/app/artefacts/play/aspiran-promo-1080p.mp4
/opt/homebrew/bin/ffmpeg -y -loglevel error "${inputs[@]}" -f lavfi -i anullsrc=r=48000:cl=stereo -filter_complex "$filt" -map "[v]" -map ${#F[@]}:a -shortest -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart $OUT
/opt/homebrew/bin/ffprobe -v error -show_entries format=duration,size -of default=nw=1 $OUT
/opt/homebrew/bin/ffmpeg -y -loglevel error -ss 9 -i $OUT -frames:v 1 -vf scale=800:-1 ../s-mid.png
