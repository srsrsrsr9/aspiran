/* ---------- Illustrations: 360x640 scenes in an etched, sepia print style ---------- */
const P = {paper:"#F3E6D3", p2:"#E8D3B6", ink:"#2A211A", chai:"#8D4F01", rust:"#B4532A", teal:"#14696B", mari:"#C98A0B", grey:"#8A8079", sky:"#EFDCC2"};
const DEFS = `<defs>
 <pattern id="h1" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${P.ink}" stroke-width=".8" opacity=".45"/></pattern>
 <pattern id="h2" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><line x1="0" y1="0" x2="0" y2="4" stroke="${P.ink}" stroke-width=".7" opacity=".35"/></pattern>
 <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="${P.ink}" opacity=".3"/></pattern>
 <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .16 0 0 0 0 .12 0 0 0 0 .08 0 0 0 .22 0"/></filter>
 <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="${P.ink}" stop-opacity="0"/><stop offset="100%" stop-color="${P.ink}" stop-opacity=".35"/></radialGradient>
</defs>`;
const S = 'stroke="'+P.ink+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
const T = (x,y,t,size=14,w=700,fill=P.ink,anchor="middle",fam="Georgia, serif") => `<text x="${x}" y="${y}" font-family="${fam}" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="${anchor}">${t}</text>`;
const dedupe = s => s.replace(/<([a-zA-Z]+)((?:\s+[\w:-]+="[^"]*")+)\s*(\/?)>/g, (m, tag, attrs, slash) => { const o = new Map(); for (const [, k, v] of attrs.matchAll(/([\w:-]+)="([^"]*)"/g)) { o.delete(k); o.set(k, v); } return "<" + tag + [...o].map(([k, v]) => ` ${k}="${v}"`).join("") + (slash ? "/>" : ">"); });
const frame = body => dedupe(`<svg viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DEFS}<rect width="360" height="640" fill="${P.paper}"/>${body}<rect width="360" height="640" filter="url(#grain)"/><rect width="360" height="640" fill="url(#vig)"/></svg>`);
function person(x,y,s=1,col=P.p2,extra=""){ // standing figure, feet at y
  return `<g transform="translate(${x},${y}) scale(${s})">
   <path d="M-11 0 L-9 -40 Q0 -48 9 -40 L11 0 Z" fill="${col}" ${S}/><path d="M-11 0 L-9 -40 Q0 -48 9 -40 L11 0 Z" fill="url(#h2)"/>
   <circle cx="0" cy="-54" r="9" fill="${P.p2}" ${S}/>${extra}</g>`;
}
function rat(x,y,s=1,flip=false,tail=false){
  return `<g transform="translate(${x},${y}) scale(${flip?-s:s},${s})">
   ${tail?`<path d="M-18 2 C-34 -2 -38 14 -54 8" fill="none" ${S} stroke-width="1.6"/>`:`<path d="M-19 1 l-4 1" ${S} stroke-width="2"/>`}
   <ellipse cx="0" cy="0" rx="19" ry="10" fill="${P.grey}" ${S}/><ellipse cx="0" cy="0" rx="19" ry="10" fill="url(#h1)"/>
   <circle cx="19" cy="-3" r="8" fill="${P.grey}" ${S}/><circle cx="16" cy="-11" r="4" fill="${P.p2}" ${S} stroke-width="1.5"/>
   <circle cx="22" cy="-4" r="1.4" fill="${P.ink}"/><path d="M-10 9 l-2 6 M8 9 l2 6" ${S} stroke-width="1.6"/></g>`;
}
const SCENES = {
 rats: () => frame(`
  <rect x="48" y="38" width="264" height="178" fill="${P.p2}" ${S}/><rect x="48" y="38" width="264" height="178" fill="url(#dots)"/>
  <circle cx="60" cy="50" r="3" fill="${P.ink}"/><circle cx="300" cy="50" r="3" fill="${P.ink}"/>
  ${T(180,82,"AVIS",28,800)}${T(180,116,"PRIME : 1 CENT",19,700,P.rust)}${T(180,140,"PAR QUEUE DE RAT",15,700)}
  <line x1="90" y1="156" x2="270" y2="156" ${S} stroke-width="1.2"/>${T(180,184,"HANOI · 1902",14,700,P.ink)}${T(180,202,"Le Résident-Maire",10,400,P.ink)}
  <rect x="40" y="304" width="280" height="14" fill="${P.chai}" ${S}/><rect x="40" y="304" width="280" height="14" fill="url(#h1)"/>
  <path d="M60 318 v70 M300 318 v70" ${S} stroke-width="5"/>
  <ellipse cx="170" cy="296" rx="92" ry="15" fill="${P.p2}" ${S}/>
  ${[0,1,2,3,4,5,6,7,8].map(i=>`<path d="M${100+i*16} 296 c 6 -14 -6 -22 4 -34" fill="none" ${S} stroke-width="1.8"/>`).join("")}
  <circle cx="285" cy="292" r="10" fill="${P.mari}" ${S}/><circle cx="298" cy="286" r="10" fill="${P.mari}" ${S}/>${T(298,290,"1¢",9,700)}
  <path d="M0 610 H360" ${S}/><rect x="0" y="610" width="360" height="30" fill="url(#h1)"/>
  ${rat(70,470,1.05)}${rat(150,505,1,true)}${rat(95,560,1.15)}${rat(205,455,.9,true)}${rat(175,590,1)}
  <rect x="226" y="520" width="112" height="86" fill="${P.p2}" ${S}/><path d="M226 548 H338 M226 576 H338" ${S} stroke-width="1.4"/>
  <rect x="226" y="520" width="112" height="86" fill="url(#h2)"/>${rat(262,512,.75)}${rat(305,512,.75,true)}
  ${T(282,600,"élevage",11,700,P.rust)}`),

 goodhart: () => frame(`
  <rect x="0" y="0" width="360" height="300" fill="${P.sky}"/>
  <rect x="40" y="62" width="280" height="226" fill="${P.p2}" ${S}/><rect x="40" y="62" width="280" height="226" fill="url(#h2)"/>
  <rect x="80" y="74" width="200" height="34" fill="${P.paper}" ${S}/>${T(180,99,"HOSPITAL",22,800)}
  <rect x="96" y="118" width="168" height="26" fill="${P.rust}" ${S}/>${T(180,136,"SURVIVAL ★★★★★",13,700,P.paper)}
  ${[60,100,240,280].map(x=>`<rect x="${x-8}" y="160" width="26" height="32" fill="${P.paper}" ${S} stroke-width="1.6"/>`).join("")}
  <rect x="150" y="200" width="62" height="88" fill="${P.ink}" ${S}/>
  ${person(170,286,.8,P.paper,'<path d="M10 -36 l14 -10 M10 -30 l15 -2" '+S+'/>')}${person(196,286,.8,P.paper)}
  <path d="M210 296 h96" ${S} stroke-width="3"/><circle cx="222" cy="306" r="6" fill="${P.paper}" ${S}/><circle cx="294" cy="306" r="6" fill="${P.paper}" ${S}/>
  <path d="M214 290 q 40 -14 88 0" fill="${P.p2}" ${S}/>
  <path d="M300 260 q 30 10 18 40" fill="none" stroke="${P.rust}" stroke-width="3" stroke-dasharray="6 5"/>
  <rect x="34" y="350" width="292" height="248" rx="6" fill="#2F3A33" ${S} stroke-width="4"/>
  ${T(54,392,"ENROLLED (age 6–14)",15,700,"#EDE6D6","start")}
  <rect x="54" y="404" width="221" height="22" fill="#EDE6D6" opacity=".9"/>${T(282,421,"95%+",15,800,"#EDE6D6","start")}
  ${T(54,486,"CLASS 5 CAN READ",15,700,"#EDE6D6","start")}${T(54,506,"A CLASS 2 TEXT (govt)",15,700,"#EDE6D6","start")}
  <rect x="54" y="520" width="104" height="22" fill="${P.mari}"/><rect x="54" y="520" width="233" height="22" fill="none" stroke="#EDE6D6" stroke-dasharray="4 4"/>${T(166,537,"45%",15,800,"#EDE6D6","start")}
  ${T(54,580,"ASER 2024, rural · full bar = 100%",10,400,"#EDE6D6","start","system-ui, sans-serif")}`),

 fine: () => frame(`
  <circle cx="180" cy="128" r="84" fill="${P.p2}" ${S} stroke-width="4"/><circle cx="180" cy="128" r="84" fill="url(#dots)"/>
  ${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<line x1="${180+70*Math.sin(a)}" y1="${128-70*Math.cos(a)}" x2="${180+78*Math.sin(a)}" y2="${128-78*Math.cos(a)}" ${S}/>`}).join("")}
  <line x1="180" y1="128" x2="${180+42*Math.sin(130*Math.PI/180)}" y2="${128-42*Math.cos(130*Math.PI/180)}" ${S} stroke-width="5"/>
  <line x1="180" y1="128" x2="${180+62*Math.sin(120*Math.PI/180)}" y2="${128-62*Math.cos(120*Math.PI/180)}" ${S} stroke-width="3"/>
  <circle cx="180" cy="128" r="5" fill="${P.ink}"/>${T(180,236,"CLOSES 16:00",14,700,P.rust)}
  <rect x="34" y="252" width="128" height="170" fill="${P.p2}" ${S}/><rect x="56" y="300" width="84" height="122" fill="${P.chai}" ${S}/><rect x="56" y="300" width="84" height="122" fill="url(#h1)"/>
  <rect x="58" y="264" width="80" height="24" fill="${P.paper}" ${S} stroke-width="1.5"/>${T(98,281,"DAY CARE",12,800)}
  ${person(112,420,.9,P.teal,'<rect x="10" y="-30" width="16" height="12" fill="'+P.mari+'" '+S+' stroke-width="1.4"/>')}
  <rect x="190" y="262" width="136" height="140" fill="${P.paper}" ${S}/><path d="M190 262 l68 -16 l68 16" fill="none" ${S} stroke-width="1.4"/>
  ${T(258,292,"LATE PICKUP",14,800)}${T(258,330,"₪10",32,800,P.rust)}${T(258,354,"per child",12,400)}${T(258,374,"10 min late or more",12,400)}
  <path d="M40 600 H330" ${S}/><path d="M40 600 V450" ${S}/>
  ${Array.from({length:20},(_,i)=>{const h=i<4?26:i<8?26+(i-3)*9:i<16?66+(i%2)*4:68+(i%2)*3; const x=46+i*14; return `<rect x="${x}" y="${600-h}" width="10" height="${h}" fill="${i<4?P.grey:P.rust}" ${S} stroke-width="1"/>`}).join("")}
  <path d="M100 600 V462 M268 600 V462" stroke="${P.ink}" stroke-width="1.4" stroke-dasharray="4 4"/>
  ${T(104,474,"fine starts",11,700,P.ink,"start","system-ui, sans-serif")}${T(264,474,"fine dropped",11,700,P.ink,"end","system-ui, sans-serif")}
  ${T(185,622,"late pickups by week, 20 weeks (shape only)",10,400,P.ink,"middle","system-ui, sans-serif")}`),

 punjab: () => frame(`
  <rect width="360" height="190" fill="${P.sky}"/>
  ${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<line x1="${90+48*Math.cos(a)}" y1="${90+48*Math.sin(a)}" x2="${90+64*Math.cos(a)}" y2="${90+64*Math.sin(a)}" stroke="${P.mari}" stroke-width="3" stroke-linecap="round"/>`}).join("")}
  <circle cx="90" cy="90" r="38" fill="${P.mari}" ${S}/><circle cx="90" cy="90" r="38" fill="url(#h2)"/>
  <rect x="214" y="44" width="112" height="112" fill="${P.paper}" ${S}/><rect x="214" y="44" width="112" height="28" fill="${P.rust}" ${S}/>${T(270,64,"JUNE",15,800,P.paper)}
  ${Array.from({length:15},(_,i)=>`<rect x="${222+(i%5)*20}" y="${80+Math.floor(i/5)*24}" width="16" height="18" fill="none" stroke="${P.ink}" stroke-width="1"/>`).join("")}
  <circle cx="290" cy="113" r="13" fill="none" stroke="${P.rust}" stroke-width="3"/>${T(270,152,"no paddy before this",10,700,P.ink,"middle","system-ui, sans-serif")}
  <rect x="40" y="200" width="96" height="58" fill="${P.p2}" ${S}/><rect x="40" y="200" width="96" height="58" fill="url(#h1)"/>${T(88,234,"PUMP",13,800)}
  <path d="M136 230 h40 v18" fill="none" ${S} stroke-width="4"/><path d="M176 252 q 4 14 -2 24 M182 252 q 6 12 2 22" stroke="${P.teal}" stroke-width="2.4" fill="none"/>
  <rect x="0" y="262" width="360" height="110" fill="${P.p2}"/><rect x="0" y="262" width="360" height="110" fill="url(#h2)"/>
  <path d="M88 258 V360" ${S} stroke-width="5"/>
  ${[300,326,352].map((y,i)=>`<path d="M20 ${y} H330" stroke="${P.teal}" stroke-width="${3-i*.6}" stroke-dasharray="${i?'6 6':'0'}" opacity="${1-i*.25}"/>`).join("")}
  <path d="M300 296 V352" stroke="${P.teal}" stroke-width="2.5"/><path d="M292 344 l8 10 l8 -10" fill="none" stroke="${P.teal}" stroke-width="2.5"/>${T(244,292,"water table",11,700,P.teal,"middle","system-ui, sans-serif")}
  <rect x="0" y="372" width="360" height="110" fill="${P.paper}"/>
  ${Array.from({length:30},(_,i)=>{const x=14+(i%10)*14, y=392+Math.floor(i/10)*30;return `<path d="M${x} ${y+18} q -4 -12 -8 -16 M${x} ${y+18} q 0 -14 2 -20 M${x} ${y+18} q 4 -10 9 -14" fill="none" stroke="${P.teal}" stroke-width="1.6"/>`}).join("")}
  ${Array.from({length:14},(_,i)=>`<path d="M${170+i*13} 478 l3 -12" ${S} stroke-width="1.5"/>`).join("")}
  <path d="M190 476 q -10 -26 6 -40 q 2 16 12 10 q -4 -22 14 -34 q -2 24 14 30 q 8 -10 6 -20 q 16 18 4 54 Z" fill="${P.rust}" ${S}/>
  <path d="M206 476 q -4 -16 6 -24 q 4 10 10 6 q 4 10 -2 18 Z" fill="${P.mari}"/>
  <rect x="268" y="392" width="72" height="26" fill="${P.paper}" ${S} stroke-width="1.5"/>${T(304,410,"LATE OCT",12,800,P.rust)}
  <path d="M0 482 H360" ${S}/>
  ${[[205,430,24],[225,400,30],[250,372,26]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.6}" fill="${P.grey}" opacity=".55"/>`).join("")}
  <rect x="0" y="483" width="360" height="157" fill="${P.sky}"/>
  ${[[150,540,34],[200,552,40],[255,548,42],[310,556,36]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.45}" fill="${P.grey}" opacity=".6"/>`).join("")}
  <path d="M90 520 H350" stroke="${P.ink}" stroke-width="2" stroke-dasharray="8 6"/>${T(96,512,"warm layer acts as a lid",10,700,P.ink,"start","system-ui, sans-serif")}
  ${[[200,590,22,46],[226,600,18,36],[248,580,20,56],[272,596,16,40],[292,586,22,50],[318,598,18,38]].map(([x,b,w,h])=>`<rect x="${x}" y="${b-h+40}" width="${w}" height="${h}" fill="${P.p2}" ${S} stroke-width="1.6"/>`).join("")}
  <path d="M0 636 H360" ${S}/>`),

 pradhan: () => frame(`
  <path d="M130 120 q -40 40 -10 96 q 60 34 120 0 q 30 -56 -10 -96 Z" fill="${P.chai}" ${S}/><path d="M130 120 q -40 40 -10 96 q 60 34 120 0 q 30 -56 -10 -96 Z" fill="url(#h1)"/>
  <rect x="140" y="98" width="80" height="24" rx="4" fill="${P.chai}" ${S}/><path d="M146 156 h68" stroke="${P.mari}" stroke-width="4"/>
  ${[[150,70,-14],[188,52,6],[226,74,18]].map(([x,y,r])=>`<g transform="translate(${x},${y}) rotate(${r})"><rect x="-14" y="-9" width="28" height="18" fill="${P.paper}" ${S} stroke-width="1.5"/></g>`).join("")}
  ${T(188,58,"♀",12,700,P.rust)}${T(180,244,"SEATS ROTATE",13,800,P.ink)}
  <path d="M30 400 V300 L180 262 L330 300 V400 Z" fill="${P.p2}" ${S}/><path d="M30 400 V300 L180 262 L330 300 V400 Z" fill="url(#h2)"/>
  <rect x="80" y="296" width="200" height="26" fill="${P.paper}" ${S}/>${T(180,314,"GRAM PANCHAYAT",13,800)}
  <rect x="150" y="332" width="60" height="68" fill="${P.ink}" ${S}/>
  ${person(180,400,1.05,P.teal,'<path d="M-9 -40 Q 10 -60 12 -20" fill="'+P.mari+'" '+S+' stroke-width="1.4"/>')}
  ${person(70,400,.75,P.p2)}${person(290,400,.75,P.p2)}
  <path d="M0 412 H360" ${S}/>
  <rect x="166" y="452" width="28" height="120" fill="${P.grey}" ${S}/><rect x="166" y="452" width="28" height="120" fill="url(#h1)"/>
  <path d="M194 470 L262 440" ${S} stroke-width="6"/><path d="M166 486 h-30 v12" fill="none" ${S} stroke-width="7"/>
  <path d="M136 504 q -2 14 0 22 M140 506 q 2 12 0 20" stroke="${P.teal}" stroke-width="2.4" fill="none"/>
  <path d="M112 528 h44 l-6 44 h-32 Z" fill="${P.mari}" ${S}/>
  ${person(270,600,.9,P.rust)}${person(306,600,.8,P.teal)}${person(60,600,.85,P.chai)}
  <path d="M0 600 H360" ${S}/><rect x="0" y="600" width="360" height="40" fill="url(#h2)"/>`),

 wald: () => frame(`
  <rect width="360" height="330" fill="${P.sky}"/>
  <path d="M30 150 L160 132 L200 132 L330 150 L330 166 L200 168 L160 168 L30 166 Z" fill="${P.grey}" ${S}/><path d="M30 150 L160 132 L200 132 L330 150 L330 166 L200 168 L160 168 L30 166 Z" fill="url(#h1)"/>
  <path d="M168 58 Q180 40 192 58 L196 260 Q180 274 164 260 Z" fill="${P.grey}" ${S}/><path d="M168 58 Q180 40 192 58 L196 260 Q180 274 164 260 Z" fill="url(#h1)"/>
  <path d="M120 248 L240 248 L240 262 L120 262 Z" fill="${P.grey}" ${S}/>
  ${[86,128,232,274].map(x=>`<rect x="${x-9}" y="128" width="18" height="34" rx="5" fill="${P.p2}" ${S}/>`).join("")}
  <circle cx="180" cy="70" r="9" fill="${P.p2}" ${S}/>
  ${[[50,156],[62,152],[70,160],[104,150],[112,158],[150,146],[150,160],[208,148],[214,160],[248,152],[252,160],[296,154],[310,158],[318,152],[175,110],[184,122],[176,190],[186,204],[178,222],[132,254],[150,256],[214,254],[230,256],[60,162],[300,162]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.2" fill="${P.rust}" stroke="${P.ink}" stroke-width=".8"/>`).join("")}
  ${[86,128,232,274].map(x=>`<rect x="${x-14}" y="122" width="28" height="46" rx="6" fill="none" stroke="${P.teal}" stroke-width="2.4" stroke-dasharray="5 4"/>`).join("")}
  <rect x="166" y="56" width="28" height="28" rx="6" fill="none" stroke="${P.teal}" stroke-width="2.4" stroke-dasharray="5 4"/>
  ${T(180,302,"armour where the holes aren't",13,800,P.teal)}
  <path d="M180 330 L120 492 L240 492 Z" fill="${P.mari}" opacity=".28"/>
  <rect x="40" y="492" width="280" height="18" fill="${P.chai}" ${S}/><rect x="40" y="492" width="280" height="18" fill="url(#h1)"/>
  ${person(180,492,1.2,P.rust,'<path d="M12 -44 l10 -18 h10 l-2 10 q -8 6 -10 0" fill="'+P.mari+'" '+S+' stroke-width="1.5"/>')}
  ${T(180,382,"TOPPER TALK",13,800,P.chai)}
  ${Array.from({length:22},(_,i)=>`<g opacity=".38">${person(22+(i%11)*32,(i<11?566:620),.6,P.grey)}</g>`).join("")}
  ${T(180,636,"the ones who didn't clear",11,700,P.ink,"middle","system-ui, sans-serif")}`)
};


const fs=require("fs"),path=require("path");const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
for(const k of Object.keys(SCENES)){fs.writeFileSync(path.join(out,k+".svg"),'<?xml version="1.0" encoding="UTF-8"?>\n'+SCENES[k]().replace("<svg ",'<svg width="360" height="640" '));}
console.log("wrote",Object.keys(SCENES).join(", "));
