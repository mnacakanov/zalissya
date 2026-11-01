// Renders a model from the Pillars-lite camera and writes the renders, the
// plan (hut.json numbers) and a .glb of the model into an output folder.
//
//   cd godot-demo/tools/model && npm install
//   node render.cjs otaman ../../styles/pillars/huts/otaman/model
//
// Needs Playwright with a Chromium (any recent one). Nothing here goes into
// the game's export.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const name = process.argv[2] || "otaman";
const outDir = path.resolve(process.argv[3] || `out/${name}`);
const root = __dirname;
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".wasm": "application/wasm" };

const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, async () => {
  const port = server.address().port;
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage();
    page.on("console", (m) => { if (m.type() === "error") console.error(m.text()); });
    page.on("pageerror", (e) => console.error(e));
    await page.goto(`http://localhost:${port}/render.html?model=${name}`);
    await page.waitForFunction(() => window.result, null, { timeout: 100000 });
    const out = await page.evaluate(() => window.result);
    fs.mkdirSync(outDir, { recursive: true });
    for (const [key, val] of Object.entries(out)) {
      if (key === "plan") fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(val, null, 1) + "\n");
      else if (key === "glb") fs.writeFileSync(path.join(outDir, `${name}.glb`), Buffer.from(val, "base64"));
      else fs.writeFileSync(path.join(outDir, `${key}.png`), Buffer.from(val.split(",")[1], "base64"));
    }
    console.log(`wrote ${Object.keys(out).length} files to ${outDir}`);
  } finally {
    await browser.close();
    server.close();
  }
});
