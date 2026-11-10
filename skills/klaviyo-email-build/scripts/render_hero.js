// node render_hero.js <hero.html> <out.png>
// hero.html: standalone HTML with the hero section only, 600px wide, local asset paths (file://).
const { chromium } = require('playwright');
(async () => {
  const [html, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 600, height: 1000 }, deviceScaleFactor: 2 });
  await p.goto('file://' + require('path').resolve(html));
  await p.waitForTimeout(600);
  const h = await p.evaluate(() => document.body.firstElementChild.getBoundingClientRect().height);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 600, height: Math.ceil(h) } });
  await b.close();
  console.log('rendered', out, 'height css px', Math.ceil(h));
})();
// then: python3 -c "from PIL import Image; Image.open('hero.png').convert('RGB').save('hero.jpg', quality=84, optimize=True)"
