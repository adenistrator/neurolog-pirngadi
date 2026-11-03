const FAN = 'M145,-4.7 A110,110 0 0 0 255,-4.7 L410,263.7 A420,420 0 0 1 -10,263.7 Z';
const LIN = 'M30,0 H370 V262 H30 Z';
const SITES = [
 { id:'IA', name:'Injeksi intra-artikular SIJ', chip:'Intra-artikular',
   probe:'convex', freq:'2–5 MHz', depth:8, plane:'Transversal · setinggi S3–S4', orient:['MEDIAL','LATERAL'],
   fatB:38, fascia:['M0,38 C120,36 260,40 400,38'],
   bones:[{k:'S',d:'M0,150 C60,148 120,155 170,175 L192,200 L190,300 L0,300 Z',s:'M0,150 C60,148 120,155 170,175 L192,200'},
          {k:'I',d:'M214,196 C232,165 282,136 400,122 L400,300 L212,300 Z',s:'M214,196 C232,165 282,136 400,122'}],
   joint:['M192,200 L214,196 L212,300 L190,300 Z'], foramen:[],
   lig:['M166,170 C182,176 200,182 226,176 L214,196 L192,200 Z'], nerves:[],
   target:[203,197], needle:[[52,0],[199,193]],
   labels:[['Lemak subkutan',392,26,'end'],['M. gluteus maximus',392,84,'end'],['Sakrum',30,215,'start'],['Ilium',385,215,'end'],
           ['Celah SIJ (sinovial)',236,262,'start',203,240],['Lig. SI posterior',112,124,'end',186,182],['Jarum 22G, in-plane',112,70,'start']],
   model:{m:[112,240],a:[161,222],probe:[172,214,82,0]},
   info:{ target:'Sepertiga inferior celah SIJ, bagian yang benar-benar sinovial (setinggi foramen S3–S4).',
     indikasi:'Nyeri SIJ dengan ≥3 dari 5 tes provokasi positif (distraction, compression, thigh thrust, Gaenslen, sacral thrust). Diagnostik (blok anestesi lokal) maupun terapeutik; sakroiliitis pada spondiloartritis.',
     probe:'Prone, bantal di bawah perut. Convex transversal di hiatus sakralis, geser ke lateral sampai tepi sakrum, lalu ke kranial sampai tampak celah hipoekoik antara sakrum (medial) dan ilium (lateral).',
     jarum:'Spinal 22G 3,5", in-plane dari medial ke lateral. Rasakan "give" saat menembus kapsul posterior.',
     obat:'Total 1–2 mL: bupivakain 0,5% 1 mL + triamsinolon asetonid 40 mg atau metilprednisolon asetat 40 mg. Kapasitas sendi kecil, injeksi terasa resisten bila di intra-artikular.',
     waspada:'Akurasi USG lebih rendah dari fluoroskopi berkontras (±87% vs ±98%), terutama pada obesitas dan sendi degeneratif. Kebocoran kapsul ventral dapat memblok pleksus lumbosakral (kelemahan tungkai sementara).',
     bukti:'RCT Jee 2014: akurasi USG 87,3% vs fluoroskopi 98,2%, perbaikan nyeri dan fungsi setara, tanpa radiasi. Teknik dasar: Harmon & O\'Sullivan 2008.' } },

 { id:'PA', name:'Injeksi periartikular SIJ superior', chip:'Periartikular',
   probe:'convex', freq:'2–5 MHz', depth:8, plane:'Transversal · setinggi S1 / PSIS', orient:['MEDIAL','LATERAL'],
   fatB:30, fascia:['M0,30 C140,28 260,32 400,30','M232,30 C220,60 205,120 190,172'],
   bones:[{k:'S',d:'M0,176 C50,172 100,180 150,195 L176,214 L176,300 L0,300 Z',s:'M0,176 C50,172 100,180 150,195 L176,214'},
          {k:'I',d:'M192,208 C186,170 200,122 240,96 C290,78 350,84 400,90 L400,300 L192,300 Z',s:'M192,208 C186,170 200,122 240,96 C290,78 350,84 400,90'}],
   joint:['M176,214 L192,208 L192,300 L176,300 Z'], foramen:[],
   lig:['M150,195 C162,186 176,178 189,172 L192,208 L176,214 Z'], nerves:[],
   target:[180,199], needle:[[30,0],[177,195]],
   labels:[['Lemak subkutan',392,22,'end'],['Fasia torakolumbal',392,46,'end'],['M. gluteus maximus',392,72,'end'],['M. multifidus',12,150,'start'],
           ['PSIS / ilium',385,165,'end'],['Sakrum (S1)',20,232,'start'],['Lig. interoseus + SI posterior',214,244,'start',186,196],['Jarum',62,20,'start']],
   model:{m:[96,108],a:[137,114],probe:[160,118,82,0]},
   info:{ target:'Celah SIJ bagian atas setinggi S1, medial PSIS: ligamen sakroiliaka posterior dan interoseus (komponen ekstra-artikular).',
     indikasi:'Nyeri tepat di sekitar PSIS (Fortin finger test positif), nyeri ligamen pasca-trauma atau hipermobilitas; tambahan untuk injeksi IA bila respons IA saja parsial.',
     probe:'Convex transversal setinggi S1, mulai dari krista sakral median lalu geser lateral sampai PSIS tampak lebih superfisial dari sakrum.',
     jarum:'Spinal 22G, in-plane medial ke lateral menembus m. multifidus, ujung jarum di ligamen dorsal di atas celah.',
     obat:'2–3 mL lidokain 1% atau bupivakain 0,25% + steroid dosis rendah (mis. triamsinolon 20 mg). Alternatif regeneratif: dekstrosa 12,5–25%.',
     waspada:'Celah atas dalam dan sempit, didominasi ligamen interoseus. Ini bukan jalur yang baik untuk masuk intra-artikular. Gunakan Doppler bila arah jarum menuju lateral-dalam.',
     bukti:'Borowsky & Fagen 2008: kombinasi injeksi intra- dan periartikular memberi perbaikan nyeri lebih baik daripada intra-artikular saja, mendukung peran ligamen sebagai sumber nyeri.' } },

 { id:'LDL', name:'Injeksi ligamen sakroiliaka dorsal panjang', chip:'Ligamen dorsal (LDL)',
   probe:'linear', freq:'6–13 MHz', depth:4, plane:'Longitudinal-oblik · PSIS → S3', orient:['KRANIAL','KAUDAL'],
   fatB:26, fascia:['M0,26 C120,24 260,28 400,26'],
   bones:[{k:'I',d:'M0,96 C40,90 80,96 110,112 L116,300 L0,300 Z',s:'M0,96 C40,90 80,96 110,112'},
          {k:'S',d:'M150,160 C220,150 300,141 400,136 L400,300 L150,300 Z',s:'M150,160 C220,150 300,141 400,136'}],
   joint:['M110,112 L150,160 L150,300 L116,300 Z'], foramen:[],
   lig:['M44,84 C100,86 140,112 200,128 C260,127 330,123 400,121 L400,132 C330,135 260,140 200,146 C150,142 112,106 56,94 Z'],
   nerves:[[290,112,8,4.5]],
   target:[152,123], needle:[[392,0],[156,120]],
   labels:[['Lemak subkutan',200,19,'middle'],['Aponeurosis m. gluteus maximus',36,60,'start'],['N. kluneal',304,104,'start',296,109],
           ['LDL',360,168,'end',330,129],['PSIS',40,160,'start'],['Krista sakral lateral (S3)',362,232,'end'],['SIJ (dalam)',133,276,'middle']],
   model:{m:[96,186],a:[146,190],probe:[142,196,82,77]},
   info:{ target:'Ligamen sakroiliaka dorsal panjang (LDL), dari PSIS ke krista sakral lateral S3–S4. Nyeri tekan tepat di bawah PSIS.',
     indikasi:'Nyeri pelvis peripartum/postpartum, nyeri tekan LDL, nyeri SIJ dengan komponen ligamen. Juga untuk hidrodiseksi n. kluneal medius bila dicurigai entrapment.',
     probe:'Linear frekuensi tinggi, longitudinal-oblik dari PSIS ke arah kaudal-medial. LDL tampak sebagai pita fibrilar hiperekoik di atas celah antara PSIS dan sakrum.',
     jarum:'25G 1,5–2", in-plane dari kaudal ke kranial. Target di permukaan/peri-ligamen, hindari bolus besar intraligamen.',
     obat:'1–2 mL anestesi lokal + steroid dosis rendah, atau dekstrosa 15% untuk prolotherapy (biasanya serial 3–4 sesi).',
     waspada:'N. kluneal medius (cabang lateral S1–S3) melintas dekat LDL. Parestesia saat jarum maju menandakan kontak saraf; tarik sedikit.',
     bukti:'Vleeming 1996: LDL menegang saat kontranutasi sakrum dan merupakan sumber nyeri yang dapat dipalpasi, terutama pada nyeri pelvis peripartum.' } },

 { id:'LB', name:'Blok cabang lateral S1–S3', chip:'Cabang lateral S1–S3',
   probe:'convex', freq:'2–5 MHz', depth:7, plane:'Transversal · setinggi foramen S2', orient:['MEDIAL','LATERAL'],
   fatB:30, fascia:['M0,30 C150,28 260,32 400,30','M232,30 C236,70 236,110 232,148'],
   bones:[{k:'S',d:'M0,118 C18,108 40,112 60,128 C90,138 120,144 150,150 L150,300 L0,300 Z',s:'M0,118 C18,108 40,112 60,128 C90,138 120,144 150,150'},
          {k:'S',d:'M180,152 C210,150 240,148 268,150 C285,152 296,160 302,176 L306,300 L180,300 Z',s:'M180,152 C210,150 240,148 268,150 C285,152 296,160 302,176'},
          {k:'I',d:'M326,182 C340,152 368,132 400,122 L400,300 L322,300 Z',s:'M326,182 C340,152 368,132 400,122'}],
   joint:['M302,176 L326,182 L322,300 L306,300 Z'], foramen:['M150,150 L180,152 L180,300 L150,300 Z'],
   lig:[], nerves:[[165,162,6,5],[196,146,7,3.2]],
   target:[187,147], needle:[[384,0],[191,144]],
   labels:[['Lemak subkutan',392,22,'end'],['M. multifidus',14,70,'start'],['Krista sakral median',14,96,'start',30,110],['M. gluteus maximus',392,108,'end'],
           ['Ramus dorsalis S2',112,204,'end',160,166],['Cabang lateral',232,204,'start',200,150],['Foramen S2',165,282,'middle'],['Sakrum',60,252,'middle'],['SIJ',314,282,'middle'],['Ilium',390,236,'end']],
   model:{m:[306,156],a:[236,156],probe:[232,156,82,0],dots:[[238,115],[232,155],[226,193]]},
   info:{ target:'Tepi lateral foramen sakral posterior S1, S2, S3, tempat cabang lateral keluar menuju ligamen dorsal SIJ.',
     indikasi:'Blok diagnostik sebelum ablasi radiofrekuensi (RF) pada nyeri SIJ kronik yang respons terhadap blok tetapi kambuh. Selalu dikombinasikan dengan blok ramus dorsalis L5.',
     probe:'Convex transversal. Mulai dari krista sakral median, geser lateral sampai garis hiperekoik sakrum "terputus": itulah foramen posterior. Ulangi untuk S1, S2, S3.',
     jarum:'22–25G 3,5", in-plane lateral ke medial menuju tepi lateral foramen. Multi-site multi-depth: 2–3 titik per level.',
     obat:'0,2–0,5 mL bupivakain 0,5% per titik (blok diagnostik volume kecil). Respons positif: nyeri turun ≥50–80% selama durasi kerja obat.',
     waspada:'Jumlah dan lintasan cabang lateral sangat bervariasi (Roberts 2014), jadi satu titik per level sering tidak cukup. Untuk RF, fluoroskopi masih standar acuan.',
     bukti:'Cohen 2008 (RCT, Anesthesiology): RF cabang lateral L4–S3 lebih unggul dari plasebo hingga 6 bulan. Dreyfuss 2009: blok multi-site multi-depth efektif untuk nyeri ligamen dorsal, kurang efektif untuk nyeri kapsul intra-artikular.' } },

 { id:'L5', name:'Blok ramus dorsalis L5', chip:'Ramus dorsalis L5',
   probe:'convex', freq:'2–5 MHz', depth:8, plane:'Transversal · setinggi L5–S1', orient:['MEDIAL','LATERAL'],
   fatB:26, fascia:['M0,26 C140,24 260,28 400,26'],
   bones:[{k:'S',d:'M0,78 L22,80 L32,168 C50,174 72,170 94,164 C108,142 124,134 140,146 C150,170 160,198 176,204 C214,200 260,198 302,204 C332,208 362,212 400,200 L400,300 L0,300 Z',
           s:'M0,78 L22,80 L32,168 C50,174 72,170 94,164 C108,142 124,134 140,146 C150,170 160,198 176,204 C214,200 260,198 302,204 C332,208 362,212 400,200'}],
   joint:[], foramen:[], lig:[], nerves:[[176,197,6,4]],
   target:[171,197], needle:[[390,0],[178,193]],
   labels:[['Lemak subkutan',392,19,'end'],['M. multifidus / erector spinae',60,58,'start'],['Prosesus spinosus L5',40,104,'start',18,92],
           ['SAP S1',98,130,'end',120,138],['Ramus dorsalis L5',150,252,'end',172,203],['Ala sakrum',320,244,'middle']],
   model:{m:[306,70],a:[242,90],probe:[236,86,82,0]},
   info:{ target:'Alur (groove) antara prosesus artikularis superior S1 dan ala sakrum, tempat ramus dorsalis L5 menyilang.',
     indikasi:'Bagian dari blok/RF inervasi SIJ posterior (bersama cabang lateral S1–S3). Juga untuk nyeri faset L5–S1.',
     probe:'Convex transversal setinggi L5–S1. Identifikasi prosesus spinosus, lalu geser lateral: SAP S1 tampak sebagai "bukit" dan ala sakrum sebagai garis datar di lateralnya.',
     jarum:'22G 3,5", in-plane lateral ke medial sampai kontak tulang di dasar alur.',
     obat:'≤0,5 mL bupivakain 0,5% untuk blok diagnostik.',
     waspada:'Volume >0,5 mL menurunkan spesifisitas karena menyebar ke foramen L5 atau ventral. Hati-hati pada sakralisasi/transisi lumbosakral; konfirmasi level.',
     bukti:'Inervasi posterior SIJ berasal dari ramus dorsalis L5 dan cabang lateral S1–S3 (Roberts 2014), sehingga target ini selalu diikutkan pada protokol RF SIJ (Cohen 2008).' } }
];

const TYPE_NAME = {skin:'Kulit',fat:'Lemak subkutan',muscle:'Otot',fascia:'Fasia',S:'Sakrum / vertebra',I:'Ilium',joint:'Celah sendi (SIJ)',foramen:'Foramen sakral',lig:'Ligamen',nerve:'Saraf',needle:'Jarum',target:'Target'};
const TYPE_VAR = {skin:'--c-skin',fat:'--c-fat',muscle:'--c-muscle',fascia:'--c-fascia',S:'--c-sacrum',I:'--c-ilium',joint:'--c-joint',foramen:'--c-foramen',lig:'--c-lig',nerve:'--c-nerve',needle:'--c-needle',target:'--accent'};
function labels(s, mode){
  const col = mode==='us' ? '#f2e27d' : 'var(--ink)';
  const halo = mode==='us' ? '#000' : 'var(--surface)';
  let out = '';
  s.labels.forEach(([t,x,y,anc,ax,ay])=>{
    if(ax!=null){ const ex = anc==='end'? x+3 : anc==='start'? x-3 : x; out += `<line x1="${ax}" y1="${ay}" x2="${ex}" y2="${y-3}" stroke="${col}" stroke-width="1" opacity=".9"/><circle cx="${ax}" cy="${ay}" r="1.8" fill="${col}"/>`; }
    out += `<text x="${x}" y="${y}" text-anchor="${anc}" fill="${col}" stroke="${halo}" stroke-width="3" paint-order="stroke" font-family="var(--f-mono)" font-size="10">${t}</text>`;
  });
  return out;
}

function usSVG(s, i){
  const fov = s.probe==='linear'? LIN : FAN;
  const f = s.fatB;
  let g = `<rect width="400" height="300" fill="#3a3a3a"/><rect width="400" height="300" fill="url(#stri${i})"/>`;
  g += `<rect width="400" height="${f}" fill="#1b1b1b"/>`;
  g += `<path d="M0,${f*.45} C90,${f*.35} 200,${f*.6} 400,${f*.4}" stroke="#555" stroke-width="1" fill="none"/>`;
  g += `<rect width="400" height="5" fill="#cfcfcf"/>`;
  g += `<rect width="400" height="300" fill="#fff" filter="url(#speck${i})" opacity=".42"/>`;
  s.joint.forEach(d=> g += `<path d="${d}" fill="#0b0b0b"/>`);
  s.foramen.forEach(d=> g += `<path d="${d}" fill="#151515"/>`);
  s.bones.forEach(b=> g += `<path d="${b.d}" fill="#030303"/>`);
  s.lig.forEach(d=> g += `<path d="${d}" fill="#8f8f8f" opacity=".85"/><path d="${d}" fill="url(#stri${i})"/>`);
  s.nerves.forEach(([x,y,rx,ry])=> g += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#1e1e1e" stroke="#cfcfcf" stroke-width="1.4"/>`);
  s.fascia.forEach(d=> g += `<path d="${d}" stroke="#a8a8a8" stroke-width="1.6" fill="none"/>`);
  s.bones.forEach(b=> g += `<path d="${b.s}" stroke="#fbfbf3" stroke-width="3.6" fill="none" stroke-linejoin="round" filter="url(#glow${i})"/>`);
  const [[x1,y1],[x2,y2]] = s.needle;
  g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="2.2" stroke-linecap="round" filter="url(#glow${i})"/>`;
  g += `<circle cx="${s.target[0]}" cy="${s.target[1]}" r="10" fill="none" stroke="#f2e27d" stroke-width="1.4" stroke-dasharray="3 3"/>`;
  let ticks = '';
  for(let k=0;k<=s.depth;k++){ const y = k*262/s.depth; ticks += `<line x1="${k%2?392:388}" x2="398" y1="${y}" y2="${y}" stroke="#9a9a9a"/>` + (k%2===0 && k>0 ? `<text x="386" y="${y+3}" text-anchor="end" font-size="8" fill="#9a9a9a" font-family="var(--f-mono)">${k}</text>` : ''); }
  return `<svg viewBox="0 -22 400 322" role="img" aria-label="Ilustrasi USG ${s.name}">
    <defs>
      <clipPath id="fov${i}"><path d="${fov}"/></clipPath>
      <pattern id="stri${i}" width="400" height="9" patternUnits="userSpaceOnUse"><path d="M0,4 Q100,2 200,5 T400,4" stroke="#5c5c5c" stroke-width="1" fill="none"/></pattern>
      <filter id="speck${i}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 1.7" numOctaves="2" seed="${i*7+3}"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.5 0 0 0 -0.6"/></filter>
      <filter id="glow${i}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect x="0" y="-22" width="400" height="322" fill="#000"/>
    <text x="6" y="-8" font-family="var(--f-mono)" font-size="8.5" fill="#bdbdbd">SIJ·${s.id}  ${s.probe==='linear'?'Linear':'Convex'} ${s.freq}  D ${s.depth} cm</text>
    <text x="394" y="-8" text-anchor="end" font-family="var(--f-mono)" font-size="8.5" fill="#bdbdbd">${s.plane.split(' · ')[0]}</text>
    <g clip-path="url(#fov${i})">${g}</g>
    ${ticks}
    <text x="${s.probe==='linear'?36:150}" y="14" font-family="var(--f-mono)" font-size="8" fill="#7fd1ff" stroke="#000" stroke-width="2.5" paint-order="stroke">${s.orient[0]}</text>
    <text x="${s.probe==='linear'?364:250}" y="14" text-anchor="end" font-family="var(--f-mono)" font-size="8" fill="#7fd1ff" stroke="#000" stroke-width="2.5" paint-order="stroke">${s.orient[1]}</text>
    ${labels(s,'us')}
  </svg>`;
}

function anSVG(s){
  const v = k => `var(${TYPE_VAR[k]})`;
  const f = s.fatB;
  let g = `<rect width="400" height="300" fill="${v('muscle')}"/>`;
  for(let y=f+10;y<300;y+=12) g += `<path d="M0,${y} Q100,${y-3} 200,${y+1} T400,${y}" stroke="var(--c-muscle-line)" stroke-width="1" fill="none" opacity=".6"/>`;
  g += `<rect width="400" height="${f}" fill="${v('fat')}"/><rect width="400" height="6" fill="${v('skin')}"/>`;
  s.fascia.forEach(d=> g += `<path d="${d}" stroke="${v('fascia')}" stroke-width="2" fill="none"/>`);
  s.bones.forEach(b=>{ const edge = b.k==='I' ? 'var(--c-ilium-edge)' : 'var(--c-sacrum-edge)'; g += `<path d="${b.d}" fill="${v(b.k)}"/><path d="${b.s}" stroke="${edge}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`; });
  s.joint.forEach(d=> g += `<path d="${d}" fill="${v('joint')}"/>`);
  s.foramen.forEach(d=> g += `<path d="${d}" fill="${v('foramen')}"/>`);
  s.lig.forEach(d=> g += `<path d="${d}" fill="${v('lig')}" stroke="rgba(0,0,0,.25)" stroke-width=".8"/>`);
  s.nerves.forEach(([x,y,rx,ry])=> g += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${v('nerve')}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>`);
  const [[x1,y1],[x2,y2]] = s.needle;
  const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy), hx=x1-dx/L*26, hy=y1-dy/L*26;
  const probe = s.probe==='linear'
    ? `<rect x="110" y="-24" width="180" height="18" rx="3" fill="var(--ink)"/><text x="200" y="-12" text-anchor="middle" font-family="var(--f-mono)" font-size="8.5" fill="var(--surface)">PROBE LINEAR ${s.freq}</text>`
    : `<path d="M140,-26 H260 V-12 Q200,2 140,-12 Z" fill="var(--ink)"/><text x="200" y="-15" text-anchor="middle" font-family="var(--f-mono)" font-size="8.5" fill="var(--surface)">PROBE CONVEX ${s.freq}</text>`;
  return `<svg viewBox="0 -34 400 334" role="img" aria-label="Diagram anatomi ${s.name}">
    <rect x="0" y="-34" width="400" height="334" fill="var(--surface)"/>
    ${g}
    <circle cx="${s.target[0]}" cy="${s.target[1]}" r="10" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 2.5"/>
    <line x1="${hx}" y1="${hy}" x2="${x2}" y2="${y2}" stroke="${v('needle')}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="${hx}" cy="${hy}" r="3.5" fill="${v('needle')}"/>
    ${probe}
    <text x="4" y="-4" font-family="var(--f-mono)" font-size="8" fill="var(--muted)">${s.orient[0]}</text>
    <text x="396" y="-4" text-anchor="end" font-family="var(--f-mono)" font-size="8" fill="var(--muted)">${s.orient[1]}</text>
    ${labels(s,'an')}
  </svg>`;
}

function legendFor(s){
  const ks = ['skin','fat','muscle'];
  if(s.fascia.length) ks.push('fascia');
  [...new Set(s.bones.map(b=>b.k))].forEach(k=>ks.push(k));
  if(s.joint.length) ks.push('joint');
  if(s.foramen.length) ks.push('foramen');
  if(s.lig.length) ks.push('lig');
  if(s.nerves.length) ks.push('nerve');
  ks.push('needle','target');
  return ks.map(k=>`<span><i style="background:var(${TYPE_VAR[k]})${k==='target'?';background:transparent;border:2px dashed var(--accent)':''}"></i>${TYPE_NAME[k]}</span>`).join('');
}

