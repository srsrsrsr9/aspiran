// Renders lyric-video frames (one PNG per word beat) and an ffconcat list. No photos, no real people.
const fs=require("fs"),path=require("path");const {chromium}=require("playwright");
const song=JSON.parse(fs.readFileSync(__dirname+"/../source/song.json","utf8"));const LG=process.argv[2]||"hinglish";const L=JSON.parse(fs.readFileSync(__dirname+`/../source/langs/${LG}.json`,"utf8"));const FD=__dirname+`/${LG}/frames`;const latin=["hinglish","english"].includes(LG);const BAR=4*60/song.bpm;const W=1080,H=1920;
fs.mkdirSync(FD,{recursive:true});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const scenes={
 night:`<div class="moon"></div><div class="win"><i></i><i class="on"></i><i></i><i></i><i class="on"></i><i></i></div>`,
 room:`<div class="lamp"></div><div class="books"><b style="width:420px">LAXMIKANTH</b><b style="width:360px;background:#4F6B3E">NCERT XI</b><b style="width:470px;background:#6B3A1F">PYQ 2014–2026</b><b style="width:300px;background:#D9822B">NOTES v3</b></div>`,
 phone:`<div class="phone"><div class="call">Ghar<br><small>calling…</small></div><div class="btns"><span style="background:#c0392b"></span><span style="background:#4F6B3E"></span></div></div>`,
 chai:`<div class="cup">☕</div><div class="clock">3:00</div>`,
 feed:`<div class="phone feed"><p>AIR 1 ka 16-hour routine</p><p>Topper's SECRET notes</p><p>Sirf 0.1% hi banenge…</p><p>Abhi nahi toh kabhi nahi</p></div>`,
 pod:`<div class="ring">${["A","R","S","M","K","P","N","T"].map((x,i)=>`<span style="--a:${i*45}deg">${x}</span>`).join("")}<em>your pod</em></div>`,
 chotu:`<div class="steam"><i></i><i></i><i></i></div><div class="chotu"><div class="eyes"><i></i><i></i></div><div class="smile"></div></div><div class="tag">Chotu · your AI chai cup</div>`,
 free:`<div class="chips"><span>Your pod · free</span><span>Chotu · free</span><span>Honest tools · free</span><span>No card needed</span></div>`,
 badge:`<div class="badge">5<small>days. You showed up.</small></div><div class="cheer">👏 🎉 🙌</div>`,
 three:`<div class="list"><p>✓ Polity: Article 32</p><p>✓ 10 PYQs</p><p>○ 20-min walk</p></div>`,
};
const css=`*{box-sizing:border-box;margin:0}body{width:${W}px;height:${H}px;overflow:hidden;font-family:"${L.font}",Mukta,sans-serif;background:var(--bg);color:var(--fg)}
.st{position:absolute;left:0;right:0;top:170px;height:900px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:40px}
.ly{position:absolute;left:80px;right:80px;top:1130px;bottom:330px;display:flex;flex-direction:column;justify-content:center;gap:34px}
.sung{font-weight:800;font-size:${latin?96:80}px;line-height:1.08;letter-spacing:-.01em}
.sung span{opacity:.28;display:inline-block;margin-right:.22em}.sung span.p{opacity:1}.sung span.c{opacity:1;color:var(--acc);transform:scale(1.08) rotate(-2deg)}
.en:empty{display:none}.en{font-size:44px;font-weight:500;opacity:.85;border-left:8px solid var(--acc);padding-left:24px}
.top{position:absolute;top:90px;left:80px;right:80px;display:flex;justify-content:space-between;font-size:34px;font-weight:600;opacity:.75}
.foot{position:absolute;bottom:200px;left:80px;right:80px;font-size:28px;opacity:.6}
.moon{width:220px;height:220px;border-radius:50%;box-shadow:-50px 20px 0 0 #F7F2EA;transform:translate(160px,0)}
.win{display:grid;grid-template-columns:repeat(3,150px);gap:24px}.win i{height:170px;background:#3a2a20;border-radius:12px}.win i.on{background:#F2C14E;box-shadow:0 0 60px #F2C14E88}
.lamp{width:0;height:0;border-left:140px solid transparent;border-right:140px solid transparent;border-bottom:200px solid #F2C14E;filter:drop-shadow(0 0 80px #F2C14E)}
.books{display:flex;flex-direction:column;align-items:center;gap:8px}.books b{height:84px;background:#2c4a6b;color:#F7F2EA;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:34px;letter-spacing:.08em}
.phone{width:420px;height:760px;border-radius:60px;border:14px solid #F7F2EA;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:120px 30px 80px}
.call{font-size:84px;font-weight:800;text-align:center;line-height:1}.call small{font-size:40px;font-weight:500;opacity:.7}
.btns{display:flex;gap:80px}.btns span{width:110px;height:110px;border-radius:50%}
.feed{overflow:hidden;justify-content:flex-start;gap:22px;padding:70px 26px}.feed p{background:#ffffff18;border-radius:20px;padding:24px;font-size:36px;font-weight:700;width:100%;filter:blur(.6px)}
.cup{font-size:300px;line-height:1;filter:saturate(.6)}.clock{font-size:120px;font-weight:800;font-family:"IBM Plex Mono",monospace;color:var(--acc)}
.ring{position:relative;width:700px;height:700px}.ring span{position:absolute;left:290px;top:290px;width:120px;height:120px;border-radius:50%;background:var(--acc);color:var(--bg);font-size:60px;font-weight:800;display:flex;align-items:center;justify-content:center;transform:rotate(var(--a)) translate(290px) rotate(calc(-1*var(--a)))}
.ring em{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:"Yatra One";font-style:normal;font-size:90px}
.chotu{width:400px;height:380px;background:linear-gradient(#C8693A,#9A4A26);position:relative;clip-path:polygon(0 0,100% 0,84% 100%,16% 100%);border-top:28px solid #E08A55}.steam{display:flex;gap:50px;margin-bottom:-20px}.steam i{width:18px;height:110px;border-radius:9px;background:#9A4A2655;transform:skewX(-14deg)}.chotu .eyes{position:absolute;top:100px;left:0;right:0;display:flex;justify-content:center;gap:90px}.chotu .eyes i{width:52px;height:70px;border-radius:26px;background:#2A1B12}
.chotu .smile{position:absolute;top:200px;left:140px;width:120px;height:60px;border-bottom:16px solid #2A1B12;border-radius:0 0 60px 60px}
.tag{font-size:40px;font-weight:600;background:#ffffff1c;padding:12px 30px;border-radius:999px}
.chips{display:flex;flex-direction:column;gap:30px;align-items:center}.chips span{font-size:64px;font-weight:800;background:var(--acc);color:var(--bg);padding:16px 50px;border-radius:999px}
.badge{width:420px;height:420px;border-radius:50%;background:radial-gradient(#F2C14E,#D9822B);color:#2A1B12;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:200px;font-weight:800;line-height:.9;border:16px dashed #2A1B1244}.badge small{font-size:40px}
.cheer{font-size:110px}
.list{font-size:76px;font-weight:700;display:flex;flex-direction:column;gap:24px}
.big{font-family:${latin?'"Yatra One"':'"'+L.font+'"'};font-weight:800;font-size:170px;line-height:1.05;text-align:center;color:var(--acc)}.small{font-size:54px;text-align:center;font-weight:500}
.logo{font-family:"Yatra One";font-size:150px;color:var(--acc)}.cta{font-size:62px;font-weight:800;background:var(--acc);color:var(--bg);padding:24px 60px;border-radius:999px}
.fine{font-size:34px;line-height:1.45;text-align:center;opacity:.85;max-width:900px}`;
const theme=(b)=>b.hook||b.scene==="end"?{bg:"#F7F2EA",fg:"#2A1B12",acc:"#B4521A"}:b.scene==="free"||b.scene==="badge"||b.scene==="three"?{bg:"#24331d",fg:"#F7F2EA",acc:"#F2C14E"}:{bg:"#1a120d",fg:"#F7F2EA",acc:"#F2A65A"};
const page=(b,inner)=>{const t=theme(b);return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mukta:wght@500;600;700;800&family=Yatra+One&family=IBM+Plex+Mono:wght@600&family=Noto+Sans+Telugu:wght@500;800&family=Noto+Sans+Tamil:wght@500;800&family=Noto+Sans+Bengali:wght@500;800&family=Noto+Sans+Kannada:wght@500;800&family=Noto+Sans+Malayalam:wght@500;800&family=Noto+Sans+Gujarati:wght@500;800&family=Noto+Sans+Oriya:wght@500;800&display=swap"><style>:root{--bg:${t.bg};--fg:${t.fg};--acc:${t.acc}}${css}</style></head><body>
<div class="top"><span>UPSC Pods</span><span>${esc(L.title)} · AI vocals</span></div>${inner}</body></html>`};
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:W,height:H}});const list=["ffconcat version 1.0"];let n=0;
 const shot=async(html,dur)=>{const f=path.resolve(FD+"/f.html");fs.writeFileSync(f,html);await p.goto("file://"+f,{waitUntil:"networkidle"});await p.evaluate(()=>document.fonts.ready);
  const nm=`${String(n++).padStart(4,"0")}.png`;await p.screenshot({path:FD+"/"+nm});list.push(`file '${nm}'`,`duration ${dur.toFixed(4)}`);};
 let ci=0,li=0;for(const b of song.bars){
  if(b.kind==="card"){const c=L.cards[ci++];await shot(page(b,`<div class="st">${scenes.night}</div><div class="ly" style="align-items:center"><div class="big">${esc(c[0])}</div><div class="small">${esc(c[1])}</div></div>`),BAR);}
  else if(b.kind==="end") await shot(page(b,`<div class="st" style="gap:50px"><div class="logo">UPSC Pods</div><div class="big" style="font-size:${latin?118:90}px;color:inherit;text-align:center;padding:0 60px">${esc(L.end[0])}</div><div class="cta">${esc(L.end[1])}</div><div class="small">Your pod, Chotu and the honest tools are free.<br>Go Plus when you're ready to go all in.</div></div>
   <div class="ly" style="top:1240px;align-items:center"><div class="fine">Chotu is an AI helper, not a counsellor. In distress, call Tele-MANAS 14416.<br>Names are working names. Vocals are AI-generated (ElevenLabs). Not affiliated with UPSC. Music and art are original.</div></div>`),BAR*2);
  else{const ln=L.lines[li++];const w=ln[0].split(" ");const tot=w.reduce((a,x)=>a+x.length+2,0);
   for(let i=0;i<w.length;i++){const words=w.map((x,j)=>`<span class="${j<i?"p":j===i?"c":""}">${esc(x)}</span>`).join("");
    const per=(i==w.length-1?BAR*0.08:0)+BAR*0.92*(w[i].length+2)/tot;await shot(page(b,`<div class="st">${scenes[b.scene]}</div><div class="ly"><div class="sung">${words}</div><div class="en">${esc(ln[2])}</div></div>`),per);}}
 }
 list.push(list[list.length-2]);fs.writeFileSync(FD+"/list.ffconcat",list.join("\n")+"\n");await br.close();console.log("frames",n);})();
