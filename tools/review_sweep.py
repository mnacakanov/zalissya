#!/usr/bin/env python3
"""Zalissya review sweep: mechanical checks. Usage: python3 -I review_sweep.py <repo-root>

Prints a report. Every hit is a LEAD, not a verdict: open the file and verify
before reporting (see REVIEW.md, "False positives").
"""
import glob, hashlib, json, re, subprocess, sys
from collections import defaultdict
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
src = root / "client/src"
loc = src / "content/locales"

def read(p): return Path(p).read_text(encoding="utf-8")
files = sorted(str(p.relative_to(src)) for p in src.rglob("*") if p.suffix in (".ts", ".tsx"))
code_files = [f for f in files if not f.endswith(".test.ts")]
text = {f: read(src / f) for f in files}
code_all = "\n".join(text[f] for f in code_files)

def head(s): print(f"\n=== {s} ===")

def flat(d, p=""):
    out = {}
    for k, v in d.items():
        kk = f"{p}.{k}" if p else k
        out.update(flat(v, kk) if isinstance(v, dict) else {kk: v})
    return out

uk = flat(json.loads(read(loc / "uk.json")))
en = flat(json.loads(read(loc / "en.json")))

# 1. Locale parity ------------------------------------------------------------
head("1. LOCALES: key and placeholder parity")
print("keys uk/en:", len(uk), len(en))
print("only uk:", sorted(set(uk) - set(en))[:20])
print("only en:", sorted(set(en) - set(uk))[:20])
ph = lambda s: sorted(re.findall(r"\{(\w+)\}", s)) if isinstance(s, str) else []
print("placeholder mismatches:", [k for k in uk if k in en and ph(uk[k]) != ph(en[k])][:20])
cy = re.compile("[Ѐ-ӿ]")
print("en values with Cyrillic:", [k for k, v in en.items() if isinstance(v, str) and cy.search(v)][:20])
print("uk values with Russian-only letters (ыэёъ):", [k for k, v in uk.items() if isinstance(v, str) and re.search("[ыэёъЫЭЁЪ]", v)][:20])
same = [k for k in uk if k in en and uk[k] == en[k] and isinstance(uk[k], str) and re.search("[A-Za-zА-Яа-яІіЇїЄє]{4,}", uk[k])]
print("uk == en (untranslated?):", same[:20])

# 2. Keys used vs defined -----------------------------------------------------
head("2. LOCALES: keys referenced but missing, defined but unused")
# NOTE: segments may contain hyphens (quest.lysa-sabbath.0). Dropping '-' from this class gave false positives once.
lit = re.compile(r'["`\']([a-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+)["`\']')
used = set(m.group(1) for m in lit.finditer(code_all))
dyn = set(m.group(1) for m in re.finditer(r"`([a-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*\.)\$\{", code_all))
roots = {k.split(".")[0] for k in en}
missing = sorted(k for k in used if k.split(".")[0] in roots and k not in en and not any(e.startswith(k + ".") for e in en))
print("referenced but missing in en.json (ignore comment-only hits like ui.caught):", missing)
def covered(k):
    if k in used or any(k.startswith(p) for p in dyn): return True
    p = k.split(".")
    return any(".".join(p[:i]) in used for i in range(1, len(p)))
print("possibly unused keys:", sorted(k for k in en if not covered(k)))
print("opaque numbered keys: ui.misc.N =", sum(1 for k in en if re.fullmatch(r"ui\.misc\.\d+", k)), "| keys ending .0 =", sum(1 for k in en if k.endswith(".0")))

# 3. Rule 0/1 -----------------------------------------------------------------
head("3. RULES 0/1: text in code, naming")
for f in code_files:
    for i, l in enumerate(text[f].split("\n"), 1):
        s = l.strip()
        code = re.sub(r"//.*$", "", s)
        if cy.search(code) and not s.startswith(("//", "*", "/*")):
            print(f"Cyrillic in code {f}:{i}: {s[:90]}")
kh = [k for k, v in en.items() if isinstance(v, str) and re.search(r"\bkhat(a|y|as)\b", v, re.I)]
print(f'English strings using "khata/khaty" (owner rule: "huts"): {len(kh)}', kh[:6])
bad = [k for k, v in en.items() if isinstance(v, str) and re.search(r"\b(Russia\w*|Muscov\w*|tsar\w*|czar\w*|Slavic|Viking\w*|medieval|knight\w*)\b", v, re.I)]
print("banned terms in en:", bad)

# 4. Duplicated helpers --------------------------------------------------------
head("4. DUPLICATION: same-named top-level helpers; identical bodies")
defs = defaultdict(list)
pat = re.compile(r"^(?:export )?(?:function|const) ([A-Za-z0-9_]+)\b([^\n]*(?:\n(?:  .*|\}.*|\)\;?)?)*)", re.M)
for f in code_files:
    for m in pat.finditer(text[f]):
        body = re.sub(r"\s+", " ", m.group(0))[:400]
        defs[m.group(1)].append((f, hashlib.md5(body.encode()).hexdigest()[:6]))
for name, v in sorted(defs.items()):
    if len({f for f, _ in v}) > 1 and name not in ("PLATFORM", "JOYSTICK_ALLOWED", "PAD", "H", "run"):
        same = len({h for _, h in v}) == 1
        print(f"{name}: {len(v)} files{' (IDENTICAL)' if same else ''}: {[f for f, _ in v]}")
print("counter-rewrite sites (startsWith(`${name}=`)):", [f"{f}:{i}" for f in code_files for i, l in enumerate(text[f].split('\n'), 1) if re.search(r"startsWith\(`\$\{\w+\}=`\)", l)])
print("inline Math.max(..Math.min(..)) vs clamp():", len(re.findall(r"Math\.max\([^,]+, *Math\.min\(", code_all)), "vs", code_all.count("clamp("))

# 5. Dead exports --------------------------------------------------------------
head("5. DEAD CODE: exports never used anywhere else")
exp = re.compile(r"^export (?:async )?(?:function|const|let|class|type|interface|enum) ([A-Za-z0-9_]+)", re.M)
for f in code_files:
    if f.startswith("platform/target"): continue
    for m in exp.finditer(text[f]):
        n = m.group(1); w = re.compile(rf"\b{re.escape(n)}\b")
        elsewhere = sum(len(w.findall(text[g])) for g in code_files if g != f)
        if elsewhere == 0 and len(w.findall(text[f])) == 1 and not any(w.search(text[g]) for g in files if g.endswith(".test.ts")):
            print(f"unused anywhere: {f}  {n}")

# 6. Leftovers / type escapes ---------------------------------------------------
head("6. LEFTOVERS and type escapes")
for label, rx in [("TODO/FIXME/HACK", r"TODO|FIXME|HACK|XXX"), ("console.*", r"console\.\w+\("), ("ts-ignore/expect-error", r"@ts-ignore|@ts-expect-error"),
                  ("eslint-disable (no ESLint in repo)", r"eslint-disable"), ("any", r"\bas any\b|: any\b|<any>"), ("`as TextKey` casts (defeat key typing)", r"as TextKey")]:
    hits = [f"{f}:{i}" for f in code_files for i, l in enumerate(text[f].split("\n"), 1) if re.search(rx, l)]
    print(f"{label}: {len(hits)}", hits[:5])
for f in ("App.tsx",):
    print(f"{f}: {len(text[f].splitlines())} lines (CLAUDE.md: keep App.tsx as wiring)")
print("isHutArea() branches (area is only village|lysa at runtime):", code_all.count("isHutArea("))

# 7. Git / rule 7 ----------------------------------------------------------------
head("7. RULE 7: model names in repo and commits")
mx = r"\b(sonnet|opus|haiku|fable|mythos|gpt-?\d|gemini)\b"
print("repo files:", [f"{f}:{i}" for f in code_files for i, l in enumerate(text[f].split('\n'), 1) if re.search(mx, l, re.I)][:10])
try:
    if (root / ".git/shallow").exists():
        print("WARNING: shallow clone, so the commit check below sees too few commits. Run: git fetch --depth=80 origin main")
    out = subprocess.run(["git", "-C", str(root), "log", "-80", "--format=%h %ad %s", "--date=short", "-i", "-E", f"--grep=co-authored-by|{mx}"], capture_output=True, text=True).stdout.strip()
    print("commits with trailers / model names (last 80):", len(out.splitlines()))
    print("\n".join(out.splitlines()[:3]))
except Exception as e:
    print("git unavailable:", e)

print("\nDone. Every hit is a lead: verify it, then follow REVIEW.md sections 2-4.")
