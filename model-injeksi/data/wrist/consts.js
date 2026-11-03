const SHORT = { K1:'K1 De Quervain', K2:'K2 ECRL/ECRB', K2i:'Interseksi', K3:'K3 EPL', K4:'K4 ED/EI', K5:'K5 EDM', K6:'K6 ECU',
  CTU:'CTS USG ulnar', CTB:'CTS landmark', FCR:'Selubung FCR', GUY:'Kanal Guyon',
  RC:'Radiokarpal 3-4', DRUJ:'DRUJ', TFCC:'TFCC', CMC1:'CMC I', SL:'Lig. SL', DRC:'Lig. DRC' };

const COMP = { apl:1, epb:1, ecrl:2, ecrb:2, epl:3, ed:4, ei:4, edm:5, ecu:6 };
const COMP_COL = { 1:'#e4572e', 2:'#f0a202', 3:'#b5b82a', 4:'#2fa66a', 5:'#2f86d6', 6:'#8e5bd6' };
const COMP_TXT = { 1:'K1 APL, EPB', 2:'K2 ECRL, ECRB', 3:'K3 EPL', 4:'K4 ED, EI', 5:'K5 EDM', 6:'K6 ECU' };

const STRUCT = {
  radius:['Radius',''], ulna:['Ulna',''], scaphoid:['Skafoid',''], lunate:['Lunatum',''], triquetrum:['Triquetrum',''],
  pisiform:['Pisiformis','Batas ulnar kanal Guyon; landmark proksimal terowongan karpal.'], trapezium:['Trapezium','Bersendi dengan MC I (sendi CMC I).'], trapezoid:['Trapezoid',''],
  capitate:['Kapitatum',''], hamate:['Hamatum','Hamulus hamatum: batas radial-distal kanal Guyon.'],
  mc1:['Metakarpal I',''], mc2:['Metakarpal II',''], mc3:['Metakarpal III',''], mc4:['Metakarpal IV',''], mc5:['Metakarpal V',''],
  pp1:['Falang proksimal I',''], pp2:['Falang proksimal II',''], pp3:['Falang proksimal III',''], pp4:['Falang proksimal IV',''], pp5:['Falang proksimal V',''],
  apl:['M./tendon abduktor polisis longus (APL)','Kompartemen I.'], epb:['M./tendon ekstensor polisis brevis (EPB)','Kompartemen I.'],
  ecrl:['M./tendon ekstensor karpi radialis longus (ECRL)','Kompartemen II.'], ecrb:['M./tendon ekstensor karpi radialis brevis (ECRB)','Kompartemen II.'],
  epl:['M./tendon ekstensor polisis longus (EPL)','Kompartemen III.'], ed:['M./tendon ekstensor digitorum (ED)','Kompartemen IV.'],
  ei:['M./tendon ekstensor indisis (EI)','Kompartemen IV.'], edm:['M./tendon ekstensor digiti minimi (EDM)','Kompartemen V.'],
  ecu:['M./tendon ekstensor karpi ulnaris (ECU)','Kompartemen VI.'], br:['M. brakioradialis','Insersi di stiloideus radius; n. radialis superfisial muncul dari bawah tepinya ±9 cm proksimal pergelangan.'],
  fcr:['M./tendon fleksor karpi radialis (FCR)','A. radialis tepat di radialnya.'], pl:['M./tendon palmaris longus (PL)','Landmark CTS tanpa USG; n. medianus di dalam/sedikit radial di bawahnya. Tidak ada pada sebagian orang.'],
  fpl:['M./tendon fleksor polisis longus (FPL)','Isi terowongan karpal (paling radial).'], fds:['M./tendon fleksor digitorum superfisialis (FDS)','Isi terowongan karpal; n. medianus di atas/radialnya.'],
  fdp:['M./tendon fleksor digitorum profundus (FDP)','Isi terowongan karpal (lapis dalam).'], fcu:['M./tendon fleksor karpi ulnaris (FCU)','N. dan a. ulnaris berjalan di bawah/radial FCU, berinsersi di pisiformis.'],
  pq:['M. pronator kuadratus',''], apb:['M. abduktor polisis brevis','Dipersarafi cabang motorik rekuren n. medianus; atrofi pada CTS berat.'],
  op:['M. oponens polisis',''], fpb:['M. fleksor polisis brevis',''], adm:['M. abduktor digiti minimi',''], fdmb:['M. fleksor digiti minimi brevis',''], odm:['M. oponens digiti minimi',''],
  flexret:['Retinakulum fleksor (lig. karpal transversum)','Atap terowongan karpal: pisiformis–hamatum (ulnar) ke skafoid–trapezium (radial).'],
  extret:['Retinakulum ekstensor (skematik)','Membagi tendon ekstensor menjadi 6 kompartemen dorsal.'],
  tfcc:['TFCC (skematik)','Diskus artikular + ligamen radioulnar dorsal/palmar, berapeks di fovea ulna.'],
  median:['N. medianus (skematik)','Lewat di bawah retinakulum fleksor, radial dari tendon FDS. Target CTS.'],
  rmb:['Cabang motorik rekuren n. medianus (skematik)','Ke otot tenar; posisinya bervariasi, hindari pendekatan radial-distal.'],
  ulnarN:['N. ulnaris (skematik)','Di bawah FCU lalu ke kanal Guyon, radial dari pisiformis.'],
  ulnarA:['A. ulnaris (skematik)','Radial dari n. ulnaris di kanal Guyon; dilewati di bawahnya pada pendekatan ulnar CTS.'],
  radialA:['A. radialis (skematik)','Di pergelangan radial dari FCR, lalu ke dorsal lewat tabatière anatomis di bawah APL/EPB menuju ruang interoseus I.'],
  srn:['N. radialis superfisial (skematik)','Di atas kompartemen I; risiko neuritis/neuroma pada injeksi De Quervain dan CMC I.'],
  pcb:['Cabang kutaneus palmar n. medianus (skematik)','Di superfisial retinakulum, sisi radial dari PL; alasan pendekatan CTS dari ulnar.'],
  dsbu:['Cabang sensorik dorsal n. ulnaris (skematik)','Melingkari ulna distal ke dorsal; waspadai pada injeksi K6 dan TFCC.'],
  pin:['N. interoseus posterior, cabang terminal (skematik)','Di dasar kompartemen IV, sensorik untuk kapsul dorsal pergelangan.']
};
const TUBE_STYLE = { median:['nerve',0.11], rmb:['nerve',0.04], ulnarN:['nerve',0.085], ulnarA:['artery',0.07], radialA:['artery',0.075],
  srn:['nerve',0.05], pcb:['nerve',0.035], dsbu:['nerve',0.045], pin:['nerve',0.035] };
