"""Patch the service worker of a Godot web export so a new build really is new.

Godot's worker caches the game cache-first under a per-build CACHE_VERSION,
which is right. But the files it fills that new cache with come through the
browser's ordinary HTTP cache, and GitHub Pages lets that keep a file for
10 minutes. Open the demo, push a build, open it again within ten minutes:
the new worker installs, fetches index.pck, gets the OLD one from the HTTP
cache, and keeps it for good under the new version. So every fetch the
worker makes for its cache goes past the HTTP cache (revalidating, so an
unchanged file still costs only a 304).

    python3 tools/patch_sw.py build/index.service.worker.js
"""
import sys

path = sys.argv[1]
src = open(path, encoding="utf-8").read()
patches = [
    # the files cached at install
    ("cache.addAll(CACHED_FILES)",
     "cache.addAll(CACHED_FILES.map((f) => new Request(f, { cache: 'reload' })))"),
    # everything fetched later (the .pck, the .wasm); a navigation request
    # can't be copied with new options, and the page itself is small
    ("response = await self.fetch(event.request);",
     "response = await self.fetch(event.request.mode === 'navigate' ? event.request : new Request(event.request, { cache: 'no-cache' }));"),
]
for old, new in patches:
    if new in src:
        continue
    if src.count(old) != 1:
        sys.exit(f"patch_sw: expected exactly one {old!r} in {path} (did Godot change its worker?)")
    src = src.replace(old, new)
open(path, "w", encoding="utf-8").write(src)
print(f"patch_sw: {path} patched")
