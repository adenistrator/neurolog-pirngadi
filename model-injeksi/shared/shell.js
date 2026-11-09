// shared helpers for all injection model pages
const MI = {
  press(els, fn){ els.forEach(b => b.setAttribute('aria-pressed', String(!!fn(b)))); },
  reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
  coarse: matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window),
  // on phones the panel sits under the stage: bring the stage back after picking from a list
  toStage(){
    if (innerWidth >= 900) { const pn = document.querySelector('.mi-panel'); if (pn) pn.scrollTo({ top: 0, behavior: MI.reduce ? 'auto' : 'smooth' }); return; }
    const st = document.querySelector('.mi-stage'), hd = document.querySelector('.mi-head');
    if (!st) return;
    const top = st.getBoundingClientRect().top + scrollY - (hd ? hd.offsetHeight : 0) - 4;
    scrollTo({ top: Math.max(0, top), behavior: MI.reduce ? 'auto' : 'smooth' });
  },
  initLegend(){ try { const l = document.querySelector('.mi-legend'); if (l && innerWidth >= 700) l.open = true; else if (l && innerWidth < 700) l.open = false; } catch (e) {} },
  vb(k, txt){ const L = { v:'Terverifikasi', p:'Sebagian terverifikasi', u:'Belum terverifikasi', g:'Anatomi umum', i:'Interpretasi posisi' }; return `<span class="vb ${k}">${txt || L[k]}</span>`; },
  // iOS Safari URL bar show/hide changes layout — listen to visualViewport when present
  onViewport(fn){
    const run = () => fn();
    addEventListener('resize', run, { passive: true });
    addEventListener('orientationchange', () => setTimeout(run, 250), { passive: true });
    if (window.visualViewport) visualViewport.addEventListener('resize', run, { passive: true });
  },
};
