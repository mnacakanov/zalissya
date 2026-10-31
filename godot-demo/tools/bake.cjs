// node bake.cjs <bundle.js> <out dir> — runs the bake in headless Chromium
// and writes the PNG layers and data.json into the Godot project.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const [bundle, out] = process.argv.slice(2);
  const html = path.join(path.dirname(bundle), 'bake.html');
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><body><script src="${path.basename(bundle)}"></script>`);
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on('pageerror', (e) => console.error('pageerror', e));
  await p.goto('file://' + html);
  await p.waitForFunction(() => window.__bake, null, { timeout: 60000 });
  const { data, files } = await p.evaluate(() => window.__bake);
  fs.mkdirSync(out, { recursive: true });
  for (const [name, url] of Object.entries(files)) fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data));
  console.log(Object.keys(files).length, 'files');
  await b.close();
})();
