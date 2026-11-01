#!/usr/bin/env python3
"""Copy the game's text (client/src/content/locales/*.json) into the Godot
project (godot-demo/locales/), so both games read the same words.

The 2D game's locales are the single source (CLAUDE.md rule 0): edit them
there, then run this from the repository root:

    python3 godot-demo/tools/sync_locales.py
"""
import pathlib, shutil
root = pathlib.Path(__file__).resolve().parents[2]
src = root / "client/src/content/locales"
dst = root / "godot-demo/locales"
dst.mkdir(exist_ok=True)
for f in sorted(src.glob("*.json")):
    shutil.copyfile(f, dst / f.name)
    print("copied", f.name)
