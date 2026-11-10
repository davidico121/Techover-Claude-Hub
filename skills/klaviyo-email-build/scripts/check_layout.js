// node check_layout.js <preview.html> [outPrefix]
// Fails loudly if there is sideways scroll or an image did not load, at 600 and 375 px.
const { chromium } = require('playwright');
(async () => {
  const f = require('path').resolve(process.argv[2]); const pre = process.argv[3] || 'preview';
  const b = await chromium.launch(); let bad = false;
  for (const w of [600, 375]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('file://' + f); await p.waitForTimeout(1200);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src.slice(-50)) }));
    console.log(w, JSON.stringify(r));
    if (r.sw > w || r.broken.length) bad = true;
    await p.screenshot({ path: `${pre}-${w}.png`, fullPage: true });
  }
  await b.close(); if (bad) { console.error('LAYOUT CHECK FAILED'); process.exit(1); }
})();
