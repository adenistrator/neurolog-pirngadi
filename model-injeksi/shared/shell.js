// shared helpers for all injection model pages
const MI = {
  press(els, fn){ els.forEach(b => b.setAttribute('aria-pressed', String(!!fn(b)))); },
  reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
  // on phones the panel sits under the stage: bring the stage back after picking from a list
  toStage(){
    if (innerWidth >= 900) { const pn = document.querySelector('.mi-panel'); if (pn) pn.scrollTo({ top: 0, behavior: MI.reduce ? 'auto' : 'smooth' }); return; }
    const st = document.querySelector('.mi-stage'), hd = document.querySelector('.mi-head');
    const top = st.getBoundingClientRect().top + scrollY - (hd ? hd.offsetHeight : 0);
    scrollTo({ top: Math.max(0, top), behavior: MI.reduce ? 'auto' : 'smooth' });
  },
  initLegend(){ try { const l = document.querySelector('.mi-legend'); if (l && innerWidth >= 700) l.open = true; } catch (e) {} },
  vb(k, txt){ const L = { v:'Terverifikasi', p:'Sebagian terverifikasi', u:'Belum terverifikasi', g:'Anatomi umum', i:'Interpretasi posisi' }; return `<span class="vb ${k}">${txt || L[k]}</span>`; },
};
