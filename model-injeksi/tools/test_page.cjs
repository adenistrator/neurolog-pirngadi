// usage: node test_page.cjs PAGE.html OUTDIR THREE_DIR [actions.js]
// Wraps the artifact body in the publish skeleton, serves three.js locally (CDN mirror of the same pinned version),
// runs phone / tablet / desktop (light+dark) and fails on any console error or page error.
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const [page_, outDir, threeDir, actFile] = process.argv.slice(2);
const body = fs.readFileSync(page_, 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;
const actions = actFile ? require(path.resolve(actFile)) : async()=>{};
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const configs = [
    { name: 'iphone', ctx: { ...devices['iPhone 13'] }, scheme: 'light' },
    { name: 'iphone-dark', ctx: { ...devices['iPhone 13'] }, scheme: 'dark' },
    { name: 'ipad', ctx: { ...devices['iPad Pro 11 landscape'] }, scheme: 'light' },
    { name: 'desktop', ctx: { viewport: { width: 1440, height: 900 } }, scheme: 'light' },
    { name: 'desktop-dark', ctx: { viewport: { width: 1440, height: 900 } }, scheme: 'dark' },
  ];
  const only = (process.env.CONFIGS||'').split(',').filter(Boolean);
  let fail = 0;
  for (const c of configs) {
    if (only.length && !only.includes(c.name)) continue;
    const ctx = await browser.newContext({ ...c.ctx, deviceScaleFactor: 1, colorScheme: c.scheme });
    ctx.setDefaultTimeout(120000);
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
    pg.on('requestfailed', r => errs.push('requestfailed: ' + r.url().slice(0, 100)));
    await pg.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', r => {
      const rel = r.request().url().split('three@0.160.0/')[1];
      r.fulfill({ path: path.join(threeDir, rel), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } });
    });
    await pg.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
    await pg.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 204, body: '' }));
    await pg.route('http://local.test/', r => r.fulfill({ body: html, contentType: 'text/html' }));
    await pg.goto('http://local.test/', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForTimeout(4000);
    const info = await pg.evaluate(() => ({
      hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      sw: document.documentElement.scrollWidth, iw: window.innerWidth,
      canvas: !!document.querySelector('canvas'),
      loadingVisible: [...document.querySelectorAll('.mi-msg')].some(e => !e.hidden && getComputedStyle(e).display !== 'none'),
    }));
    try { await actions(pg, c, path.join(outDir, c.name)); } catch (e) { errs.push('action: ' + e.message); }
    try { await pg.screenshot({ path: path.join(outDir, c.name + '.png'), timeout: 300000 }); } catch (e) { errs.push('screenshot: ' + e.message.split('\n')[0]); }
    const ok = !errs.length && !info.hscroll && info.canvas && !info.loadingVisible;
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${c.name} ${JSON.stringify(info)}${errs.length ? '\n   ' + errs.slice(0, 8).join('\n   ') : ''}`);
    await ctx.close();
  }
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
