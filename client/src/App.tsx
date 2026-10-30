import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { save } from "./api";
import { JOYSTICK_ALLOWED, loadControlPref, SafeAreaTopScrim, storeControlPref } from "./platform/target";
import { ALL_CHARS, charPos, DOMOVYK_IN, LYSA_CHARS, LYSA_DANCERS, type Npc, VESNA_IN } from "./data/characters";
import { hutSolids } from "./data/huts";
import { BOBBER, BREW_SPOT, COOK_SPOT, CRUST_SPOT, FISH_CATCH, FISH_SPOT, FORGE_SPOT, HERB_SPOTS, HERBS, IRON_SPOTS, PICH_IN_SPOT, WISH_LINES } from "./data/items";
import { LYSA_DANCE_SPOT, LYSA_FLOWER_SPOTS, LYSA_OFFER_SPOT, LYSA_SOLID } from "./data/lysa";
import { FENCES, FIRE, HOUSES, POND, SOLID, TREES, WELL } from "./data/village";
import { linesFor, linesForLysa } from "./dialogue/lines";
import { canForgeWard, canWeaveWreath, VIGIL_BROKEN_LINES, VIGIL_INTRO_LINES, VIGIL_WON_LINES, type VigilContext, vigilTopics, viyNarration, WREATH_HERBS } from "./dialogue/viyNight";
import { BREW_BENCH_NPC, BREW_CHOICE_LINES, CHORT_REFUSED_LINES, CHORT_SIGNED_LINES, CHORT_TRADE_LINES, type DialogueTopic, LYSA_BLESSING_LINES, topicsForLysa, topicsForVillage, WELL_NPC } from "./dialogue/topics";
import { Joystick } from "./input/Joystick";
import { PadButton } from "./input/PadButton";
import { drawHutInterior } from "./render/huts";
import { drawBeelzebub, drawLysaFire, drawLysaFlower, drawLysaGround, drawWitch } from "./render/lysa";
import { rr } from "./render/shapes";
import { drawNight, drawVigil, drawVigilOverlay } from "./render/viyFight";
import { drawBolotianyk, drawChort, drawDomovyk, drawLisovyk, drawViy } from "./render/spirits";
import { drawBrewBench, drawChicken, drawCrust, drawFence, drawFire, drawFishing, drawGround, drawHerbPatch, drawHouse, drawPerson, drawTree, drawWell } from "./render/village";
import { carriedWeight, carryCap, satchelWeight } from "./systems/carry";
import { flagCount, flagHas } from "./systems/flags";
import { type QuestItem, questLog } from "./systems/quests";
import { CRAFT_THRESH, craftLevel, FISH_THRESH, fishLevel, herbLevel, THRESH } from "./systems/skills";
import { computeStats, soulPrice, STAT_DEFS } from "./systems/stats";
import { advance, type Clock, darkness, isNight, minutesUntil, MS_PER_GAME_MINUTE, NIGHTFALL_MINUTE, readClock, START_MINUTE, timeLabel, UNTIL_DAWN_FLAGS, WAKE_MINUTE, writeClock } from "./systems/time";
import { type FightState, startFight, stepFight, VIGIL_SECONDS } from "./systems/viyFight";
import { type BrewRecipe, type Dialogue, type DialogueOption, type Prompt, promptKeyOf } from "./ui/types";
import { type AreaId, HUT_DOOR_IN, HUT_H, HUT_SPAWN, isHutArea, LYSA_SPAWN, PLAYER_R, PLAYER_SPEED, SPAWN, TRAIL_Y_MAX, TRAIL_Y_MIN, VILLAGE_FROM_HUT0, VILLAGE_FROM_HUT1, VILLAGE_RETURN, WORLD_H, WORLD_W, worldSize } from "./world/areas";
import { circleRectCollide, clamp, hash2 } from "./world/geometry";

// Zalissya — the game component: state, the frame loop, interaction, and
// the HUD/sheets. Data, dialogue, systems and drawing live in their own
// modules (see CLAUDE.md for the layout, DESIGN.md for the design record).

// The Domovyk's bed (hut0, north-east corner) — sleep here to pass time.
const BED_SPOT = { x: 635, y: 196 };
const BED_NPC: Npc = {
  id: "bed", name: "The Domovyk's bed", pron: "", role: "Straw, sheepskin, and the pich's warmth",
  x: BED_SPOT.x, y: BED_SPOT.y, tunic: "#6e5136", hair: "#8a6f4d", style: "domovyk",
};
// Where the chalk ring is drawn for Viy's vigil: just south of his hollow.
const VIGIL_CENTER = { x: 1420, y: 440 };
const VIGIL_NPC: Npc = {
  id: "vigil", name: "The vigil", pron: "", role: "Viy's hollow · one night",
  x: VIGIL_CENTER.x, y: VIGIL_CENTER.y, tunic: "#3a3444", hair: "#55506a", style: "elder",
};

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const playerRef = useRef({ x: SPAWN.x, y: SPAWN.y, face: 0, moving: false, phase: 0 });
  // Which area the player is in — mirrored into hudArea for the HUD and
  // carried in the save, so a reload restores the right side of the trail.
  const areaRef = useRef<AreaId>("village");
  const keysRef = useRef<Set<string>>(new Set());
  // Hold-to-move pad directions currently held ("up" | "down" | "left" | "right").
  // Movement is press-and-hold, never a drag: a downward drag on this phone
  // gets claimed by the host's pull-to-refresh no matter what the page sets,
  // so walking must not require a dragging gesture at all.
  const padRef = useRef<Set<string>>(new Set());
  // Floating-joystick vector (Pages build only — see input/Joystick.tsx).
  const stickRef = useRef({ x: 0, y: 0 });
  const patchesRef = useRef(HERB_SPOTS.map((s) => ({ ...s, available: true, respawnAt: 0 })));
  // Nichnyky patches on Lysa Hora — gathered for the offering, and they
  // stay gathered (the mountain counts promises, and flowers).
  const lysaPatchesRef = useRef(LYSA_FLOWER_SPOTS.map((s) => ({ ...s, taken: false })));
  // While dancing at the sabbath, walking is replaced by the dance for a
  // few seconds (timestamp until which the player figure dances in place).
  const danceUntilRef = useRef(0);
  // Set when Beelzebub's blessing dialogue opens; the Moonstone lands in
  // the satchel as the conversation closes, as the script narrates.
  const blessingPendingRef = useRef(false);
  const talkedRef = useRef<Set<string>>(new Set());
  const herbsRef = useRef(0);
  const chickensRef = useRef(
    [0, 1, 2].map((i) => ({
      x: 700 + i * 130, y: 700 + (i % 2) * 60,
      tx: 700 + i * 130, ty: 700, wait: 0, phase: hash2(i, 7) * 6,
    })),
  );
  const promptRef = useRef<Prompt>(null);
  const dialogueRef = useRef<Dialogue | null>(null);
  const dirtyRef = useRef(false);
  const loadedRef = useRef(false);
  // Story flags + counters ("bread", "fish=3", "iron=1", …) — the state of
  // every non-combat system. Mirrored into hudFlags for rendering.
  const flagsRef = useRef<Set<string>>(new Set());
  // Fishing: null when not fishing; phase "wait" until a bite, then "bite"
  // for a short window — tap Reel in during it or the fish is gone.
  const fishingRef = useRef<{ phase: "wait" | "bite"; biteAt: number; biteEnd: number } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  // Smithing cooldown: the anvil (and the arm) need a breath between pieces.
  const smithReadyRef = useRef(0);
  // Character sheet open? The render loop reads the ref to freeze walking.
  const panelRef = useRef(false);
  // The day-night clock (systems/time.ts); real ms pile up in clockAccRef
  // and are paid out as game minutes.
  const clockRef = useRef<Clock>({ day: 1, minute: START_MINUTE });
  const clockAccRef = useRef(0);
  // Viy's vigil while it runs (systems/viyFight.ts) and its two controls.
  const fightRef = useRef<FightState | null>(null);
  const lookHeldRef = useRef(false);
  const wardQueuedRef = useRef(false);
  // Set when the vigil's opening narration opens; the fight starts as it closes.
  const vigilPendingRef = useRef(false);

  const [started, setStarted] = useState(false);
  const [hudArea, setHudArea] = useState<AreaId>("village");
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [hudTalked, setHudTalked] = useState<string[]>([]);
  const [hudHerbs, setHudHerbs] = useState(0);
  const [hudFlags, setHudFlags] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [padPressed, setPadPressed] = useState<ReadonlySet<string>>(new Set());
  // "pad" everywhere; "stick" only where the platform allows a joystick.
  const [controls, setControls] = useState<"pad" | "stick">(() => (JOYSTICK_ALLOWED ? loadControlPref() : "pad"));
  const [confirmReset, setConfirmReset] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<"stats" | "skills" | "quests">("stats");
  const [hudClock, setHudClock] = useState<Clock>({ day: 1, minute: START_MINUTE });
  const [hudFight, setHudFight] = useState<{ nerve: number; max: number; t: number; gaze: FightState["gaze"]; ready: boolean } | null>(null);
  const [lookHeld, setLookHeld] = useState(false);

  // Defense in depth against pull-to-refresh / page scroll. The game is
  // full-screen and never scrolls. The scroll container is NOT the
  // document: the SDK wraps the app in [data-generated-space-root]
  // (position:fixed, overflow:auto) with a .hatch-space-root child taller
  // than the viewport. Lock overscroll + touch handling on every ancestor
  // up the chain — as inline styles, so they beat the SDK stylesheet no
  // matter the cascade order — and swallow touchmove with a non-passive
  // listener so no touch gesture becomes a scroll. NOTE: on the user's
  // phone these locks alone did NOT stop the host claiming a downward
  // drag as pull-to-refresh (verified twice), which is why movement is
  // hold-to-move buttons rather than a drag joystick; these stay so that
  // incidental touches elsewhere never scroll or refresh either.
  useEffect(() => {
    type SavedStyle = { el: HTMLElement; props: Record<string, string> };
    const saved: SavedStyle[] = [];
    const lock = (el: HTMLElement | null, props: Record<string, string>) => {
      if (!el) return;
      const prevProps: Record<string, string> = {};
      for (const key of Object.keys(props)) {
        prevProps[key] = el.style.getPropertyValue(key);
        el.style.setProperty(key, props[key] ?? "", "important");
      }
      saved.push({ el, props: prevProps });
    };
    const lockProps = {
      "overscroll-behavior": "none",
      "touch-action": "none",
      overflow: "hidden",
    };
    lock(document.documentElement, lockProps);
    lock(document.body, { ...lockProps, position: "fixed", inset: "0", width: "100%" });
    lock(document.querySelector<HTMLElement>("[data-generated-space-root]"), lockProps);
    lock(document.querySelector<HTMLElement>(".hatch-space-root"), {
      ...lockProps,
      "min-height": "100%",
      height: "100%",
      "max-height": "100%",
    });
    // If anything still manages to scroll the SDK container, snap it back
    // so it can never rest at a scrolled offset or hand off a chain.
    const scroller = document.querySelector<HTMLElement>("[data-generated-space-root]");
    const snapBack = () => {
      if (scroller && (scroller.scrollTop !== 0 || scroller.scrollLeft !== 0)) {
        scroller.scrollTop = 0;
        scroller.scrollLeft = 0;
      }
    };
    scroller?.addEventListener("scroll", snapBack, { passive: true });
    const swallowTouchMove = (e: TouchEvent) => {
      // The Character sheet is a real scroll container on small phones —
      // touches that start inside it scroll the sheet, not the host page.
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-scroll-ok]")) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", swallowTouchMove, { passive: false });
    return () => {
      document.removeEventListener("touchmove", swallowTouchMove);
      scroller?.removeEventListener("scroll", snapBack);
      for (const { el, props } of saved) {
        for (const [key, value] of Object.entries(props)) {
          if (value) el.style.setProperty(key, value);
          else el.style.removeProperty(key);
        }
      }
    };
  }, []);

  const saveQuery = useQuery({ queryKey: ["game-save"], queryFn: () => save.load() });
  const saveMut = useMutation({ mutationFn: (v: { x: number; y: number; area: AreaId; talked: string[]; herbs: number; flags: string[] }) => save.save(v) });
  const resetMut = useMutation({ mutationFn: () => save.reset() });

  // --- feedback + flags ------------------------------------------------------
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3400);
  };
  const syncFlags = () => {
    setHudFlags(new Set(flagsRef.current));
    dirtyRef.current = true;
  };
  const setFlag = (name: string) => {
    if (flagsRef.current.has(name)) return;
    flagsRef.current.add(name);
    syncFlags();
  };
  const bumpCount = (name: string, by: number): number => {
    const next = flagCount(flagsRef.current, name) + by;
    for (const f of [...flagsRef.current]) {
      if (f.startsWith(`${name}=`)) flagsRef.current.delete(f);
    }
    flagsRef.current.add(`${name}=${next}`);
    syncFlags();
    return next;
  };
  const openDialogue = (npc: Npc, lines: string[], choiceAt?: number, choiceKind?: "chort" | "brew") => {
    const d: Dialogue = {
      npc, lines, line: 0,
      ...(choiceAt != null ? { choiceAt } : {}),
      ...(choiceKind != null ? { choiceKind } : {}),
    };
    dialogueRef.current = d;
    setDialogue(d);
  };
  // A topic conversation: greeting pages first, then the question menu.
  const openTopicDialogue = (npc: Npc, intro: string[], topics: DialogueTopic[]) => {
    const d: Dialogue = { npc, lines: intro, line: 0, topics, asked: [], view: "lines", topicLine: 0 };
    dialogueRef.current = d;
    setDialogue(d);
  };
  const endDialogue = () => {
    dialogueRef.current = null;
    setDialogue(null);
  };
  // Stepping through a hut door — the interior twin of the Lysa trail
  // transition: swap the area, land just inside (or just outside) the
  // door, and let the autosave carry the new area like any other.
  const enterHut = (hut: 0 | 1) => {
    const dest: AreaId = hut === 0 ? "hut0" : "hut1";
    areaRef.current = dest;
    setHudArea(dest);
    playerRef.current.x = HUT_SPAWN.x;
    playerRef.current.y = HUT_SPAWN.y;
    fishingRef.current = null;
    promptRef.current = null;
    setPrompt(null);
    dirtyRef.current = true;
    showToast(
      hut === 0
        ? "You duck into the Domovyk's hut — pich-warm, smelling of bread and woodsmoke."
        : "You duck into Vesna's hut — herbs overhead, and something green breathing in the cauldron.",
    );
  };
  const exitHut = () => {
    const door = areaRef.current === "hut1" ? VILLAGE_FROM_HUT1 : VILLAGE_FROM_HUT0;
    areaRef.current = "village";
    setHudArea("village");
    playerRef.current.x = door.x;
    playerRef.current.y = door.y;
    promptRef.current = null;
    setPrompt(null);
    dirtyRef.current = true;
    showToast("Back out into the clearing's daylight.");
  };
  // Picking a question from the menu. The blessing topic never pages —
  // it hands straight over to Beelzebub's blessing script, and the
  // Moonstone lands when that script closes (blessingPendingRef).
  const selectTopic = (topic: DialogueTopic) => {
    const dlg = dialogueRef.current;
    if (!dlg || !dlg.topics) return;
    if (topic.action === "blessing") {
      blessingPendingRef.current = true;
      openDialogue(dlg.npc, [...linesForLysa(dlg.npc, flagsRef.current), ...LYSA_BLESSING_LINES]);
      return;
    }
    if (topic.grant) applyGrant(topic.grant);
    const asked = dlg.asked?.includes(topic.id) ? dlg.asked : [...(dlg.asked ?? []), topic.id];
    const next: Dialogue = { ...dlg, view: "topic", topic, topicLine: 0, asked };
    dialogueRef.current = next;
    setDialogue(next);
  };

  // Load the save once.
  useEffect(() => {
    if (!saveQuery.data || loadedRef.current) return;
    loadedRef.current = true;
    const s = saveQuery.data;
    if (s.exists) {
      const area: AreaId = s.area === "lysa" ? "lysa" : s.area === "hut0" ? "hut0" : s.area === "hut1" ? "hut1" : "village";
      areaRef.current = area;
      setHudArea(area);
      const ws = worldSize(area);
      playerRef.current.x = clamp(s.x, 30, ws.w - 30);
      playerRef.current.y = clamp(s.y, 60, ws.h - 20);
      // Map pre-rename save ids to their current forms.
      const idMap: Record<string, string> = { miroslav: "myroslav", bohdan: "radek", vij: "viy" };
      const mappedTalked = s.talked.map((id) => idMap[id] ?? id);
      talkedRef.current = new Set(mappedTalked);
      herbsRef.current = s.herbs;
      flagsRef.current = new Set(s.flags);
      clockRef.current = readClock(flagsRef.current);
      setHudClock(clockRef.current);
      // Stats/skills migration for older saves: spendable herb stock
      // starts as everything ever gathered (nothing was spendable
      // before), and lifetime fish starts as the fish on hand (the old
      // single counter was both). Derived stats need no migration at
      // all — they are computed from skill levels and people met.
      let migrated = false;
      const loadedFlags = flagsRef.current;
      const hasCounter = (name: string) => [...loadedFlags].some((f) => f.startsWith(`${name}=`));
      if (!hasCounter("herbStock")) {
        loadedFlags.add(`herbStock=${s.herbs}`);
        migrated = true;
      }
      if (!hasCounter("fishTotal")) {
        loadedFlags.add(`fishTotal=${flagCount(loadedFlags, "fish")}`);
        migrated = true;
      }
      if (migrated) dirtyRef.current = true;
      // Nichnyky already picked on Lysa Hora stay picked.
      lysaPatchesRef.current.forEach((pt, i) => {
        pt.taken = loadedFlags.has(`lysaFlowerSpot${i}`);
      });
      if (area === "lysa" && !loadedFlags.has("visitedLysa")) {
        loadedFlags.add("visitedLysa");
        dirtyRef.current = true;
      }
      setHudTalked(mappedTalked);
      setHudHerbs(s.herbs);
      setHudFlags(new Set(flagsRef.current));
    }
  }, [saveQuery.data]);

  // Periodic autosave when dirty.
  useEffect(() => {
    if (!started) return;
    const iv = window.setInterval(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      saveMut.mutate({
        x: Math.round(playerRef.current.x),
        y: Math.round(playerRef.current.y),
        area: areaRef.current,
        talked: [...talkedRef.current],
        herbs: herbsRef.current,
        flags: [...flagsRef.current],
      });
    }, 2500);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // The Chort's bargain: a real choice at the signature line. Signing is
  // instant and has visible teeth — your shadow is gone from the grass
  // until you buy your soul back with 3 fish.
  const chortChoice = (sign: boolean) => {
    const dlg = dialogueRef.current;
    if (!dlg || dlg.npc.id !== "chort") return;
    if (sign) {
      setFlag("soulsold");
      setFlag("gold");
      openDialogue(dlg.npc, CHORT_SIGNED_LINES);
      showToast("You signed. The gold is heavy — and where did your shadow go?");
    } else {
      setFlag("soulkept");
      openDialogue(dlg.npc, CHORT_REFUSED_LINES);
    }
  };

  // Stats from live refs — used by the game loop (pace, bite window) and
  // by interactions (prices, double finds). The HUD/panel use the same
  // computeStats() over the mirrored state, so the numbers never disagree.
  const liveStats = () =>
    computeStats({
      herbs: herbsRef.current,
      fishTotal: flagCount(flagsRef.current, "fishTotal"),
      cooked: flagCount(flagsRef.current, "cooked"),
      smithed: flagCount(flagsRef.current, "smithed"),
      brewed: flagCount(flagsRef.current, "brewed"),
      met: talkedRef.current.size,
      flags: flagsRef.current,
    });

  // Eating and drinking happen from the Character sheet's satchel.
  const eatMeal = () => {
    if (flagCount(flagsRef.current, "meals") < 1) return;
    bumpCount("meals", -1);
    setFlag("wellfed");
    showToast("Hot karas soup, herbs and all. You feel sturdier — CON +1 while well fed.");
  };
  const drinkTonic = () => {
    if (flagCount(flagsRef.current, "potions") < 1) return;
    bumpCount("potions", -1);
    setFlag("tonic");
    showToast("Bitter, bright, clarifying. INT +1 and WIS +1 while the tonic lasts.");
  };
  const drinkStrongTonic = () => {
    if (flagCount(flagsRef.current, "strongPotions") < 1) return;
    bumpCount("strongPotions", -1);
    setFlag("strongtonic");
    showToast("Dark, deep, twice as clarifying — Vesna's strong tonic. INT +2 and WIS +2 while it lasts.");
  };

  // --- time --------------------------------------------------------------------
  // Move the clock on and store it in the flags. Every dawn crossed ends
  // the until-dawn bonuses (meals, tonics); returns whether any ended.
  const passTime = (minutes: number): boolean => {
    const { clock, dawns } = advance(clockRef.current, minutes);
    clockRef.current = clock;
    writeClock(flagsRef.current, clock);
    let expired = false;
    if (dawns > 0) {
      for (const f of UNTIL_DAWN_FLAGS) if (flagsRef.current.delete(f)) expired = true;
    }
    setHudClock(clock);
    syncFlags();
    return expired;
  };
  const sleepUntil = (target: number, msg: string) => {
    const expired = passTime(minutesUntil(clockRef.current, target));
    showToast(expired ? `${msg} Yesterday's meal and tonics have worn off.` : msg);
  };
  // A dialogue whose last page is a row of option buttons.
  const openOptions = (npc: Npc, lines: string[], tag: "sleep", options: DialogueOption[]) => {
    const d: Dialogue = { npc, lines, line: 0, choiceAt: lines.length - 1, choiceKind: "options", options, optionsTag: tag };
    dialogueRef.current = d;
    setDialogue(d);
  };
  const pickOption = (tag: "sleep", id: string) => {
    endDialogue();
    if (tag === "sleep") {
      if (id === "morning") sleepUntil(WAKE_MINUTE, "You sleep like a stone on the Domovyk's warm bed and wake to birdsong.");
      else if (id === "night") sleepUntil(NIGHTFALL_MINUTE, "You doze the day away. Something small tugs your sleeve: dusk. The Domovyk kept his word.");
    }
  };

  // --- Viy's night -------------------------------------------------------------
  const vigilContext = (): VigilContext => ({
    flags: flagsRef.current,
    talked: talkedRef.current,
    wis: liveStats().wis.total,
    herbStock: flagCount(flagsRef.current, "herbStock"),
  });
  // Items handed over by asking a topic (see dialogue/viyNight.ts). The
  // checks repeat the topic's own, so re-asking never gives twice.
  const applyGrant = (g: "chalk" | "wreath" | "ironward") => {
    const f = flagsRef.current;
    if (g === "chalk" && !flagHas(f, "chalk")) {
      setFlag("chalk");
      showToast("Myroslav's blessed chalk — and the old way with it. Viy can be faced after dark.");
    } else if (g === "wreath" && !flagHas(f, "wreath") && canWeaveWreath(vigilContext())) {
      bumpCount("herbStock", -WREATH_HERBS);
      setFlag("wreath");
      showToast("Vesna's wreath of polyn and zvirobiy. Viy's gaze will take half.");
    } else if (g === "ironward" && !flagHas(f, "ironward") && canForgeWard(vigilContext())) {
      bumpCount("forged", -1);
      setFlag("ironward");
      showToast("Three iron nails for the chalk. The first three of the host will burn.");
    }
  };
  const startVigil = () => {
    const st = liveStats();
    playerRef.current.x = VIGIL_CENTER.x;
    playerRef.current.y = VIGIL_CENTER.y;
    playerRef.current.moving = false;
    lookHeldRef.current = false;
    setLookHeld(false);
    wardQueuedRef.current = false;
    const f = startFight(
      { con: st.con.total, wis: st.wis.total, dex: st.dex.total, wreath: flagHas(flagsRef.current, "wreath"), ironWard: flagHas(flagsRef.current, "ironward") },
      Math.floor(performance.now()) || 1,
    );
    fightRef.current = f;
    setHudFight({ nerve: f.nerve, max: f.maxNerve, t: 0, gaze: f.gaze, ready: true });
  };
  const releaseLook = () => {
    lookHeldRef.current = false;
    setLookHeld(false);
  };
  const endVigil = (won: boolean) => {
    fightRef.current = null;
    setHudFight(null);
    releaseLook();
    if (won) {
      setFlag("viySealed");
      passTime(minutesUntil(clockRef.current, 5 * 60 + 40));
      openDialogue(VIGIL_NPC, VIGIL_WON_LINES);
      showToast("Viy is sealed under the hollow. Keeper of the vigil: WIS +1, CHA +1 ✦");
    } else {
      // Nothing is lost but the night: you wake in the Domovyk's bed.
      bumpCount("vigilBroken", 1);
      areaRef.current = "hut0";
      setHudArea("hut0");
      playerRef.current.x = BED_SPOT.x;
      playerRef.current.y = BED_SPOT.y + 24;
      passTime(minutesUntil(clockRef.current, WAKE_MINUTE));
      openDialogue(VIGIL_NPC, VIGIL_BROKEN_LINES);
    }
    dirtyRef.current = true;
  };

  // The honest "no" of the carry system: name the load, the limit, and
  // the stat that sets it. Nothing is consumed when this fires.
  const carryBlockedToast = (addWeight: number) => {
    const st = liveStats();
    showToast(
      `Too heavy — you are carrying ${carriedWeight(flagsRef.current)}/${carryCap(st)}, and that needs ${addWeight} more room. Your STR ${st.str.total} sets the limit; smithing raises it. Put something down first — cook, brew, eat, or hand the iron to Radek.`,
    );
  };

  // Brewing, both tiers. The base tonic (2 herbs) is open from the
  // start; Vesna's strong tonic (3 herbs) is gated at INT total 3 and
  // chosen at the bench — performBrew itself trusts the gate was
  // checked by the caller (the brew prompt only offers the choice when
  // INT ≥ 3, and Vesna's dialogue says plainly that it is locked below).
  const performBrew = (recipe: BrewRecipe) => {
    const cost = recipe === "strong" ? 3 : 2;
    const herbsIn = flagCount(flagsRef.current, "herbStock");
    if (herbsIn < cost) {
      showToast(
        recipe === "strong"
          ? `Vesna's strong tonic wants 3 herbs — you have ${herbsIn}. The glowing patches provide.`
          : `The cauldron wants 2 herbs from your satchel — you have ${herbsIn}. The glowing patches provide.`,
      );
      return;
    }
    bumpCount("herbStock", -cost);
    const before = flagCount(flagsRef.current, "brewed");
    const brewed = bumpCount("brewed", 1);
    if (recipe === "strong") bumpCount("strongPotions", 1);
    else bumpCount("potions", 1);
    // A bright mind coaxes a second bottle out of the same batch.
    const intNow = liveStats().int.total;
    const double = hash2(Math.floor(performance.now()), 73) < (intNow - 1) * 0.1;
    if (double) {
      if (recipe === "strong") bumpCount("strongPotions", 1);
      else bumpCount("potions", 1);
    }
    const stock = flagCount(flagsRef.current, recipe === "strong" ? "strongPotions" : "potions");
    showToast(
      craftLevel(brewed) > craftLevel(before)
        ? recipe === "strong"
          ? `The strong tonic settles, dark as well-water at dusk! Alchemy Lv ${craftLevel(brewed)} — INT is now ${liveStats().int.total}. Drink it from your Character sheet.`
          : `The tonic clears, bright as bottled morning! Alchemy Lv ${craftLevel(brewed)} — INT is now ${liveStats().int.total}. Drink it from your Character sheet.`
        : double
          ? recipe === "strong"
            ? `Two bottles of the strong brew from one batch — a bright mind wastes nothing (INT ${intNow}). · Alchemy Lv ${craftLevel(brewed)}`
            : `Two bottles from one batch — a bright mind wastes nothing (INT ${intNow}). · Alchemy Lv ${craftLevel(brewed)}`
          : recipe === "strong"
            ? `Vesna's strong tonic, dark and deep. · Alchemy Lv ${craftLevel(brewed)} · ${stock} in satchel`
            : `A tonic, bitter and bright. · Alchemy Lv ${craftLevel(brewed)} · ${stock} in satchel`,
    );
  };

  // The bench's recipe choice, made through the dialogue buttons.
  const brewChoice = (recipe: BrewRecipe | null) => {
    const dlg = dialogueRef.current;
    if (!dlg || dlg.choiceKind !== "brew") return;
    dialogueRef.current = null;
    setDialogue(null);
    if (recipe != null) performBrew(recipe);
  };

  const doInteract = () => {
    // During the vigil the interact key is the ward.
    if (fightRef.current) {
      wardQueuedRef.current = true;
      return;
    }
    const dlg = dialogueRef.current;
    if (dlg) {
      // Topic conversations: the menu is driven by its buttons, answers
      // page with Next, and the last answer page returns to the menu.
      if (dlg.topics) {
        if (dlg.view === "menu") return;
        if (dlg.view === "topic" && dlg.topic) {
          const t = dlg.topic;
          const tl = dlg.topicLine ?? 0;
          // The bargain topic ends in a choice, not a page turn.
          if (t.action === "bargain" && tl >= t.lines.length - 1) return;
          if (tl + 1 < t.lines.length) {
            const next = { ...dlg, topicLine: tl + 1 };
            dialogueRef.current = next;
            setDialogue(next);
          } else {
            const next: Dialogue = { ...dlg, view: "menu", topic: undefined, topicLine: 0 };
            dialogueRef.current = next;
            setDialogue(next);
          }
          return;
        }
        // Greeting pages: at the end, the questions open up.
        if (dlg.line + 1 < dlg.lines.length) {
          const next = { ...dlg, line: dlg.line + 1 };
          dialogueRef.current = next;
          setDialogue(next);
        } else {
          const next: Dialogue = { ...dlg, view: "menu" };
          dialogueRef.current = next;
          setDialogue(next);
        }
        return;
      }
      // At the bargain page the only way onward is the choice itself.
      if (dlg.choiceAt != null && dlg.line === dlg.choiceAt) return;
      if (dlg.line + 1 < dlg.lines.length) {
        const next = { ...dlg, line: dlg.line + 1 };
        dialogueRef.current = next;
        setDialogue(next);
      } else {
        dialogueRef.current = null;
        setDialogue(null);
        if (blessingPendingRef.current) {
          blessingPendingRef.current = false;
          setFlag("moonstone");
          showToast("The Moonstone of Lysa Hora is yours — WIS +1, CHA +1 while you carry it. 🌙");
        }
        if (vigilPendingRef.current) {
          vigilPendingRef.current = false;
          startVigil();
        }
      }
      return;
    }
    // Reeling in answers the fishing bite directly, before any prompt.
    const fishing = fishingRef.current;
    if (fishing && fishing.phase === "bite") {
      fishingRef.current = null;
      const now = performance.now();
      // Dexterity tilts the catch itself, not just the window: deft
      // hands meet better fish — the pike and perch grow likelier with
      // every DEX point, and the pond's old boot grows shy.
      const dexNow = liveStats().dex;
      const table = FISH_CATCH.map((f) => {
        let w = f.w;
        if (f.name.includes("pike")) w += (dexNow.total - 1) * 3;
        else if (f.name.includes("perch")) w += (dexNow.total - 1);
        else if (f.name.includes("boot")) w = Math.max(1, w - (dexNow.total - 1) * 1.5);
        return { name: f.name, w };
      });
      const totalW = table.reduce((s, f) => s + f.w, 0);
      const roll = hash2(Math.floor(now), Math.floor(playerRef.current.x)) * totalW;
      let acc = 0;
      let caught = table[0]?.name ?? "a karas";
      for (const f of table) {
        acc += f.w;
        if (roll < acc) { caught = f.name; break; }
      }
      if (caught.includes("boot")) {
        showToast("You caught an old boot. The pond gives back what the village throws in.");
      } else if (carriedWeight(flagsRef.current) + 1 > carryCap(liveStats())) {
        // A fish is 1 of weight, and a full satchel holds no fish: it
        // slips back into the pond, uncounted and uneaten.
        showToast(
          `${caught[0]?.toUpperCase() ?? "A"}${caught.slice(1)} — in your hands, and gone again! No room: carrying ${carriedWeight(flagsRef.current)}/${carryCap(liveStats())}, and a fish weighs 1. Your STR ${liveStats().str.total} sets the limit.`,
        );
      } else {
        bumpCount("fish", 1);
        const total = bumpCount("fishTotal", 1);
        showToast(
          fishLevel(total) > fishLevel(total - 1)
            ? `Caught ${caught}! Fishing Lv ${fishLevel(total)} — DEX is now ${dexNow.total}. The bite window widens.`
            : `Caught ${caught}! · Fishing Lv ${fishLevel(total)} (${total} caught)`,
        );
      }
      return;
    }
    const p = promptRef.current;
    if (!p) return;
    switch (p.kind) {
      case "enter":
        enterHut(p.hut);
        return;
      case "exit":
        exitHut();
        return;
      case "talk": {
        const firstMeeting = !talkedRef.current.has(p.npc.id);
        if (firstMeeting) {
          talkedRef.current.add(p.npc.id);
          setHudTalked([...talkedRef.current]);
          dirtyRef.current = true;
        }
        const flags = flagsRef.current;
        const fish = flagCount(flags, "fish");
        const statsNow = liveStats();
        const price = soulPrice(statsNow);
        // The soul buy-back happens the moment you bring him enough fish
        // — 3, or 2 if your Charisma has talked him down (CHA 4+).
        if (p.npc.id === "chort" && flagHas(flags, "soulsold") && !flagHas(flags, "soulback") && fish >= price) {
          bumpCount("fish", -price);
          setFlag("soulback");
          openDialogue(p.npc, CHORT_TRADE_LINES);
          showToast("Your soul — and your shadow — are yours again.");
          return;
        }
        // Handing Radek his third lump of bog iron lights the forge.
        if (p.npc.id === "radek" && flagCount(flags, "iron") >= 3 && !flagHas(flags, "horseshoe")) {
          setFlag("horseshoe");
          showToast("Radek presses a warm horseshoe into your hand — STR +1 while you carry it.");
        }
        // On Lysa Hora everyone speaks the sabbath script — including the
        // Chort, who does no soul-business on the mountain (sabbath rules).
        // Conversations there are topic menus too; Beelzebub's blessing
        // is reached through his "Receive the blessing" topic.
        if (areaRef.current === "lysa") {
          const tsetL = topicsForLysa(p.npc, flags, firstMeeting);
          if (tsetL) {
            openTopicDialogue(p.npc, tsetL.intro, tsetL.topics);
          } else {
            openDialogue(p.npc, linesForLysa(p.npc, flags));
          }
          return;
        }
        // Viy keeps his scripted narration — he is not a conversation —
        // and it changes with the night and the chalk in your pocket.
        // Everyone else in the village answers questions, Viy's night
        // included (dialogue/viyNight.ts).
        if (p.npc.id === "viy") {
          const n = viyNarration(flags, isNight(clockRef.current.minute));
          if (n) {
            openDialogue(p.npc, n);
            return;
          }
        } else {
          const tset = topicsForVillage(p.npc, herbsRef.current, flags, fish, price, statsNow.int.total, firstMeeting);
          if (tset) {
            openTopicDialogue(p.npc, tset.intro, [...tset.topics, ...vigilTopics(p.npc.id, vigilContext())]);
            return;
          }
        }
        openDialogue(p.npc, linesFor(p.npc, herbsRef.current, flags, fish, price, statsNow.int.total));
        return;
      }
      case "gather": {
        const patch = patchesRef.current[p.idx];
        if (patch && patch.available) {
          const def = HERBS[patch.kind];
          // Zvirobiy is WIS-gated knowledge, not just a plant: below
          // WIS 2 the eye slides off it, the patch stays untouched,
          // and the failure says exactly what was checked.
          const wisNow = liveStats().wis.total;
          if (patch.kind === "zvirobiy" && wisNow < 2) {
            showToast(`You reach for the Zvirobiy — and hesitate. You do not truly know this herb yet: WIS check failed (your WIS ${wisNow}, it takes 2). Gather the other herbs first; Vesna's eye will teach yours. The patch stays, unpicked.`);
            return;
          }
          // An herb is 1 of weight; a full satchel picks nothing.
          if (carriedWeight(flagsRef.current) + 1 > carryCap(liveStats())) {
            carryBlockedToast(1);
            return;
          }
          patch.available = false;
          patch.respawnAt = performance.now() + 26000;
          const before = herbsRef.current;
          herbsRef.current += 1;
          setHudHerbs(herbsRef.current);
          dirtyRef.current = true;
          bumpCount("herbStock", 1);
          // A wise eye spots the second stem hiding under the first —
          // if there is room in the satchel to carry it.
          const wis = liveStats().wis.total;
          const keen =
            hash2(Math.floor(performance.now()), patch.x) < (wis - 1) * 0.08 &&
            carriedWeight(flagsRef.current) + 1 <= carryCap(liveStats());
          if (keen) bumpCount("herbStock", 1);
          showToast(
            herbLevel(herbsRef.current) > herbLevel(before)
              ? `${def.name} gathered. Herbalism Lv ${herbLevel(herbsRef.current)} — WIS is now ${wis}.`
              : keen
                ? `${def.name} — and a second stem hiding beneath it! Keen eye (WIS ${wis}).`
                : `${def.name} gathered · Herbalism Lv ${herbLevel(herbsRef.current)} · ${flagCount(flagsRef.current, "herbStock")} in satchel`,
          );
        }
        return;
      }
      case "cast": {
        const now = performance.now();
        fishingRef.current = { phase: "wait", biteAt: now + 2200 + hash2(Math.floor(now), 17) * 3800, biteEnd: 0 };
        showToast("Cast… now wait for the bobber to dip.");
        return;
      }
      case "reel":
        // Prompt exists but the bite window already closed — a late tap.
        return;
      case "crust":
        setFlag("bread");
        showToast("You take the crust — and the pinch of salt. For the Domovyk.");
        return;
      case "offer":
        flagsRef.current.delete("bread");
        setFlag("offering");
        syncFlags();
        showToast("You leave the crust behind the pich, quiet as you can. Something in the hut sighs — happily.");
        return;
      case "gift":
        setFlag("stone");
        showToast("A smooth river stone, warm as fresh bread. The Domovyk's thanks — CON +1 while you keep it.");
        return;
      case "iron": {
        // A lump is 3 of weight, hauled in the arms: the dig is checked
        // against your satchel load (fish, herbs, forged pieces), so a
        // stuffed satchel leaves you no way to haul — but the quest's
        // own lumps can always be carried to Radek, one load at a time.
        const stIron = liveStats();
        if (satchelWeight(flagsRef.current) + 3 > carryCap(stIron)) {
          showToast(`No way to haul a lump — your satchel load is ${satchelWeight(flagsRef.current)}/${carryCap(stIron)} before iron, and a lump of bog iron weighs 3. Your STR ${stIron.str.total} sets the limit. Cook, brew or eat something down first.`);
          return;
        }
        // The third lump (the southern, deepest one) is bedded deep in
        // the mud: an honest STR check. STR 3 forces it free every
        // time; below that it is a gamble that improves with STR, and
        // a failed pull consumes nothing — the lump stays for another
        // heave.
        if (p.idx === 2) {
          const str = stIron.str.total;
          const chance = str >= 3 ? 1 : 0.35 + (str - 1) * 0.25;
          if (hash2(Math.floor(performance.now()), 97) >= chance) {
            showToast(`You heave — the deepest lump does not budge, bedded in black mud. STR check failed (your STR ${str}: it takes STR 3 to force it free, or luck on another heave). Nothing lost — try again.`);
            return;
          }
        }
        setFlag(`ironspot${p.idx}`);
        const n = bumpCount("iron", 1);
        showToast(
          n >= 3
            ? "Bog iron — that's three lumps! Your arms are full: haul them to Radek at the forge."
            : p.idx === 2
              ? `With a sucking pop, the deepest lump comes FREE! Bog iron (${n}/3 for Radek).`
              : `Bog iron! A heavy, rust-dark lump (${n}/3 for Radek).`,
        );
        return;
      }
      case "wish": {
        const lineIdx = Math.floor(hash2(Math.floor(performance.now() / 1000), 41) * WISH_LINES.length);
        openDialogue(WELL_NPC, [WISH_LINES[lineIdx] ?? WISH_LINES[0]!]);
        // The well's lucky pebble answers a CHA check: the warmer the
        // tongue that wishes, the likelier the well gives something
        // back. A miss costs nothing but the wish itself, and says so.
        if (!flagHas(flagsRef.current, "pebble")) {
          const cha = liveStats().cha.total;
          const chance = 0.18 + (cha - 1) * 0.07;
          if (hash2(Math.floor(performance.now() / 997), 43) < chance) {
            setFlag("pebble");
            showToast("Something glints on the well's rim — a lucky pebble. The well liked your wishing (CHA check passed). It puts spring in your hands (DEX +1).");
          } else {
            showToast(`The well gives back only your face — no pebble this time. CHA check missed (your CHA ${cha}); the well favours a warmer tongue. Meet more of Zalissya and wish again.`);
          }
        }
        return;
      }
      case "cook": {
        // Karas soup, the znakharka way: one pond fish, one herb,
        // the pot over the campfire. Cooking level IS your Constitution.
        const fishIn = flagCount(flagsRef.current, "fish");
        const herbsIn = flagCount(flagsRef.current, "herbStock");
        if (fishIn < 1 || herbsIn < 1) {
          showToast(
            fishIn < 1 && herbsIn < 1
              ? "The pot wants 1 fish and 1 herb from your satchel. The pond is west, the herbs glow in the grass."
              : fishIn < 1
                ? "The pot wants a fish — cast a line from the pond's west shore first."
                : "The pot wants an herb — gather any glowing patch first (Kropyva, Polyn, Kalendula, Zvirobiy, Dereviy).",
          );
          return;
        }
        bumpCount("fish", -1);
        bumpCount("herbStock", -1);
        const before = flagCount(flagsRef.current, "cooked");
        const cooked = bumpCount("cooked", 1);
        bumpCount("meals", 1);
        showToast(
          craftLevel(cooked) > craftLevel(before)
            ? `Karas soup! Cooking Lv ${craftLevel(cooked)} — CON is now ${liveStats().con.total}. Eat it from your Character sheet.`
            : `Karas soup, rich and steaming. · Cooking Lv ${craftLevel(cooked)} · ${flagCount(flagsRef.current, "meals")} meal(s) in satchel`,
        );
        return;
      }
      case "smith": {
        if (!flagHas(flagsRef.current, "horseshoe")) {
          showToast("The forge is cold. It needs bog iron from the pond mud — three lumps for Radek — before anyone can work it.");
          return;
        }
        const nowS = performance.now();
        if (nowS < smithReadyRef.current) {
          showToast("The iron needs a moment in the heat — and so does your arm. A breath, then hammer again.");
          return;
        }
        // A forged piece is 2 of weight, and the anvil only works for
        // someone who can carry the result — checked before the hammer
        // lifts, so a blocked swing costs no cooldown.
        if (carriedWeight(flagsRef.current) + 2 > carryCap(liveStats())) {
          carryBlockedToast(2);
          return;
        }
        smithReadyRef.current = nowS + 7000;
        const before = flagCount(flagsRef.current, "smithed");
        const smithed = bumpCount("smithed", 1);
        bumpCount("forged", 1);
        // A strong arm now and then turns out a masterwork: a second,
        // finer piece off the same heat — if your back can take it.
        const str = liveStats().str.total;
        const master =
          hash2(Math.floor(nowS), 71) < (str - 1) * 0.1 &&
          carriedWeight(flagsRef.current) + 2 <= carryCap(liveStats());
        if (master) bumpCount("forged", 1);
        showToast(
          craftLevel(smithed) > craftLevel(before)
            ? `The hammer rings true! Smithing Lv ${craftLevel(smithed)} — STR is now ${liveStats().str.total}.`
            : master
              ? `A masterwork! Two fine pieces off one heat (STR ${str}). · Smithing Lv ${craftLevel(smithed)}`
              : `Clang… clang… a sound piece of ironwork. · Smithing Lv ${craftLevel(smithed)} · ${flagCount(flagsRef.current, "forged")} forged in satchel`,
        );
        return;
      }
      case "brew": {
        // Vesna's drying rack. Alchemy level IS your Intelligence, and
        // Intelligence tiers the bench: below INT 3 only the common
        // tonic (2 herbs) is known; at INT 3+ the bench offers a real
        // recipe choice, and Vesna's strong tonic (3 herbs) unlocks.
        const herbsIn = flagCount(flagsRef.current, "herbStock");
        if (herbsIn < 2) {
          showToast(`The cauldron wants 2 herbs from your satchel — you have ${herbsIn}. The glowing patches provide.`);
          return;
        }
        if (liveStats().int.total >= 3) {
          openDialogue(BREW_BENCH_NPC, BREW_CHOICE_LINES, 0, "brew");
          return;
        }
        performBrew("base");
        return;
      }
      case "bloom": {
        // Nichnyky weigh 0 — moon-flowers, the mountain insists — so
        // the carry cap never blocks them, by design of the brief's
        // own weight table.
        const patch = lysaPatchesRef.current[p.idx];
        if (patch && !patch.taken) {
          patch.taken = true;
          setFlag(`lysaFlowerSpot${p.idx}`);
          const n = bumpCount("lysaFlower", 1);
          showToast(
            n >= 3
              ? "Nichnyk gathered — that's three. Lay them on the offering stone, north of the bonfire."
              : `Nichnyk gathered · night-blooms ${n}/3 for the offering`,
          );
        }
        return;
      }
      case "offering": {
        const have = flagCount(flagsRef.current, "lysaFlower");
        if (have < 3) {
          showToast(`The offering stone wants 3 nichnyky — night-blooms from the slopes. You carry ${have}. Motrya knows where they hide.`);
          return;
        }
        bumpCount("lysaFlower", -3);
        setFlag("lysaOffering");
        showToast("You lay the nichnyky on the cold stone. One by one, they open — and the whole ring of standing stones seems to lean closer.");
        return;
      }
      case "dance": {
        if (!flagHas(flagsRef.current, "lysaOffering")) {
          showToast("The witches shake their heads — no dance before the offering. Three nichnyky on the stone, north of the fire, first.");
          return;
        }
        danceUntilRef.current = performance.now() + 5000;
        setFlag("lysaDanced");
        showToast("You step into the ring and keep the turn — the witches whoop, the devils stamp, and the fire dances with you. Now: Beelzebub is waiting.");
        return;
      }
      case "blessing":
        // Granted through Beelzebub's dialogue; the prompt spot only
        // exists to draw the eye to his seat.
        return;
      case "sleep": {
        const c = clockRef.current;
        openOptions(
          BED_NPC,
          [`Straw, a sheepskin, and the pich's warmth through the wall. ${timeLabel(c)}. How long will you lie down?`],
          "sleep",
          [
            { id: "morning", label: "Sleep until morning 🌅", aria: "Sleep until seven in the morning" },
            { id: "night", label: "Rest until nightfall 🌙", aria: "Rest until nine in the evening" },
            { id: "cancel", label: "Not now", aria: "Get up again" },
          ],
        );
        return;
      }
      case "vigil":
        vigilPendingRef.current = true;
        openDialogue(VIGIL_NPC, VIGIL_INTRO_LINES);
        return;
    }
  };
  const interactRef = useRef(doInteract);
  interactRef.current = doInteract;

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === "e" || k === " ") {
        if (!e.repeat) interactRef.current();
        return;
      }
      keysRef.current.add(k);
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Main loop
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    let raf = 0;
    let last = performance.now();
    let promptKey = "";
    let fightHudKey = "";

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = rect.width;
      const vh = rect.height;

      const p = playerRef.current;
      // --- movement input
      let mx = 0;
      let my = 0;
      const keys = keysRef.current;
      if (keys.has("w") || keys.has("arrowup")) my -= 1;
      if (keys.has("s") || keys.has("arrowdown")) my += 1;
      if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
      if (keys.has("d") || keys.has("arrowright")) mx += 1;
      const pad = padRef.current;
      if (pad.has("up")) my -= 1;
      if (pad.has("down")) my += 1;
      if (pad.has("left")) mx -= 1;
      if (pad.has("right")) mx += 1;
      mx += stickRef.current.x;
      my += stickRef.current.y;
      const len = Math.hypot(mx, my);
      const area = areaRef.current;
      const ws = worldSize(area);
      const solids = area === "lysa" ? LYSA_SOLID : isHutArea(area) ? hutSolids(area) : SOLID;
      const dancing = area === "lysa" && now < danceUntilRef.current;
      const frozen = dialogueRef.current != null || panelRef.current || dancing || fightRef.current != null;
      p.moving = len > 0.01 && !frozen;
      // Walking off abandons the cast — the line comes in empty.
      if (p.moving && fishingRef.current) fishingRef.current = null;
      if (p.moving) {
        const nx = mx / (len > 1 ? len : 1);
        const ny = my / (len > 1 ? len : 1);
        p.face = nx;
        p.phase += dt * 11;
        // Constitution is walking pace: a fed, seasoned traveller covers
        // ground brisker than a newcomer living on air (+4 per CON).
        const speed = PLAYER_SPEED + (liveStats().con.total - 1) * 4;
        const stepX = nx * speed * dt * Math.min(1, len);
        const stepY = ny * speed * dt * Math.min(1, len);
        // axis-separated collision
        let tx = clamp(p.x + stepX, PLAYER_R + 4, ws.w - PLAYER_R - 4);
        if (!solids.some((b) => circleRectCollide(tx, p.y - 6, PLAYER_R, b)) && (area !== "village" || !inPond(tx, p.y))) p.x = tx;
        let ty = clamp(p.y + stepY, 46, ws.h - 10);
        if (!solids.some((b) => circleRectCollide(p.x, ty - 6, PLAYER_R, b)) && (area !== "village" || !inPond(p.x, ty))) p.y = ty;
        dirtyRef.current = true;
      }

      // --- the clock: stops while talking, reading, dancing, or keeping
      // the vigil; paid out in 5-minute steps so the HUD is not redrawn
      // every frame.
      if (!frozen) {
        clockAccRef.current += dt * 1000;
        const mins = Math.floor(clockAccRef.current / MS_PER_GAME_MINUTE);
        if (mins >= 5) {
          clockAccRef.current -= mins * MS_PER_GAME_MINUTE;
          if (passTime(mins)) showToast("Dawn over Zalissya. Last night's meal and tonics have worn off.");
        }
      }

      // --- Viy's vigil
      const fight = fightRef.current;
      const lookingAway = lookHeldRef.current || keysRef.current.has("shift") || keysRef.current.has("l");
      if (fight) {
        const events = stepFight(fight, dt, { lookAway: lookingAway, ward: wardQueuedRef.current });
        wardQueuedRef.current = false;
        for (const e of events) {
          if (e.kind === "gazeWarning") showToast("“LIFT MY EYELIDS!” The servants strain at their forks. Look away before they open!");
          else if (e.kind === "gazeHit") showToast(`You met his eyes! Nerve −${e.damage}.`);
          else if (e.kind === "gazeAvoided") showToast("The lids fall again. You never looked.");
        }
        if (fight.outcome) {
          endVigil(fight.outcome === "won");
        } else {
          const ready = fight.t >= fight.wardReadyAt;
          const hudKey = `${fight.nerve}|${Math.floor(fight.t * 4)}|${fight.gaze}|${ready}`;
          if (hudKey !== fightHudKey) {
            fightHudKey = hudKey;
            setHudFight({ nerve: fight.nerve, max: fight.maxNerve, t: fight.t, gaze: fight.gaze, ready });
          }
        }
      }

      // --- area transitions: walk off the trail's end, arrive on the
      // other side. The village's east edge (between the cairns, on the
      // spur path) climbs to Lysa Hora; the summit's west trailhead
      // walks back down to Zalissya.
      if (!dialogueRef.current && !panelRef.current) {
        if (area === "village" && p.x >= WORLD_W - PLAYER_R - 6 && p.y >= TRAIL_Y_MIN && p.y <= TRAIL_Y_MAX) {
          areaRef.current = "lysa";
          setHudArea("lysa");
          p.x = LYSA_SPAWN.x;
          p.y = LYSA_SPAWN.y;
          fishingRef.current = null;
          promptRef.current = null;
          setPrompt(null);
          promptKey = "";
          if (!flagHas(flagsRef.current, "visitedLysa")) {
            setFlag("visitedLysa");
            showToast("The trail climbs… and climbs… and the trees give up. Lysa Hora. The Bald Mountain. Something is dancing around a fire up there.");
          } else {
            showToast("Lysa Hora — the sabbath is still going.");
          }
          dirtyRef.current = true;
        } else if (area === "lysa" && p.x <= PLAYER_R + 6 && p.y >= 400 && p.y <= 560) {
          areaRef.current = "village";
          setHudArea("village");
          p.x = VILLAGE_RETURN.x;
          p.y = VILLAGE_RETURN.y;
          promptRef.current = null;
          setPrompt(null);
          promptKey = "";
          showToast("Down the trail, back under the trees — Zalissya, and honest daylight.");
          dirtyRef.current = true;
        } else if (area === "village" && my < 0 && Math.abs(p.x - 384) < 34 && p.y >= 316 && p.y <= 342) {
          // Walking up into the Domovyk's hut door (north-west hut).
          enterHut(0);
        } else if (area === "village" && my < 0 && Math.abs(p.x - 1285) < 34 && p.y >= 798 && p.y <= 822) {
          // Walking up into Vesna's hut door (south-east hut — the one
          // she stands beside, by her garden).
          enterHut(1);
        } else if (isHutArea(area) && p.y >= HUT_H - 70) {
          // Out of the interior's south door — only the door gap in
          // the south wall lets the player reach this far down.
          exitHut();
        }
      }

      // --- herb respawn
      for (const patch of patchesRef.current) {
        if (!patch.available && now > patch.respawnAt) patch.available = true;
      }

      // --- fishing: the bite window opens, then closes
      const fishing = fishingRef.current;
      if (fishing) {
        if (fishing.phase === "wait" && now >= fishing.biteAt) {
          fishing.phase = "bite";
          // Dexterity is reaction: every point past the first buys
          // another 120ms to answer the bite.
          fishing.biteEnd = now + 1100 + (liveStats().dex.total - 1) * 120;
        } else if (fishing.phase === "bite" && now > fishing.biteEnd) {
          fishingRef.current = null;
          setToast("It slipped away… the bobber settles. Cast again when ready.");
        }
      }

      // --- chickens wander (village only — there are no chickens on the
      // Bald Mountain; the witches ate them, probably)
      for (const ch of area === "village" ? chickensRef.current : []) {
        ch.phase += dt;
        if (ch.wait > 0) {
          ch.wait -= dt;
        } else {
          // Chickens are not fools: stride too close and they scatter.
          const pdx = ch.x - p.x;
          const pdy = ch.y - p.y;
          const pd = Math.hypot(pdx, pdy);
          if (pd < 52 && pd > 0.01) {
            ch.x += (pdx / pd) * 95 * dt;
            ch.y += (pdy / pd) * 95 * dt;
            ch.tx = ch.x;
            ch.ty = ch.y;
            continue;
          }
          const dx = ch.tx - ch.x;
          const dy = ch.ty - ch.y;
          const d = Math.hypot(dx, dy);
          if (d < 4) {
            ch.wait = 1 + hash2(now * 0.001, ch.x) * 2.4;
            ch.tx = clamp(ch.x + (hash2(ch.y, now * 0.01) - 0.5) * 190, 620, 1060);
            ch.ty = clamp(ch.y + (hash2(ch.x, now * 0.01) - 0.5) * 130, 620, 860);
          } else {
            ch.x += (dx / d) * 26 * dt;
            ch.y += (dy / d) * 26 * dt;
          }
        }
      }

      // --- nearest interactable
      const flagsNow = flagsRef.current;
      // Once Viy is sealed, his hollow is only a hollow.
      const villageChars = flagHas(flagsNow, "viySealed") ? ALL_CHARS.filter((c) => c.id !== "viy") : ALL_CHARS;
      const vigilReady = flagHas(flagsNow, "chalk") && isNight(clockRef.current.minute);
      let nextPrompt: Prompt = null;
      let best = 64;
      if (area === "lysa") {
        // Lysa Hora interactables: the sabbath host, the night-blooms,
        // the offering stone, and the dance ring.
        for (const npc of LYSA_CHARS) {
          const pos = charPos(npc, now);
          const d = Math.hypot(pos.x - p.x, pos.y - p.y);
          const reach = npc.id === "beelzebub" ? 96 : 64;
          if (d < reach && d - reach < best - 64) { best = d - reach + 64; nextPrompt = { kind: "talk", npc }; }
        }
        lysaPatchesRef.current.forEach((patch, idx) => {
          if (patch.taken) return;
          const d = Math.hypot(patch.x - p.x, patch.y - p.y);
          if (d < 50 && d < best + 14) nextPrompt = { kind: "bloom", idx };
        });
        const lspot = (x: number, y: number, reach: number, make: () => Prompt) => {
          const d = Math.hypot(x - p.x, y - p.y);
          if (d < reach && d <= best + 14) { best = d; nextPrompt = make(); }
        };
        if (!flagHas(flagsNow, "lysaOffering")) {
          lspot(LYSA_OFFER_SPOT.x, LYSA_OFFER_SPOT.y, 62, () => ({ kind: "offering" }));
        }
        if (flagHas(flagsNow, "lysaOffering") && !flagHas(flagsNow, "lysaDanced")) {
          lspot(LYSA_DANCE_SPOT.x, LYSA_DANCE_SPOT.y, 66, () => ({ kind: "dance" }));
        }
      } else if (isHutArea(area)) {
        // Inside a hut: the resident, the pich offering spots (the
        // Domovyk's hut only — the bread offering and his gift live
        // indoors now), and the door back out.
        const resident = area === "hut1" ? VESNA_IN : DOMOVYK_IN;
        const rpos = charPos(resident, now);
        const rd = Math.hypot(rpos.x - p.x, rpos.y - p.y);
        if (rd < 64) { best = rd; nextPrompt = { kind: "talk", npc: resident }; }
        const hspot = (cond: boolean, x: number, y: number, reach: number, make: () => Prompt) => {
          if (!cond) return;
          const d = Math.hypot(x - p.x, y - p.y);
          if (d < reach && d <= best + 14) { best = d; nextPrompt = make(); }
        };
        if (area === "hut0") {
          hspot(true, BED_SPOT.x, BED_SPOT.y, 58, () => ({ kind: "sleep" }));
          hspot(flagHas(flagsNow, "bread"), PICH_IN_SPOT.x, PICH_IN_SPOT.y, 58, () => ({ kind: "offer" }));
          hspot(flagHas(flagsNow, "offering") && !flagHas(flagsNow, "stone"), PICH_IN_SPOT.x, PICH_IN_SPOT.y + 14, 58, () => ({ kind: "gift" }));
        }
        hspot(true, HUT_DOOR_IN.x, HUT_DOOR_IN.y, 50, () => ({ kind: "exit" }));
      } else if (fishingRef.current?.phase === "bite") {
        nextPrompt = { kind: "reel" };
      } else {
        for (const npc of villageChars) {
          const pos = charPos(npc, now);
          const d = Math.hypot(pos.x - p.x, pos.y - p.y);
          // Viy is enormous and the Bolotianyk sits out in the pond, so both
          // can be addressed from further off than a person. With the
          // chalk, after dark, approaching Viy begins the vigil.
          const reach = npc.id === "viy" ? 158 : npc.id === "bolotianyk" ? 92 : 64;
          if (d < reach && d - reach < best - 64) {
            best = d - reach + 64;
            nextPrompt = npc.id === "viy" && vigilReady ? { kind: "vigil" } : { kind: "talk", npc };
          }
        }
        patchesRef.current.forEach((patch, idx) => {
          if (!patch.available) return;
          const d = Math.hypot(patch.x - p.x, patch.y - p.y);
          if (d < 50 && d < best + 14) nextPrompt = { kind: "gather", idx };
        });
        // Village-life spots compete on plain distance from here on.
        const spot = (cond: boolean, x: number, y: number, reach: number, make: () => Prompt) => {
          if (!cond) return;
          const d = Math.hypot(x - p.x, y - p.y);
          if (d < reach && d <= best + 14) { best = d; nextPrompt = make(); }
        };
        spot(!fishingRef.current, FISH_SPOT.x, FISH_SPOT.y, 62, () => ({ kind: "cast" }));
        spot(!flagHas(flagsNow, "bread") && !flagHas(flagsNow, "offering"), CRUST_SPOT.x, CRUST_SPOT.y, 56, () => ({ kind: "crust" }));
        // The two enterable hut doors: stepping up to one offers entry
        // (and walking into it enters directly — see the transitions).
        // The bread offering itself is made indoors now, at the pich.
        spot(true, 384, 336, 46, () => ({ kind: "enter", hut: 0 as const }));
        spot(true, 1285, 810, 46, () => ({ kind: "enter", hut: 1 as const }));
        spot(true, WELL.x + WELL.w / 2, WELL.y + WELL.h / 2, 66, () => ({ kind: "wish" }));
        spot(true, COOK_SPOT.x, COOK_SPOT.y, 60, () => ({ kind: "cook" }));
        spot(true, FORGE_SPOT.x, FORGE_SPOT.y, 60, () => ({ kind: "smith" }));
        spot(true, BREW_SPOT.x, BREW_SPOT.y, 60, () => ({ kind: "brew" }));
        IRON_SPOTS.forEach((s, idx) => {
          spot(!flagHas(flagsNow, `ironspot${idx}`) && !flagHas(flagsNow, "horseshoe"), s.x, s.y, 52, () => ({ kind: "iron", idx }));
        });
      }
      if (fight) nextPrompt = null;
      const key = promptKeyOf(nextPrompt);
      if (key !== promptKey) {
        promptKey = key;
        promptRef.current = nextPrompt;
        setPrompt(nextPrompt);
      }

      // --- camera
      // (during the vigil the camera looks up toward Viy, so both the
      // chalk ring and his lids are in view)
      const focusY = fight ? p.y - 110 : p.y;
      const camX = clamp(p.x - vw / 2, 0, Math.max(0, ws.w - vw));
      const camY = clamp(focusY - vh / 2, 0, Math.max(0, ws.h - vh));

      // --- render
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, vw, vh);
      if (area === "lysa") {
        drawLysaGround(ctx2d, camX, camY, vw, vh, now, flagHas(flagsNow, "lysaOffering"));
        drawLysaFire(ctx2d, camX, camY, now);
        lysaPatchesRef.current.forEach((patch) => drawLysaFlower(ctx2d, patch.x, patch.y, camX, camY, now, !patch.taken));
      } else if (isHutArea(area)) {
        drawHutInterior(ctx2d, camX, camY, now, area === "hut1" ? 1 : 0, flagsNow);
      } else {
      drawGround(ctx2d, camX, camY, vw, vh, now);
      drawWell(ctx2d, camX, camY);
      drawFire(ctx2d, camX, camY, now);
      drawBrewBench(ctx2d, camX, camY, now);
      if (!flagHas(flagsNow, "bread") && !flagHas(flagsNow, "offering")) {
        drawCrust(ctx2d, camX, camY, now);
      }
      // bog iron glints in the pond mud, until dug
      IRON_SPOTS.forEach((s, idx) => {
        if (flagHas(flagsNow, `ironspot${idx}`) || flagHas(flagsNow, "horseshoe")) return;
        const ix = s.x - camX;
        const iy = s.y - camY;
        ctx2d.fillStyle = "#4a3423";
        ctx2d.beginPath(); ctx2d.ellipse(ix, iy, 10, 5.4, 0.3, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.fillStyle = "#6e4a2a";
        ctx2d.beginPath(); ctx2d.ellipse(ix - 2, iy - 1.4, 6, 3.2, 0.3, 0, Math.PI * 2); ctx2d.fill();
        const glint = 0.4 + Math.sin(now * 0.005 + idx * 2.2) * 0.3;
        ctx2d.fillStyle = `rgba(255,196,110,${glint})`;
        ctx2d.fillRect(ix + 2, iy - 4, 2.2, 2.2);
      });
      patchesRef.current.forEach((patch) => drawHerbPatch(ctx2d, patch.x, patch.y, camX, camY, now, patch.available, HERBS[patch.kind]));
      for (const f of FENCES) drawFence(ctx2d, f, camX, camY);
      }

      type Drawable = { y: number; draw: () => void };
      const drawables: Drawable[] = [];
      if (area === "village") {
      for (const h of HOUSES) {
        drawables.push({ y: h.y + h.h, draw: () => drawHouse(ctx2d, h, camX, camY, now) });
      }
      for (const tr of TREES) {
        if (tr.x < camX - 90 || tr.x > camX + vw + 90 || tr.y < camY - 130 || tr.y > camY + vh + 40) continue;
        drawables.push({ y: tr.y, draw: () => drawTree(ctx2d, tr, camX, camY, now) });
      }
      }
      for (const npc of area === "lysa" ? [...LYSA_CHARS, ...LYSA_DANCERS] : area === "hut0" ? [DOMOVYK_IN] : area === "hut1" ? [VESNA_IN] : villageChars) {
        const pos = charPos(npc, now);
        drawables.push({
          y: pos.y,
          draw: () => {
            const sx = pos.x - camX;
            const sy = pos.y - camY;
            if (npc.style === "domovyk") drawDomovyk(ctx2d, sx, sy, now);
            else if (npc.style === "lisovyk") drawLisovyk(ctx2d, sx, sy, now);
            else if (npc.style === "chort") drawChort(ctx2d, sx, sy, now);
            else if (npc.style === "bolotianyk") drawBolotianyk(ctx2d, sx, sy, now);
            else if (npc.style === "viy") drawViy(ctx2d, sx, sy, now);
            else if (npc.style === "beelzebub") drawBeelzebub(ctx2d, sx, sy, now);
            else if (npc.style === "witch") drawWitch(ctx2d, sx, sy, npc.tunic, npc.hair, now, false);
            else if (npc.style === "dancer") drawWitch(ctx2d, sx, sy, npc.tunic, npc.hair, now, true);
            else {
              drawPerson(ctx2d, sx, sy, {
                tunic: npc.tunic, hair: npc.hair, style: npc.style,
                moving: false, phase: 0, face: clamp(p.x - pos.x, -1, 1) * 0.7, t: now,
              });
            }
          },
        });
        // name tag — each kind floats at its own height (Viy's is a warning)
        const tagLift = npc.id === "viy" ? 168 : npc.style === "beelzebub" ? 96 : npc.style === "witch" ? 64 : npc.style === "lisovyk" ? 122 : npc.style === "domovyk" ? 48 : npc.style === "bolotianyk" ? 58 : 66;
        const tagText = npc.id === "viy" ? "Вій · Viy" : npc.name;
        if (npc.style !== "dancer") drawables.push({
          y: pos.y + 1,
          draw: () => {
            ctx2d.font = npc.id === "viy" ? "700 13px Georgia, serif" : "600 11px Georgia, serif";
            ctx2d.textAlign = "center";
            const wText = ctx2d.measureText(tagText).width + 16;
            ctx2d.fillStyle = npc.id === "viy" ? "rgba(38,10,14,0.72)" : "rgba(28,24,16,0.55)";
            rr(ctx2d, pos.x - camX - wText / 2, pos.y - camY - tagLift, wText, npc.id === "viy" ? 20 : 16, 8);
            ctx2d.fill();
            ctx2d.fillStyle = npc.id === "viy" ? "#f0b9a6" : "#f3e9d2";
            ctx2d.fillText(tagText, pos.x - camX, pos.y - camY - tagLift + (npc.id === "viy" ? 14.5 : 12));
          },
        });
      }
      for (const ch of area === "village" ? chickensRef.current : []) {
        drawables.push({
          y: ch.y,
          draw: () => drawChicken(ctx2d, ch.x, ch.y, ch.wait > 0.4 && ch.wait < 1 ? Math.sin((1 - ch.wait) * 9) * 0.5 + 0.5 : 0, camX, camY),
        });
      }
      drawables.push({
        y: p.y,
        draw: () => drawPerson(ctx2d, p.x - camX, p.y - camY, {
          tunic: "#efe3c8", hair: "#5d3a1a", style: "player",
          moving: p.moving || dancing, phase: dancing ? now * 0.018 : p.phase, face: p.face, t: now,
          // Sold your soul to the Chort? Then the sun casts no shadow
          // for you — until you buy it back with three fish.
          shadow: !(flagHas(flagsNow, "soulsold") && !flagHas(flagsNow, "soulback")),
        }),
      });
      if (fishingRef.current) {
        const fphase = fishingRef.current.phase;
        drawables.push({
          y: BOBBER.y + 2,
          draw: () => drawFishing(ctx2d, p.x, p.y, camX, camY, now, fphase),
        });
      }
      drawables.sort((a, b) => a.y - b.y);
      for (const d of drawables) d.draw();

      // drifting pollen / seeds in the light (outdoors only — the huts
      // have dust motes enough of their own in the lamplight)
      ctx2d.fillStyle = "rgba(255,244,200,0.55)";
      for (let i = 0; i < (isHutArea(area) ? 0 : 22); i++) {
        const px = ((hash2(i, 3) * WORLD_W + now * 0.012 * (0.6 + hash2(i, 4))) % WORLD_W) - camX;
        const py = ((hash2(i, 8) * WORLD_H + Math.sin(now * 0.001 + i * 2.1) * 16) % WORLD_H) - camY;
        if (px < -4 || px > vw + 4 || py < -4 || py > vh + 4) continue;
        ctx2d.beginPath();
        ctx2d.arc(px, py, 1.3 + hash2(i, 9) * 1.2, 0, Math.PI * 2);
        ctx2d.fill();
      }

      // vignette — warm for the village day, cold moonlit blue on Lysa Hora
      if (area === "lysa") {
        ctx2d.fillStyle = "rgba(16,18,48,0.18)";
        ctx2d.fillRect(0, 0, vw, vh);
      }
      const vg = ctx2d.createRadialGradient(vw / 2, vh * 0.42, Math.min(vw, vh) * 0.36, vw / 2, vh * 0.5, Math.max(vw, vh) * 0.78);
      vg.addColorStop(0, "rgba(60,30,0,0)");
      vg.addColorStop(1, area === "lysa" ? "rgba(6,6,24,0.42)" : "rgba(43,26,4,0.28)");
      ctx2d.fillStyle = vg;
      ctx2d.fillRect(0, 0, vw, vh);

      // night over the open village (huts are lamp-lit; Lysa Hora is
      // always moonlit), then the vigil on top so the chalk stays bright
      if (area === "village") {
        drawNight(ctx2d, darkness(clockRef.current.minute), vw, vh, FIRE.x + FIRE.w / 2 - camX, FIRE.y + FIRE.h / 2 - camY);
      }
      if (fight) {
        drawVigil(ctx2d, fight, VIGIL_CENTER.x, VIGIL_CENTER.y, camX, camY, now);
        drawVigilOverlay(ctx2d, fight, vw, vh, lookingAway, now);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [started]);

  function inPond(x: number, y: number): boolean {
    const dx = (x - POND.x) / (POND.rx + 6);
    const dy = (y - POND.y) / (POND.ry + 6);
    return dx * dx + dy * dy < 1;
  }

  // --- hold-to-move pad ------------------------------------------------------
  // Each direction is a plain button: press and hold to walk, release to
  // stop. Two buttons can be held at once for diagonal movement (each
  // captures its own pointer, so multi-touch works). There is deliberately
  // NO drag-based control: on the user's phone a downward drag is claimed
  // by the host's pull-to-refresh before the page can use it, whatever the
  // page sets — a stationary hold produces no scroll/refresh gesture at all.
  const padDown = (dirs: string[]) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dirs.forEach((d) => padRef.current.add(d));
    setPadPressed(new Set(padRef.current));
  };
  const padUp = (dirs: string[]) => () => {
    let changed = false;
    dirs.forEach((d) => { if (padRef.current.delete(d)) changed = true; });
    if (!changed) return;
    setPadPressed(new Set(padRef.current));
  };
  // If the window loses focus mid-hold, drop all held directions so the
  // player never walks on unattended.
  useEffect(() => {
    const clear = () => {
      padRef.current.clear();
      stickRef.current = { x: 0, y: 0 };
      setPadPressed(new Set());
    };
    window.addEventListener("blur", clear);
    return () => window.removeEventListener("blur", clear);
  }, []);

  const switchControls = (next: "pad" | "stick") => {
    padRef.current.clear();
    setPadPressed(new Set());
    stickRef.current = { x: 0, y: 0 };
    setControls(next);
    storeControlPref(next);
  };

  const onReset = () => {
    resetMut.mutate(undefined, {
      onSuccess: () => {
        talkedRef.current = new Set();
        herbsRef.current = 0;
        flagsRef.current = new Set();
        areaRef.current = "village";
        setHudArea("village");
        lysaPatchesRef.current.forEach((pt) => { pt.taken = false; });
        danceUntilRef.current = 0;
        blessingPendingRef.current = false;
        fishingRef.current = null;
        smithReadyRef.current = 0;
        panelRef.current = false;
        setPanelOpen(false);
        playerRef.current = { x: SPAWN.x, y: SPAWN.y, face: 0, moving: false, phase: 0 };
        patchesRef.current.forEach((pt) => { pt.available = true; });
        setHudTalked([]);
        setHudHerbs(0);
        setHudFlags(new Set());
        setToast(null);
        setConfirmReset(false);
        dialogueRef.current = null;
        setDialogue(null);
        clockRef.current = { day: 1, minute: START_MINUTE };
        clockAccRef.current = 0;
        setHudClock(clockRef.current);
        fightRef.current = null;
        setHudFight(null);
        vigilPendingRef.current = false;
      },
    });
  };

  const lvl = herbLevel(hudHerbs);
  const fish = flagCount(hudFlags, "fish");
  const fishTotal = Math.max(flagCount(hudFlags, "fishTotal"), fish);
  const fishLvl = fishLevel(fishTotal);
  const herbStock = flagCount(hudFlags, "herbStock");
  const cooked = flagCount(hudFlags, "cooked");
  const meals = flagCount(hudFlags, "meals");
  const smithed = flagCount(hudFlags, "smithed");
  const forged = flagCount(hudFlags, "forged");
  const brewed = flagCount(hudFlags, "brewed");
  const potions = flagCount(hudFlags, "potions");
  const strongPotions = flagCount(hudFlags, "strongPotions");
  const cookLvl = craftLevel(cooked);
  const smithLvl = craftLevel(smithed);
  const alchemyLvl = craftLevel(brewed);
  const stats = computeStats({
    herbs: hudHerbs, fishTotal, cooked, smithed, brewed,
    met: hudTalked.length, flags: hudFlags,
  });
  const price = soulPrice(stats);
  const carried = carriedWeight(hudFlags);
  const cap = carryCap(stats);
  const iron = flagCount(hudFlags, "iron");
  const haulingIron = !flagHas(hudFlags, "horseshoe") && iron > 0;
  const soulLost = flagHas(hudFlags, "soulsold") && !flagHas(hudFlags, "soulback");
  const lysaFlowers = flagCount(hudFlags, "lysaFlower");
  const quests = questLog({ area: hudArea, talked: hudTalked, herbs: hudHerbs, flags: hudFlags, soulPrice: price, night: isNight(hudClock.minute) });
  const objective = hudFight ? "Hold the chalk circle until the rooster crows" : quests.objective;
  const promptHerb =
    prompt?.kind === "gather" ? HERBS[HERB_SPOTS[prompt.idx]?.kind ?? "kropyva"] : null;
  const promptLabel = !prompt
    ? ""
    : prompt.kind === "talk"
      ? prompt.npc.id === "viy" ? "Approach · Viy" : `Talk · ${prompt.npc.name}`
      : prompt.kind === "enter"
        ? "Step inside 🚪"
        : prompt.kind === "exit"
          ? "Step outside"
          : prompt.kind === "gather"
        ? `Gather ${promptHerb?.name ?? "herb"} 🌿`
        : prompt.kind === "cast"
          ? "Cast a line 🎣"
          : prompt.kind === "reel"
            ? "REEL IN! 🎣"
            : prompt.kind === "crust"
              ? "Take the crust 🍞"
              : prompt.kind === "offer"
                ? "Leave the crust by the pich"
                : prompt.kind === "gift"
                  ? "Something glints by the door…"
                  : prompt.kind === "iron"
                    ? "Dig bog iron"
                    : prompt.kind === "cook"
                      ? "Cook karas soup 🍲"
                      : prompt.kind === "smith"
                        ? "Work the forge 🔨"
                        : prompt.kind === "brew"
                          ? stats.int.total >= 3 ? "Brew — choose a recipe ⚗" : "Brew a tonic ⚗"
                          : prompt.kind === "bloom"
                            ? "Gather nichnyk 🌙"
                            : prompt.kind === "offering"
                              ? "Lay the offering 🌙"
                              : prompt.kind === "dance"
                                ? "Join the dance 💃"
                                : prompt.kind === "sleep"
                                  ? "Lie down 🛏"
                                  : prompt.kind === "vigil"
                                    ? "Draw the chalk circle ◯"
                                    : "Make a wish ✨";
  const promptAria = !prompt
    ? ""
    : prompt.kind === "talk"
      ? prompt.npc.id === "viy" ? "Approach Viy — carefully" : `Talk to ${prompt.npc.name}`
      : prompt.kind === "vigil"
        ? "Draw the chalk circle and begin Viy's vigil"
        : promptLabel.replace(/\s*[🎣🍞✨🍲🔨⚗🌙💃🚪🛏◯]\s*/g, " ").trim();
  const sealed = flagHas(hudFlags, "viySealed");
  const keepsakes: string[] = [
    ...(sealed ? ["✦ Keeper of the vigil (WIS +1, CHA +1)"] : []),
    ...(flagHas(hudFlags, "chalk") && !sealed ? ["◯ Blessed chalk"] : []),
    ...(flagHas(hudFlags, "wreath") && !sealed ? ["🌿 Vesna's wreath"] : []),
    ...(flagHas(hudFlags, "ironward") && !sealed ? ["⚒ Iron nails for the chalk"] : []),
    ...(flagHas(hudFlags, "moonstone") ? ["🌙 Moonstone (WIS +1, CHA +1)"] : []),
    ...(flagHas(hudFlags, "gold") ? ["🪙 Devil's gold (CHA +2)"] : []),
    ...(flagHas(hudFlags, "stone") ? ["🪨 Warm stone (CON +1)"] : []),
    ...(flagHas(hudFlags, "horseshoe") ? ["✦ Horseshoe (STR +1)"] : []),
    ...(flagHas(hudFlags, "pebble") ? ["✨ Lucky pebble (DEX +1)"] : []),
    ...(flagHas(hudFlags, "bread") ? ["🍞 Domovyk's crust"] : []),
  ];
  // Skill rows for the Character sheet: name, level, lifetime count, and
  // what the next level wants.
  const skillRows: Array<{ name: string; level: number; done: number; next: number | null; stat: string }> = [
    { name: "Herbalism", level: lvl, done: hudHerbs, next: THRESH[lvl] ?? null, stat: "WIS" },
    { name: "Fishing", level: fishLvl, done: fishTotal, next: FISH_THRESH[fishLvl] ?? null, stat: "DEX" },
    { name: "Cooking", level: cookLvl, done: cooked, next: CRAFT_THRESH[cookLvl] ?? null, stat: "CON" },
    { name: "Smithing", level: smithLvl, done: smithed, next: CRAFT_THRESH[smithLvl] ?? null, stat: "STR" },
    { name: "Alchemy", level: alchemyLvl, done: brewed, next: CRAFT_THRESH[alchemyLvl] ?? null, stat: "INT" },
  ];
  // --- Quest log: every thread, from systems/quests.ts (the same source
  // as the objective line above, so the two always agree).
  const questStatus = (q: QuestItem): "done" | "active" | "todo" => (q.done ? "done" : q.active ? "active" : "todo");

  const openPanel = (tab: "stats" | "skills" | "quests") => {
    if (fightRef.current) return;
    setPanelTab(tab);
    panelRef.current = true;
    setPanelOpen(true);
  };
  const closePanel = () => {
    panelRef.current = false;
    setPanelOpen(false);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#1e3a24] select-none" style={{ touchAction: "none", overscrollBehavior: "none" }}>
      <SafeAreaTopScrim backgroundColor="rgba(30,58,36,0)" />
      <div
        ref={wrapRef}
        className="absolute inset-0"
        style={{ touchAction: "none", overscrollBehavior: "none" }}
      >
        <canvas ref={canvasRef} className="block" style={{ touchAction: "none" }} aria-label="Zalissya village clearing — game view" />
        {/* warm sunlight wash in the village; cold moonwash on Lysa Hora */}
        <div className="pointer-events-none absolute inset-0" style={{ background: hudArea === "lysa" || (hudArea === "village" && isNight(hudClock.minute)) ? "linear-gradient(160deg, rgba(140,160,255,0.13) 0%, rgba(140,160,255,0) 50%)" : isHutArea(hudArea) ? "linear-gradient(165deg, rgba(255,170,80,0.15) 0%, rgba(255,170,80,0) 55%)" : "linear-gradient(135deg, rgba(255,196,86,0.14) 0%, rgba(255,196,86,0) 45%)" }} />
      </div>

      {!started && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-[#16281a]/72 p-5"
          style={{ touchAction: "none", overscrollBehavior: "none" }}
        >
          <div className="w-full max-w-xs rounded-2xl border border-[#d9c491]/50 bg-[#f3e9d2] p-6 text-center shadow-2xl">
            <h1 className="font-serif text-3xl font-bold text-[#33241a]">Zalissya</h1>
            <p className="mt-2 text-sm text-[#5d4630]">A Ukrainian folk tale</p>
            <button
              type="button"
              aria-label={saveQuery.data?.exists ? "Continue" : "Enter the village"}
              onClick={() => setStarted(true)}
              className="mt-5 w-full rounded-xl bg-[#7a4a2b] px-4 py-3 font-serif text-base font-bold text-[#f3e9d2] shadow active:bg-[#5d3a1f]"
            >
              {saveQuery.data?.exists ? "Continue" : "Enter the village"}
            </button>
          </div>
        </div>
      )}

      {started && (
        <>
          {/* HUD — deliberately slim: where you are, the one current
              objective, and urgent warnings only. Skill levels, stat
              totals, carrying and keepsakes all live in the Character
              sheet; the full thread list lives in Quests. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3 pt-safe">
            <div className="mt-2 max-w-[250px] rounded-xl bg-[#1c1409]/62 px-3 py-2 text-[#f3e9d2] backdrop-blur-[2px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#cbb27a]">
                {hudArea === "lysa" ? "🌙 Lysa Hora · the Bald Mountain" : hudArea === "hut0" ? "🏠 Inside · the Domovyk's hut" : hudArea === "hut1" ? "🏠 Inside · Vesna's hut" : "Zalissya"}
                <span className="ml-1.5 normal-case tracking-normal text-[#e8d7ad]">{timeLabel(hudClock)}</span>
              </p>
              <p className="font-serif text-[13px] font-bold leading-tight">
                {objective}
              </p>
              {soulLost && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#f0a696]">
                  ☠ No shadow — the Chort has your soul ({price} fish buys it back)
                </p>
              )}
              {carried > cap && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#f0a696]">
                  🎒 Over-full ({carried}/{cap}) — no new pickups until the load lightens
                </p>
              )}
            </div>
            <div className="pointer-events-auto mt-2 flex flex-col items-end gap-1.5">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label="Open character sheet — stats, skills and satchel"
                  onClick={() => openPanel("stats")}
                  className="rounded-lg bg-[#7a4a2b]/85 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow backdrop-blur-[2px]"
                >
                  Character
                </button>
                <button
                  type="button"
                  aria-label={`Open quest log — ${quests.done} of ${quests.total} quests done`}
                  onClick={() => openPanel("quests")}
                  className="rounded-lg bg-[#7a4a2b]/85 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow backdrop-blur-[2px]"
                >
                  Quests
                </button>
              </div>
              {confirmReset ? (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    aria-label="Confirm new game"
                    onClick={onReset}
                    className="rounded-lg bg-[#a83c32] px-3 py-2 text-xs font-bold text-white shadow"
                  >
                    Start over
                  </button>
                  <button
                    type="button"
                    aria-label="Cancel new game"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg bg-[#1c1409]/70 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow"
                  >
                    Keep playing
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label="Start a new game"
                  onClick={() => setConfirmReset(true)}
                  className="rounded-lg bg-[#1c1409]/55 px-3 py-2 text-xs font-semibold text-[#f3e9d2] backdrop-blur-[2px]"
                >
                  New game
                </button>
              )}
            </div>
          </div>

          {/* Hold-to-move pad — cross / D-pad layout.
              Press and hold a direction to walk. Diagonals work two
              ways: hold two adjacent arrows at once (each button
              captures its own pointer, so multi-touch works), or hold
              a corner cell — the spots between the arrows are real
              buttons that hold both neighbouring directions, so a
              thumb landing between arrows walks diagonally instead of
              hitting dead space. No dragging anywhere: a downward drag
              is what the phone's pull-to-refresh steals. */}
          {/* Pad / Stick toggle — only where a joystick is allowed (the
              GitHub Pages build). Muse never shows it. */}
          {JOYSTICK_ALLOWED && !dialogue && !panelOpen && !hudFight && (
            <div className="absolute bottom-[212px] left-4 z-10 flex overflow-hidden rounded-lg border border-[#f3e9d2]/40 shadow" role="group" aria-label="Movement control style">
              {(["pad", "stick"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={controls === c}
                  aria-label={c === "pad" ? "Use the direction pad" : "Use the floating joystick"}
                  onClick={() => switchControls(c)}
                  className={`px-3 py-2 text-xs font-bold backdrop-blur-[2px] ${controls === c ? "bg-[#d99a2b] text-[#33241a]" : "bg-[#1c1409]/55 text-[#f3e9d2]"}`}
                >
                  {c === "pad" ? "Pad" : "Stick"}
                </button>
              ))}
            </div>
          )}
          {JOYSTICK_ALLOWED && controls === "stick" && !dialogue && !panelOpen && !hudFight && (
            <div className="absolute bottom-5 left-4 z-10">
              <Joystick stickRef={stickRef} />
            </div>
          )}
          {controls === "pad" && !dialogue && !panelOpen && !hudFight && (
            <div
              className="absolute bottom-5 left-4 z-10"
              style={{ touchAction: "none" }}
              role="group"
              aria-label="Movement controls"
            >
              {/* Plus-shaped backdrop so the cross reads as one control */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="absolute h-full w-[62px] rounded-full bg-[#1c1409]/35" />
                <div className="absolute h-[62px] w-full rounded-full bg-[#1c1409]/35" />
              </div>
              <div className="relative grid grid-cols-3 grid-rows-3 gap-1">
                <PadButton dirs={["up", "left"]} label="Walk up and left" rotate={-45} corner pressed={padPressed.has("up") && padPressed.has("left")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["up"]} label="Walk up" rotate={0} pressed={padPressed.has("up")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["up", "right"]} label="Walk up and right" rotate={45} corner pressed={padPressed.has("up") && padPressed.has("right")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["left"]} label="Walk left" rotate={-90} pressed={padPressed.has("left")} onDown={padDown} onUp={padUp} />
                <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center">
                  <span className={`h-3 w-3 rounded-full border transition-colors ${padPressed.size > 0 ? "border-[#f3e9d2]/80 bg-[#d99a2b]/70" : "border-[#f3e9d2]/30 bg-[#1c1409]/40"}`} />
                </span>
                <PadButton dirs={["right"]} label="Walk right" rotate={90} pressed={padPressed.has("right")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["down", "left"]} label="Walk down and left" rotate={-135} corner pressed={padPressed.has("down") && padPressed.has("left")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["down"]} label="Walk down" rotate={180} pressed={padPressed.has("down")} onDown={padDown} onUp={padUp} />
                <PadButton dirs={["down", "right"]} label="Walk down and right" rotate={135} corner pressed={padPressed.has("down") && padPressed.has("right")} onDown={padDown} onUp={padUp} />
              </div>
              {padPressed.size === 2 && (
                <p className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-wide text-[#f3e9d2] [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                  Diagonal
                </p>
              )}
            </div>
          )}

          {/* Viy's vigil — nerve, the night left, and the two controls.
              Both are press/hold buttons (no drags), so they are safe in
              the Muse build. Keyboard: E / Space wards, hold Shift or L
              to look away. */}
          {hudFight && !dialogue && (
            <>
              <div className="pointer-events-none absolute inset-x-0 bottom-[140px] z-10 flex justify-center px-4 pb-safe">
                <div className="w-full max-w-xs rounded-xl bg-[#1c1409]/75 px-3 py-2 text-[#f3e9d2] backdrop-blur-[2px]">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span>Nerve</span>
                    <span>{hudFight.nerve}/{hudFight.max}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[#f3e9d2]/20">
                    <div className="h-2 rounded-full bg-[#c23b2a]" style={{ width: `${(100 * hudFight.nerve) / hudFight.max}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-semibold">
                    <span>Until cockcrow 🐓</span>
                    <span>{Math.max(0, Math.ceil(VIGIL_SECONDS - hudFight.t))}s</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[#f3e9d2]/20">
                    <div className="h-2 rounded-full bg-[#d99a2b]" style={{ width: `${Math.min(100, (100 * hudFight.t) / VIGIL_SECONDS)}%` }} />
                  </div>
                </div>
              </div>
              {hudFight.gaze !== "closed" && (
                <p className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center font-serif text-2xl font-bold text-[#f0a696] [text-shadow:0_2px_6px_rgba(0,0,0,0.9)]">
                  {hudFight.gaze === "rising" ? "“Lift my eyelids!”" : lookHeld ? "…eyes covered…" : "DON'T LOOK!"}
                </p>
              )}
              <div className="absolute inset-x-0 bottom-6 z-10 flex justify-between gap-3 px-4 pb-safe" style={{ touchAction: "none" }}>
                <button
                  type="button"
                  aria-label="Look away — hold while Viy's eyes are open"
                  aria-pressed={lookHeld}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    lookHeldRef.current = true;
                    setLookHeld(true);
                  }}
                  onPointerUp={releaseLook}
                  onPointerCancel={releaseLook}
                  onLostPointerCapture={releaseLook}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`flex h-24 w-32 flex-col items-center justify-center rounded-2xl border font-serif text-base font-bold shadow-xl ${
                    lookHeld ? "border-[#f3e9d2] bg-[#3a3444] text-[#f3e9d2]" : "border-[#f3e9d2]/50 bg-[#1c1409]/75 text-[#f3e9d2]"
                  }`}
                  style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
                >
                  Look away 🙈
                  <span className="text-[10px] font-semibold opacity-75">hold</span>
                </button>
                <button
                  type="button"
                  aria-label="Ward — drive back the host from the chalk"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    wardQueuedRef.current = true;
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`flex h-24 w-32 flex-col items-center justify-center rounded-2xl font-serif text-base font-bold shadow-xl ${
                    hudFight.ready && !lookHeld ? "bg-[#d99a2b] text-[#33241a]" : "bg-[#8a7350] text-[#33241a]/70"
                  }`}
                  style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
                >
                  Ward ✋
                  <span className="text-[10px] font-semibold opacity-75">{hudFight.ready ? "tap" : "catching breath…"}</span>
                </button>
              </div>
            </>
          )}

          {/* Toast — catches, keepsakes, and consequences */}
          {toast && (
            <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center px-4">
              <p className="max-w-md rounded-xl bg-[#1c1409]/82 px-4 py-2.5 text-center font-serif text-sm font-semibold text-[#f3e9d2] shadow-xl backdrop-blur-[2px]">
                {toast}
              </p>
            </div>
          )}

          {/* Interact button */}
          {!dialogue && !panelOpen && !hudFight && prompt && (
            <button
              type="button"
              aria-label={promptAria}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => interactRef.current()}
              className={`absolute bottom-8 right-5 z-10 rounded-full px-6 py-4 font-serif text-base font-bold shadow-xl ${
                prompt.kind === "reel"
                  ? "animate-pulse bg-[#c23b2a] text-[#f3e9d2] active:bg-[#962c1f]"
                  : "bg-[#d99a2b] text-[#33241a] active:bg-[#b57e1f]"
              }`}
            >
              {promptLabel}
            </button>
          )}
          {!dialogue && !panelOpen && !hudFight && !prompt && controls === "pad" && (
            <p className="pointer-events-none absolute bottom-6 right-5 z-10 max-w-[38%] text-right text-[11px] leading-snug text-[#f3e9d2]/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
              Hold a direction to walk · WASD works too
            </p>
          )}

          {/* Dialogue */}
          {dialogue && (
            <div className="absolute inset-x-0 bottom-0 z-20 p-3 pb-safe">
              <div className="mx-auto max-w-xl rounded-2xl border border-[#d9c491]/60 bg-[#f3e9d2] p-4 shadow-2xl">
                <p className="font-serif text-sm font-bold text-[#7a4a2b]">
                  {dialogue.npc.name}{" "}
                  {dialogue.npc.pron && <span className="font-normal italic text-[#a3805a]">({dialogue.npc.pron}) </span>}
                  <span className="font-normal text-[#a3805a]">· {dialogue.npc.role}</span>
                </p>
                {dialogue.view === "topic" && dialogue.topic && (
                  <p className="mt-1 text-[13px] italic text-[#a3805a]">
                    You ask — “{dialogue.topic.question}”
                  </p>
                )}
                <p className="mt-1.5 min-h-12 text-[15px] leading-relaxed text-[#33241a]">
                  {dialogue.view === "topic" && dialogue.topic
                    ? dialogue.topic.lines[dialogue.topicLine ?? 0]
                    : dialogue.view === "menu"
                      ? "Ask what you will."
                      : dialogue.lines[dialogue.line]}
                </p>
                {dialogue.view === "menu" && dialogue.topics ? (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {dialogue.topics.map((t) => {
                      const asked = dialogue.asked?.includes(t.id) ?? false;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          aria-label={`Ask ${dialogue.npc.name} about ${t.label}`}
                          onClick={() => selectTopic(t)}
                          className={`rounded-lg px-3.5 py-2 text-left font-serif text-sm font-bold ${
                            asked
                              ? "bg-[#e9dcbc] text-[#8a7350]"
                              : "bg-[#e2d3ae] text-[#5d4630] active:bg-[#d3c096]"
                          }`}
                        >
                          {asked ? "✓ " : ""}{t.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-label="End conversation"
                      onClick={endDialogue}
                      className="mt-1 rounded-lg bg-[#7a4a2b] px-3.5 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                    >
                      Farewell
                    </button>
                  </div>
                ) : dialogue.view === "topic" && dialogue.topic ? (
                  dialogue.topic.action === "bargain" && (dialogue.topicLine ?? 0) >= dialogue.topic.lines.length - 1 ? (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] italic text-[#a3805a]">He is holding out a pen…</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="Sign the Chort's bargain"
                          onClick={() => chortChoice(true)}
                          className="rounded-lg bg-[#7e2430] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d1a23]"
                        >
                          Sign it ✒
                        </button>
                        <button
                          type="button"
                          aria-label="Refuse the Chort's bargain"
                          onClick={() => chortChoice(false)}
                          className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                        >
                          Keep my soul
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-[#a3805a]">
                        {(dialogue.topicLine ?? 0) + 1} / {dialogue.topic.lines.length}
                      </span>
                      <button
                        type="button"
                        aria-label={(dialogue.topicLine ?? 0) + 1 < dialogue.topic.lines.length ? "Next line" : "Back to questions"}
                        onClick={() => interactRef.current()}
                        className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                      >
                        {(dialogue.topicLine ?? 0) + 1 < dialogue.topic.lines.length ? "Next" : "Back to questions"}
                      </button>
                    </div>
                  )
                ) : dialogue.choiceAt != null && dialogue.line === dialogue.choiceAt ? (
                  dialogue.choiceKind === "options" && dialogue.options && dialogue.optionsTag ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {dialogue.options.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          aria-label={o.aria}
                          onClick={() => pickOption(dialogue.optionsTag ?? "sleep", o.id)}
                          className={`rounded-lg px-3.5 py-2 font-serif text-sm font-bold ${
                            o.id === "cancel" ? "bg-[#e2d3ae] text-[#5d4630] active:bg-[#d3c096]" : "bg-[#7a4a2b] text-[#f3e9d2] active:bg-[#5d3a1f]"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  ) : dialogue.choiceKind === "brew" ? (
                    <div className="mt-2">
                      <span className="text-[11px] italic text-[#a3805a]">The cauldron bubbles, waiting…</span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-label="Brew a tonic — two herbs"
                          onClick={() => brewChoice("base")}
                          className="rounded-lg bg-[#4c6b35] px-3.5 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#3a5427]"
                        >
                          Tonic · 2 herbs ⚗
                        </button>
                        <button
                          type="button"
                          aria-label="Brew Vesna's strong tonic — three herbs"
                          onClick={() => brewChoice("strong")}
                          className="rounded-lg bg-[#5a3a6e] px-3.5 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#462d56]"
                        >
                          Strong tonic · 3 herbs ✦
                        </button>
                        <button
                          type="button"
                          aria-label="Step away from the bench"
                          onClick={() => brewChoice(null)}
                          className="rounded-lg bg-[#e2d3ae] px-3.5 py-2 font-serif text-sm font-bold text-[#5d4630] active:bg-[#d3c096]"
                        >
                          Not now
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] italic text-[#a3805a]">He is holding out a pen…</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label="Sign the Chort's bargain"
                        onClick={() => chortChoice(true)}
                        className="rounded-lg bg-[#7e2430] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d1a23]"
                      >
                        Sign it ✒
                      </button>
                      <button
                        type="button"
                        aria-label="Refuse the Chort's bargain"
                        onClick={() => chortChoice(false)}
                        className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                      >
                        Keep my soul
                      </button>
                    </div>
                  </div>
                  )
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#a3805a]">
                      {dialogue.line + 1} / {dialogue.lines.length}
                    </span>
                    <button
                      type="button"
                      aria-label={
                        dialogue.line + 1 < dialogue.lines.length
                          ? "Next line"
                          : dialogue.topics
                            ? "See questions"
                            : "End conversation"
                      }
                      onClick={() => interactRef.current()}
                      className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                    >
                      {dialogue.line + 1 < dialogue.lines.length
                        ? "Next"
                        : dialogue.topics
                          ? "Ask a question…"
                          : "Farewell"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Character sheet — stats, skills, satchel, and the quest
              log (third tab, also opened directly by the Quests button).
              Stats start at 1
              and grow only by doing (KCD-style): each stat's base is its
              skill's level, keepsakes and tonics add the bonuses, and the
              totals change how the world plays. Tabbed so the whole sheet
              fits a phone screen; the scroll container is a fallback for
              very small screens (data-scroll-ok exempts it from the
              page-wide touch lock). */}
          {panelOpen && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#16281a]/60 p-4">
              <div
                data-scroll-ok
                className="max-h-[88dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#d9c491]/60 bg-[#f3e9d2] p-4 shadow-2xl"
                style={{ touchAction: "pan-y" }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-[#33241a]">{panelTab === "quests" ? "Quests" : "Character"}</h2>
                  <button
                    type="button"
                    aria-label={panelTab === "quests" ? "Close quest log" : "Close character sheet"}
                    onClick={closePanel}
                    className="rounded-lg bg-[#7a4a2b] px-3 py-1.5 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-2.5 flex gap-1.5" role="tablist" aria-label="Character sheet sections">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={panelTab === "stats"}
                    aria-label="Show stats"
                    onClick={() => setPanelTab("stats")}
                    className={`rounded-lg px-3.5 py-1.5 font-serif text-sm font-bold ${panelTab === "stats" ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
                  >
                    Stats
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={panelTab === "skills"}
                    aria-label="Show skills"
                    onClick={() => setPanelTab("skills")}
                    className={`rounded-lg px-3.5 py-1.5 font-serif text-sm font-bold ${panelTab === "skills" ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
                  >
                    Skills
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={panelTab === "quests"}
                    aria-label="Show quests"
                    onClick={() => setPanelTab("quests")}
                    className={`rounded-lg px-3.5 py-1.5 font-serif text-sm font-bold ${panelTab === "quests" ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
                  >
                    Quests
                  </button>
                </div>

                {panelTab === "quests" ? (
                  <div className="mt-3">
                    <p className="text-[12px] italic leading-snug text-[#7a6248]">
                      {quests.done} of {quests.total} done. The step marked <span className="font-bold not-italic text-[#7a4a2b]">Now</span> is
                      where the story stands — the rest wait their turn, and nothing is lost by wandering.
                    </p>
                    {quests.sections.map((section) => (
                      <div key={section.title} className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a3805a]">{section.title}</p>
                        {section.quests.map((q) => {
                          const st = questStatus(q);
                          return (
                            <div key={q.id} className="flex items-start gap-2 border-b border-[#d9c491]/50 py-2 last:border-0">
                              <span
                                aria-hidden="true"
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                  st === "done"
                                    ? "bg-[#7a9a3c] text-[#f3e9d2]"
                                    : st === "active"
                                      ? "bg-[#d99a2b] text-[#33241a]"
                                      : "bg-[#e2d3ae] text-[#a3805a]"
                                }`}
                              >
                                {st === "done" ? "✓" : st === "active" ? "▶" : "○"}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-bold ${st === "todo" ? "text-[#8a7350]" : "text-[#33241a]"}`}>
                                  {q.title}
                                  {st === "active" && (
                                    <span className="ml-2 rounded-full bg-[#d99a2b] px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-[#33241a]">Now</span>
                                  )}
                                  {st === "done" && (
                                    <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-[#7a9a3c]">Done</span>
                                  )}
                                </p>
                                <p className="mt-0.5 text-[12px] leading-snug text-[#7a6248]">{q.detail}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : panelTab === "stats" ? (
                  <div className="mt-3">
                    {STAT_DEFS.map((d) => {
                      const s = stats[d.key];
                      return (
                        <div key={d.key} className="flex items-baseline justify-between gap-2 border-b border-[#d9c491]/50 py-1.5 last:border-0">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#33241a]">
                              {d.abbr} · {d.name}{" "}
                              <span className="font-normal text-[#a3805a]">from {d.feeds}</span>
                            </p>
                            <p className="text-[11px] leading-snug text-[#7a6248]">
                              {d.effect}
                              {s.bonusWhy.length > 0 ? ` · ${s.bonusWhy.join(", ")}` : ""}
                            </p>
                          </div>
                          <p className="shrink-0 font-serif text-xl font-bold text-[#7a4a2b]">
                            {s.total}
                            {s.bonus !== 0 && (
                              <span className="ml-1 align-middle text-[11px] font-semibold text-[#a3805a]">
                                ({s.base}{s.bonus > 0 ? `+${s.bonus}` : s.bonus})
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                    <p className="mt-2 text-[11px] italic leading-snug text-[#7a6248]">
                      No points to spend and no dump stats — in Zalissya you become what you do.
                      The Chort currently prices your soul at {price} fish.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    {skillRows.map((r) => (
                      <div key={r.name} className="border-b border-[#d9c491]/50 py-1.5 last:border-0">
                        <div className="flex items-baseline justify-between">
                          <p className="text-sm font-bold text-[#33241a]">
                            {r.name} <span className="font-normal text-[#a3805a]">feeds {r.stat}</span>
                          </p>
                          <p className="font-serif text-base font-bold text-[#7a4a2b]">Lv {r.level}</p>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e2d3ae]" aria-hidden="true">
                          <div
                            className="h-full rounded-full bg-[#7a9a3c]"
                            style={{ width: `${r.next != null ? Math.min(100, (r.done / r.next) * 100) : 100}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#7a6248]">
                          {r.next != null ? `${r.done} done · ${r.next} for Lv ${r.level + 1}` : `${r.done} done · master`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {panelTab !== "quests" && (
                <div className="mt-3 rounded-xl bg-[#e9dcbc] p-3">
                  <p className="font-serif text-sm font-bold text-[#33241a]">Satchel</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#5d4630]">
                    🌿 {herbStock} herbs · 🎣 {fish} fish
                    {lysaFlowers > 0 ? ` · 🌙 ${lysaFlowers} nichnyky` : ""}
                    {meals > 0 ? ` · 🍲 ${meals} soup` : ""}
                    {potions > 0 ? ` · ⚗ ${potions} tonic${potions > 1 ? "s" : ""}` : ""}
                    {strongPotions > 0 ? ` · ⚗✦ ${strongPotions} strong tonic${strongPotions > 1 ? "s" : ""}` : ""}
                    {forged > 0 ? ` · 🔨 ${forged} forged` : ""}
                  </p>
                  <p className={`mt-0.5 text-[12px] leading-snug ${carried > cap ? "font-semibold text-[#a83226]" : "text-[#5d4630]"}`}>
                    🎒 Carrying {carried} / {cap} — your STR {stats.str.total} sets the limit.
                    Weights: fish 1 · herb 1 · forged piece 2 · bog iron 3 · nichnyky 0.
                    {haulingIron ? ` You are hauling ${iron} lump${iron > 1 ? "s" : ""} of bog iron for Radek.` : ""}
                    {carried > cap ? " Over the limit: nothing new can be picked up until the load lightens — nothing you hold is lost." : ""}
                  </p>
                  {keepsakes.length > 0 && (
                    <p className="mt-0.5 text-[12px] leading-snug text-[#5d4630]">{keepsakes.join(" · ")}</p>
                  )}
                  {(flagHas(hudFlags, "wellfed") || flagHas(hudFlags, "tonic") || flagHas(hudFlags, "strongtonic")) && (
                    <p className="mt-0.5 text-[12px] font-semibold text-[#7a4a2b]">
                      Active: {[
                        flagHas(hudFlags, "wellfed") ? "Well fed (CON +1)" : null,
                        flagHas(hudFlags, "tonic") ? "Tonic clarity (INT +1, WIS +1)" : null,
                        flagHas(hudFlags, "strongtonic") ? "Strong tonic (INT +2, WIS +2)" : null,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-label="Eat a meal of karas soup"
                      disabled={meals < 1}
                      onClick={eatMeal}
                      className="rounded-lg bg-[#7a4a2b] px-3 py-2 font-serif text-sm font-bold text-[#f3e9d2] disabled:opacity-40"
                    >
                      Eat soup 🍲
                    </button>
                    <button
                      type="button"
                      aria-label="Drink an alchemy tonic"
                      disabled={potions < 1}
                      onClick={drinkTonic}
                      className="rounded-lg bg-[#4c6b35] px-3 py-2 font-serif text-sm font-bold text-[#f3e9d2] disabled:opacity-40"
                    >
                      Drink tonic ⚗
                    </button>
                    <button
                      type="button"
                      aria-label="Drink Vesna's strong tonic"
                      disabled={strongPotions < 1}
                      onClick={drinkStrongTonic}
                      className="rounded-lg bg-[#5a3a6e] px-3 py-2 font-serif text-sm font-bold text-[#f3e9d2] disabled:opacity-40"
                    >
                      Drink strong tonic ✦
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}