// node icon.cjs <variant> <out dir> — renders tools/icon.html's variant at
// the sizes the PWA needs (icon_512/180/144.png). With "all", renders a
// preview of every variant instead (preview_<name>.png).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const [variant, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'icon.html'));
  fs.mkdirSync(out, { recursive: true });
  const write = async (name, v, size) => {
    const url = await p.evaluate(([v, s]) => window.render(v, s), [v, size]);
    fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64'));
  };
  if (variant === 'all') {
    for (const v of await p.evaluate(() => Object.keys(window.VARIANTS))) await write(`preview_${v}.png`, v, 512);
  } else {
    for (const s of [512, 180, 144]) await write(`icon_${s}.png`, variant, s);
  }
  await b.close();
})();
