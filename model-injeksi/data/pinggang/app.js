import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/* ============================== DATA ============================== */
// Zone helpers. v = proyeksi: P posterior, A anterior, L lateral (a = koordinat z), T top/dorsum kaki (y-field = z)
// a = jarak lateral dari midline (sisi kanan), y = tinggi (1 unit ≈ 10 cm). k: p=nyeri primer, r=nyeri rujukan, n=neuropatik/radikular
const E=(v,a,y,rx,ry,i,k)=>({v,a1:a,y1:y,rx,ry,i,k});
const C=(v,a1,y1,a2,y2,rx,i,k)=>({v,a1,y1,a2,y2,rx,ry:rx,i,k});
const M=(v,a,y,label)=>({v,a,y,label});

const REFS={
  fukui:{t:'Fukui S et al. Distribution of referred pain from the lumbar zygapophyseal joints and dorsal rami. Clin J Pain 1997;13:303-7',u:'https://doi.org/10.1097/00002508-199712000-00007'},
  mccall:{t:'McCall IW et al. Induced pain referral from posterior lumbar elements in normal subjects. Spine 1979;4:441-6',u:'https://doi.org/10.1097/00007632-197909000-00009'},
  slipman:{t:'Slipman CW et al. Sacroiliac joint pain referral zones. Arch Phys Med Rehabil 2000;81:334-8',u:'https://doi.org/10.1016/s0003-9993(00)90080-7'},
  fortin:{t:'Fortin JD et al. Sacroiliac joint: pain referral maps… Part I. Spine 1994;19:1475-82',u:'https://pubmed.ncbi.nlm.nih.gov/7939978/'},
  laslett:{t:'Laslett M et al. Diagnosis of SIJ pain: validity of individual provocation tests and composites. Man Ther 2005;10:207-18',u:'https://doi.org/10.1016/j.math.2005.01.003'},
  hopayian:{t:'Hopayian K et al. The clinical features of the piriformis syndrome: a systematic review. Eur Spine J 2010;19:2095-109',u:'https://doi.org/10.1007/s00586-010-1504-9'},
  kuniya:{t:'Kuniya H et al. Prospective study of superior cluneal nerve disorder… J Orthop Surg Res 2014;9:139',u:'https://doi.org/10.1186/s13018-014-0139-7'},
  rask:{t:'Rask MR. Superior gluteal nerve entrapment syndrome. Muscle Nerve 1980;3:304-7',u:'https://doi.org/10.1002/mus.880030406'},
  diop:{t:'Diop M et al. Anatomical bases of SGN entrapment syndrome in the suprapiriformis foramen. Surg Radiol Anat 2002;24:155-9',u:'https://doi.org/10.1007/s00276-002-0048-z'},
  maigne:{t:'Maigne R. Low back pain of thoracolumbar origin. Arch Phys Med Rehabil 1980;61:389-95',u:'https://pubmed.ncbi.nlm.nih.gov/6448030/'},
  shokanov:{t:'Shokanov T et al. Transverse Process Cluneal Approach (TPCA)… Int Med Case Rep J 2026;19 (laporan kasus)',u:'https://doi.org/10.2147/IMCRJ.S590996'},
  katz:{t:'Katz JN et al. Degenerative lumbar spinal stenosis: diagnostic value of history and physical examination. Arthritis Rheum 1995;38:1236-41',u:'https://doi.org/10.1002/art.1780380910'},
  draghici:{t:'Drăghici NC et al. Rare entrapment neuropathies of the lower extremity: a narrative review. Medicine 2024;103:e39486',u:'https://doi.org/10.1097/MD.0000000000039486'},
  travell:{t:'Simons DG, Travell JG, Simons LS. Myofascial Pain and Dysfunction: The Trigger Point Manual, Vol. 2 (buku)',u:''},
};

const U='<span class="pill usg">USG</span>', F='<span class="pill flu">Fluoro</span>', LIM='<span class="pill lim">evidens terbatas</span>';

const DX=[
{ id:'facet', grp:'Spinal', name:'Lumbar facet joint pain', side:'uni',
  loc:'Paraspinal ± bokong/paha; jarang di bawah lutut',
  gen:'Sendi zigapofisial (faset) lumbal. Inervasi ganda dari medial branch ramus dorsalis level yang sama dan level di atasnya (mis. faset L4–L5 ← MB L3 & L4; L5–S1 ← MB L4 & ramus dorsal L5).',
  pat:'Nyeri paraspinal (uni/bilateral) dengan rujukan ke bokong ± paha posterior/lateral, kadang groin. Level atas cenderung ke flank/bokong atas, level bawah ke bokong/paha. Overlap antar level besar — pola tidak cukup untuk menentukan level secara pasti.',
  feat:['Nyeri aksial > nyeri tungkai','Memberat saat ekstensi/rotasi, berdiri lama; kaku pagi','Nyeri tekan paraspinal di atas faset','Tanpa defisit neurologis'],
  tests:['Extension–rotation (facet loading) hanya pendukung; tidak ada tes klinis tunggal yang andal','Diagnosis ditegakkan dengan respons blok'],
  conf:'Medial branch block (MBB), idealnya dual comparative block sebelum RFA; ambang relief mengikuti guideline yang dipakai.',
  intv:['MBB / injeksi intra-artikular faset '+U+' (L1–L4 cukup feasible); level L5 & pasien obes '+F+' lebih andal','RF neurotomi medial branch '+F,'Proloterapi dekstrosa kapsul faset '+LIM],
  refs:['fukui','mccall'],
  vars:[
   {id:'L1',label:'L1–L2',focus:['facet:L1'],z:[E('P',.45,11.6,.42,.4,1,'p'),E('P',1.3,11.15,.45,.55,.7,'r'),E('L',-.3,11.0,.5,.5,.5,'r'),E('P',1.0,10.15,.5,.35,.45,'r')]},
   {id:'L2',label:'L2–L3',focus:['facet:L2'],z:[E('P',.45,11.15,.42,.4,1,'p'),E('P',1.25,10.8,.45,.5,.65,'r'),E('P',1.0,9.85,.55,.4,.6,'r'),E('L',-.2,9.0,.4,.45,.35,'r')]},
   {id:'L3',label:'L3–L4',focus:['facet:L3'],z:[E('P',.45,10.7,.42,.4,1,'p'),E('P',1.0,9.5,.6,.45,.75,'r'),E('L',-.1,8.6,.4,.5,.45,'r'),C('L',0,8.2,0,6.8,.35,.35,'r'),E('A',.9,8.55,.35,.3,.3,'r')]},
   {id:'L4',label:'L4–L5',focus:['facet:L4'],z:[E('P',.45,10.25,.42,.4,1,'p'),E('P',.95,9.2,.65,.5,.85,'r'),C('P',.9,8.1,.88,6.6,.4,.5,'r'),C('L',-.1,8.0,-.05,6.6,.3,.3,'r'),E('A',.9,8.55,.35,.3,.28,'r')]},
   {id:'L5',label:'L5–S1',focus:['facet:L5'],z:[E('P',.42,9.95,.42,.4,1,'p'),E('P',.9,9.0,.65,.55,.9,'r'),C('P',.9,8.0,.85,6.0,.4,.6,'r'),C('P',.8,5.0,.75,4.2,.35,.2,'r'),E('A',.9,8.55,.35,.3,.25,'r')]},
  ], def:'L4'},

{ id:'disc', grp:'Spinal', name:'Nyeri diskogenik', side:'bi',
  loc:'Midline lumbal bawah ± bokong bilateral',
  gen:'Annulus fibrosus (internal disc disruption) — inervasi n. sinuvertebralis dan cabang ramus ventral/rami communicantes. Vertebrogenic pain (endplate, Modic 1/2) adalah entitas terkait namun berbeda.',
  pat:'Nyeri aksial midline lumbal bawah, dapat menjalar ke bokong/paha bilateral; umumnya tidak dermatomal dan jarang di bawah lutut.',
  feat:['Midline, "dalam"','Memberat saat duduk lama, fleksi, batuk/mengejan','Tanpa defisit neurologis (beda dengan radikulopati)'],
  tests:['Tidak ada tes klinis spesifik; fenomena sentralisasi (McKenzie) dapat menyokong','MRI: HIZ / disc degeneration / Modic — tidak spesifik, perlu korelasi'],
  conf:'Provocation discography (invasif, kontroversial) — jarang diperlukan di praktik rutin.',
  intv:['Rehabilitasi aktif & edukasi sebagai lini pertama','Vertebrogenic (Modic 1/2): basivertebral nerve ablation — seleksi ketat, ketersediaan terbatas','Terapi intradiskal biologik — masih eksperimental '+LIM],
  refs:[],
  vars:[
   {id:'L4',label:'L4–L5',focus:['disc:L4'],z:[E('P',0,10.3,.75,.55,1,'p'),E('P',.9,9.2,.6,.5,.55,'r'),C('P',.9,8.0,.88,6.8,.38,.35,'r')]},
   {id:'L5',label:'L5–S1',focus:['disc:L5'],z:[E('P',0,9.95,.75,.55,1,'p'),E('P',.9,9.1,.6,.5,.6,'r'),C('P',.9,8.0,.88,6.6,.38,.38,'r')]},
  ], def:'L5'},

{ id:'radic', grp:'Spinal', name:'Radikulopati lumbosakral', side:'uni',
  loc:'Dermatomal ke tungkai (nyeri tungkai > pinggang)',
  gen:'Radiks saraf (herniasi diskus, stenosis foraminal/lateral recess) — inflamasi kimiawi + kompresi mekanik.',
  pat:'Nyeri menjalar sesuai dermatom, sering disertai parestesia; nyeri tungkai lebih dominan dibanding pinggang.',
  feat:['Nyeri tungkai > nyeri pinggang','SLR / crossed SLR (L5, S1); femoral stretch (L3, L4)','Defisit dermatomal, miotomal, dan refleks sesuai radiks'],
  tests:['Neurologis lengkap: sensorik, motorik, refleks','EMG/KHS: abnormalitas paraspinal + miotom satu radiks mendukung radikulopati dan menyingkirkan entrapment perifer (n. peroneus, SGN, dsb.)'],
  conf:'MRI lumbal dengan korelasi klinis; selective nerve root block diagnostik bila multilevel/meragukan.',
  intv:['Transforaminal ESI '+F,'Caudal ESI '+U+' (terutama L5/S1)','Pulsed RF DRG '+F],
  refs:[],
  vars:[
   {id:'L4',label:'L4',focus:['root:L4'],note:'Dermatom L4: paha anterolateral → lutut → sisi medial tungkai bawah s/d maleolus medial. Motor: ekstensi lutut, dorsofleksi (tibialis anterior). Refleks patela ↓.',
    z:[E('P',.5,10.3,.4,.4,.4,'p'),E('P',.95,9.2,.55,.45,.35,'r'),C('A',1.05,8.2,.85,5.6,.35,.9,'n'),C('A',.62,5.2,.5,4.5,.3,.85,'n'),C('A',.45,4.4,.48,1.1,.22,.9,'n'),E('A',.45,.85,.2,.22,.75,'n')]},
   {id:'L5',label:'L5',focus:['root:L5'],note:'Dermatom L5: bokong → paha posterolateral → tungkai lateral → dorsum kaki & ibu jari. Motor: ekstensi ibu jari (EHL), dorsofleksi, eversi/inversi, abduksi panggul. Refleks standar biasanya normal.',
    z:[E('P',.5,10.0,.4,.4,.4,'p'),E('P',1.05,9.1,.55,.45,.55,'n'),C('L',-.3,8.2,-.2,5.3,.3,.9,'n'),C('A',1.0,4.6,.85,1.2,.25,.95,'n'),C('T',.68,.7,.6,1.75,.28,.95,'n'),E('T',.45,1.9,.18,.25,.9,'n')]},
   {id:'S1',label:'S1',focus:['root:S1'],note:'Dermatom S1: bokong → paha posterior → betis → tumit, sisi lateral dan plantar kaki. Motor: plantarfleksi, eversi. Refleks Achilles ↓.',
    z:[E('P',.5,9.9,.4,.4,.4,'p'),E('P',.95,9.0,.55,.45,.55,'n'),C('P',.85,8.0,.8,5.3,.35,.9,'n'),C('P',.72,4.6,.68,1.2,.3,.95,'n'),E('P',.66,.35,.3,.3,.9,'n'),C('L',-.2,.3,1.5,.3,.25,.9,'n')]},
  ], def:'L5'},

{ id:'stenosis', grp:'Spinal', name:'Lumbar spinal stenosis', side:'bi',
  loc:'Bokong–paha–tungkai bilateral saat berdiri/berjalan',
  gen:'Penyempitan kanal sentral / lateral recess (hipertrofi ligamentum flavum, faset, protrusi diskus) → kompresi & iskemia cauda equina.',
  pat:'Klaudikasio neurogenik: nyeri, rasa berat, kesemutan bokong–paha–tungkai (sering bilateral, difus, tidak selalu dermatomal) saat berdiri/berjalan; membaik dengan duduk atau fleksi ("shopping-cart sign").',
  feat:['Usia lanjut','Tidak nyeri saat duduk','Wide-based gait, Romberg abnormal','Nyeri paha setelah ekstensi lumbal 30 detik'],
  tests:['Prediktor anamnesis/pemeriksaan fisik pada Katz 1995 (di atas)','Singkirkan klaudikasio vaskular: nadi perifer, ABI'],
  conf:'MRI lumbal dengan korelasi klinis.',
  intv:['Interlaminar ESI '+F+' atau caudal ESI '+U,'Program rehabilitasi berbasis fleksi','Rujuk bedah bila defisit progresif atau tanda cauda equina'],
  refs:['katz'],
  vars:[{id:'L4',label:'L4–L5',focus:['canal'],z:[E('P',0,10.3,.7,.5,.55,'p'),E('P',.9,9.1,.6,.5,.65,'n'),C('P',.9,8.0,.85,5.4,.4,.6,'n'),C('L',-.1,8.0,-.05,5.4,.3,.45,'n'),C('P',.72,4.6,.68,1.4,.3,.5,'n'),C('A',.9,4.6,.8,1.4,.25,.35,'n')]}], def:'L4'},

{ id:'maigne', grp:'Spinal', name:'Sindrom Maigne (thoracolumbar junction)', side:'uni',
  loc:'Krista iliaka & bokong atas; ± trokanter, groin',
  gen:'Disfungsi segmen torakolumbal (T11–L1). Ramus dorsal → cabang kutaneus ke krista iliaka/bokong (n. cluneal superior); ramus ventral → iliohipogastrik/ilioinguinal/subkostal (groin, perut bawah); cabang perforans lateral → trokanter.',
  pat:'Pasien merasakan nyeri di pinggang bawah/krista iliaka posterior dan bokong atas — bukan di T–L junction tempat sumbernya. Dapat disertai nyeri lateral pinggul dan groin.',
  feat:['Iliac-crest point test positif','Skin-rolling test positif di area rujukan','Nyeri tekan spinosus di T–L junction','Nyeri tekan sendi apofiseal segmen yang terlibat'],
  tests:['Tanda klinis klasik di atas (Maigne 1980)','Bedakan dari SCN entrapment lokal di krista (keduanya melibatkan teritori n. cluneal superior)'],
  conf:'Blok anestesi lokal periapofiseal pada segmen T–L yang terlibat.',
  intv:['Blok faset / medial branch T11–L1 '+F,'Pendekatan proksimal SCN di prosesus transversus L1–L3 (diagnostik → RF) — baru laporan kasus '+LIM,'Manipulasi & latihan'],
  refs:['maigne','shokanov'],
  vars:[{id:'TL',label:'T12–L1',focus:['facet:T12','scn'],mk:[M('P',.7,10.02,'Iliac crest point'),M('P',0,12.35,'T12–L1')],
    z:[E('P',.35,12.4,.35,.35,.45,'p'),E('P',.85,10.1,.55,.4,1,'r'),E('P',1.05,9.45,.5,.35,.6,'r'),E('L',-.1,8.9,.4,.45,.55,'r'),E('A',1.0,9.3,.45,.35,.5,'r')]}], def:'TL'},

{ id:'sij', grp:'Sendi & Pelvis', name:'Sacroiliac joint pain', side:'uni',
  loc:'Di bawah PSIS, bokong; ± lumbal bawah, paha',
  gen:'Sendi sakroiliaka (intra-artikular) dan ligamen posterior (ekstra-artikular). Inervasi posterior terutama lateral branch S1–S3 (± ramus dorsal L5).',
  pat:'Area utama ≈ 10 cm kaudal × 3 cm lateral dari PSIS (Fortin 1994). Pada 50 pasien dengan blok positif: bokong 94%, lumbal bawah 72%, ekstremitas bawah 50%, di bawah lutut 28%, groin 14%, kaki 14% (Slipman 2000). Intensitas warna di peta mengikuti frekuensi ini.',
  feat:['Pasien sering menunjuk area tepat di bawah PSIS','Nyeri saat duduk pada sisi yang sakit, transisi duduk–berdiri','Nyeri umumnya tidak dominan di atas level L5'],
  tests:['Cluster Laslett: distraction, thigh thrust, compression, sacral thrust, Gaenslen kanan & kiri','≥3 dari 6 positif: sensitivitas 94%, spesifisitas 78%; bila keenamnya negatif → SIJ dapat disingkirkan (Laslett 2005)'],
  conf:'Blok intra-artikular anestesi lokal (standar: fluoroskopi dengan kontras).',
  intv:['Injeksi IA SIJ '+U+' — feasible, namun akurasi intra-artikular lebih rendah dibanding '+F,'Lateral branch RFA (S1–S3 ± L5) '+F,'Proloterapi dekstrosa ligamen SIJ posterior '+LIM],
  refs:['fortin','slipman','laslett'],
  vars:[{id:'SIJ',label:'SIJ',focus:['sij'],mk:[M('P',.45,9.75,'PSIS')],
    z:[E('P',.58,9.25,.28,.55,1,'p'),E('P',1.0,9.0,.6,.45,.95,'r'),E('P',.55,10.1,.5,.3,.78,'r'),C('P',.9,8.0,.85,6.3,.38,.6,'r'),C('P',.75,4.8,.7,2.6,.3,.42,'r'),E('A',.9,8.55,.35,.3,.31,'r'),E('P',.66,.4,.3,.35,.31,'r')]}], def:'SIJ'},

{ id:'piri', grp:'Entrapment saraf perifer', name:'Piriformis syndrome', side:'uni',
  loc:'Bokong (sciatic notch) ± paha posterior',
  gen:'Otot piriformis mengiritasi/menekan n. iskiadikus di sekitar foramen infrapiriformis (termasuk varian nervus menembus otot).',
  pat:'Nyeri bokong di atas piriformis/greater sciatic notch, dapat menjalar ke paha posterior seperti sciatica; parestesia di bawah lutut bisa terjadi.',
  feat:['Nyeri bokong','Nyeri tekan eksternal di atas greater sciatic notch','Memberat saat duduk','Memberat dengan manuver yang menegangkan piriformis (FAIR, Freiberg, Pace, Beatty)'],
  tests:['Empat temuan di atas paling sering dilaporkan (Hopayian 2010)','Diagnosis eksklusi: singkirkan radikulopati (MRI, EMG/KHS)'],
  conf:'Blok piriformis diagnostik dengan panduan imaging.',
  intv:['Injeksi piriformis '+U+' (anestesi lokal ± steroid)','BoNT-A intramuskular (off-label)','Hidrodiseksi perineural n. iskiadikus (D5W) '+U+' '+LIM,'Peregangan & rehabilitasi'],
  refs:['hopayian'],
  vars:[{id:'PS',label:'Piriformis',focus:['piri','sciatic'],mk:[M('P',.82,9.05,'Greater sciatic notch')],
    z:[E('P',1.05,8.95,.6,.32,1,'p'),E('P',1.45,8.8,.3,.3,.6,'r'),C('P',.9,8.0,.88,5.6,.35,.7,'n'),C('P',.75,4.6,.72,2.6,.3,.3,'n')]}], def:'PS'},

{ id:'sgn', grp:'Entrapment saraf perifer', name:'Superior gluteal nerve entrapment', side:'uni',
  loc:'Bokong superolateral ± lateral pinggul',
  gen:'N. gluteus superior (L4–S1) keluar melalui foramen suprapiriformis, di antara tepi atas piriformis dan greater sciatic notch; hipertrofi piriformis dapat mempersempit foramen (Diop 2002).',
  pat:'Nyeri bokong superolateral tipe aching/klaudikasio, dapat ke lateral pinggul.',
  feat:['Nyeri bokong tipe klaudikasio','Kelemahan abduksi panggul → gait Trendelenburg/waddling','Nyeri tekan superolateral dari greater sciatic notch'],
  tests:['Temuan klinis di atas (Rask 1980)','EMG gluteus medius/minimus/TFL abnormal dengan paraspinal & miotom L5 lain normal → mendukung lesi perifer, bukan radikulopati L5'],
  conf:'Blok anestesi lokal di titik entrapment dapat menghilangkan nyeri.',
  intv:['Blok SGN '+U+' (bidang antara gluteus medius & minimus / suprapiriform)','Hidrodiseksi D5W '+LIM,'Neurolisis bedah pada kasus refrakter'],
  refs:['rask','diop','draghici'],
  vars:[{id:'SGN',label:'SGN',focus:['sgn','piri'],mk:[M('P',1.0,9.35,'Titik SGN')],
    z:[E('P',1.15,9.45,.5,.32,1,'p'),E('L',-.3,9.0,.45,.45,.6,'r'),C('L',-.1,8.4,0,7.2,.3,.3,'r')]}], def:'SGN'},

{ id:'scn', grp:'Entrapment saraf perifer', name:'Superior cluneal nerve entrapment', side:'uni',
  loc:'Krista iliaka posterior ±7 cm dari midline → bokong',
  gen:'N. cluneal superior (cabang kutaneus ramus dorsal lumbal atas) terjepit pada terowongan osteofibrosa saat melintasi krista iliaka posterior.',
  pat:'Nyeri pinggang bawah–bokong atas; sekitar setengah pasien juga mengeluh gejala tungkai.',
  feat:['Titik nyeri tekan maksimal di krista iliaka posterior ±70 mm dari midline yang mereproduksi keluhan utama','Pada 834 pasien LBP/gejala tungkai, 14% memenuhi kriteria; 49% di antaranya punya gejala tungkai (Kuniya 2014)'],
  tests:['Palpasi titik 70 mm (kriteria Kuniya)','Sering salah dianggap radikulopati atau SIJ'],
  conf:'Blok SCN di titik nyeri tekan.',
  intv:['Blok / hidrodiseksi SCN '+U+' di krista iliaka','RF / cryoneurolysis '+LIM,'Release bedah pada kasus refrakter'],
  refs:['kuniya','draghici'],
  vars:[{id:'SCN',label:'SCN',focus:['scn'],mk:[M('P',.7,10.0,'±70 mm')],
    z:[E('P',.7,10.0,.25,.22,1,'p'),E('P',1.0,9.35,.6,.5,.8,'n'),C('P',.95,8.2,.9,6.8,.38,.4,'n')]}], def:'SCN'},

{ id:'mcn', grp:'Entrapment saraf perifer', name:'Middle cluneal nerve entrapment', side:'uni',
  loc:'Bokong medial, kaudal PSIS (mirip SIJ)',
  gen:'N. cluneal medius (ramus dorsal S1–S3) dapat terjepit di bawah ligamen sakroiliaka posterior panjang (LPSL).',
  pat:'Nyeri bokong medial/inferior PSIS — tumpang-tindih dengan pola SIJ.',
  feat:['Nyeri tekan di tepi lateral sakrum / LPSL, sedikit kaudal PSIS','Sering terdiagnosis sebagai SIJ pain'],
  tests:['Data klinis masih terbatas (laporan & seri kecil)'],
  conf:'Blok MCN di LPSL.',
  intv:['Blok MCN '+U,'Release bedah — laporan terbatas '+LIM],
  refs:['draghici'],
  vars:[{id:'MCN',label:'MCN',focus:['mcn'],mk:[M('P',.52,9.12,'LPSL')],
    z:[E('P',.55,9.12,.22,.25,1,'p'),E('P',.8,8.6,.45,.35,.75,'n')]}], def:'MCN'},

{ id:'myo', grp:'Miofasial', name:'Myofascial pain', side:'uni',
  loc:'Tergantung otot — pola rujukan non-dermatomal',
  gen:'Trigger point miofasial: taut band, nyeri tekan lokal yang mereproduksi nyeri familiar, pola rujukan khas, local twitch response.',
  pat:'Pola rujukan per otot mengikuti peta Travell & Simons (pilih otot di atas).',
  feat:['Taut band + titik nyeri tekan yang mereproduksi nyeri familiar','Pola rujukan non-dermatomal, tanpa defisit neurologis','Sering sekunder/koeksis dengan faset, SIJ, atau radikulopati'],
  tests:['Diagnosis klinis berbasis palpasi','Respons terhadap TrP injection menyokong'],
  conf:'Diagnosis klinis; tidak ada baku emas pencitraan.',
  intv:['TrP injection '+U+' (anestesi lokal / D5W) — terutama otot dalam: QL, gluteus minimus, psoas','Dry needling','Peregangan, koreksi postur, latihan'],
  refs:['travell'],
  vars:[
   {id:'QL',label:'Quadratus lumborum',focus:['ql'],note:'Superfisial → sepanjang krista iliaka & trokanter mayor; dalam → area SIJ & bokong bawah.',mk:[M('P',1.2,10.75,'TrP QL'),M('P',1.1,11.4,'TrP QL')],
    z:[E('P',1.15,11.0,.3,.5,.7,'p'),C('P',.9,10.1,1.6,10.35,.25,.85,'r'),E('L',-.1,8.65,.4,.45,.8,'r'),E('P',.6,9.35,.3,.4,.6,'r'),E('P',1.0,8.4,.45,.3,.45,'r')]},
   {id:'GMED',label:'Gluteus medius',focus:['gmed'],note:'Sepanjang krista iliaka posterior, area SIJ/sakrum, bokong; ± paha posterolateral atas.',mk:[M('P',.75,9.75,'TrP'),M('P',1.2,9.85,'TrP'),M('P',1.6,9.75,'TrP')],
    z:[E('P',1.2,9.75,.35,.3,.9,'p'),C('P',.55,9.9,1.5,10.05,.3,.8,'r'),E('P',.45,9.4,.35,.45,.7,'r'),E('P',1.1,9.3,.55,.4,.7,'r'),E('L',-.25,8.3,.35,.45,.4,'r')]},
   {id:'GMIN',label:'Gluteus minimus',focus:['gmin'],note:'"Pseudo-sciatica": bagian posterior → bokong, paha posterior, betis; bagian anterior → paha lateral, lutut, tungkai lateral s/d maleolus.',mk:[M('P',1.45,9.3,'TrP posterior'),M('L',.25,9.35,'TrP anterior')],
    z:[E('P',1.4,9.3,.35,.3,.85,'p'),E('P',1.0,8.7,.5,.4,.7,'r'),C('P',.9,8.0,.85,5.6,.35,.75,'r'),C('P',.75,4.7,.7,2.2,.3,.6,'r'),C('L',0,8.3,.05,5.4,.3,.75,'r'),C('L',.1,4.6,.15,1.2,.25,.55,'r')]},
   {id:'PSOAS',label:'Iliopsoas',focus:['psoas'],note:'Strip vertikal paraspinal lumbal ipsilateral s/d area SIJ, ditambah paha anterior atas/groin.',mk:[M('A',1.05,8.3,'TrP iliopsoas'),M('A',.9,10.2,'TrP psoas')],
    z:[C('P',.45,11.6,.45,9.8,.3,1,'r'),E('P',.55,9.35,.3,.3,.55,'r'),C('A',1.0,8.6,.95,7.3,.35,.6,'r'),E('A',.95,8.5,.3,.3,.5,'p')]},
   {id:'ES',label:'Erector spinae / multifidus',focus:['erector'],note:'Iliokostalis lumborum → ke bawah ke bokong & pinggang; multifidus → lokal paraspinal dan sakrum/area SIJ.',mk:[M('P',.9,11.6,'TrP iliokostalis'),M('P',.3,10.0,'TrP multifidus')],
    z:[E('P',.9,11.6,.3,.35,.8,'p'),C('P',.9,11.0,1.0,9.2,.4,.7,'r'),E('P',.3,10.0,.25,.3,.8,'p'),E('P',.3,9.3,.3,.4,.6,'r')]},
  ], def:'QL'},

{ id:'gtps', grp:'Mimik (hip)', name:'Greater trochanteric pain syndrome', side:'uni',
  loc:'Lateral pinggul di atas trokanter mayor',
  gen:'Tendinopati gluteus medius/minimus ± bursitis trokanter.',
  pat:'Nyeri lateral pinggul di atas trokanter mayor, dapat menjalar ke paha lateral.',
  feat:['Nyeri tekan trokanter mayor','Nyeri saat berbaring miring ke sisi sakit dan naik tangga','Single-leg stance, FADER, resisted abduction memprovokasi nyeri'],
  tests:['USG: tendinopati/robekan gluteus medius–minimus, bursitis'],
  conf:'Klinis + USG; injeksi diagnostik bila meragukan.',
  intv:['Injeksi peritrokanter '+U+' (steroid — hati-hati pada tendon)','Proloterapi / PRP tendon gluteal '+LIM,'Load management & latihan penguatan abduktor'],
  refs:[],
  vars:[{id:'GT',label:'GTPS',focus:['gt','gmed','gmin'],mk:[M('L',-.1,8.6,'Trokanter mayor')],
    z:[E('L',-.1,8.6,.45,.5,1,'p'),C('L',-.05,8.0,0,5.6,.32,.5,'r')]}], def:'GT'},

{ id:'hip', grp:'Mimik (hip)', name:'Nyeri sendi panggul (OA / intra-artikular)', side:'uni',
  loc:'Groin, paha anterior; dapat ke lutut',
  gen:'Sendi panggul: osteoartritis, FAI, patologi labrum.',
  pat:'Nyeri groin dominan, paha anterior, dapat dirujuk ke lutut; kadang bokong.',
  feat:['Nyeri groin + keterbatasan rotasi internal','FADIR / FABER memprovokasi nyeri groin','"C-sign" saat menunjukkan lokasi nyeri'],
  tests:['Rontgen pelvis AP ± USG efusi'],
  conf:'Injeksi intra-artikular hip diagnostik dengan panduan imaging.',
  intv:['Injeksi IA hip '+U,'RF cabang artikular (femoral & obturator) '+F+'/'+U,'Proloterapi IA dekstrosa '+LIM],
  refs:[],
  vars:[{id:'HIP',label:'Hip',focus:['hipj'],
    z:[E('A',.85,8.45,.45,.35,1,'p'),C('A',.95,8.0,.85,5.6,.38,.6,'r'),E('A',.7,5.0,.4,.35,.45,'r'),E('P',1.0,8.7,.5,.4,.35,'r')]}], def:'HIP'},
];
const DXM=Object.fromEntries(DX.map(d=>[d.id,d]));
const GROUPS=['Spinal','Sendi & Pelvis','Entrapment saraf perifer','Miofasial','Mimik (hip)'];
const KCOL={p:'#ff3b4e',r:'#ffa23a',n:'#b26bff'};
const CMPCOL=['#ff4d6d','#4cc9f0','#80ed99'];

/* ============================== STATE ============================== */
const S={detail:false,mode:'dx',dx:'facet',vars:Object.fromEntries(DX.map(d=>[d.id,d.def])),side:'R',cmp:['facet','sij','piri'],anat:false,op:0.3,labels:false,tap:null,inj:false,proc:{},sonoLab:true};

/* ============================== THREE SETUP ============================== */
const stage=document.getElementById('stage');
let renderer;
try{ renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
catch(e){ const er=document.getElementById('err'); er.hidden=false; er.textContent='WebGL tidak tersedia di perangkat/browser ini.'; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
stage.insertBefore(renderer.domElement,stage.firstChild);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,1,0.1,200);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.dampingFactor=0.08; controls.minDistance=3; controls.maxDistance=45;
controls.target.set(0,7,0); camera.position.set(0,8.5,-22);

scene.add(new THREE.HemisphereLight(0xdfe9ff,0x7a6a70,0.95));
const key=new THREE.DirectionalLight(0xffffff,1.25); key.position.set(-7,16,-12); scene.add(key);
const fill=new THREE.DirectionalLight(0xcfe0ff,0.7); fill.position.set(9,8,12); scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,0.35); rim.position.set(12,10,-4); scene.add(rim);

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const MAXZ=48;
const PU={uN:{value:0},uA:{value:Array.from({length:MAXZ},()=>V(0,0,0))},uB:{value:Array.from({length:MAXZ},()=>V(0,0,0))},
  uR:{value:Array.from({length:MAXZ},()=>new THREE.Vector4(1,1,1,0))},uC:{value:Array.from({length:MAXZ},()=>new THREE.Vector4(0,0,0,0))},
  uT:{value:0},uPick:{value:new THREE.Vector4(0,0,0,0)}};

const skinMat=new THREE.MeshStandardMaterial({color:0xd9a884,roughness:.72,metalness:0,transparent:true,opacity:1});
skinMat.onBeforeCompile=(sh)=>{
  Object.assign(sh.uniforms,PU);
  sh.vertexShader='varying vec3 vWP;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader=`#define MAXZ ${MAXZ}
varying vec3 vWP; uniform int uN; uniform vec3 uA[MAXZ]; uniform vec3 uB[MAXZ]; uniform vec4 uR[MAXZ]; uniform vec4 uC[MAXZ]; uniform float uT; uniform vec4 uPick;
float zd(vec3 p,vec3 a,vec3 b,vec3 r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.);return length((pa-ba*h)/r);}
`+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 pc=vec3(0.); float ws=0.; float keep=1.;
 for(int i=0;i<MAXZ;i++){ if(i>=uN) break;
   float d=zd(vWP,uA[i],uB[i],uR[i].xyz);
   float w=(1.0-smoothstep(0.22,1.0,d))*uC[i].a;
   if(uR[i].w>0.5){ float s=0.5+0.5*sin(vWP.y*10.0+vWP.x*4.0-uT*2.2); w*=mix(0.45,1.0,s); }
   else if(uR[i].w<-0.5){ w*=0.86+0.14*sin(uT*3.2); }
   pc+=uC[i].rgb*w; ws+=w; keep*=(1.0-w);
 }
 float pa=1.0-keep; vec3 pcol=ws>0.0?pc/ws:vec3(0.);
 diffuseColor.rgb=mix(diffuseColor.rgb,pcol,clamp(pa*1.15,0.,0.93));
 diffuseColor.a=max(diffuseColor.a,pa*0.9);
 if(uPick.w>0.5){ float dd=length(vWP-uPick.xyz); float ring=1.0-smoothstep(0.0,0.045,abs(dd-0.26)); float dt=1.0-smoothstep(0.05,0.08,dd);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.25,0.8,1.0),max(ring,dt)); diffuseColor.a=max(diffuseColor.a,max(ring,dt)); }
`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=pcol*pa*0.28;');
};
const armMat=new THREE.MeshStandardMaterial({color:0xd9a884,roughness:.72,transparent:true,opacity:1});

/* ---------- geometry builders ---------- */
function cr(a,b,c,d,t){const t2=t*t,t3=t2*t;return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);}
function sampleSecs(secs,per){const out=[],n=secs.length,keys=Object.keys(secs[0]);
  for(let i=0;i<n-1;i++)for(let j=0;j<per;j++){const t=j/per,o={};for(const k of keys){const g=x=>secs[Math.max(0,Math.min(n-1,x))][k];o[k]=cr(g(i-1),g(i),g(i+1),g(i+2),t);}out.push(o);}
  out.push({...secs[n-1]});return out;}
const sp=(v,e)=>Math.sign(v)*Math.pow(Math.abs(v),e);
function loft(rings,Mn,fn,capBottom=true,capTop=true){
  const pos=[],idx=[];
  rings.forEach(s=>{for(let j=0;j<Mn;j++){const th=j/Mn*Math.PI*2;pos.push(...fn(s,th));}});
  const R=rings.length;
  for(let i=0;i<R-1;i++)for(let j=0;j<Mn;j++){const a=i*Mn+j,b=i*Mn+(j+1)%Mn,c=(i+1)*Mn+j,d=(i+1)*Mn+(j+1)%Mn;idx.push(a,c,b,b,c,d);}
  const cap=(ri,flip)=>{let cx=0,cy=0,cz=0;for(let j=0;j<Mn;j++){const k=(ri*Mn+j)*3;cx+=pos[k];cy+=pos[k+1];cz+=pos[k+2];}
    const ci=pos.length/3;pos.push(cx/Mn,cy/Mn,cz/Mn);for(let j=0;j<Mn;j++){const a=ri*Mn+j,b=ri*Mn+(j+1)%Mn;flip?idx.push(ci,a,b):idx.push(ci,b,a);}};
  if(capBottom)cap(0,true); if(capTop)cap(R-1,false);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function tube(pts,rfn,segs=48,rad=14,caps=true){
  const curve=new THREE.CatmullRomCurve3(pts.map(p=>V(...p)));
  const fr=curve.computeFrenetFrames(segs,false);const pos=[],idx=[];
  for(let i=0;i<=segs;i++){const u=i/segs,P=curve.getPointAt(u),N=fr.normals[i],B=fr.binormals[i],r=rfn(u);
    for(let j=0;j<rad;j++){const a=j/rad*Math.PI*2,c=Math.cos(a),s=Math.sin(a);pos.push(P.x+r*(c*N.x+s*B.x),P.y+r*(c*N.y+s*B.y),P.z+r*(c*N.z+s*B.z));}}
  for(let i=0;i<segs;i++)for(let j=0;j<rad;j++){const a=i*rad+j,b=i*rad+(j+1)%rad,c=(i+1)*rad+j,d=(i+1)*rad+(j+1)%rad;idx.push(a,b,c,b,d,c);}
  if(caps){[[0,curve.getPointAt(0)],[segs,curve.getPointAt(1)]].forEach(([ri,P],k)=>{const ci=pos.length/3;pos.push(P.x,P.y,P.z);for(let j=0;j<rad;j++){const a=ri*rad+j,b=ri*rad+(j+1)%rad;k?idx.push(ci,a,b):idx.push(ci,b,a);}});}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function ribbon(top,bot,rows,segs,bulge,side){ // two curves -> plate
  const ct=new THREE.CatmullRomCurve3(top.map(p=>V(...p))),cb=new THREE.CatmullRomCurve3(bot.map(p=>V(...p)));
  const pos=[],idx=[];
  for(let i=0;i<=rows;i++){const v=i/rows;for(let j=0;j<=segs;j++){const u=j/segs;const p=ct.getPoint(u).lerp(cb.getPoint(u),v);
    const b=bulge*Math.sin(Math.PI*v)*Math.sin(Math.PI*u);p.x+=side*b;pos.push(p.x,p.y,p.z);}}
  for(let i=0;i<rows;i++)for(let j=0;j<segs;j++){const a=i*(segs+1)+j,b=a+1,c=a+segs+1,d=c+1;idx.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}

/* ---------- BODY ---------- */
const body=new THREE.Group();scene.add(body);
const TS=[
 {y:7.05,hw:.75,df:.4,db:.75,c:.05},{y:7.45,hw:1.226,df:.5,db:1.358,c:.08},{y:7.8,hw:1.562,df:.74,db:1.464,c:.22},{y:8.2,hw:2.312,df:1.018,db:1.664,c:.34},{y:8.85,hw:2.434,df:1.104,db:1.603,c:.32},
 {y:9.45,hw:2.434,df:1.403,db:1.323,c:.2},{y:10.0,hw:2.153,df:1.242,db:1.011,c:.07},{y:10.6,hw:1.66,df:1.013,db:.86,c:.06},
 {y:11.3,hw:1.5,df:1.02,db:.9,c:.06},{y:12.2,hw:1.631,df:1.12,db:1.008,c:.05},{y:13.2,hw:1.848,df:1.2,db:1.115,c:.05},
 {y:14.0,hw:1.9,df:1.05,db:1.0,c:.03},{y:14.5,hw:1.74,df:.8,db:.8,c:0},{y:14.85,hw:.85,df:.55,db:.55,c:0},{y:15.05,hw:.5,df:.45,db:.45,c:0}];
const torso=new THREE.Mesh(loft(sampleSecs(TS,8),72,(s,th)=>{const c=Math.cos(th),sn=Math.sin(th);const x=s.hw*sp(c,2/2.5);const zr=sp(sn,2/2.5);
  let z=zr>0?zr*s.df:zr*s.db; if(z<0) z+=s.c*Math.exp(-Math.pow(x/0.2,2))*Math.abs(zr); return [x,s.y,z];}),skinMat);
body.add(torso);
const LS=[{y:9.1,cx:1.15,rx:1.0,rf:.85,rb:.9},{y:8.2,cx:1.25,rx:1.062,rf:.9,rb:1.608},{y:7.2,cx:1.3,rx:.973,rf:.82,rb:1.315},{y:6.1,cx:1.25,rx:.68,rf:.7,rb:.7},
 {y:5.1,cx:1.05,rx:.55,rf:.56,rb:.52},{y:4.5,cx:.85,rx:.5,rf:.5,rb:.58},{y:3.7,cx:.7,rx:.52,rf:.45,rb:.7},{y:2.6,cx:.68,rx:.43,rf:.38,rb:.52},
 {y:1.5,cx:.66,rx:.3,rf:.3,rb:.34},{y:.8,cx:.65,rx:.28,rf:.28,rb:.3},{y:.35,cx:.65,rx:.32,rf:.34,rb:.4}].reverse();
const bodyMeshes=[torso];
[-1,1].forEach(sd=>{
  const leg=new THREE.Mesh(loft(sampleSecs(LS,8),48,(s,th)=>{const c=Math.cos(th),sn=Math.sin(th);const x=sd*s.cx+s.rx*sp(c,2/2.2);const zr=sp(sn,2/2.2);return [x,s.y,zr>0?zr*s.rf:zr*s.rb];}),skinMat);
  body.add(leg);bodyMeshes.push(leg);
  const foot=new THREE.Mesh(new THREE.SphereGeometry(1,40,24),skinMat);foot.scale.set(.36,.28,1.15);foot.position.set(sd*.67,.28,.7);body.add(foot);bodyMeshes.push(foot);
  const arm=new THREE.Mesh(tube([[sd*1.92,14.2,0],[sd*2.55,11.7,-.05],[sd*3.1,9.6,.15]],u=>u<.5?.44-.28*u:.3-.12*(u-.5),40,18),armMat);body.add(arm);
  const delt=new THREE.Mesh(new THREE.SphereGeometry(.52,28,20),armMat);delt.position.set(sd*1.9,14.15,0);body.add(delt);
  const hand=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),armMat);hand.scale.set(.14,.48,.3);hand.position.set(sd*3.24,8.95,.2);hand.rotation.z=sd*.22;body.add(hand);
});
// fix leg winding: check by flipping if needed (see test); keep both consistent
const neck=new THREE.Mesh(new THREE.CylinderGeometry(.48,.52,1.2,28),skinMat);neck.position.set(0,15.4,0);body.add(neck);
const head=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),skinMat);head.scale.set(.78,1.02,.92);head.position.set(0,16.6,.1);body.add(head);bodyMeshes.push(head);
[torso,neck,head,...bodyMeshes].forEach(m=>m.renderOrder=2);

/* ---------- ANATOMY ---------- */
const anat=new THREE.Group();scene.add(anat);anat.visible=false;
const REG=[]; // {key,side,mesh}
const mk=(hex,op=1,ds=false)=>new THREE.MeshStandardMaterial({color:hex,roughness:.55,metalness:0,transparent:op<1,opacity:op,side:ds?THREE.DoubleSide:THREE.FrontSide});
const BONE=0xe9e2cf,DISC=0x7fb3d5,MUS=0xb5524e,NERV=0xf6d743,CART=0x4fd1c5;
function addA(mesh,key,side='C'){mesh.renderOrder=1;anat.add(mesh);REG.push({key,side,mesh,base:mesh.material.emissive.clone()});return mesh;}
const LV={T10:13.2,T11:12.76,T12:12.32,L1:11.86,L2:11.4,L3:10.93,L4:10.45,L5:9.98};
const zoff=y=>.12*Math.sin(Math.PI*Math.min(1,Math.max(0,(y-9.7)/2.9)));
const bz=y=>.1+zoff(y);
const ORDER=['T10','T11','T12','L1','L2','L3','L4','L5'];
ORDER.forEach((lv,i)=>{
  const y=LV[lv],z=bz(y),isL=lv[0]==='L';
  const vb=new THREE.Mesh(new THREE.CylinderGeometry(isL?.3:.25,isL?.31:.26,.31,28),mk(BONE));vb.scale.z=.78;vb.position.set(0,y,z);addA(vb,'vb:'+lv);
  const spn=new THREE.Mesh(new THREE.BoxGeometry(.1,.22,.44),mk(BONE));spn.position.set(0,y-.03,z-.68);spn.rotation.x=isL?0:.35;addA(spn,'sp:'+lv);
  const lam=new THREE.Mesh(new THREE.BoxGeometry(.42,.2,.12),mk(BONE));lam.position.set(0,y,z-.46);addA(lam,'lam:'+lv);
  [-1,1].forEach(sd=>{
    const ped=new THREE.Mesh(new THREE.BoxGeometry(.09,.13,.3),mk(BONE));ped.position.set(sd*.19,y+.02,z-.3);addA(ped,'ped:'+lv,sd<0?'R':'L');
    const tl=lv==='L3'?.58:lv==='L5'?.42:isL?.5:.36;
    const tp=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,tl,10),mk(BONE));tp.rotation.z=Math.PI/2;tp.position.set(sd*(.2+tl/2),y,z-.36);addA(tp,'tp:'+lv,sd<0?'R':'L');
  });
  if(i<ORDER.length-1){const yn=LV[ORDER[i+1]];const ym=(y+yn)/2;const d=new THREE.Mesh(new THREE.CylinderGeometry(isL?.3:.25,isL?.3:.25,.13,28),mk(DISC));d.scale.z=.78;d.position.set(0,ym,bz(ym));addA(d,'disc:'+lv);
    [-1,1].forEach(sd=>{const f=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mk(0xf2e6c4));f.scale.set(.075,.13,.085);f.position.set(sd*.21,ym+.02,bz(ym)-.47);addA(f,'facet:'+lv,sd<0?'R':'L');});}
});
// L5-S1 disc & facet
{const ym=9.8;const d=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.12,28),mk(DISC));d.scale.z=.78;d.position.set(0,ym,bz(ym)+.02);d.rotation.x=-.15;addA(d,'disc:L5');
 [-1,1].forEach(sd=>{const f=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mk(0xf2e6c4));f.scale.set(.08,.13,.09);f.position.set(sd*.24,ym+.02,bz(ym)-.5);addA(f,'facet:L5',sd<0?'R':'L');});}
// sacrum
{const sh=new THREE.Shape();sh.moveTo(-.58,0);sh.lineTo(.58,0);sh.quadraticCurveTo(.5,-.6,.15,-1.2);sh.lineTo(-.15,-1.2);sh.quadraticCurveTo(-.5,-.6,-.58,0);
 const g=new THREE.ExtrudeGeometry(sh,{depth:.32,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,curveSegments:12});g.translate(0,0,-.16);
 const s=new THREE.Mesh(g,mk(BONE));s.rotation.x=.45;s.position.set(0,9.74,-.12);addA(s,'sacrum');
 const cc=new THREE.Mesh(new THREE.ConeGeometry(.1,.35,12),mk(BONE));cc.rotation.x=Math.PI+.6;cc.position.set(0,8.47,-.7);addA(cc,'coccyx');}
// pelvis & femur per side (coords: a = lateral distance)
[-1,1].forEach(sd=>{
  const S2=sd<0?'R':'L',X=a=>sd*a;
  const P=(a,y,z)=>[X(a),y,z];
  const il=new THREE.Mesh(ribbon([P(.48,9.75,-.92),P(.8,10.15,-.82),P(1.18,10.35,-.52),P(1.42,10.32,-.08),P(1.46,10.05,.4),P(1.34,9.68,.74)],
    [P(.55,9.15,-.62),P(.82,8.95,-.55),P(1.02,8.82,-.25),P(1.14,8.78,.1),P(1.24,9.0,.45),P(1.3,9.42,.7)],6,24,.16,sd),mk(BONE,1,true));addA(il,'ilium',S2);
  const rim2=new THREE.Mesh(tube([P(.48,9.75,-.92),P(.8,10.15,-.82),P(1.18,10.35,-.52),P(1.42,10.32,-.08),P(1.46,10.05,.4),P(1.34,9.68,.74)],()=>.045,40,8),mk(BONE));addA(rim2,'crest',S2);
  const isch=new THREE.Mesh(tube([P(1.05,8.62,-.15),P(.86,8.25,-.42),P(.68,8.0,-.48),P(.45,8.05,-.1),P(.12,8.3,.72)],u=>.1+.04*Math.sin(Math.PI*u),40,10),mk(BONE));addA(isch,'ischium',S2);
  const pub=new THREE.Mesh(tube([P(1.12,8.75,.25),P(.62,8.6,.68),P(.1,8.45,.78)],()=>.08,24,10),mk(BONE));addA(pub,'pubis',S2);
  const fh=new THREE.Mesh(new THREE.SphereGeometry(.24,24,16),mk(BONE));fh.position.set(X(.98),8.7,.08);addA(fh,'hipj',S2);
  const fn=new THREE.Mesh(tube([P(1.0,8.7,.06),P(1.32,8.6,-.02),P(1.56,8.5,-.08)],()=>.12,16,12),mk(BONE));addA(fn,'femneck',S2);
  const gt=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mk(BONE));gt.scale.set(.18,.26,.22);gt.position.set(X(1.62),8.62,-.14);addA(gt,'gt',S2);
  const shaft=new THREE.Mesh(tube([P(1.58,8.45,-.06),P(1.3,7.0,.05),P(1.0,5.6,.02),P(.82,5.0,0)],()=>.14,30,12),mk(BONE));addA(shaft,'femur',S2);
  const bur=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mk(0xa78bfa,.8));bur.scale.set(.06,.22,.17);bur.position.set(X(1.82),8.62,-.14);addA(bur,'gt',S2);
  // SIJ
  const sij=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mk(CART,.95));sij.scale.set(.06,.42,.13);sij.rotation.x=.45;sij.position.set(X(.56),9.35,-.42);addA(sij,'sij',S2);
  // ribs 11-12
  [[LV.T11,1.25],[LV.T12,1.0]].forEach(([y,l])=>{const rb=new THREE.Mesh(tube([P(.25,y,bz(y)-.36),P(.6,y-.12,bz(y)-.42),P(l,y-.45,bz(y)-.2)],()=>.05,16,8),mk(BONE));addA(rb,'rib',S2);});
  // muscles
  const fus=(r0,r1)=>u=>r0+r1*Math.pow(Math.sin(Math.PI*u),.7);
  addA(new THREE.Mesh(tube([P(.3,9.15,-.4),P(.8,9.05,-.56),P(1.25,8.9,-.46),P(1.58,8.78,-.26)],fus(.05,.14),36,14),mk(MUS,.92)),'piri',S2);
  addA(new THREE.Mesh(tube([P(1.0,10.28,-.42),P(.98,11.2,-.4),P(.88,12.05,-.36)],fus(.07,.13),30,12),mk(MUS,.9)),'ql',S2);
  addA(new THREE.Mesh(tube([P(.33,12.0,.15),P(.48,11.0,.3),P(.62,10.0,.42),P(.84,9.0,.58),P(1.0,8.4,.4),P(1.06,8.1,.12)],fus(.06,.16),40,14),mk(MUS,.9)),'psoas',S2);
  addA(new THREE.Mesh(tube([P(.32,9.3,-.78),P(.42,10.4,-.6),P(.48,11.6,-.6),P(.48,13.1,-.68)],fus(.08,.12),36,12),mk(MUS,.85)),'erector',S2);
  addA(new THREE.Mesh(ribbon([P(.62,9.9,-.98),P(.95,10.22,-.86),P(1.25,10.38,-.55),P(1.48,10.32,-.08),P(1.5,10.0,.32)],[P(1.52,8.95,-.36),P(1.6,8.92,-.26),P(1.66,8.9,-.16),P(1.7,8.9,-.04),P(1.72,8.9,.06)],6,20,.14,sd),mk(MUS,.75,true)),'gmed',S2);
  addA(new THREE.Mesh(ribbon([P(.88,9.45,-.72),P(1.1,9.65,-.5),P(1.3,9.75,-.12),P(1.38,9.62,.28)],[P(1.6,8.86,-.1),P(1.64,8.86,0),P(1.68,8.86,.08),P(1.7,8.86,.16)],5,16,.1,sd),mk(0xc96a5a,.85,true)),'gmin',S2);
  // nerves
  const nr=r=>()=>r;
  addA(new THREE.Mesh(tube([P(.1,10.32,bz(10.3)-.36),P(.35,10.15,bz(10.2)-.25),P(.56,9.8,.12),P(.72,9.38,.16)],nr(.05),24,8),mk(NERV)),'root:L4',S2);
  addA(new THREE.Mesh(tube([P(.1,9.86,bz(9.9)-.36),P(.36,9.7,bz(9.7)-.25),P(.52,9.4,0),P(.66,9.08,-.18)],nr(.055),24,8),mk(NERV)),'root:L5',S2);
  addA(new THREE.Mesh(tube([P(.1,9.56,-.3),P(.28,9.4,-.34),P(.45,9.2,-.28),P(.66,9.0,-.3)],nr(.055),24,8),mk(NERV)),'root:S1',S2);
  addA(new THREE.Mesh(tube([P(.66,9.05,-.28),P(.95,8.66,-.56),P(1.05,8.1,-.56),P(1.0,7.0,-.46),P(.9,6.0,-.36),P(.78,5.2,-.3)],nr(.065),48,10),mk(NERV)),'sciatic',S2);
  addA(new THREE.Mesh(tube([P(.74,9.16,-.46),P(.96,9.27,-.64),P(1.3,9.36,-.52),P(1.55,9.36,-.16),P(1.66,9.25,.3)],nr(.035),30,8),mk(NERV)),'sgn',S2);
  [0,1,2].forEach(k=>addA(new THREE.Mesh(tube([P(.42+.06*k,11.0+.4*k,-.66),P(.62+.1*k,10.6+.15*k,-.8),P(.72+.12*k,10.05,-.88),P(.95+.15*k,9.4,-1.08)],nr(.025),24,6),mk(NERV)),'scn',S2));
  [0,1].forEach(k=>addA(new THREE.Mesh(tube([P(.3,9.35-.18*k,-.8),P(.55,9.05-.15*k,-.98),P(.8+.1*k,8.75-.12*k,-1.12)],nr(.022),20,6),mk(NERV)),'mcn',S2));
});
// thecal sac / canal
addA(new THREE.Mesh(tube([[0,12.6,bz(12.6)-.36],[0,11.4,bz(11.4)-.38],[0,10.4,bz(10.4)-.38],[0,9.5,-.32]],u=>.11-.03*u,40,14),mk(NERV,.9)),'canal');

/* ============================== ZONES ============================== */
const ray=new THREE.Raycaster();
scene.updateMatrixWorld(true);

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
  REG.forEach(r=>{ if(!r.detail) r.mesh.visible=!(S.detail && DREPL.test(r.key) && !r.keep); }); }
const SUBT={simple:'Versi sederhana: tubuh dan anatomi skematik. Tekan Anatomi untuk melihat generator nyeri; pola nyeri diwarnai di kulit.',
  detail:'Versi detail: lapisan Anatomi memakai mesh BodyParts3D (vertebra T10–L5, diskus, sakrum, pelvis, femur, psoas, QL, erector, multifidus, gluteal, piriformis) dan saraf Z-Anatomy. Faset, radiks, n. cluneal, dan SIJ tetap skematik.'};
async function setDetail(on){
  S.detail=on; MI.press(document.querySelectorAll('#mode button'),b=>(b.dataset.m==='detail')===on);
  document.getElementById('sub').textContent=SUBT[on?'detail':'simple']; document.getElementById('about').textContent=SUBT[on?'detail':'simple'];
  if(on){ const ld=document.getElementById('loading'); ld.hidden=false; await new Promise(r=>setTimeout(r,30));
    try{ await loadDetail(); }catch(e){ console.error(e); const er=document.getElementById('err'); er.textContent='Mesh detail gagal dimuat.'; er.hidden=false; }
    ld.hidden=true; if(!S.anat) setAnat(true); }
  syncAnat(); setFocus(); }
function initDetail(){ document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>setDetail(b.dataset.m==='detail'));
  const H=(location.hash||'').toLowerCase(); setDetail(H.includes('detail')); }

function hit(v,a,y,sd){let o,d;
  if(v==='P'){o=V(sd*a,y,-12);d=V(0,0,1);} else if(v==='A'){o=V(sd*a,y,12);d=V(0,0,-1);}
  else if(v==='L'){o=V(sd*12,y,a);d=V(-sd,0,0);} else {o=V(sd*a,2.4,y);d=V(0,-1,0);}
  const prev=skinMat.side;skinMat.side=THREE.DoubleSide;ray.set(o,d);const h=ray.intersectObjects(bodyMeshes,false)[0];skinMat.side=prev;
  return h?{p:h.point.clone(),n:h.face.normal.clone().transformDirection(h.object.matrixWorld)}:{p:o.clone().addScaledVector(d,12),n:d.clone().negate()};}
const radii=(v,rx,ry,dp=.5)=>v==='L'?V(dp,ry,rx):v==='T'?V(rx,dp,ry):V(rx,ry,dp);
const zcache=new Map();
function resolve(spec,sd){const a=hit(spec.v,spec.a1,spec.y1,sd).p;const b=spec.a2===undefined?a.clone():hit(spec.v,spec.a2,spec.y2,sd).p;
  return {a,b,r:radii(spec.v,spec.rx,spec.ry),i:spec.i,k:spec.k};}
function zonesFor(dxId,varId,side){const key=dxId+'|'+varId+'|'+side;if(zcache.has(key))return zcache.get(key);
  const d=DXM[dxId],vv=d.vars.find(x=>x.id===varId)||d.vars[0];const out=[];
  const sides=side==='B'?[-1,1]:[side==='R'?-1:1];
  sides.forEach((sd,ix)=>vv.z.forEach(s=>{const mid=(s.v==='P'||s.v==='A')&&Math.abs(s.a1)<.05&&(s.a2===undefined||Math.abs(s.a2)<.05);if(ix>0&&mid)return;out.push(resolve(s,sd));}));
  zcache.set(key,out);return out;}
function effSide(d){return d.side==='bi'?'B':S.side;}
function wAt(p,z){const pa=p.clone().sub(z.a),ba=z.b.clone().sub(z.a);const h=Math.min(1,Math.max(0,pa.dot(ba)/Math.max(ba.lengthSq(),1e-6)));
  const q=pa.sub(ba.multiplyScalar(h));const dd=Math.hypot(q.x/z.r.x,q.y/z.r.y,q.z/z.r.z);const t=Math.min(1,Math.max(0,(dd-.22)/(1-.22)));return (1-t*t*(3-2*t))*z.i;}

function hexV(h){const c=new THREE.Color(h);return c;}
function pushZones(list){let n=0;for(const {z,col} of list){if(n>=MAXZ)break;PU.uA.value[n].copy(z.a);PU.uB.value[n].copy(z.b);
  PU.uR.value[n].set(z.r.x,z.r.y,z.r.z,z.k==='n'?1:z.k==='p'?-1:0);const c=hexV(col);PU.uC.value[n].set(c.r,c.g,c.b,z.i);n++;}PU.uN.value=n;}

/* ---------- markers & labels ---------- */
const markGroup=new THREE.Group();scene.add(markGroup);
const labelsEl=document.getElementById('labels');let LBL=[];
const LANDMARKS=[['P',.45,9.75,'PSIS'],['P',1.45,10.3,'Krista iliaka'],['P',0,10.45,'L4'],['L',-.12,8.62,'Trokanter mayor'],['P',.66,8.02,'Tuber iskiadikum']];
function setMarkers(){markGroup.clear();labelsEl.innerHTML='';LBL=[];
  const add=(v,a,y,label,sd,cls)=>{const h=hit(v,a,y,sd);const el=document.createElement('div');el.className='lab '+cls;el.textContent=label;labelsEl.appendChild(el);
    if(cls==='mk'){const m=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));m.position.copy(h.p).addScaledVector(h.n,.03);markGroup.add(m);
      const ring=new THREE.Mesh(new THREE.RingGeometry(.1,.14,24),new THREE.MeshBasicMaterial({color:0xff4d6d,side:THREE.DoubleSide}));ring.position.copy(m.position);ring.lookAt(h.p.clone().add(h.n));markGroup.add(ring);}
    LBL.push({el,p:h.p.clone().addScaledVector(h.n,.05),n:h.n});};
  if(S.labels) LANDMARKS.forEach(([v,a,y,l])=>add(v,a,y,l,a===0?-1:(S.side==='L'?1:-1),'lm'));
  const dxs=S.mode==='cmp'?S.cmp:(S.mode==='dx'?[S.dx]:[]);
  dxs.forEach(id=>{const d=DXM[id],vv=d.vars.find(x=>x.id===S.vars[id]);if(!vv||!vv.mk)return;const sides=effSide(d)==='B'?[-1,1]:[effSide(d)==='R'?-1:1];
    sides.forEach(sd=>vv.mk.forEach(m=>add(m.v,m.a,m.y,m.label,sd,'mk')));});}

/* ---------- focus highlight ---------- */
let FOCUS=[];
function setFocus(){FOCUS=[];const dxs=S.mode==='cmp'?S.cmp:(S.mode==='dx'?[S.dx]:[]);
  dxs.forEach(id=>{const d=DXM[id],vv=d.vars.find(x=>x.id===S.vars[id]);const es=effSide(d);
    (vv.focus||[]).forEach(f=>REG.forEach(r=>{if(r.key===f&&(r.side==='C'||es==='B'||r.side===es))FOCUS.push(r);}));});
  REG.forEach(r=>r.mesh.material.emissive.copy(r.base));}

/* ============================== INJEKSI & SONOANATOMI ============================== */
// Status verifikasi: v = langkah & sonoanatomi dari publikasi; p = sebagian (target/lapisan terverifikasi, orientasi probe skematik); g = skema anatomi umum
const VER={v:['Terverifikasi literatur','#3df5a0'],p:['Sebagian terverifikasi','#ffd28a'],g:['Skema anatomi umum','#9ec5ff']};
Object.assign(REFS,{
  greher1:{t:'Greher M et al. Ultrasound-guided lumbar facet nerve block: sonoanatomic study. Anesthesiology 2004;100:1242-8',u:'https://doi.org/10.1097/00000542-200405000-00028'},
  greher2:{t:'Greher M et al. Ultrasound-guided lumbar facet nerve block: accuracy confirmed by CT. Anesthesiology 2004;101:1195-200',u:'https://doi.org/10.1097/00000542-200411000-00020'},
  galiano:{t:'Galiano K et al. Ultrasound guidance for facet joint injections in the lumbar spine: CT-controlled feasibility. Anesth Analg 2005;101:579-83',u:'https://doi.org/10.1213/01.ANE.0000158609.64417.93'},
  klauser:{t:'Klauser A et al. Feasibility of US-guided SIJ injection at two levels in cadavers and patients. Arthritis Rheum 2008;59:1618-24',u:'https://doi.org/10.1002/art.24204'},
  chen04:{t:'Chen CPC et al. Ultrasound guidance in caudal epidural needle placement. Anesthesiology 2004;101:181-4',u:'https://doi.org/10.1097/00000542-200407000-00028'},
  kim16:{t:'Kim DH et al. Ultrasonographic evaluation of anatomic variations in the sacral hiatus. Spine 2016;41:E759-63',u:'https://doi.org/10.1097/BRS.0000000000001448'},
  smith06:{t:'Smith J et al. Ultrasound-guided piriformis injection: technique description and verification. Arch Phys Med Rehabil 2006;87:1664-7',u:'https://doi.org/10.1016/j.apmr.2006.08.337'},
  finnoff:{t:'Finnoff JT et al. Accuracy of US-guided vs fluoroscopically guided piriformis injections: cadaveric study. J Ultrasound Med 2008;27:1157-63',u:'https://doi.org/10.7863/jum.2008.27.8.1157'},
  ferreira:{t:'Ferreira-Dos-Santos G et al. US-guided gluteal fascial plane block (SGN) for refractory GTPS. Pain Med 2022;23:1875-81',u:'https://doi.org/10.1093/pm/pnac071'},
  luo:{t:'Luo X, Zhao Y. Ultrasound-guided superior cluneal nerve block: a narrative review. J Pain Res 2024;17:1829-36',u:'https://doi.org/10.2147/JPR.S462166'},
  bodner:{t:'Bodner G et al. Identification of the superior cluneal nerves with high-resolution sonography. Pain Physician 2016;19:197-202',u:'https://pubmed.ncbi.nlm.nih.gov/27008294/'},
  pfirrmann:{t:'Pfirrmann CW et al. Greater trochanter of the hip: abductor attachments and bursae. Radiology 2001;221:469-77',u:'https://doi.org/10.1148/radiol.2211001634'},
  nysorahip:{t:'NYSORA. Ultrasound-guided intra-articular hip injections (teknik)',u:'https://www.nysora.com/pain-management/ultrasound-guided-intra-articular-hip-injections/'},
  reeh:{t:'Reeh C et al. Middle cluneal neuralgia: case report & review of interventional treatments. Pain Med Case Rep 2023;7:239-43',u:'https://pubmed.ncbi.nlm.nih.gov/40929583/'},
});

/* ---------- SVG sonogram renderer ---------- */
let SVGID=0;
function sonoSVG(sp,showLab=true){
  const id='s'+(++SVGID),W=sp.W,D=sp.D,X0=22,Y0=22,PW=276,PH=210;
  const SX=sp.sx||0,X=x=>X0+(x+SX+W/2)/W*PW, Y=y=>Y0+y/D*PH, P=pts=>pts.map(([x,y])=>`${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');
  const tex={fat:`url(#${id}fat)`,mus:`url(#${id}mus)`,musL:`url(#${id}musL)`,lig:`url(#${id}lig)`,dark:'#0a0a0a'};
  let body='',labs='';
  for(const it of sp.items){const k=it[0];
    if(k==='poly') body+=`<polygon points="${P(it[2])}" fill="${tex[it[1]]}"/>`;
    else if(k==='line') body+=`<polyline points="${P(it[1])}" fill="none" stroke="${it[2]==='lig'?'#c9c9c9':'#e6e6e6'}" stroke-width="${it[2]==='lig'?2.2:1.5}" opacity=".85"/>`;
    else if(k==='bone'){const p=it[1];const sh=[...p,[p[p.length-1][0],D+1],[p[0][0],D+1]];
      body+=`<polygon points="${P(sh)}" fill="#030303"/><polyline points="${P(p)}" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round" filter="url(#${id}glow)"/>`;}
    else if(k==='gap') body+=`<polygon points="${P(it[1])}" fill="#050505"/>`;
    else if(k==='nerve'){const [_,x,y,rx,ry,small]=it;
      if(small) body+=`<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${rx/W*PW}" ry="${ry/D*PH}" fill="#d6d6d6" stroke="#fff" stroke-width="1"/>`;
      else{body+=`<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${rx/W*PW}" ry="${ry/D*PH}" fill="#bdbdbd" stroke="#f2f2f2" stroke-width="1.4"/>`;
        for(let i=0;i<7;i++){const a=i/7*6.283,r=.5;body+=`<circle cx="${(X(x)+Math.cos(a)*rx/W*PW*r).toFixed(1)}" cy="${(Y(y)+Math.sin(a)*ry/D*PH*r).toFixed(1)}" r="${Math.max(1.2,Math.min(rx/W*PW,ry/D*PH)*.22).toFixed(1)}" fill="#3a3a3a"/>`;}}}
    else if(k==='vessel'){const [_,x,y,r,t]=it;body+=`<circle cx="${X(x)}" cy="${Y(y)}" r="${r/W*PW}" fill="#020202" stroke="#6a6a6a" stroke-width="1"/>`+(showLab?`<text x="${X(x)}" y="${Y(y)+3}" text-anchor="middle" font-size="8" fill="${t==='A'?'#ff6b6b':'#6ba8ff'}">${t}</text>`:'');}
    else if(k==='lab'&&showLab){const [_,x,y,t,dx=0,dy=0]=it;const tx=X(x)+dx,ty=Y(y)+dy;
      if(dx||dy) labs+=`<line x1="${X(x)}" y1="${Y(y)}" x2="${tx}" y2="${ty}" stroke="#ffd166" stroke-width=".7" opacity=".8"/>`;
      labs+=`<text x="${tx}" y="${ty}" font-size="8.6" fill="#ffd166" stroke="#000" stroke-width="2.4" paint-order="stroke" text-anchor="${dx<0?'end':dx>0?'start':'middle'}">${t}</text>`;}
  }
  let nd='';
  if(sp.needle){const [a,b]=sp.needle;nd=`<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="#fff" stroke-width="2" stroke-linecap="round" filter="url(#${id}glow)"/><circle cx="${X(b[0])}" cy="${Y(b[1])}" r="2.2" fill="#fff"/>`;}
  if(sp.tgt) for(const t of [].concat(sp.tgt2?[sp.tgt,sp.tgt2]:[sp.tgt])) nd+=`<circle cx="${X(t[0])}" cy="${Y(t[1])}" r="7" fill="none" stroke="#3df5a0" stroke-width="1.6" stroke-dasharray="3 2"/>`;
  let ticks='';for(let d=0;d<=D;d++)ticks+=`<line x1="${X0+PW+2}" x2="${X0+PW+6}" y1="${Y(d)}" y2="${Y(d)}" stroke="#7d8aa0"/><text x="${X0+PW+8}" y="${Y(d)+3}" font-size="7" fill="#7d8aa0">${d}</text>`;
  const clip=sp.curv?`<path d="M${X0+PW*.12},${Y0} L${X0+PW*.88},${Y0} L${X0+PW},${Y0+PH*.88} Q${X0+PW/2},${Y0+PH*1.06} ${X0},${Y0+PH*.88} Z"/>`:`<rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}"/>`;
  return `<svg viewBox="0 0 320 ${Y0+PH+16}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#000;border-radius:10px">
  <defs>
   <pattern id="${id}fat" width="26" height="14" patternUnits="userSpaceOnUse"><rect width="26" height="14" fill="#1b1b1b"/><path d="M2 4 L11 3 M14 10 L24 9" stroke="#4d4d4d" stroke-width="1"/></pattern>
   <pattern id="${id}mus" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#3a3a3a"/><circle cx="3" cy="4" r=".8" fill="#7a7a7a"/><circle cx="11" cy="2" r=".6" fill="#6a6a6a"/><circle cx="7" cy="10" r=".9" fill="#858585"/><circle cx="14" cy="13" r=".6" fill="#6a6a6a"/><circle cx="2" cy="14" r=".5" fill="#727272"/></pattern>
   <pattern id="${id}musL" width="18" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><rect width="18" height="10" fill="#3a3a3a"/><path d="M0 3 L18 2 M0 7.5 L18 7" stroke="#8a8a8a" stroke-width=".8"/></pattern>
   <pattern id="${id}lig" width="12" height="5" patternUnits="userSpaceOnUse"><rect width="12" height="5" fill="#6e6e6e"/><path d="M0 1.5 L12 1.2 M0 3.8 L12 3.6" stroke="#bdbdbd" stroke-width=".7"/></pattern>
   <filter id="${id}glow"><feGaussianBlur stdDeviation=".7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   <filter id="${id}nz" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter>
   <clipPath id="${id}c">${clip}</clipPath>
  </defs>
  <g clip-path="url(#${id}c)"><rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}" fill="${tex.fat}"/>${body}<rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}" filter="url(#${id}nz)" opacity=".22"/>${nd}</g>
  ${labs}${ticks}
  <text x="${X0}" y="14" font-size="9" fill="#cfd8e6">${sp.lt}</text><text x="${X0+PW}" y="14" font-size="9" fill="#cfd8e6" text-anchor="end">${sp.rt}</text>
  <text x="${X0+PW+12}" y="${Y0+PH+12}" font-size="7" fill="#7d8aa0" text-anchor="end">cm</text>
  </svg>`;}

/* ---------- Sonogram specs (unit: cm; x = lebar probe, y = kedalaman) ---------- */
const SONO={
 mbb:(lv)=>({W:11,D:7.5,curv:true,sx:.6,lt:'◀ Medial (prosesus spinosus)',rt:'Lateral ▶',
  items:[['line',[[-5.5,1.4],[5.5,1.5]]],
   ['poly','mus',[[-4.3,1.45],[-1.4,1.5],[-1.3,3.2],[-2.6,3.6],[-3.6,3.45],[-4.2,2.4]]],
   ['poly','mus',[[-1.4,1.5],[5.5,1.6],[5.5,4.7],[3.2,4.75],[0,4.6],[-1.1,3.6]]],
   ['poly','mus',[[3.1,5.0],[5.5,4.95],[5.5,7.5],[3.0,7.5]]],
   ['bone',[[-4.85,1.15],[-4.5,0.95],[-4.2,1.3],[-4.15,2.5],[-3.6,3.5],[-2.6,3.72],[-2.0,3.3],[-1.6,3.25],[-1.2,3.9],[-0.95,4.6],[1,4.7],[2.8,4.85],[3.05,5.0]]],
   ['lab',-4.5,.95,'SP',0,-6],['lab',-3.2,3.6,'Lamina',-6,18],['lab',-1.8,3.25,'SAP',0,-8],['lab',1.6,4.75,'TP '+lv,0,-8],
   ['lab',-2.9,2.4,'Multifidus'],['lab',1.9,3.0,'Erector spinae'],['lab',3.6,1.45,'Fascia TL',0,-6],['lab',1.5,.7,'Subkutis'],['lab',4.3,6.2,'Psoas/QL']],
  needle:[[5.2,.3],[-.88,4.55]],tgt:[-.9,4.6]}),
 fia:()=>({W:10,D:6.5,curv:true,sx:.4,lt:'◀ Medial (prosesus spinosus)',rt:'Lateral ▶',
  items:[['line',[[-5,1.3],[5,1.4]]],
   ['poly','mus',[[-4.0,1.35],[-1.0,1.4],[-1.4,2.95],[-2.5,2.95],[-3.3,2.95],[-4.0,2.2]]],
   ['poly','mus',[[-1.0,1.4],[5,1.5],[5,4.3],[-0.4,4.1],[-1.5,3.1]]],
   ['bone',[[-4.6,1.05],[-4.3,.9],[-4.05,1.2],[-4.0,2.3],[-3.3,3.08],[-2.5,3.08]]],
   ['bone',[[-2.28,3.14],[-1.6,3.3],[-0.8,3.9],[-0.2,4.6]]],
   ['gap',[[-2.5,3.08],[-2.28,3.14],[-2.22,3.7],[-2.42,3.7]]],
   ['lab',-4.3,.9,'SP',0,-6],['lab',-3.6,2.7,'Lamina',-4,20],['lab',-2.9,3.1,'IAP (vertebra atas)',-8,26],['lab',-1.1,3.6,'SAP (vertebra bawah)',10,22],['lab',-2.38,3.2,'Celah faset',20,-26],
   ['lab',-2.7,2.2,'Multifidus'],['lab',2.4,2.8,'Longissimus']],
  needle:[[4.7,.3],[-2.36,3.12]],tgt:[-2.38,3.12]}),
 sij:()=>({W:9,D:6,curv:false,lt:'◀ Medial (garis tengah)',rt:'Lateral ▶',
  items:[['poly','mus',[[-4.5,1.25],[-0.8,1.3],[-0.8,2.0],[-1.9,2.62],[-3.4,2.25],[-3.9,1.55],[-4.5,1.6]]],
   ['poly','lig',[[-0.8,2.0],[1.0,1.9],[0.6,2.55],[0.28,3.22],[0.02,3.32],[-0.6,2.85]]],
   ['poly','mus',[[0.4,1.2],[4.5,1.1],[4.5,2.05],[2.0,2.15],[0.9,2.4],[0.3,1.9]]],
   ['bone',[[-4.5,2.3],[-3.9,1.6],[-3.4,2.3],[-2.45,2.6]]],
   ['bone',[[-1.9,2.7],[-0.6,2.9],[0.0,3.4]]],
   ['bone',[[0.3,3.3],[0.8,2.6],[2.0,2.2],[4.5,2.1]]],
   ['gap',[[0.0,3.38],[0.3,3.3],[0.24,3.9],[0.04,3.95]]],
   ['lab',-3.9,1.6,'Krista sakral mediana',16,-16],['lab',-2.2,2.65,'Foramen sakral post. S2',0,22],['lab',-1.2,2.85,'Sakrum',-2,22],['lab',2.6,2.2,'Ilium',0,16],
   ['lab',0.15,3.4,'Celah SIJ',22,26],['lab',0.1,2.4,'Lig. SI posterior',-28,-40],['lab',2.8,1.65,'Gluteus maks.'],['lab',-2.4,1.8,'Multifidus']],
  needle:[[-4.3,.3],[0.12,3.3]],tgt:[0.13,3.38]}),
 caudalT:()=>({W:5,D:3.5,curv:false,lt:'◀ Lateral',rt:'Lateral ▶',
  items:[['poly','lig',[[-0.78,1.02],[0.78,1.02],[0.72,1.34],[-0.72,1.34]]],
   ['gap',[[-0.72,1.34],[0.72,1.34],[0.85,2.08],[-0.85,2.08]]],
   ['bone',[[-1.7,1.6],[-1.1,0.95],[-0.8,1.05],[-0.62,1.5]]],['bone',[[0.62,1.5],[0.8,1.05],[1.1,.95],[1.7,1.6]]],
   ['bone',[[-0.9,2.1],[0,2.16],[0.9,2.1]]],
   ['lab',-1.0,.95,'Kornu sakral',-4,-10],['lab',1.0,.95,'Kornu sakral',4,-10],['lab',0,1.18,'Lig. sakrokoksigeal',0,-26],['lab',0,1.7,'Kanalis sakralis'],['lab',0,2.2,'Dasar kanal (dorsal sakrum)',0,14]],
  tgt:[0,1.7]}),
 caudalL:()=>({W:5,D:3.5,curv:false,lt:'◀ Kaudal (koksigis)',rt:'Kranial ▶',
  items:[['poly','lig',[[-2.5,.8],[0.6,.95],[0.6,1.15],[-2.5,1.05]]],
   ['gap',[[-1.5,1.08],[0.6,1.15],[0.6,2.05],[-1.5,2.18]]],
   ['bone',[[0.6,1.0],[1.5,.92],[2.5,.86]]],
   ['bone',[[-2.5,2.4],[0,2.05],[2.5,1.85]]],
   ['lab',-1.6,.9,'Lig. sakrokoksigeal',0,-10],['lab',1.6,.9,'Atap kanal (apeks hiatus)',0,-10],['lab',-0.6,1.6,'Kanalis sakralis'],['lab',0.5,2.1,'Dasar kanal',0,16]],
  needle:[[-2.4,.25],[0.35,1.5]],tgt:[0.4,1.55]}),
 piri:()=>({W:12,D:8,curv:true,lt:'◀ Medial (sakrum/ilium)',rt:'Lateral (trokanter) ▶',
  items:[['poly','mus',[[-6,1.4],[6,1.6],[6,3.75],[-6,3.6]]],['line',[[-6,3.65],[6,3.8]]],
   ['poly','musL',[[-4.6,3.75],[4.6,3.88],[4.3,5.0],[-4.6,5.15]]],
   ['bone',[[-6,5.45],[-3.5,5.3],[-1.3,5.5]]],
   ['nerve',0.6,5.75,.85,.38],
   ['bone',[[4.3,5.1],[5.0,4.35],[6,4.05]]],
   ['lab',0,2.5,'Gluteus maksimus'],['lab',-1.5,4.45,'Piriformis'],['lab',-4.4,5.35,'Ilium',0,18],['lab',-1.2,5.5,'Greater sciatic notch',-4,30],['lab',0.6,5.75,'N. iskiadikus',30,20],['lab',5.0,4.35,'Trokanter mayor',-6,-12]],
  needle:[[5.8,.4],[-1.0,4.45]],tgt:[-1.0,4.45]}),
 sgn:()=>({W:9,D:6,curv:true,lt:'◀ Posterior',rt:'Anterior ▶',
  items:[['poly','mus',[[-4.5,1.0],[4.5,1.1],[4.5,3.1],[-4.5,3.3]]],['line',[[-4.5,3.28],[4.5,3.12]]],
   ['poly','mus',[[-4.5,3.35],[4.5,3.17],[4.5,4.3],[-4.5,4.6]]],
   ['bone',[[-4.5,4.75],[0,4.55],[4.5,4.4]]],
   ['vessel',-0.6,3.24,.22,'A'],
   ['lab',0,2.1,'Gluteus medius'],['lab',2,3.8,'Gluteus minimus'],['lab',2.6,4.48,'Sayap ilium',0,16],['lab',-0.6,3.24,'A. glutea sup. (Doppler)',-12,-24],['lab',1.6,3.2,'Bidang fasia med–min',10,-22]],
  needle:[[4.3,.3],[0.7,3.18]],tgt:[0.7,3.2]}),
 scn:()=>({W:5,D:3.5,curv:false,lt:'◀ Medial',rt:'Lateral ▶',
  items:[['line',[[-2.5,1.62],[0.2,1.66]]],
   ['poly','mus',[[-2.5,1.67],[0.15,1.7],[0.5,3.5],[-2.5,3.5]]],
   ['poly','mus',[[1.0,1.45],[2.5,1.38],[2.5,1.86],[1.8,1.72],[1.0,1.78]]],
   ['bone',[[0.2,2.45],[0.9,1.82],[1.8,1.76],[2.5,1.92]]],
   ['nerve',0.38,1.58,.13,.07,true],
   ['lab',-1,.8,'Subkutis (tebal)'],['lab',-1.2,1.64,'Fascia torakolumbal',0,-8],['lab',-1.2,2.6,'Erector spinae'],['lab',1.6,1.8,'Krista iliaka',0,22],['lab',1.8,1.5,'Glut. medius',0,-10],['lab',0.38,1.58,'N. cluneal sup.',-6,-26]],
  needle:[[2.4,.25],[0.46,1.55]],tgt:[0.38,1.58]}),
 ql:()=>({W:12,D:9,curv:true,sx:1.2,lt:'◀ Posterior',rt:'Anterior ▶',
  items:[['poly','mus',[[-6,1.4],[-2.6,1.5],[-3.5,3.3],[-3.6,4.8],[-6,5.2]]],
   ['poly','mus',[[1.5,1.2],[6,1.3],[6,2.0],[1.5,1.9]]],['poly','mus',[[1.2,1.95],[6,2.05],[6,3.0],[1.2,2.9]]],['poly','mus',[[1.0,2.95],[6,3.05],[6,3.5],[1.0,3.4]]],
   ['line',[[1.0,3.2],[-0.6,3.3]],'lig'],
   ['poly','mus',[[-3.5,3.3],[0.5,3.35],[0.8,5.0],[-1.5,5.6],[-3.5,4.8]]],
   ['bone',[[-3.1,5.95],[-1.0,5.75]]],
   ['poly','mus',[[-0.8,6.0],[1.6,5.9],[1.6,7.8],[-1.3,8.0]]],
   ['lab',-4.6,3.2,'Erector spinae'],['lab',3.8,1.65,'Obl. eksterna'],['lab',3.8,2.5,'Obl. interna'],['lab',3.8,3.25,'Transv. abd.'],['lab',-1.4,4.4,'Quadratus lumborum'],['lab',-2,5.85,'TP L3/L4',0,16],['lab',0.4,7.0,'Psoas']],
  needle:[[-5.8,.3],[-1.2,4.4]],tgt:[-1.2,4.4]}),
 glut:(deep)=>({W:10,D:7,curv:true,lt:'◀ Medial',rt:'Lateral ▶',
  items:[['poly','mus',[[-5,1.3],[1.5,1.4],[0,2.6],[-5,2.8]]],['line',[[-5,2.82],[0,2.62],[1.5,1.42],[5,1.38]]],
   ['poly','mus',[[-5,2.86],[0,2.66],[1.5,1.46],[5,1.42],[5,3.9],[-5,4.4]]],['line',[[-5,4.42],[5,3.92]]],
   ['poly','mus',[[-5,4.46],[5,3.96],[5,5.0],[-5,5.6]]],
   ['bone',[[-5,5.75],[0,5.35],[5,5.15]]],
   ['lab',-2.5,2.0,'Gluteus maksimus'],['lab',1.8,2.7,'Gluteus medius'],['lab',1.0,4.65,'Gluteus minimus'],['lab',-3,5.6,'Ilium',0,16]],
  needle:deep?[[4.8,.3],[0.5,4.75]]:[[4.8,.3],[1.0,3.0]],tgt:deep?[0.5,4.75]:[1.0,3.0]}),
 psoas:()=>({W:7,D:5,curv:false,lt:'◀ Medial',rt:'Lateral ▶',
  items:[['line',[[-3.5,.82],[3.5,.82]]],
   ['poly','mus',[[1.8,.86],[3.5,.86],[3.5,1.4],[1.8,1.36]]],
   ['line',[[-1.0,1.5],[3.5,1.42]]],
   ['poly','mus',[[-1.0,1.55],[3.5,1.46],[3.5,3.4],[0,3.6],[-1.2,2.6]]],
   ['vessel',-2.4,1.6,.45,'V'],['vessel',-1.45,1.5,.38,'A'],['nerve',-0.6,1.75,.36,.2],
   ['bone',[[-1.6,3.95],[0.5,3.5],[2.6,3.6],[3.5,3.9]]],
   ['lab',-2.4,1.6,'V. femoralis',0,-26],['lab',-1.45,1.5,'A. femoralis',0,-32],['lab',-0.6,1.75,'N. femoralis',10,30],['lab',2.6,1.1,'Sartorius'],['lab',1.6,2.6,'Iliopsoas'],['lab',1.0,.8,'Fascia lata',0,-6],['lab',2.6,1.44,'Fascia iliaka',0,-4],['lab',1.6,3.6,'Kaput femur',0,18]],
  needle:[[3.4,.25],[1.4,2.4]],tgt:[1.4,2.4]}),
 es:()=>{const s=SONO.mbb('L3');s.needle=[[5.2,.3],[1.9,3.0]];s.tgt=[1.9,3.0];return s;},
 gt:()=>({W:8,D:5.5,curv:false,lt:'◀ Posterior',rt:'Anterior ▶',
  items:[['poly','mus',[[-4,1.2],[-0.5,1.3],[-0.5,1.6],[-1.5,2.4],[-4,2.6]]],
   ['poly','lig',[[-0.5,1.3],[4,1.25],[4,1.55],[-0.5,1.6]]],
   ['poly','lig',[[-1.0,2.12],[1.1,2.08],[1.0,2.47],[-1.0,2.52]]],
   ['poly','lig',[[1.3,2.3],[2.4,2.55],[3.2,3.15],[2.6,3.3],[1.6,2.8]]],
   ['bone',[[-4,3.6],[-2.2,2.92],[-1.0,2.56],[1.0,2.52],[2.0,2.92],[3.2,3.6],[4,4.1]]],
   ['lab',-3.1,1.75,'Gluteus maks.'],['lab',2.8,1.4,'ITB / TFL',0,-10],['lab',0.4,2.3,'Tendon glut. medius',-14,-58],['lab',2.4,2.9,'Tendon glut. minimus',-4,34],
   ['lab',-3.2,3.3,'Facet posterior',0,26],['lab',0,2.6,'Facet lateral',0,30],['lab',2.9,3.4,'Facet anterior',-6,44],['lab',-1.6,2.6,'Bursa trokanter (normal tipis)',30,56]],
  needle:[[-3.8,.3],[-1.6,2.55]],tgt:[-1.6,2.6]}),
 hip:()=>({W:10,D:7,curv:true,lt:'◀ Proksimal (asetabulum)',rt:'Distal (leher femur) ▶',
  items:[['poly','mus',[[-5,1.2],[5,1.3],[5,2.2],[-5,2.1]]],['line',[[-5,2.15],[5,2.25]]],
   ['poly','musL',[[-5,2.2],[5,2.3],[5,4.6],[3.2,4.35],[1.2,3.88],[-1.5,3.6],[-5,3.7]]],
   ['poly','lig',[[-1.5,3.62],[1.2,3.9],[3.2,4.37],[5,4.65],[5,4.88],[3.2,4.6],[1.2,4.15],[-1.5,3.85]]],
   ['gap',[[1.1,4.18],[3.1,4.62],[3.1,4.82],[1.25,4.42]]],
   ['bone',[[-5,3.95],[-3.0,3.45]]],['poly','lig',[[-3.0,3.42],[-1.9,3.5],[-2.9,3.82]]],
   ['bone',[[-2.6,4.45],[-1.6,4.0],[-0.2,3.92],[0.9,4.12],[1.4,4.46],[3.0,4.9],[5,5.2]]],
   ['lab',0,1.7,'Sartorius / rektus femoris'],['lab',-0.5,3.0,'Iliopsoas'],['lab',-2.5,3.55,'Labrum',-6,-18],['lab',-3.9,3.7,'Asetabulum',0,26],
   ['lab',-0.4,3.95,'Kaput femur',0,26],['lab',3.6,4.95,'Leher femur',0,22],['lab',2.0,4.15,'Kapsul (lig. iliofemoral)',4,-30],['lab',1.45,4.38,'Resesus anterior',-30,30]],
  needle:[[4.8,.4],[1.5,4.3]],tgt:[1.45,4.35]}),
};

/* ---------- Procedure definitions ---------- */
// probe:{v,a,y,dir:[horiz,vert]} (horiz = lateral untuk P/A, = z untuk L); entry:{v,a,y}; tgt:[[a,y,z]] koordinat 3D sisi kanan
const TPY=lv=>LV[lv]+.05, TPZ=lv=>bz(LV[lv]+.05)-.42;
const PROC={};
function mbbProc(id,label,tps,extra){const t=tps.map(lv=>lv==='ala'?[.32,9.72,-.32]:[.26,TPY(lv),TPZ(lv)]);const pl=tps.find(x=>x!=='ala');
  PROC[id]={name:'Medial branch block '+label,guide:'USG',ver:'v',
   pos:'Prone, bantal di bawah abdomen untuk mengurangi lordosis.',
   probe:'Curvilinear, transversal paravertebral ("cross-axis view") setinggi prosesus transversus; kemudian long-axis view paramedian untuk konfirmasi level.',
   approach:'In-plane, lateral → medial.',
   target:'Groove pada pertemuan sisi lateral SAP dengan tepi kranial TP ('+tps.filter(x=>x!=='ala').map(x=>'TP '+x).join(' & ')+').',
   steps:['Hitung level dari sakrum ke kranial (long-axis paramedian)','Transversal setinggi TP: tampak SP, lamina, SAP, TP','Tusuk in-plane dari lateral, ujung jarum ke groove SAP–TP (kontak tulang)','Aspirasi, injeksi volume kecil; ulangi untuk TP kedua'],
   safety:['Jarak kulit–target ±45–50 mm (L3–L5) pada volunteer; obesitas (IMT tinggi) menurunkan kualitas visualisasi','Pada studi CT kadaver ada sebaran paraforaminal/epidural/intravaskular sesekali — volume kecil'],
   extra, refs:['greher1','greher2'], sono:[{title:'Transversal setinggi TP '+pl,sp:SONO.mbb(pl)}],
   p3:{probe:{v:'P',a:.62,y:TPY(pl),dir:[1,0]},entry:{v:'P',a:1.2,y:TPY(pl)},tgt:t,tl:tps.map(x=>x==='ala'?'L5 DR (ala)':'TP '+x)}};}
mbbProc('mbb:T12L1','T12–L1',['T12','L1'],'TP L1 = MB T12 (tervalidasi Greher). TP T12 = MB T11 — di luar level studi Greher (TP L1–L5); konfirmasi fluoroskopi bila ragu.');
mbbProc('mbb:L1L2','L1–L2',['L1','L2']);mbbProc('mbb:L2L3','L2–L3',['L2','L3']);mbbProc('mbb:L3L4','L3–L4',['L3','L4']);mbbProc('mbb:L4L5','L4–L5',['L4','L5']);
mbbProc('mbb:L5S1','L5–S1',['L5','ala'],'Ramus dorsal L5 (groove ala sakral) tidak termasuk teknik Greher — fluoroskopi lebih andal untuk target ini.');
[['L1','L2'],['L2','L3'],['L3','L4'],['L4','L5'],['L5','S1']].forEach(([a,b])=>{const ym=b==='S1'?9.8:(LV[a]+LV[b])/2;const x=b==='S1'?.24:.21;
  PROC['fia:'+a]={name:'Injeksi intra-artikular faset '+a+'–'+b,guide:'USG',ver:'v',
   pos:'Prone, bantal di bawah abdomen.',probe:'Curvilinear, transversal setinggi sendi faset (sedikit kaudal dari view TP).',
   approach:'In-plane (umumnya lateral → medial), menuju resesus posterior celah sendi.',
   target:'Celah sendi antara IAP (vertebra atas, medial) dan SAP (vertebra bawah, lateral).',
   steps:['Identifikasi level via long-axis paramedian','Transversal: SP → lamina → kompleks artikular; cari celah hipoekoik oblik','Jarum in-plane hingga masuk celah posterior','Volume kecil (kapasitas sendi terbatas)'],
   safety:['Titik tengah sendi ±3,15 cm dalam & ±1,9 cm lateral dari SP (rerata kadaver, Galiano 2005)','Degenerasi berat/osteofit menyulitkan visualisasi celah'],
   refs:['galiano'],sono:[{title:'Transversal setinggi sendi faset '+a+'–'+b,sp:SONO.fia()}],
   p3:{probe:{v:'P',a:.55,y:ym,dir:[1,0]},entry:{v:'P',a:1.15,y:ym},tgt:[[x,ym,bz(ym)-.52]],tl:['Faset '+a+'–'+b]}};});
Object.assign(PROC,{
 sij:{name:'Injeksi intra-artikular SIJ',guide:'USG',ver:'v',pos:'Prone.',
  probe:'Linear/curvilinear transversal; mulai di hiatus sakral, geser ke kranial hingga foramen sakral posterior S2 (level bawah) — atau S1 (level atas).',
  approach:'In-plane, medial → lateral menuju celah sendi.',
  target:'Celah hipoekoik antara tepi lateral sakrum dan tepi medial ilium (bagian bawah SIJ).',
  steps:['Transversal di level foramen S2: krista sakral mediana, foramen, sakrum, ilium','Identifikasi celah SIJ di antara sakrum & ilium','Jarum in-plane medial → lateral hingga masuk celah','Bila celah level bawah tak tampak (degenerasi), coba level atas (foramen S1)'],
  safety:['Kadaver: injeksi IA terkonfirmasi CT 90% di level bawah vs 70% level atas; total 80% (Klauser 2008)','Akurasi IA tetap di bawah fluoroskopi-kontras — pertimbangkan konfirmasi bila untuk blok diagnostik'],
  refs:['klauser'],sono:[{title:'Transversal setinggi foramen sakral posterior S2',sp:SONO.sij()}],
  p3:{probe:{v:'P',a:.35,y:9.08,dir:[1,0]},entry:{v:'P',a:.08,y:9.08},tgt:[[.56,9.08,-.62]],tl:['SIJ (kutub bawah)']}},
 caudal:{name:'Caudal epidural injection',guide:'USG',ver:'v',side:'C',pos:'Prone, bantal di bawah panggul.',
  probe:'Linear. Transversal di atas kornu sakral, lalu rotasi 90° ke longitudinal di antara kedua kornu.',
  approach:'In-plane longitudinal, kaudal → kranial menembus lig. sakrokoksigeal.',
  target:'Kanalis sakralis tepat di bawah lig. sakrokoksigeal (hiatus sakral).',
  steps:['Transversal: dua kornu hiperekoik dengan lig. sakrokoksigeal di antaranya ("frog eye")','Rotasi ke longitudinal: lig. sakrokoksigeal, atap dan dasar kanal','Jarum in-plane menembus ligamen sampai ujung di kanal','Aliran injeksi tanpa pembengkakan subkutan; jangan dorong jauh ke kranial'],
  safety:['Chen 2004: 70 pasien, penempatan di epidural kaudal 100% (konfirmasi kontras fluoroskopi)','Variasi (Kim 2016, n=339): jarak antar-kornu ±18 mm, lebar ligamen ±10,5 mm, diameter kanal ±6,8 mm (1,8% <2 mm); apeks hiatus–lipatan gluteal ±29 mm (−2 s/d 75 mm)','Ujung kantong dura umumnya setinggi S1–S2'],
  refs:['chen04','kim16'],sono:[{title:'Transversal (kornu sakral)',sp:SONO.caudalT()},{title:'Longitudinal (jarum in-plane)',sp:SONO.caudalL()}],
  p3:{probe:{v:'P',a:0,y:8.75,dir:[0,1]},entry:{v:'P',a:0,y:8.4},tgt:[[0,8.85,-.62]],tl:['Hiatus sakral']}},
 tfesi:{name:'Transforaminal ESI',guide:'Fluoro',ver:'g',pos:'Prone.',probe:'—',approach:'Fluoroskopi (oblik, pendekatan subpedikular/"safe triangle" atau retrodiskal/Kambin) dengan kontras real-time.',
  target:'Foramen intervertebral level radiks yang terlibat.',steps:['Dilakukan di bawah fluoroskopi dengan kontras; USG tidak menggantikan pencitraan kontras untuk TFESI'],
  safety:['Risiko injeksi intravaskular → kontras real-time (DSA bila tersedia); steroid partikulat dihindari'],refs:[],sono:[]},
 piri:{name:'Injeksi piriformis (± hidrodiseksi n. iskiadikus)',guide:'USG',ver:'v',pos:'Prone; bantal di bawah panggul dapat membantu.',
  probe:'Curvilinear, mulai di PSIS lalu geser ke kaudal hingga ilium "hilang" (awal greater sciatic notch); orientasikan oblik sejajar serabut piriformis ke arah trokanter mayor.',
  approach:'In-plane, umumnya lateral → medial.',target:'Perut otot piriformis (dalam terhadap gluteus maksimus), di atas n. iskiadikus.',
  steps:['Sakrum lateral & ilium → geser kaudal sampai sciatic notch','Piriformis tampak dalam terhadap gluteus maksimus, menuju trokanter','Konfirmasi dinamis: rotasi internal/eksternal panggul menggerakkan piriformis','Identifikasi n. iskiadikus di dalam/kaudal piriformis sebelum menusuk','Jarum in-plane ke perut otot / sarung tendon'],
  safety:['Kadaver: USG 95% tepat di piriformis vs fluoroskopi-kontras 30% — sebagian besar meleset ke gluteus maksimus (Finnoff 2008)','Hindari injeksi intraneural n. iskiadikus'],
  refs:['smith06','finnoff'],sono:[{title:'Oblik sejajar piriformis (sciatic notch → trokanter)',sp:SONO.piri()}],
  p3:{probe:{v:'P',a:1.1,y:8.93,dir:[1,-.25]},entry:{v:'P',a:1.78,y:8.78},tgt:[[1.15,8.9,-.5]],tl:['Piriformis']}},
 sgn:{name:'Blok SGN — bidang fasia gluteus medius/minimus',guide:'USG',ver:'p',pos:'Prone / lateral dekubitus.',
  probe:'Di atas sayap ilium (bokong superolateral) hingga tampak gluteus medius – gluteus minimus – ilium. Orientasi probe rinci: ikuti publikasi asli (di sini skematik).',
  approach:'In-plane ke bidang fasia antara gluteus medius dan minimus.',target:'Bidang fasia gluteus medius/minimus tempat SGN berjalan; a. glutea superior (Doppler) sebagai penanda.',
  steps:['Identifikasi gluteus medius, minimus, dan permukaan ilium','Doppler: a. glutea superior di bidang med–min','Jarum in-plane ke bidang fasia, hidrodiseksi plane'],
  safety:['Studi kadaver: pewarnaan SGN tanpa menyebar ke piriformis, n. iskiadikus, atau n. gluteus inferior (Ferreira-Dos-Santos 2022) — bukti klinis masih terbatas'],
  refs:['ferreira'],sono:[{title:'Gluteus medius – minimus – ilium (skematik)',sp:SONO.sgn()}],
  p3:{probe:{v:'P',a:1.3,y:9.42,dir:[1,0]},entry:{v:'P',a:1.85,y:9.38},tgt:[[1.3,9.36,-.52]],tl:['Bidang med–min (SGN)']}},
 scn:{name:'Blok n. cluneal superior',guide:'USG',ver:'v',pos:'Prone.',
  probe:'Linear transversal mulai setinggi PSIS, geser ke kranial sampai gluteus maksimus hilang dan gluteus medius + sayap ilium tampak (teknik Bodner). Alternatif: long-axis mengikuti saraf.',
  approach:'In-plane.',target:'Struktur oval hiperekoik (SCN medial) di antara krista iliaka dan fascia torakolumbal; alternatif (Fan): injeksi di tepi superior krista iliaka tanpa identifikasi saraf.',
  steps:['Transversal di PSIS → geser kranial','Cari oval hiperekoik antara krista iliaka & fascia TL','Jarum in-plane perineural, volume kecil (laporan diagnostik ±2 mL lidokain 1%)','Pasien tua/obes: pakai teknik tepi superior krista (Fan)'],
  safety:['Kadaver (Kuniya): cabang medial/tengah/lateral SCN melintasi krista ±71/76/82 mm dari midline','Belum ada komplikasi blok SCN yang dilaporkan (review Luo 2024)'],
  refs:['luo','bodner','kuniya'],sono:[{title:'Transversal di krista iliaka posterior',sp:SONO.scn()}],
  p3:{probe:{v:'P',a:.78,y:10.1,dir:[1,0]},entry:{v:'P',a:1.35,y:10.08},tgt:[[.75,10.08,-.86]],tl:['SCN di krista']}},
 mcn:{name:'Blok n. cluneal medius',guide:'USG',ver:'g',pos:'Prone.',probe:'Belum ada deskripsi teknik USG yang saya verifikasi rinci — skema sonogram tidak ditampilkan.',
  approach:'—',target:'Bawah lig. sakroiliaka posterior panjang (LPSL), lateral sakrum, kaudal PSIS.',steps:['Konfirmasi teknik dari sumber primer sebelum dipakai'],
  safety:['Literatur terutama laporan kasus (blok MCN USG serial pada 1 pasien — Reeh 2023)'],refs:['reeh'],sono:[],
  p3:{tgt:[[.55,9.05,-.98]],tl:['MCN di LPSL']}},
 ql:{name:'TrP injection quadratus lumborum',guide:'USG',ver:'g',pos:'Lateral dekubitus (sisi sakit di atas) atau prone.',
  probe:'Curvilinear transversal di flank di atas krista iliaka (setinggi L3–L4).',approach:'In-plane dari posterior ke perut otot QL.',
  target:'Taut band / TrP di perut otot QL (posterolateral TP).',steps:['Identifikasi TP, erector spinae (posterior), psoas (anterior), QL (lateral) dan tiga otot dinding abdomen','Konfirmasi TrP dengan palpasi; jarum in-plane ke QL','Cari local twitch response; volume kecil'],
  safety:['Ginjal & rongga retroperitoneal di anterior — selalu visualisasi ujung jarum','Skema mengikuti anatomi umum pandangan blok QL; bukan dari studi TrP USG spesifik'],refs:['travell'],sono:[{title:'Transversal flank (anatomi umum)',sp:SONO.ql()}],
  p3:{probe:{v:'L',a:-.35,y:10.8,dir:[1,0]},entry:{v:'P',a:.95,y:10.85},tgt:[[1.0,10.85,-.42]],tl:['QL']}},
 gmed:{name:'TrP injection gluteus medius',guide:'USG',ver:'g',pos:'Prone / lateral dekubitus.',probe:'Linear/curvilinear di bawah krista iliaka posterior, di atas TrP yang dipalpasi.',
  approach:'In-plane.',target:'TrP di gluteus medius (dalam terhadap gluteus maksimus di bagian medial; di superolateral langsung di bawah aponeurosis gluteal).',
  steps:['Identifikasi lapisan glut. maksimus → medius → minimus → ilium','Jarum in-plane ke taut band; local twitch'],safety:['Hindari a./v. glutea superior (Doppler)'],refs:['travell'],sono:[{title:'Lapisan gluteal (anatomi umum)',sp:SONO.glut(false)}],
  p3:{probe:{v:'P',a:1.2,y:9.78,dir:[1,0]},entry:{v:'P',a:1.75,y:9.72},tgt:[[1.15,9.75,-.7]],tl:['TrP glut. medius']}},
 gmin:{name:'TrP injection gluteus minimus',guide:'USG',ver:'g',pos:'Prone / lateral dekubitus.',probe:'Curvilinear di bokong superolateral.',approach:'In-plane.',
  target:'TrP di gluteus minimus — lapisan terdalam, tepat di atas ilium.',steps:['Identifikasi glut. medius & minimus serta permukaan ilium','Jarum in-plane menembus medius ke minimus; local twitch'],
  safety:['Otot dalam — visualisasi ujung jarum wajib; SGN & a. glutea superior berjalan di antara medius–minimus'],refs:['travell'],sono:[{title:'Lapisan gluteal (anatomi umum)',sp:SONO.glut(true)}],
  p3:{probe:{v:'P',a:1.35,y:9.45,dir:[1,0]},entry:{v:'P',a:1.85,y:9.4},tgt:[[1.35,9.4,-.5]],tl:['TrP glut. minimus']}},
 psoas:{name:'TrP injection iliopsoas (regio inguinal)',guide:'USG',ver:'g',pos:'Supine.',probe:'Linear transversal di bawah ligamen inguinal.',approach:'In-plane lateral → medial, tetap lateral dari n. femoralis.',
  target:'Iliopsoas di lateral n. femoralis, di bawah fascia iliaka.',steps:['Identifikasi v. & a. femoralis (medial), n. femoralis, iliopsoas','Doppler; jarum dari lateral ke perut iliopsoas'],
  safety:['Berkas neurovaskular femoral di medial — risiko tinggi; pertimbangkan alternatif pada pasien antikoagulan'],refs:['travell'],sono:[{title:'Transversal di regio inguinal (anatomi umum)',sp:SONO.psoas()}],
  p3:{probe:{v:'A',a:1.0,y:8.5,dir:[1,0]},entry:{v:'A',a:1.6,y:8.45},tgt:[[1.0,8.45,.5]],tl:['Iliopsoas']}},
 es:{name:'TrP injection erector spinae',guide:'USG',ver:'g',pos:'Prone.',probe:'Curvilinear transversal paraspinal.',approach:'In-plane lateral → medial.',
  target:'TrP di iliokostalis/longissimus; multifidus di atas lamina.',steps:['Identifikasi SP, lamina, TP, multifidus, erector','Jarum in-plane ke taut band'],safety:['Tetap superfisial dari TP — di bawah TP ada psoas & ruang paravertebral'],refs:['travell'],
  sono:[{title:'Transversal paraspinal (anatomi umum)',sp:SONO.es()}],p3:{probe:{v:'P',a:.75,y:11.4,dir:[1,0]},entry:{v:'P',a:1.3,y:11.4},tgt:[[.85,11.4,-.62]],tl:['TrP erector']}},
 gt:{name:'Injeksi peritrokanter / bursa trokanter',guide:'USG',ver:'v',pos:'Lateral dekubitus, sisi sakit di atas.',probe:'Linear/curvilinear transversal (aksial) di atas trokanter mayor.',
  approach:'In-plane.',target:'Bursa trokanter (subgluteus maksimus) di atas facet posterior & insersi lateral gluteus medius; evaluasi tendon gluteus medius/minimus lebih dulu.',
  steps:['Kenali empat facet: anterior (tendon glut. minimus), lateral & superoposterior (glut. medius), posterior (ditutup bursa trokanter)','Nilai tendinopati/robekan','Jarum in-plane ke ruang peritrokanter/bursa'],
  safety:['Bursitis primer jarang — sebagian besar GTPS adalah tendinopati gluteal','Hindari injeksi steroid intratendinous'],refs:['pfirrmann'],sono:[{title:'Aksial di atas trokanter mayor',sp:SONO.gt()}],
  p3:{probe:{v:'L',a:-.12,y:8.62,dir:[1,0]},entry:{v:'L',a:-.75,y:8.62},tgt:[[1.84,8.62,-.2]],tl:['Bursa trokanter']}},
 hip:{name:'Injeksi intra-artikular hip (anterior)',guide:'USG',ver:'v',pos:'Supine, panggul netral (bantal di bawah lutut).',
  probe:'Curvilinear (linear pada pasien kurus), oblik sagital sejajar leher femur; identifikasi berkas neurovaskular femoral lebih dulu.',
  approach:'In-plane, distal (kaudolateral) → proksimal (kraniomedial).',target:'Resesus sinovial anterior di junction kaput–kolum femur.',
  steps:['Scout transversal: a./v./n. femoralis di atas kaput femur','Geser lateral & rotasi oblik sejajar leher femur','Doppler: singkirkan a. sirkumfleksa di jalur jarum','Jarum in-plane hingga kontak tulang di head–neck junction, lalu injeksi'],
  safety:['Berkas neurovaskular femoral di medial','Labrum tampak sebagai segitiga hiperekoik di kranial kaput'],refs:['nysorahip'],sono:[{title:'Oblik sagital sejajar leher femur',sp:SONO.hip()}],
  p3:{probe:{v:'A',a:1.18,y:8.5,dir:[.45,-.9]},entry:{v:'A',a:1.42,y:8.0},tgt:[[1.12,8.62,.28]],tl:['Head–neck junction']}},
});
const PMAP={facet:{L1:['mbb:L1L2','fia:L1'],L2:['mbb:L2L3','fia:L2'],L3:['mbb:L3L4','fia:L3'],L4:['mbb:L4L5','fia:L4'],L5:['mbb:L5S1','fia:L5']},
  disc:{},radic:{_:['caudal','tfesi']},stenosis:{_:['caudal']},maigne:{_:['mbb:T12L1','scn']},sij:{_:['sij']},piri:{_:['piri']},sgn:{_:['sgn']},scn:{_:['scn']},mcn:{_:['mcn']},
  myo:{QL:['ql'],GMED:['gmed'],GMIN:['gmin'],PSOAS:['psoas'],ES:['es']},gtps:{_:['gt','sgn']},hip:{_:['hip']}};
function procsFor(dx,v){const m=PMAP[dx]||{};return m[v]||m._||[];}
['gt','gmed','gmin','piri','sgn','hip'].forEach(id=>PROC[id].p3.tgt.forEach(t=>{t[0]*=WIDEN;}));

/* ---------- 3D overlay ---------- */
const injGroup=new THREE.Group();scene.add(injGroup);
const tgtMat=new THREE.MeshBasicMaterial({color:0x3df5a0,depthTest:false,transparent:true});
const haloMat=new THREE.MeshBasicMaterial({color:0x3df5a0,depthTest:false,transparent:true,opacity:.25});
const ndlMat=new THREE.MeshBasicMaterial({color:0xf2f6ff,depthTest:false,transparent:true,opacity:.95});
const prbMat=new THREE.MeshStandardMaterial({color:0x9aa7b8,roughness:.4,metalness:.2});
const prbTip=new THREE.MeshBasicMaterial({color:0x40c8ff});
let INJ_HALOS=[];
function sideList(d){const es=effSide(d);return es==='B'?[-1,1]:[es==='R'?-1:1];}
function buildInj(){injGroup.clear();INJ_HALOS=[];
  if(!(S.inj&&S.mode==='dx'))return;
  const d=DXM[S.dx],v=S.vars[d.id],list=procsFor(d.id,v);if(!list.length)return;
  const sel=S.proc[d.id+'|'+v]||list[0];
  list.forEach(pid=>{const pr=PROC[pid];if(!pr.p3)return;const sides=pr.side==='C'?[-1]:sideList(d);
    sides.forEach(sd=>{const g=pr.p3;
      g.tgt.forEach((t,i)=>{const p=V(sd*t[0],t[1],t[2]);const m=new THREE.Mesh(new THREE.SphereGeometry(.055,16,12),tgtMat);m.position.copy(p);m.renderOrder=20;injGroup.add(m);
        const h=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),haloMat);h.position.copy(p);h.renderOrder=19;injGroup.add(h);INJ_HALOS.push(h);
        if(pid===sel){const el=document.createElement('div');el.className='lab tg';el.textContent=g.tl[i];labelsEl.appendChild(el);LBL.push({el,p,n:null});}});
      if(pid!==sel||!g.probe)return;
      const T=V(sd*g.tgt[0][0],g.tgt[0][1],g.tgt[0][2]);
      const e=hit(g.entry.v,g.entry.a,g.entry.y,sd).p;
      const len=e.distanceTo(T);const nd=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,len,8),ndlMat);
      nd.position.copy(e).add(T).multiplyScalar(.5);nd.quaternion.setFromUnitVectors(V(0,1,0),T.clone().sub(e).normalize());nd.renderOrder=21;injGroup.add(nd);
      const hb=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.22,12),ndlMat);hb.position.copy(e).add(e.clone().sub(T).normalize().multiplyScalar(.11));hb.quaternion.copy(nd.quaternion);hb.renderOrder=21;injGroup.add(hb);
      const ph=hit(g.probe.v,g.probe.a,g.probe.y,sd);const n=ph.n.normalize();
      let dir=g.probe.v==='L'?V(0,g.probe.dir[1],g.probe.dir[0]):V(sd*g.probe.dir[0],g.probe.dir[1],0);
      if(g.probe.v==='L'&&g.probe.dir[0]===1&&g.probe.dir[1]===0)dir=V(0,0,1);
      dir.sub(n.clone().multiplyScalar(dir.dot(n))).normalize();const zA=dir.clone().cross(n).normalize();
      const pb=new THREE.Mesh(new THREE.BoxGeometry(.55,.3,.13),prbMat);const mtx=new THREE.Matrix4().makeBasis(dir,n,zA);pb.quaternion.setFromRotationMatrix(mtx);
      pb.position.copy(ph.p).addScaledVector(n,.15);injGroup.add(pb);
      const tip=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),prbTip);tip.position.copy(pb.position).addScaledVector(dir,.24).addScaledVector(n,.16);injGroup.add(tip);
      S._probeCam={p:ph.p.clone(),n:n.clone(),t:T.clone()};
    });});
}
function viewProbe(){const c=S._probeCam;if(!c)return;const p=c.p.clone().addScaledVector(c.n,7.5).add(V(0,1.2,0));
  tween={t0:performance.now(),dur:700,fp:camera.position.clone(),ft:controls.target.clone(),tp:p,tt:c.t.clone()};document.querySelectorAll('#views button').forEach(b=>b.classList.remove('on'));}

/* ---------- panel section ---------- */
function injHTML(d){const v=S.vars[d.id],list=procsFor(d.id,v);
  if(!list.length)return `<h3>Titik injeksi & panduan USG</h3><p class="note">Tidak ada prosedur injeksi yang ditampilkan untuk diagnosis ini (lini pertama: rehabilitasi; opsi lanjutan lihat di atas).</p>`;
  const key=d.id+'|'+v,sel=S.proc[key]&&list.includes(S.proc[key])?S.proc[key]:list[0];const pr=PROC[sel];const vr=VER[pr.ver];
  return `<h3>Titik injeksi & panduan USG</h3>
  <div class="vars">${list.map(id=>`<button data-proc="${id}" data-key="${key}" class="${id===sel?'on':''}">${PROC[id].name}</button>`).join('')}</div>
  <div class="procbox">
   <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:8px 0 6px"><span class="vb ${pr.ver}">${vr[0]}</span><span class="tag">${pr.guide==='USG'?'Panduan USG':'Fluoroskopi'}</span>
   ${pr.p3&&pr.p3.probe?`<button class="mi-chip" data-viewprobe="1" style="margin-left:auto">Lihat probe di 3D</button>`:''}</div>
   ${pr.sono.map((s,i)=>`<div class="sonoT">${s.title}</div><div class="sono" data-si="${i}">${sonoSVG(s.sp,S.sonoLab)}</div>`).join('')}
   ${pr.sono.length?`<div style="display:flex;gap:6px;margin-top:6px"><button class="mi-chip ${S.sonoLab?'on':''}" data-sonolab="1">Label sonogram</button><span class="note" style="align-self:center">Skema ilustratif, bukan gambar USG asli</span></div>`:''}
   <table class="kv"><tr><td>Posisi</td><td>${pr.pos}</td></tr><tr><td>Probe</td><td>${pr.probe}</td></tr><tr><td>Jarum</td><td>${pr.approach}</td></tr><tr><td>Target</td><td>${pr.target}</td></tr></table>
   ${pr.extra?`<p class="note" style="color:#ffd28a">${pr.extra}</p>`:''}
   <div class="note" style="margin-top:6px"><b style="color:#cfd8e6">Langkah</b></div><ol class="steps">${pr.steps.map(x=>`<li>${x}</li>`).join('')}</ol>
   <div class="note"><b style="color:#cfd8e6">Data & keamanan</b></div><ul>${pr.safety.map(x=>`<li>${x}</li>`).join('')}</ul>
   ${pr.refs.length?refHTML(pr.refs):''}
  </div>`;}

/* ============================== APPLY ============================== */
function apply(){
  const list=[];
  if(S.mode==='dx'){const d=DXM[S.dx];zonesFor(d.id,S.vars[d.id],effSide(d)).forEach(z=>list.push({z,col:KCOL[z.k]}));}
  else if(S.mode==='cmp'){S.cmp.forEach((id,ix)=>{const d=DXM[id];zonesFor(id,S.vars[id],effSide(d)).forEach(z=>list.push({z,col:CMPCOL[ix]}));});}
  pushZones(list);setMarkers();buildInj();setFocus();renderLegend();renderPanel();updateSideSeg();
}
function renderLegend(){const L=document.getElementById('legend');
  if(S.mode==='cmp'){L.innerHTML=S.cmp.map((id,i)=>`<div><i style="background:${CMPCOL[i]}"></i>${DXM[id].name}</div>`).join('')+'<div style="color:var(--mute)">garis bergerak = neuropatik</div>';}
  else if(S.mode==='tap'){L.innerHTML='<div><i style="background:#40c8ff"></i>Ketuk lokasi nyeri pasien</div>';}
  else L.innerHTML=`<div><i style="background:${KCOL.p}"></i>Nyeri primer / lokal</div><div><i style="background:${KCOL.r}"></i>Nyeri rujukan (somatik)</div><div><i style="background:${KCOL.n}"></i>Neuropatik / radikular</div>`;}

/* ============================== PANEL UI ============================== */
const content=document.getElementById('content');
const esc=s=>s;
function refHTML(ids){if(!ids||!ids.length)return '<p class="note">Pola klinis umum — bukan dari studi pemetaan spesifik.</p>';
  return '<div class="refs">'+ids.map(k=>{const r=REFS[k];return r.u?`<div>• <a href="${r.u}" target="_blank" rel="noopener">${r.t}</a></div>`:`<div class="note">• ${r.t}</div>`;}).join('')+'</div>';}
function chipsHTML(sel,isCmp){return GROUPS.map(g=>`<div class="grp">${g}</div><div class="chips">`+DX.filter(d=>d.grp===g).map(d=>{
   const on=isCmp?S.cmp.includes(d.id):S.dx===d.id;const ix=S.cmp.indexOf(d.id);
   return `<button class="chip ${on?'on':''}" data-dx="${d.id}">${isCmp&&on?`<span class="sw" style="background:${CMPCOL[ix]}"></span>`:''}${d.name}</button>`;}).join('')+'</div>').join('');}
function varsHTML(d){if(d.vars.length<2)return '';return `<div class="vars">`+d.vars.map(v=>`<button data-var="${v.id}" data-d="${d.id}" class="${S.vars[d.id]===v.id?'on':''}">${v.label}</button>`).join('')+'</div>';}
function cardHTML(d){const vv=d.vars.find(x=>x.id===S.vars[d.id]);const es=effSide(d);
  return `<div class="card"><h2>${d.name}${d.vars.length>1?' · '+vv.label:''}</h2>
  <span class="tag">${d.grp}</span><span class="tag">${es==='B'?'Bilateral / sentral':es==='R'?'Sisi kanan':'Sisi kiri'}</span>
  ${varsHTML(d)}
  <h3>Pain generator</h3><p>${d.gen}</p>
  <h3>Pola nyeri</h3><p>${d.pat}</p>${vv.note?`<p><b>${vv.label}:</b> ${vv.note}</p>`:''}
  <h3>Ciri klinis kunci</h3><ul>${d.feat.map(x=>`<li>${x}</li>`).join('')}</ul>
  <h3>Tes / pemeriksaan</h3><ul>${d.tests.map(x=>`<li>${x}</li>`).join('')}</ul>
  <h3>Konfirmasi diagnostik</h3><p>${d.conf}</p>
  <h3>Opsi intervensi</h3><ul>${d.intv.map(x=>`<li>${x}</li>`).join('')}</ul>
  ${injHTML(d)}
  <h3>Referensi</h3>${refHTML(d.refs)}
  ${S.anat?'':'<p class="note" style="margin-top:10px">Tekan <b>Anatomi</b> di kanvas untuk melihat struktur generator yang menyala.</p>'}
  </div>`;}
function cmpHTML(){if(!S.cmp.length)return '<p class="empty">Pilih hingga 3 diagnosis untuk ditumpuk di model 3D.</p>';
  const ds=S.cmp.map(id=>DXM[id]);
  const row=(lbl,f)=>`<tr><td>${lbl}</td>${ds.map(d=>`<td>${f(d)}</td>`).join('')}</tr>`;
  return `<div class="scrollx"><table class="cmp"><tr><th></th>${ds.map((d,i)=>`<th><span class="sw" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${CMPCOL[i]};margin-right:5px"></span>${d.name}${d.vars.length>1?' ('+d.vars.find(v=>v.id===S.vars[d.id]).label+')':''}</th>`).join('')}</tr>
   ${row('Lokasi utama',d=>d.loc)}${row('Generator',d=>d.gen.split('. ')[0]+'.')}${row('Pembeda kunci',d=>d.feat.slice(0,2).join('; '))}${row('Konfirmasi',d=>d.conf)}</table></div>
   ${ds.filter(d=>d.vars.length>1).map(d=>`<div style="margin-top:8px"><span class="note">${d.name}:</span>${varsHTML(d)}</div>`).join('')}`;}
function tapHTML(){
  if(!S.tap)return `<p class="empty">Ketuk lokasi nyeri pasien pada model 3D (putar dulu ke sisi yang sesuai). Daftar akan menampilkan generator yang dapat merujuk nyeri ke titik tersebut, diurutkan menurut kesesuaian pola.</p>`;
  const {region,res}=S.tap;
  return `<div class="card"><h2>${region}</h2><p class="note">Generator yang polanya mencakup titik ini (skor = intensitas pola tipikal di titik tsb.). Ketuk nama untuk membuka.</p>
   <div class="tapres">${res.length?res.map(r=>`<div class="it" data-go="${r.id}" data-v="${r.v}"><div class="bar" style="width:${Math.round(r.s*70)+6}px"></div><div class="nm">${r.name}</div><div class="sc">${Math.round(r.s*100)}</div></div>`).join(''):'<p class="empty">Tidak ada pola dalam database yang mencakup titik ini.</p>'}</div></div>`;}
function staticHTML(){return `<div class="card warn"><h3>Red flags — singkirkan lebih dahulu</h3><ul>
  <li>Cauda equina: retensi urin, saddle anesthesia, defisit bilateral progresif</li><li>Riwayat keganasan, penurunan berat badan, nyeri malam konstan</li>
  <li>Demam, imunosupresi, IDU → infeksi (spondilodiskitis, abses epidural)</li><li>Trauma / osteoporosis / steroid kronik → fraktur</li>
  <li>Nyeri non-spinal: AAA, ginjal, ginekologi, retroperitoneal</li></ul></div>
  <div class="card"><h3 style="margin-top:0">Catatan penggunaan</h3><p class="note">Peta menunjukkan pola tipikal untuk edukasi dan penalaran klinis. Variasi individual besar dan pola antar-generator tumpang tindih; peta ini bukan alat diagnosis tunggal. Model tubuh skematik, bukan anatomi presisi. Proporsi pinggul, bokong, dan paha disesuaikan (Nov 2026) supaya tulang dan otot BodyParts3D di mode Detail berada di dalam kulit.</p></div>`;}
function renderPanel(){
  let h='';
  if(S.mode==='dx'){h=chipsHTML(S.dx,false)+cardHTML(DXM[S.dx]);}
  else if(S.mode==='cmp'){h=`<p class="note" style="margin:0">Mode banding: tumpuk pola hingga 3 diagnosis dengan warna berbeda.</p>`+chipsHTML(null,true)+cmpHTML();}
  else h=tapHTML();
  content.innerHTML=h+staticHTML();
}
content.addEventListener('click',e=>{
  const c=e.target.closest('[data-dx]');if(c){const id=c.dataset.dx;
    if(S.mode==='cmp'){const i=S.cmp.indexOf(id);if(i>=0)S.cmp.splice(i,1);else{if(S.cmp.length>=3)S.cmp.shift();S.cmp.push(id);}}
    else S.dx=id; apply(); return;}
  const pb=e.target.closest('[data-proc]');if(pb){S.proc[pb.dataset.key]=pb.dataset.proc;S.inj=true;btnInj.classList.add('on');if(!S.anat)setAnat(true);apply();setTimeout(viewProbe,30);return;}
  if(e.target.closest('[data-viewprobe]')){if(!S.inj){S.inj=true;btnInj.classList.add('on');apply();}setTimeout(viewProbe,30);return;}
  if(e.target.closest('[data-sonolab]')){S.sonoLab=!S.sonoLab;renderPanel();return;}
  const v=e.target.closest('[data-var]');if(v){S.vars[v.dataset.d]=v.dataset.var;apply();return;}
  const g=e.target.closest('[data-go]');if(g){S.mode='dx';S.dx=g.dataset.go;S.vars[S.dx]=g.dataset.v;if(S.tap&&DXM[S.dx].side==='uni')S.side=S.tap.side;PU.uPick.value.w=0;setModeSeg();apply();
    const pn=document.getElementById('panel'); if(innerWidth>=900) pn.scrollTop=0; else MI.toStage();}
});
function setModeSeg(){document.querySelectorAll('#modeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.m===S.mode));}
document.getElementById('modeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.mode=b.dataset.m;if(S.mode!=='tap')PU.uPick.value.w=0;else if(S.tap)PU.uPick.value.w=1;setModeSeg();apply();});
function updateSideSeg(){const bi=S.mode==='dx'&&DXM[S.dx].side==='bi';
  document.querySelectorAll('#sideSeg button').forEach(b=>{b.classList.toggle('on',bi?b.dataset.s==='B':b.dataset.s===S.side);b.disabled=S.mode==='tap'||(bi&&b.dataset.s!=='B');});}
document.getElementById('sideSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;S.side=b.dataset.s;apply();});

/* ---------- canvas tools ---------- */
const btnAnat=document.getElementById('btnAnat'),opWrap=document.getElementById('opWrap'),op=document.getElementById('op'),btnLab=document.getElementById('btnLab');
function setAnat(on){S.anat=on;btnAnat.classList.toggle('on',on);opWrap.style.display=on?'inline-flex':'none';syncAnat();skinMat.opacity=on?S.op:1;skinMat.depthWrite=!on;renderPanel();}
btnAnat.onclick=()=>setAnat(!S.anat);
const btnInj=document.getElementById('btnInj');btnInj.onclick=()=>{S.inj=!S.inj;btnInj.classList.toggle('on',S.inj);if(S.inj&&S.mode!=='dx'){S.mode='dx';setModeSeg();}apply();};
op.oninput=()=>{S.op=+op.value;if(S.anat)skinMat.opacity=S.op;};
btnLab.onclick=()=>{S.labels=!S.labels;btnLab.classList.toggle('on',S.labels);setMarkers();};

/* ---------- camera views ---------- */
let tween=null;
function fitDist(h){const vf=THREE.MathUtils.degToRad(camera.fov)/2;const hf=Math.atan(Math.tan(vf)*camera.aspect);return Math.max(h/2/Math.tan(vf),h*0.42/Math.tan(hf));}
function view(v){const sd=S.side==='L'?1:-1;let t,p;const d=fitDist(13.5);
  if(v==='P'){t=V(0,6.9,0);p=V(0,8.2,-d);} else if(v==='A'){t=V(0,6.9,0);p=V(0,8.2,d);} else if(v==='L'){t=V(0,6.9,0);p=V(sd*d,8.2,0);}
  else {t=V(sd*.35,9.6,0);const dz=fitDist(6.8);p=V(sd*dz*.45,10.6,-dz*.9);}
  tween={t0:performance.now(),dur:650,fp:camera.position.clone(),ft:controls.target.clone(),tp:p,tt:t};
  document.querySelectorAll('#views button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));}
document.getElementById('views').addEventListener('click',e=>{const b=e.target.closest('button');if(b)view(b.dataset.v);});

/* ---------- tap to differential ---------- */
let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()};});
renderer.domElement.addEventListener('pointerup',e=>{if(!down)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;down=null;
  if(moved>7||dt>500)return;if(S.mode!=='tap'){return;}
  const r=renderer.domElement.getBoundingClientRect();const m=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(m,camera);const prev=skinMat.side;const h=ray.intersectObjects(bodyMeshes,false)[0];skinMat.side=prev;if(!h)return;
  const p=h.point,n=h.face.normal.clone().transformDirection(h.object.matrixWorld);
  PU.uPick.value.set(p.x,p.y,p.z,1);
  const side=p.x<-0.05?'R':p.x>0.05?'L':'R';
  const res=[];
  DX.forEach(d=>d.vars.forEach(vv=>{const sides=d.side==='bi'?['B']:['R','L'];let best=0;
    sides.forEach(sd=>zonesFor(d.id,vv.id,sd).forEach(z=>{best=Math.max(best,wAt(p,z));}));
    if(best>.12)res.push({id:d.id,v:vv.id,s:best,name:d.name+(d.vars.length>1?' — '+vv.label:'')});}));
  res.sort((a,b)=>b.s-a.s);
  S.tap={region:regionName(p,n),res:res.slice(0,10),side};renderPanel();
});
function regionName(p,n){const sd=p.x<-0.05?'kanan':p.x>0.05?'kiri':'midline';
  const asp=n.z<-.5?'posterior':n.z>.5?'anterior':(Math.abs(p.x)>0.6?'lateral':'medial');let r;
  if(p.y>12.6)r='Torakal';else if(p.y>10.45)r=asp==='anterior'?'Abdomen':'Lumbal';else if(p.y>9.6)r=asp==='anterior'?'Abdomen bawah / inguinal':asp==='lateral'?'Pinggul lateral (krista)':'Lumbosakral / krista iliaka';
  else if(p.y>7.9)r=asp==='anterior'?'Groin':asp==='lateral'?'Pinggul lateral / trokanter':'Bokong';else if(p.y>5.4)r='Paha '+asp;else if(p.y>4.5)r='Lutut '+asp;else if(p.y>.95)r='Tungkai bawah '+asp;else r='Kaki / pergelangan';
  return r+' · '+sd;}

/* ============================== LOOP ============================== */
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);
const tmp=V(0,0,0),cdir=V(0,0,0);
function orient(){camera.getWorldDirection(cdir);let t;
  if(Math.abs(cdir.z)>Math.abs(cdir.x)) t=cdir.z>0?'Tampak belakang · kanan pasien = kanan layar':'Tampak depan · kanan pasien = kiri layar';
  else t=cdir.x>0?'Tampak lateral kanan':'Tampak lateral kiri';document.getElementById('orient').textContent=t;}
function loop(now){
  requestAnimationFrame(loop);PU.uT.value=now/1000;
  if(tween){const k=Math.min(1,(now-tween.t0)/tween.dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;camera.position.lerpVectors(tween.fp,tween.tp,e);controls.target.lerpVectors(tween.ft,tween.tt,e);if(k>=1)tween=null;}
  controls.update();
  camera.getWorldDirection(cdir);armMat.opacity=1-.88*THREE.MathUtils.smoothstep(Math.abs(cdir.x),.5,.82);armMat.depthWrite=armMat.opacity>.95;
  const pulse=.45+.4*Math.sin(now/260);INJ_HALOS.forEach(h=>h.scale.setScalar(1+.35*Math.sin(now/220)));FOCUS.forEach(r=>r.mesh.material.emissive.setRGB(pulse,.05,.08));
  const w=stage.clientWidth,h=stage.clientHeight;
  for(const L of LBL){tmp.copy(L.p).project(camera);const toCam=camera.position.clone().sub(L.p).normalize();const vis=(L.n?L.n.dot(toCam)>0.15:true)&&tmp.z<1;
    L.el.style.display=vis?'block':'none';if(vis){L.el.style.left=((tmp.x+1)/2*w)+'px';L.el.style.top=((1-tmp.y)/2*h)+'px';}}
  orient();renderer.render(scene,camera);
}
resize();apply();view('P');requestAnimationFrame(loop);
initDetail();
setTimeout(()=>{DX.forEach(d=>d.vars.forEach(vv=>(d.side==='bi'?['B']:['R','L']).forEach(sd=>zonesFor(d.id,vv.id,sd))));},400);
window.__ok=true;
