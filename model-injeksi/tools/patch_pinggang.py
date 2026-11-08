"""Patch the legacy lumbar-map module so it runs inside the shared shell + adds the Detail anatomy layer."""
import sys, pathlib
src, out = sys.argv[1:]
s = pathlib.Path(src).read_text()
R = [
 ("import { OrbitControls } from 'three/addons/controls/OrbitControls.js';",
  "import { OrbitControls } from 'three/addons/controls/OrbitControls.js';\nimport { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\nimport { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';"),
 ("const S={mode:'dx',", "const S={detail:false,mode:'dx',"),
 ("catch(e){ const er=document.getElementById('err'); er.style.display='flex'; er.textContent='WebGL tidak tersedia di perangkat/browser ini.'; throw e; }",
  "catch(e){ const er=document.getElementById('err'); er.hidden=false; er.textContent='WebGL tidak tersedia di perangkat/browser ini.'; throw e; }"),
 ("tween={t0:performance.now(),dur:700,fp:camera.position.clone(),ft:controls.target.clone(),tp:p,tt:c.t.clone()};document.querySelectorAll('#views .vb').forEach(b=>b.classList.remove('on'));}",
  "tween={t0:performance.now(),dur:700,fp:camera.position.clone(),ft:controls.target.clone(),tp:p,tt:c.t.clone()};document.querySelectorAll('#views button').forEach(b=>b.classList.remove('on'));}"),
 ("<button class=\"vb\" data-viewprobe=\"1\" style=\"margin-left:auto\">", "<button class=\"mi-chip\" data-viewprobe=\"1\" style=\"margin-left:auto\">"),
 ("<button class=\"vb ${S.sonoLab?'on':''}\" data-sonolab=\"1\">", "<button class=\"mi-chip ${S.sonoLab?'on':''}\" data-sonolab=\"1\">"),
 ("<span class=\"tag\" style=\"border-color:${vr[1]};color:${vr[1]}\">${vr[0]}</span>", "<span class=\"vb ${pr.ver}\">${vr[0]}</span>"),
 ("document.querySelectorAll('#views .vb').forEach(b=>b.classList.toggle('on',b.dataset.v===v));}", "document.querySelectorAll('#views button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));}"),
 ("document.getElementById('views').addEventListener('click',e=>{const b=e.target.closest('.vb');if(b)view(b.dataset.v);});",
  "document.getElementById('views').addEventListener('click',e=>{const b=e.target.closest('button');if(b)view(b.dataset.v);});"),
 ("function setAnat(on){S.anat=on;btnAnat.classList.toggle('on',on);opWrap.style.display=on?'block':'none';anat.visible=on;",
  "function setAnat(on){S.anat=on;btnAnat.classList.toggle('on',on);opWrap.style.display=on?'inline-flex':'none';syncAnat();"),
 ("window.addEventListener('resize',resize);", "new ResizeObserver(resize).observe(stage);"),
 ("    document.getElementById('panel').scrollTop=0;}", "    const pn=document.getElementById('panel'); if(innerWidth>=900) pn.scrollTop=0; else MI.toStage();}"),
 ("const ray=new THREE.Raycaster();\nscene.updateMatrixWorld(true);", "const ray=new THREE.Raycaster();\nscene.updateMatrixWorld(true);\n/*@DETAIL@*/"),
 ("resize();apply();view('P');requestAnimationFrame(loop);", "resize();apply();view('P');requestAnimationFrame(loop);\ninitDetail();"),

 # --- body reshaped so BodyParts3D/Z-Anatomy detail anatomy sits inside the skin (fitted by tools/body_autofit.py)
 ("""const TS=[
 {y:7.45,hw:.85,df:.5,db:.55,c:.08},{y:7.8,hw:1.42,df:.74,db:.9,c:.22},{y:8.2,hw:1.74,df:.92,db:1.2,c:.34},{y:8.85,hw:1.86,df:1.0,db:1.34,c:.32},
 {y:9.45,hw:1.8,df:1.05,db:1.22,c:.2},{y:10.0,hw:1.66,df:1.05,db:1.0,c:.07},{y:10.6,hw:1.46,df:1.0,db:.86,c:.06},
 {y:11.3,hw:1.5,df:1.02,db:.9,c:.06},{y:12.2,hw:1.62,df:1.12,db:1.0,c:.05},{y:13.2,hw:1.76,df:1.2,db:1.05,c:.05},""",
  """const TS=[
 {y:7.05,hw:.75,df:.4,db:.75,c:.05},{y:7.45,hw:1.226,df:.5,db:1.358,c:.08},{y:7.8,hw:1.562,df:.74,db:1.464,c:.22},{y:8.2,hw:2.312,df:1.018,db:1.664,c:.34},{y:8.85,hw:2.434,df:1.104,db:1.603,c:.32},
 {y:9.45,hw:2.434,df:1.403,db:1.323,c:.2},{y:10.0,hw:2.153,df:1.242,db:1.011,c:.07},{y:10.6,hw:1.66,df:1.013,db:.86,c:.06},
 {y:11.3,hw:1.5,df:1.02,db:.9,c:.06},{y:12.2,hw:1.631,df:1.12,db:1.008,c:.05},{y:13.2,hw:1.848,df:1.2,db:1.115,c:.05},"""),
 ("""const LS=[{y:9.1,cx:.92,rx:.9,rf:.85,rb:.9},{y:8.2,cx:.92,rx:.9,rf:.9,rb:.95},{y:7.2,cx:.88,rx:.8,rf:.82,rb:.82},{y:6.1,cx:.8,rx:.66,rf:.7,rb:.66},
 {y:5.1,cx:.74,rx:.53,rf:.56,rb:.52},{y:4.5,cx:.72,rx:.5,rf:.5,rb:.58},""",
  """const LS=[{y:9.1,cx:1.15,rx:1.0,rf:.85,rb:.9},{y:8.2,cx:1.25,rx:1.062,rf:.9,rb:1.608},{y:7.2,cx:1.3,rx:.973,rf:.82,rb:1.315},{y:6.1,cx:1.25,rx:.68,rf:.7,rb:.7},
 {y:5.1,cx:1.05,rx:.55,rf:.56,rb:.52},{y:4.5,cx:.85,rx:.5,rf:.5,rb:.58},"""),
 ("Model tubuh skematik (1 unit ≈ 10 cm), bukan anatomi presisi.", "Model tubuh skematik, bukan anatomi presisi. Proporsi pinggul, bokong, dan paha disesuaikan (Nov 2026) supaya tulang dan otot BodyParts3D di mode Detail berada di dalam kulit."),
 ("function procsFor(dx,v){const m=PMAP[dx]||{};return m[v]||m._||[];}", "function procsFor(dx,v){const m=PMAP[dx]||{};return m[v]||m._||[];}\n['gt','gmed','gmin','piri','sgn','hip'].forEach(id=>PROC[id].p3.tgt.forEach(t=>{t[0]*=WIDEN;}));"),
]
for a, b in R:
    n = s.count(a)
    if n != 1: sys.exit(f'pattern count {n}: {a[:70]}')
    s = s.replace(a, b)
DETAIL = r'''
/* ---------- DETAIL ANATOMY: BodyParts3D bones/muscles + Z-Anatomy nerves (replaces schematic parts) ---------- */
const anatD=new THREE.Group();scene.add(anatD);anatD.visible=false;
// schematic pelvic/hip parts widened to match the reshaped (wider) body
const WIDEN=1.2, WKEYS=/^(ilium|crest|ischium|pubis|hipj|femneck|gt|femur|gmed|gmin|piri|sgn|sciatic)$/;
REG.forEach(r=>{ if(WKEYS.test(r.key)){ r.mesh.position.x*=WIDEN; r.mesh.scale.x*=WIDEN; } });
const DREPL=/^(vb|sp|lam|ped|tp|disc):|^(sacrum|coccyx|ilium|crest|ischium|pubis|hipj|femneck|femur|piri|ql|psoas|erector|gmed|gmin|sciatic|sgn)$/;
REG.forEach(r=>{ r.keep = r.key==='gt' && r.mesh.material.color.getHex()===0xa78bfa; });
const DCOL={bone:0xe9e2cf,disc:0x7fb3d5,mus:0xb5524e,nerve:0xf6d743};
const DALIAS={hip:['ilium','crest','ischium','pubis'],femur:['femur','gt','hipj'],multifidus:['erector'],iliacus:['psoas']};
const DNAME={vb:'Vertebra',disc:'Diskus',sacrum:'Sakrum',hip:'Os coxae',femur:'Femur proksimal',psoas:'M. psoas mayor',ql:'M. quadratus lumborum',iliacus:'M. iliacus',erector:'M. erector spinae (iliokostalis, longissimus)',multifidus:'M. multifidus',piri:'M. piriformis',gmax:'M. gluteus maximus',gmed:'M. gluteus medius',gmin:'M. gluteus minimus',sciatic:'N. iskiadikus',sgn:'N. gluteus superior'};
let detailLoaded=false;
async function loadDetail(){ if(detailLoaded) return;
  const s=atob(document.getElementById('glb_detail').textContent.trim()); const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);
  const l=new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
  const gltf=await new Promise((res,rej)=>l.parse(u.buffer,'',res,rej));
  gltf.scene.updateMatrixWorld(true); const ms=[]; gltf.scene.traverse(o=>{if(o.isMesh)ms.push(o);});
  for(const o of ms){ let nm=o.name||''; if(!nm||/^mesh_\d+$/.test(nm)) nm=(o.parent&&o.parent.name)||nm;
    const [key,side]=nm.split('|'); const base=key.split(':')[0];
    const cat=(base==='vb'||base==='sacrum'||base==='hip'||base==='femur')?'bone':base==='disc'?'disc':(base==='sciatic'||base==='sgn')?'nerve':'mus';
    o.material=mk(DCOL[cat], base==='gmax'?.3:cat==='mus'?.82:1, cat==='mus'); o.geometry.computeVertexNormals(); o.renderOrder=1; o.userData.dkey=key;
    if(o.material.transparent) o.material.depthWrite=false;
    anatD.attach(o);
    (DALIAS[base]||[key]).forEach(k=>REG.push({key:k,side:side||'C',mesh:o,base:o.material.emissive.clone(),detail:true}));
  }
  detailLoaded=true; }
function syncAnat(){ anat.visible=S.anat; anatD.visible=S.anat&&S.detail;
  REG.forEach(r=>{ if(!r.detail && !r.path) r.mesh.visible=!(S.detail && DREPL.test(r.key) && !r.keep); });
  if(typeof applyPathology==='function') applyPathology(); }
const SUBT={simple:'Versi sederhana: spine lumbosakral interaktif. Chip Spine = fokus vertebra; Putar = auto-rotate; ketuk tulang = pilih level. HNP, facet arthropathy, dan stenosis punya morfologi 3D. Pola nyeri di kulit.',
  detail:'Versi detail: mesh BodyParts3D + saraf Z-Anatomy. Overlay morfologi HNP / facet OA / stenosis tetap skematik di atas tulang. Gunakan mode Spine untuk melihat patologi lebih jelas.'};
async function setDetail(on){
  S.detail=on; MI.press(document.querySelectorAll('#mode button'),b=>(b.dataset.m==='detail')===on);
  document.getElementById('sub').textContent=SUBT[on?'detail':'simple']; document.getElementById('about').textContent=SUBT[on?'detail':'simple'];
  if(on){ const ld=document.getElementById('loading'); ld.hidden=false; await new Promise(r=>setTimeout(r,30));
    try{ await loadDetail(); }catch(e){ console.error(e); const er=document.getElementById('err'); er.textContent='Mesh detail gagal dimuat.'; er.hidden=false; }
    ld.hidden=true; if(!S.anat) setAnat(true); }
  syncAnat(); setFocus(); }
function initDetail(){ document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>setDetail(b.dataset.m==='detail'));
  const H=(location.hash||'').toLowerCase(); setDetail(H.includes('detail')); }
'''
s = s.replace('/*@DETAIL@*/', DETAIL)
pathlib.Path(out).write_text(s)
print('patched', len(s))
