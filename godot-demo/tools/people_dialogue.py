"""Build zalissya/people.json: who stands where on the maidan, and what they
say, as the 2D game's own text keys (client/src/content/locales/*.json,
copied to godot-demo/locales/), so the two games speak alike and in either
language. A line is a key, or {"key", "params"}; people.gd looks them up.

The 2D game picks its lines by the world's state (herbs gathered, iron
brought, the Domovyk fed...). The Godot demo has no such state yet, so this
takes the lines of a fresh game: the first meeting's introduction, the
greeting after it, and each topic's answer as the 2D game gives it at the
start (dialogue/topics.ts and dialogue/lines.ts, read by hand into the
tables below).

    python3 tools/people_dialogue.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UK = json.load(open(os.path.join(ROOT, "client/src/content/locales/uk.json"), encoding="utf-8"))


def flat(o, p=""):
    if isinstance(o, dict):
        for k, v in o.items():
            yield from flat(v, f"{p}.{k}" if p else k)
    else:
        yield p, o


T = dict(flat(UK))


def t(key, **params):
    s = T[key]
    for k, v in params.items():
        s = s.replace("{" + k + "}", str(v))
    return s


def key(k):
    """a key as it is stored, checked to exist (a typo fails here, not in the game)"""
    if isinstance(k, str):
        assert k in T, k
        return k
    assert k[0] in T, k[0]
    return {"key": k[0], "params": k[1]}


def topic(npc, tid, lines, label=None, question=None):
    return {
        "label": key(label or f"topic.{npc}.{tid}.label.0"),
        "question": key(question or f"topic.{npc}.{tid}.question.0"),
        "lines": [key(k) for k in lines],
    }


# Where they stand, in the maidan's metres: by day at their work, by night
# at home (a "house" is the id of a building in maidan.json; its people are
# seen only from inside it). Heights in metres for their pictures.
PEOPLE = [
    {
        "id": "myroslav", "name": key("char.myroslav.name.0"), "height": 1.8, "colour": "8a2a2a",
        "day": {"at": [2.6, -11.6]},
        "night": {"house": "otaman", "at": [-2.0, -16.0]},
        "first": [key("line.myroslav.0")],
        "again": [key("topic.myroslav.0")],
        "topics": [
            topic("myroslav", "forest", ["line.myroslav.1"]),
            topic("myroslav", "domovyk", ["line.myroslav.2", "line.myroslav.3"]),
            topic("myroslav", "viy", ["line.myroslav.4"]),
            topic("myroslav", "radek", ["line.myroslav.5"]),
            topic("myroslav", "dark", ["line.myroslav.6"]),
            topic("myroslav", "lysa", ["line.myroslav.7"]),
            topic("myroslav", "growth", ["line.myroslav.8"]),
        ],
    },
    {
        "id": "vesna", "name": key("char.vesna.name.0"), "height": 1.65, "colour": "3f6a3a",
        "day": {"at": [19.0, -1.6]},
        "night": {"house": "vesna", "at": [15.0, -5.0]},
        "first": [key("line.vesna.7")],
        "again": [key("topic.vesna.3")],
        "topics": [
            topic("vesna", "herbs", ["line.vesna.8"]),
            topic("vesna", "zvirobiy", ["line.vesna.9"]),
            topic("vesna", "cooking", ["topic.vesna.cooking.0"]),
            topic("vesna", "alchemy", ["topic.vesna.alchemy.0", ("topic.vesna.1", {"intTotal": 1})]),
            topic("vesna", "pond", ["topic.vesna.pond.0"]),
            topic("vesna", "errand", ["line.vesna.10"]),
        ],
    },
    {
        "id": "radek", "name": key("char.radek.name.0"), "height": 1.85, "colour": "4a4a52",
        "day": {"at": [-12.6, 0.8]},
        "night": {"house": "kuznia", "at": [-15.5, 0.0]},
        "first": [key("line.radek.6")],
        "again": [key("topic.radek.2")],
        "topics": [
            topic("radek", "home", ["line.radek.7"], "topic.radek.home.label.1", "topic.radek.home.question.1"),
            topic("radek", "iron", ["line.radek.9"]),
            topic("radek", "lisovyk", ["line.radek.10"]),
            topic("radek", "viy", ["line.radek.11"]),
        ],
    },
    {
        # the Lisovyk stands at the forest's edge behind the khutir, tree-tall
        "id": "lisovyk", "name": key("char.lisovyk.name.0"), "height": 3.2, "colour": "33502e",
        "day": {"at": [-4.0, -26.5]},
        "night": {"at": [-4.0, -26.5]},
        "first": [key("line.lisovyk.0")],
        "again": [key("topic.lisovyk.0")],
        "topics": [
            topic("lisovyk", "rules", ["line.lisovyk.1"]),
            topic("lisovyk", "vesna", ["line.lisovyk.2"]),
            topic("lisovyk", "viy", ["line.lisovyk.3"]),
            topic("lisovyk", "domovyk", ["topic.lisovyk.domovyk.0"]),
            topic("lisovyk", "lost", ["topic.lisovyk.lost.0"]),
        ],
    },
    {
        # the Domovyk keeps his nook between the pil and the pich, day and night
        "id": "domovyk", "name": key("char.domovyk.name.0"), "height": 0.9, "colour": "6a5236",
        "day": {"house": "domovyk", "near_pich": True},
        "night": {"house": "domovyk", "near_pich": True},
        "first": [key("line.domovyk.5")],
        "again": [key("topic.domovyk.1")],
        "topics": [
            topic("domovyk", "bread", ["line.domovyk.6", "line.domovyk.7"]),
            topic("domovyk", "hearth", ["line.domovyk.5"], "topic.domovyk.hearth.1", "topic.domovyk.hearth.3"),
            topic("domovyk", "lisovyk", ["line.domovyk.8"]),
            topic("domovyk", "viy", ["line.domovyk.9"]),
        ],
    },
]

out = os.path.join(ROOT, "godot-demo/zalissya/people.json")
with open(out, "w", encoding="utf-8") as f:
    f.write('{\n  "_note": "Generated by tools/people_dialogue.py: the 2D game\'s text keys (locales/), looked up by people.gd in the player\'s language. Edit the positions in that script, or here and keep them in step.",\n  "people": [\n')
    f.write(",\n".join("    " + json.dumps(p, ensure_ascii=False) for p in PEOPLE))
    f.write("\n  ]\n}\n")
print("wrote", out)
