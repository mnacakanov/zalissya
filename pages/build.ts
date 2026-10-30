// GitHub Pages build of the shared client (../client/src).
//
// Produces ONE self-contained dist/index.html — CSS and JS inlined — so the
// game can also be saved and played offline from a single file. The only
// difference from the Muse build is the platform module: ./platform/target
// resolves to ./platform/target.pages.ts (localStorage saves, no SDK,
// joystick allowed). Bare imports (react, …) resolve from pages/node_modules
// because the client folder has no node_modules of its own outside Muse.
//
//   bun run build              → dist/index.html
//   bun run dev                → rebuild on change + serve on :5173

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import type { BunPlugin } from "bun";

const PAGES = import.meta.dir;
const CLIENT_SRC = path.resolve(PAGES, "../client/src");
const BUILD = path.join(PAGES, ".build");
const DIST = path.join(PAGES, "dist");

const pagesPlatform: BunPlugin = {
  name: "zalissya-pages-platform",
  setup(b) {
    // Swap the platform module for the Pages one.
    b.onResolve({ filter: /(^|\/)platform\/target$/ }, () => ({
      path: path.join(CLIENT_SRC, "platform/target.pages.ts"),
    }));
    // CSS is compiled separately by the Tailwind CLI and inlined below.
    b.onResolve({ filter: /\.css$/ }, (a) => ({ path: a.path, namespace: "skip-css" }));
    b.onLoad({ filter: /.*/, namespace: "skip-css" }, () => ({ contents: "", loader: "js" }));
    // Bare specifiers from client files → pages/node_modules.
    b.onResolve({ filter: /^[^./]/ }, (a) => {
      if (!a.importer.startsWith(CLIENT_SRC)) return undefined;
      return { path: Bun.resolveSync(a.path, PAGES) };
    });
  },
};

async function buildCss(): Promise<string> {
  // Compile the client's theme.css with Tailwind, scanning the client
  // sources for class names. Copied into .build so its @imports resolve
  // against pages/node_modules.
  const theme = await readFile(path.join(CLIENT_SRC, "theme.css"), "utf8");
  const input = path.join(BUILD, "theme.css");
  await writeFile(input, `${theme}\n@source "${path.relative(BUILD, CLIENT_SRC)}";\n`);
  const out = path.join(BUILD, "out.css");
  const proc = Bun.spawn([path.join(PAGES, "node_modules/.bin/tailwindcss"), "-i", input, "-o", out, "--minify"], {
    cwd: PAGES,
    stdout: "inherit",
    stderr: "pipe",
  });
  if ((await proc.exited) !== 0) {
    throw new Error(`tailwind failed:\n${await new Response(proc.stderr).text()}`);
  }
  return readFile(out, "utf8");
}

async function buildJs(): Promise<string> {
  const res = await Bun.build({
    entrypoints: [path.join(CLIENT_SRC, "main.tsx")],
    plugins: [pagesPlatform],
    target: "browser",
    format: "esm",
    minify: true,
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
  });
  if (!res.success) {
    for (const log of res.logs) console.error(log);
    throw new Error("bundle failed");
  }
  const js = res.outputs[0];
  if (!js) throw new Error("bundle produced no output");
  return js.text();
}

async function build(): Promise<void> {
  const t0 = performance.now();
  await mkdir(BUILD, { recursive: true });
  await mkdir(DIST, { recursive: true });
  const [css, js] = await Promise.all([buildCss(), buildJs()]);
  // Keep inline <script>/<style> from closing early.
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
    <meta name="color-scheme" content="light dark" />
    <link rel="icon" href="data:," />
    <title>Zalissya — a Ukrainian folk tale</title>
    <style>${safeCss}</style>
  </head>
  <body>
    <div data-generated-space-root="" data-generated-space-slug="zalissya-pages"></div>
    <script type="module">${safeJs}</script>
  </body>
</html>
`;
  await writeFile(path.join(DIST, "index.html"), html);
  console.log(`dist/index.html  ${(html.length / 1024).toFixed(0)} KB  in ${(performance.now() - t0).toFixed(0)} ms`);
}

await build();

if (process.argv.includes("--watch")) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(CLIENT_SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((e: unknown) => console.error(e)), 150);
  });
  console.log("watching client/src …");
}

if (process.argv.includes("--serve")) {
  const server = Bun.serve({
    port: Number(process.env.PORT ?? 5173),
    fetch: () => new Response(Bun.file(path.join(DIST, "index.html")), { headers: { "content-type": "text/html; charset=utf-8" } }),
  });
  console.log(`serving http://localhost:${server.port}/`);
}
