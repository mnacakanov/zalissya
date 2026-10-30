import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { save } from "./api";
import { JOYSTICK_ALLOWED, SafeAreaTopScrim } from "./platform/target";
import { ALL_CHARS, charPos, LYSA_CHARS, LYSA_DANCERS, type Npc } from "./data/characters";
import { BED_SPOT_WORLD, HOUSE_CENTER, HOUSE_IDS, HOUSE_RECTS, houseAt, type HouseId, PICH_SPOT } from "./data/houses";
import { BOBBER, BREW_SPOT, COOK_SPOT, CRUST_SPOT, FISH_CATCH, FISH_SPOT, FORGE_SPOT, HERB_SPOTS, HERBS, IRON_SPOTS, WISH_LINES } from "./data/items";
import { LYSA_ORIGIN, LYSA_WORLD } from "./data/lysa";
import { DECOR, FENCES, FIRE, HOUSES, KURHAN, KURHAN_STEPPE, OTAMAN_FLAGPOLE, POND, SOLID, TREES, WELL, WINDMILL } from "./data/village";
import { drawKhataBig, drawKorohva, drawKovyla, drawOtamanKhata, drawKurhan, drawMallow, drawSunflower, drawWindmill } from "./render/khutir";
import { linesFor, linesForLysa } from "./dialogue/lines";
import { songTopics } from "./dialogue/songTopics";
import { MAP_PRICE, mapTopics } from "./dialogue/mapTopics";
import { tobaccoTopics } from "./dialogue/tobacco";
import { HEMP_SPOT, inRiver, TOBACCO_SPOTS } from "./data/land";
import { drawLand, drawRiver } from "./render/land";
import { LEAVES_NEEDED, tobaccoDawn, tobaccoStage } from "./systems/tobacco";
import { chumakTopicSet, chumakTopicsFor, type ChumakContext } from "./dialogue/chumaky";
import { CAMP_SOLID, CART, GNAT, GRAVE, OSTAP, OSTAP_WELL, OXEN } from "./data/chumaky";
import { drawCart, drawGrave, drawOx, drawSickChumak } from "./render/chumaky";
import { chumakDawn, chumakyPresent, healByDefiance, healByPersuasion, ostapState, PERSUADE_CHA } from "./systems/chumaky";
import { type GrantId } from "./dialogue/topics";
import { canForgeWard, canWeaveWreath, VIGIL_BROKEN_LINES, VIGIL_INTRO_LINES, VIGIL_WON_LINES, type VigilContext, vigilTopics, viyNarration, WREATH_HERBS } from "./dialogue/viyNight";
import { BREW_BENCH_NPC, BREW_CHOICE_LINES, CHORT_REFUSED_LINES, CHORT_SIGNED_LINES, CHORT_TRADE_LINES, type DialogueTopic, LYSA_BLESSING_LINES, topicsForLysa, topicsForVillage, WELL_NPC } from "./dialogue/topics";
import { createGamepadReader, lookAwayHeld, moveFocus, type PadState } from "./input/gamepad";
import { Joystick } from "./input/Joystick";
import { PadButton } from "./input/PadButton";
import { type Lang, setLanguage, type TextKey } from "./i18n";
import { LanguagePicker } from "./ui/LanguagePicker";
import { MapOverlay } from "./ui/MapOverlay";
import { questTarget } from "./render/map";
import { drawKhataInterior } from "./render/khataInterior";
import { drawBeelzebub, drawLysaFire, drawLysaFlower, drawLysaGround, drawWitch } from "./render/lysa";
import { rr } from "./render/shapes";
import { drawNight, drawVigil, drawVigilOverlay } from "./render/viyFight";
import { drawBolotianyk, drawChort, drawDomovyk, drawLisovyk, drawViy } from "./render/spirits";
import { drawBrewBench, drawChicken, drawCrust, drawFence, drawFire, drawFishing, drawGround, drawHerbPatch, drawHouse, drawPerson, drawTree, drawWell } from "./render/village";
import { carriedWeight, carryCap, satchelWeight } from "./systems/carry";
import { flagCount, flagHas } from "./systems/flags";
import { type QuestItem, questLog } from "./systems/quests";
import { eveningMood, fireCheck, isEvening, knownSongs, knowsSong, reception, rewardFor, songFlag, type SongId, SONGS } from "./systems/songs";
import { CRAFT_THRESH, craftLevel, FISH_THRESH, fishLevel, herbLevel, THRESH } from "./systems/skills";
import { computeStats, soulPrice, STAT_DEFS } from "./systems/stats";
import { advance, type Clock, DAWN, darkness, isNight, minutesUntil, MS_PER_GAME_MINUTE, NIGHTFALL_MINUTE, readClock, START_MINUTE, timeLabel, UNTIL_DAWN_FLAGS, WAKE_MINUTE, writeClock } from "./systems/time";
import { type FightState, startFight, stepFight, VIGIL_SECONDS } from "./systems/viyFight";
import { type BrewRecipe, type Dialogue, type DialogueOption, type Prompt, promptKeyOf } from "./ui/types";
import { type AreaId, isHutArea, LYSA_BORDER_X, LYSA_BORDER_Y, LYSA_H, LYSA_W, PLAYER_R, PLAYER_SPEED, SPAWN, WORLD_H, WORLD_W, worldSize } from "./world/areas";
import { circleRectCollide, clamp, hash2 } from "./world/geometry";
import { t } from "./i18n";

// Zalissya — the game component: state, the frame loop, interaction, and
// the HUD/sheets. Data, dialogue, systems and drawing live in their own
// modules (see CLAUDE.md for the layout, DESIGN.md for the design record).

// The Domovyk's bed (inside his khata, data/houses.ts) — sleep here to pass time.
const BED_SPOT = BED_SPOT_WORLD;
const BED_NPC: Npc = {
  id: "bed", name: t("ui.bed.name.0"), pron: "", role: t("ui.bed.role.0"),
  x: BED_SPOT.x, y: BED_SPOT.y, tunic: "#6e5136", hair: "#8a6f4d", style: "domovyk",
};
// The log bench east of the campfire — where the kobzar plays for the
// khutir in the evening.
const PLAY_SPOT = { x: 918, y: 618 };
const FIRE_NPC: Npc = {
  id: "fire", name: t("ui.fire.name"), pron: "", role: t("ui.fire.role"),
  x: PLAY_SPOT.x, y: PLAY_SPOT.y, tunic: "#7a4a2b", hair: "#cfc8bb", style: "elder",
};
const MOOD_ICON = { happy: "☀", neutral: "♪", sad: "🕯" } as const;
const GRAVE_NPC: Npc = {
  id: "grave", name: t("chumak.grave.name"), pron: "", role: t("chumak.grave.role"),
  x: GRAVE.x, y: GRAVE.y, tunic: "#24201c", hair: "#a29a8c", style: "elder",
};
// Where the chalk ring is drawn for Viy's vigil: just south of his hollow.
const VIGIL_CENTER = { x: 1420, y: 440 };
const VIGIL_NPC: Npc = {
  id: "vigil", name: t("ui.vigil.name.0"), pron: "", role: t("ui.vigil.role.0"),
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
  // Latest gamepad poll (input/gamepad.ts); null while none is connected.
  const gamepadRef = useRef<PadState | null>(null);
  const patchesRef = useRef(HERB_SPOTS.map((s) => ({ ...s, available: true, respawnAt: 0 })));
  // Nichnyky patches on Lysa Hora — gathered for the offering, and they
  // stay gathered (the mountain counts promises, and flowers).
  const lysaPatchesRef = useRef(LYSA_WORLD.flowers.map((s) => ({ ...s, taken: false })));
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
  const startedRef = useRef(false);
  startedRef.current = started;
  const [hudArea, setHudArea] = useState<AreaId>("village");
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [hudTalked, setHudTalked] = useState<string[]>([]);
  const [hudHerbs, setHudHerbs] = useState(0);
  const [hudFlags, setHudFlags] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [padPressed, setPadPressed] = useState<ReadonlySet<string>>(new Set());
  // "pad" everywhere; "stick" only where the platform allows a joystick.
  // Pages: floating joystick only. Muse: the D-pad (no drags there).
  const controls: "pad" | "stick" = JOYSTICK_ALLOWED ? "stick" : "pad";
  const [confirmReset, setConfirmReset] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  // which khata the kobzar stands in, if any (data/houses.ts), and how
  // visible each khata's roof is (1 = closed, 0 = lifted away)
  const [hudInside, setHudInside] = useState<HouseId | null>(null);
  const insideRef = useRef<HouseId | null>(null);
  const roofAlphaRef = useRef<Record<HouseId, number>>({ hut0: 1, hut1: 1, otaman: 1 });
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
      // Saves from when the khaty were separate rooms come back inside the
      // same khata, now standing in the world (data/houses.ts).
      const oldRoom: HouseId | null = s.area === "hut0" || s.area === "hut1" ? s.area : null;
      const area: AreaId = s.area === "lysa" ? "lysa" : "village";
      areaRef.current = area;
      setHudArea(area);
      // Saves from before the one-world map stored Lysa Hora in its own
      // local coordinates: move them onto the mountain in the shared world.
      const onOldMountain = area === "lysa" && s.x < LYSA_ORIGIN.x;
      const ws = worldSize(area);
      playerRef.current.x = clamp(s.x + (onOldMountain ? LYSA_ORIGIN.x : 0), 30, ws.w - 30);
      playerRef.current.y = clamp(s.y + (onOldMountain ? LYSA_ORIGIN.y : 0), 60, ws.h - 20);
      if (oldRoom) {
        const c0 = HOUSE_CENTER(oldRoom);
        playerRef.current.x = c0.x;
        playerRef.current.y = c0.y;
      }
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
      showToast(t("ui.chortChoice.0"));
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
      played: flagCount(flagsRef.current, "played"),
      flags: flagsRef.current,
    });

  // Eating and drinking happen from the Character sheet's satchel.
  const eatMeal = () => {
    if (flagCount(flagsRef.current, "meals") < 1) return;
    bumpCount("meals", -1);
    setFlag("wellfed");
    showToast(t("ui.eatMeal.0"));
  };
  const drinkTonic = () => {
    if (flagCount(flagsRef.current, "potions") < 1) return;
    bumpCount("potions", -1);
    setFlag("tonic");
    showToast(t("ui.drinkTonic.0"));
  };
  const drinkStrongTonic = () => {
    if (flagCount(flagsRef.current, "strongPotions") < 1) return;
    bumpCount("strongPotions", -1);
    setFlag("strongtonic");
    showToast(t("ui.drinkStrongTonic.0"));
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
      // The chumak caravan keeps its own calendar (systems/chumaky.ts):
      // run its dawn rule for every dawn crossed, oldest first.
      const lastDawnDay = clock.minute >= DAWN ? clock.day : clock.day - 1;
      let news: string | null = null;
      for (let d = lastDawnDay - dawns + 1; d <= lastDawnDay; d++) {
        for (const f of tobaccoDawn(flagsRef.current, d)) {
          flagsRef.current.add(f);
          news = "tobacco.news.dry";
        }
        for (const f of chumakDawn(flagsRef.current, d)) {
          flagsRef.current.add(f);
          if (f.startsWith("chumakyArrivedDay=")) news = "chumak.news.arrived";
          if (f === "ostapDied") news = "chumak.news.died";
        }
      }
      if (news) {
        setHudClock(clock);
        syncFlags();
        showToast(t(news as TextKey));
        return false;
      }
    }
    setHudClock(clock);
    syncFlags();
    return expired;
  };
  const sleepUntil = (target: number, msg: string) => {
    const expired = passTime(minutesUntil(clockRef.current, target));
    showToast(expired ? t("ui.sleepUntil.0", { msg }) : msg);
  };
  // A dialogue whose last page is a row of option buttons.
  const openOptions = (npc: Npc, lines: string[], tag: "sleep" | "play", options: DialogueOption[]) => {
    const d: Dialogue = { npc, lines, line: 0, choiceAt: lines.length - 1, choiceKind: "options", options, optionsTag: tag };
    dialogueRef.current = d;
    setDialogue(d);
  };
  const pickOption = (tag: "sleep" | "play", id: string) => {
    endDialogue();
    if (id === "cancel") return;
    if (tag === "sleep") {
      if (id === "morning") {
        sleepUntil(WAKE_MINUTE, t("ui.pickOption.0"));
        // The Domovyk hums the lullaby along — if you taught it to the hut.
        if (knowsSong(flagsRef.current, "kolyskova")) {
          setFlag("rested");
          showToast(t("ui.sleep.rested"));
        }
      } else if (id === "night") sleepUntil(NIGHTFALL_MINUTE, t("ui.pickOption.1"));
    } else if (tag === "play") {
      performAtFire(id as SongId);
    }
  };

  // --- the kobza ----------------------------------------------------------------
  // Playing for the khutir at the campfire: once an evening, the listeners
  // pay in kulish, and Music (= CHA) grows. See systems/songs.ts.
  const songName = (id: SongId) => t(`song.name.${id}` as TextKey);
  const performAtFire = (song: SongId) => {
    const c = clockRef.current;
    const check = fireCheck(flagsRef.current, c.day, c.minute);
    if (!check.ok) return;
    // Read the room: the evening's mood against the song's (systems/songs.ts).
    const evening = eveningMood(c.day, flagsRef.current);
    const rec = reception(evening.mood, SONGS[song].mood);
    const reward = rewardFor(rec);
    const before = flagCount(flagsRef.current, "played");
    const after = bumpCount("played", reward.music);
    for (const f of [...flagsRef.current]) if (f.startsWith("playedDay=")) flagsRef.current.delete(f);
    flagsRef.current.add(`playedDay=${c.day}`);
    if (reward.kulish) bumpCount("meals", 1);
    const lvlUp = craftLevel(after) > craftLevel(before);
    const title = songName(song);
    showToast(
      t(`ui.play.${rec}` as TextKey, { song: title, level: craftLevel(after) }) +
        (lvlUp ? ` ${t("ui.play.levelUpTail", { cha: liveStats().cha.total })}` : ""),
    );
    openDialogue(FIRE_NPC, [rec === "clash" ? t(`ui.play.clash.${evening.mood}` as TextKey) : t(`ui.play.audience.${song}` as TextKey)]);
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
  const chumakContext = (): ChumakContext => ({
    flags: flagsRef.current,
    cha: liveStats().cha.total,
    potions: flagCount(flagsRef.current, "potions") + flagCount(flagsRef.current, "strongPotions"),
  });
  const applyGrant = (g: GrantId) => {
    const f = flagsRef.current;
    // The chumak choices (systems/chumaky.ts).
    if (g === "persuade" || g === "treatOstap" || g === "vesnaTonic") {
      const day = clockRef.current.day;
      if (g === "vesnaTonic" && !flagHas(f, "vesnaGaveTonic")) {
        setFlag("vesnaGaveTonic");
        bumpCount("potions", 1);
        showToast(t("chumak.toast.vesnaTonic"));
      } else if (g === "persuade" && ostapState(f) === "sick" && liveStats().cha.total >= PERSUADE_CHA) {
        for (const x of healByPersuasion(day)) f.add(x);
        syncFlags();
        showToast(t("chumak.toast.persuaded"));
      } else if (g === "treatOstap" && ostapState(f) === "sick") {
        if (flagCount(f, "potions") > 0) bumpCount("potions", -1);
        else if (flagCount(f, "strongPotions") > 0) bumpCount("strongPotions", -1);
        else return;
        for (const x of healByDefiance(day)) f.add(x);
        syncFlags();
        showToast(t("chumak.toast.treated"));
      }
      return;
    }
    // The map: Hnat's gift, or the Chort's for fish (dialogue/mapTopics.ts)
    if (g === "chumakMap" || g === "buyMap") {
      if (g === "chumakMap" && (!flagHas(f, "map") || flagHas(f, "mapChort"))) {
        // Hnat's chumak map replaces a devil's one: it is the better map
        f.delete("mapChort");
        setFlag("map");
        syncFlags();
        showToast(t("map.toast.chumak"));
      } else if (g === "buyMap" && !flagHas(f, "map") && flagCount(f, "fish") >= MAP_PRICE) {
        bumpCount("fish", -MAP_PRICE);
        setFlag("map");
        setFlag("mapChort");
        showToast(t("map.toast.chort"));
      }
      return;
    }
    // «Люлька отамана» (systems/tobacco.ts)
    if (g === "tobaccoQuest" || g === "giveTobacco") {
      if (g === "tobaccoQuest" && tobaccoStage(f) === "none") {
        setFlag("tobaccoQuest");
        showToast(t("tobacco.toast.started"));
      } else if (g === "giveTobacco" && tobaccoStage(f) === "ready") {
        setFlag("tobaccoGiven");
        setFlag("lyulka");
        showToast(t("tobacco.toast.lyulka"));
      }
      return;
    }
    if (g in SONGS) {
      const song = g as SongId;
      if (!knowsSong(f, song)) {
        setFlag(songFlag(song));
        showToast(t("ui.song.learned", { song: songName(song) }));
      }
      return;
    }
    if (g === "chalk" && !flagHas(f, "chalk")) {
      setFlag("chalk");
      setFlag(songFlag("burya"));
      showToast(t("ui.applyGrant.0"));
    } else if (g === "wreath" && !flagHas(f, "wreath") && canWeaveWreath(vigilContext())) {
      bumpCount("herbStock", -WREATH_HERBS);
      setFlag("wreath");
      showToast(t("ui.applyGrant.1"));
    } else if (g === "ironward" && !flagHas(f, "ironward") && canForgeWard(vigilContext())) {
      bumpCount("forged", -1);
      setFlag("ironward");
      showToast(t("ui.applyGrant.2"));
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
      { con: st.con.total, cha: st.cha.total, dex: st.dex.total, wreath: flagHas(flagsRef.current, "wreath"), ironWard: flagHas(flagsRef.current, "ironward"), lyulka: flagHas(flagsRef.current, "lyulka") },
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
      showToast(t("ui.endVigil.0"));
    } else {
      // Nothing is lost but the night: you wake in the Domovyk's bed.
      bumpCount("vigilBroken", 1);
      areaRef.current = "village";
      setHudArea("village");
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
      t("ui.carryBlockedToast.0", { carriedWeight: carriedWeight(flagsRef.current), carryCap: carryCap(st), addWeight, str: st.str.total }),
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
          ? t("ui.performBrew.0", { herbsIn })
          : t("ui.performBrew.1", { herbsIn }),
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
          ? t("ui.performBrew.2", { craftLevel: craftLevel(brewed), int: liveStats().int.total })
          : t("ui.performBrew.3", { craftLevel: craftLevel(brewed), int: liveStats().int.total })
        : double
          ? recipe === "strong"
            ? t("ui.performBrew.4", { intNow, craftLevel: craftLevel(brewed) })
            : t("ui.performBrew.5", { intNow, craftLevel: craftLevel(brewed) })
          : recipe === "strong"
            ? t("ui.performBrew.6", { craftLevel: craftLevel(brewed), stock })
            : t("ui.performBrew.7", { craftLevel: craftLevel(brewed), stock }),
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
          showToast(t("ui.doInteract.0"));
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
        if (f.id === "pike") w += (dexNow.total - 1) * 3;
        else if (f.id === "perch") w += (dexNow.total - 1);
        else if (f.id === "boot") w = Math.max(1, w - (dexNow.total - 1) * 1.5);
        return { id: f.id, name: f.name, w };
      });
      const totalW = table.reduce((s, f) => s + f.w, 0);
      const roll = hash2(Math.floor(now), Math.floor(playerRef.current.x)) * totalW;
      let acc = 0;
      let caughtFish = table[0];
      for (const f of table) {
        acc += f.w;
        if (roll < acc) { caughtFish = f; break; }
      }
      const caught = caughtFish?.name ?? "";
      if (caughtFish?.id === "boot") {
        showToast(t("ui.doInteract.1"));
      } else if (carriedWeight(flagsRef.current) + 1 > carryCap(liveStats())) {
        // A fish is 1 of weight, and a full satchel holds no fish: it
        // slips back into the pond, uncounted and uneaten.
        showToast(
          t("ui.doInteract.2", { fish: caught, carriedWeight: carriedWeight(flagsRef.current), carryCap: carryCap(liveStats()), str: liveStats().str.total }),
        );
      } else {
        bumpCount("fish", 1);
        const total = bumpCount("fishTotal", 1);
        showToast(
          fishLevel(total) > fishLevel(total - 1)
            ? t("ui.doInteract.3", { caught, fishLevel: fishLevel(total), total: dexNow.total })
            : t("ui.doInteract.4", { caught, fishLevel: fishLevel(total), total }),
        );
      }
      return;
    }
    const p = promptRef.current;
    if (!p) return;
    switch (p.kind) {
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
          showToast(t("ui.talk.0"));
          return;
        }
        // Handing Radek his third lump of bog iron lights the forge.
        if (p.npc.id === "radek" && flagCount(flags, "iron") >= 3 && !flagHas(flags, "horseshoe")) {
          setFlag("horseshoe");
          showToast(t("ui.talk.1"));
        }
        // On Lysa Hora everyone speaks the sabbath script — including the
        // Chort, who does no soul-business on the mountain (sabbath rules).
        // Conversations there are topic menus too; Beelzebub's blessing
        // is reached through his "Receive the blessing" topic.
        if (areaRef.current === "lysa") {
          const tsetL = topicsForLysa(p.npc, flags, firstMeeting);
          if (tsetL) {
            openTopicDialogue(p.npc, tsetL.intro, [...tsetL.topics, ...songTopics(p.npc.id, "lysa", flags), ...mapTopics(p.npc.id, flags, fish)]);
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
        } else if (p.npc.id === "gnat" || p.npc.id === "ostap") {
          const cset = chumakTopicSet(p.npc.id, chumakContext(), firstMeeting);
          if (cset) {
            openTopicDialogue(p.npc, cset.intro, cset.topics);
            return;
          }
        } else {
          const tset = topicsForVillage(p.npc, herbsRef.current, flags, fish, price, statsNow.int.total, firstMeeting);
          if (tset) {
            openTopicDialogue(p.npc, tset.intro, [...tset.topics, ...songTopics(p.npc.id, areaRef.current, flags), ...chumakTopicsFor(p.npc.id, chumakContext()), ...tobaccoTopics(p.npc.id, flags), ...mapTopics(p.npc.id, flags, fish), ...vigilTopics(p.npc.id, vigilContext())]);
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
            showToast(t("ui.gather.0", { wisNow }));
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
              ? t("ui.gather.1", { name: def.name, herbLevel: herbLevel(herbsRef.current), wis })
              : keen
                ? t("ui.gather.2", { name: def.name, wis })
                : t("ui.gather.3", { name: def.name, herbLevel: herbLevel(herbsRef.current), flagCount: flagCount(flagsRef.current, "herbStock") }),
          );
        }
        return;
      }
      case "cast": {
        const now = performance.now();
        fishingRef.current = { phase: "wait", biteAt: now + 2200 + hash2(Math.floor(now), 17) * 3800, biteEnd: 0 };
        showToast(t("ui.cast.0"));
        return;
      }
      case "reel":
        // Prompt exists but the bite window already closed — a late tap.
        return;
      case "crust":
        setFlag("bread");
        showToast(t("ui.crust.0"));
        return;
      case "offer":
        flagsRef.current.delete("bread");
        setFlag("offering");
        syncFlags();
        showToast(t("ui.offer.0"));
        return;
      case "gift":
        setFlag("stone");
        showToast(t("ui.gift.0"));
        return;
      case "iron": {
        // A lump is 3 of weight, hauled in the arms: the dig is checked
        // against your satchel load (fish, herbs, forged pieces), so a
        // stuffed satchel leaves you no way to haul — but the quest's
        // own lumps can always be carried to Radek, one load at a time.
        const stIron = liveStats();
        if (satchelWeight(flagsRef.current) + 3 > carryCap(stIron)) {
          showToast(t("ui.iron.0", { satchelWeight: satchelWeight(flagsRef.current), carryCap: carryCap(stIron), str: stIron.str.total }));
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
            showToast(t("ui.iron.1", { str }));
            return;
          }
        }
        setFlag(`ironspot${p.idx}`);
        const n = bumpCount("iron", 1);
        showToast(
          n >= 3
            ? t("ui.iron.2")
            : p.idx === 2
              ? t("ui.iron.3", { n })
              : t("ui.iron.4", { n }),
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
            showToast(t("ui.wish.0"));
          } else {
            showToast(t("ui.wish.1", { cha }));
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
              ? t("ui.cook.0")
              : fishIn < 1
                ? t("ui.cook.1")
                : t("ui.cook.2"),
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
            ? t("ui.cook.3", { craftLevel: craftLevel(cooked), con: liveStats().con.total })
            : t("ui.cook.4", { craftLevel: craftLevel(cooked), flagCount: flagCount(flagsRef.current, "meals") }),
        );
        return;
      }
      case "smith": {
        if (!flagHas(flagsRef.current, "horseshoe")) {
          showToast(t("ui.smith.0"));
          return;
        }
        const nowS = performance.now();
        if (nowS < smithReadyRef.current) {
          showToast(t("ui.smith.1"));
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
            ? t("ui.smith.2", { craftLevel: craftLevel(smithed), str: liveStats().str.total })
            : master
              ? t("ui.smith.3", { str, craftLevel: craftLevel(smithed) })
              : t("ui.smith.4", { craftLevel: craftLevel(smithed), flagCount: flagCount(flagsRef.current, "forged") }),
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
          showToast(t("ui.brew.0", { herbsIn }));
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
              ? t("ui.bloom.0")
              : t("ui.bloom.1", { n }),
          );
        }
        return;
      }
      case "offering": {
        const have = flagCount(flagsRef.current, "lysaFlower");
        if (have < 3) {
          showToast(t("ui.offering.0", { have }));
          return;
        }
        bumpCount("lysaFlower", -3);
        setFlag("lysaOffering");
        showToast(t("ui.offering.1"));
        return;
      }
      case "dance": {
        if (!flagHas(flagsRef.current, "lysaOffering")) {
          showToast(t("ui.dance.0"));
          return;
        }
        // The sabbath dances only to the hopak — and the kobzar plays it.
        if (!knowsSong(flagsRef.current, "hopak")) {
          showToast(t("ui.dance.noHopak"));
          return;
        }
        danceUntilRef.current = performance.now() + 5000;
        setFlag("lysaDanced");
        showToast(t("ui.dance.1"));
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
          [t("ui.sleep.0", { timeLabel: timeLabel(c) })],
          "sleep",
          [
            { id: "morning", label: t("ui.sleep.morning.label.0"), aria: t("ui.sleep.morning.aria.0") },
            { id: "night", label: t("ui.sleep.night.label.0"), aria: t("ui.sleep.night.aria.0") },
            { id: "cancel", label: t("ui.sleep.cancel.label.0"), aria: t("ui.sleep.cancel.aria.0") },
          ],
        );
        return;
      }
      case "play": {
        const c = clockRef.current;
        const check = fireCheck(flagsRef.current, c.day, c.minute);
        if (!check.ok) {
          showToast(t(check.reason === "daytime" ? "ui.play.daytime" : "ui.play.alreadyPlayed"));
          return;
        }
        openOptions(
          FIRE_NPC,
          [`${t(check.firstEver ? "ui.play.first" : "ui.play.prompt")} ${t(`ui.mood.${eveningMood(c.day, flagsRef.current).reason}` as TextKey)}`],
          "play",
          [
            ...knownSongs(flagsRef.current)
              .filter((id) => id !== "burya" || flagHas(flagsRef.current, "viySealed"))
              .map((id) => ({ id, label: `${songName(id)} ${MOOD_ICON[SONGS[id].mood]}`, aria: `${songName(id)} — ${t(`ui.songMood.${SONGS[id].mood}` as TextKey)}` })),
            { id: "cancel", label: t("ui.sleep.cancel.label.0"), aria: t("ui.sleep.cancel.label.0") },
          ],
        );
        return;
      }
      case "tobacco": {
        if (flagHas(flagsRef.current, `tobaccoLeaf${p.idx}`)) return;
        setFlag(`tobaccoLeaf${p.idx}`);
        const n = bumpCount("tobaccoLeaves", 1);
        showToast(t(n >= LEAVES_NEEDED ? (flagHas(flagsRef.current, "hempFibre") ? "tobacco.toast.leavesDone" : "tobacco.toast.leavesNeedHemp") : "tobacco.toast.leaf", { n, need: LEAVES_NEEDED }));
        return;
      }
      case "hemp":
        setFlag("hempFibre");
        showToast(t("tobacco.toast.hemp"));
        return;
      case "hangTobacco":
        flagsRef.current.add(`tobaccoDryingDay=${clockRef.current.day}`);
        syncFlags();
        showToast(t("tobacco.toast.hung"));
        return;
      case "grave": {
        if (knowsSong(flagsRef.current, "polechko") && !flagHas(flagsRef.current, "sangAtGrave")) {
          setFlag("sangAtGrave");
          bumpCount("played", 1);
          openDialogue(GRAVE_NPC, [t("chumak.grave.sing.0"), t("chumak.grave.sing.1")]);
        } else {
          openDialogue(GRAVE_NPC, [t(knowsSong(flagsRef.current, "polechko") ? "chumak.grave.after" : "chumak.grave.quiet")]);
        }
        return;
      }
      case "vigil":
        vigilPendingRef.current = true;
        openDialogue(VIGIL_NPC, VIGIL_INTRO_LINES);
        return;
    }
  };
  const mapOpenRef = useRef(false);
  mapOpenRef.current = mapOpen;
  const toggleMapRef = useRef(() => {});
  toggleMapRef.current = () => (mapOpen ? closeMap() : openMap());
  const interactRef = useRef(doInteract);
  interactRef.current = doInteract;

  // Gamepad buttons — polled always (the title screen too). Movement and
  // look-away are read from gamepadRef by the frame loop; here are the
  // presses. In a dialogue or sheet (data-pad-scope) the d-pad moves focus
  // between its buttons and A presses the focused one.
  const padPress = (s: PadState) => {
    const pressed = s.pressed;
    if (pressed.size) document.body.dataset.input = "pad";
    if (!startedRef.current) {
      if (pressed.has("a") || pressed.has("start")) setStarted(true);
      return;
    }
    if (fightRef.current) {
      if (pressed.has("a")) wardQueuedRef.current = true;
      return;
    }
    const scope = document.querySelector("[data-pad-scope]");
    if (scope) {
      if (pressed.has("down") || pressed.has("right")) moveFocus(scope, 1);
      if (pressed.has("up") || pressed.has("left")) moveFocus(scope, -1);
    }
    if (pressed.has("a")) {
      const el = document.activeElement;
      if (scope && el instanceof HTMLButtonElement && scope.contains(el)) el.click();
      else interactRef.current();
    }
    if (pressed.has("y")) toggleMapRef.current();
    if (pressed.has("b")) {
      if (mapOpenRef.current) closeMap();
      else if (panelRef.current) closePanel();
      else if (dialogueRef.current?.view === "menu") endDialogue();
    }
    if (pressed.has("start")) {
      if (panelRef.current) closePanel();
      else if (!dialogueRef.current) openPanel("stats");
    }
    if (pressed.has("back")) {
      if (panelRef.current) closePanel();
      else if (!dialogueRef.current) openPanel("quests");
    }
  };
  const padPressRef = useRef(padPress);
  padPressRef.current = padPress;
  useEffect(() => {
    const read = createGamepadReader();
    let raf = 0;
    const poll = () => {
      const s = read();
      gamepadRef.current = s;
      if (s) padPressRef.current(s);
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    const touched = () => {
      document.body.dataset.input = "touch";
    };
    window.addEventListener("pointerdown", touched);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", touched);
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === "m") {
        if (!e.repeat) toggleMapRef.current();
        return;
      }
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
      const gp = gamepadRef.current;
      if (gp) {
        mx += gp.x;
        my += gp.y;
      }
      mx += stickRef.current.x;
      my += stickRef.current.y;
      const len = Math.hypot(mx, my);
      const area = areaRef.current;
      const ws = worldSize(area);
      const solids = [...SOLID, ...LYSA_WORLD.solid, ...(chumakyPresent(flagsRef.current) ? CAMP_SOLID : [])];
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
        if (!solids.some((b) => circleRectCollide(tx, p.y - 6, PLAYER_R, b)) && (isHutArea(area) || (!inPond(tx, p.y) && !inRiver(tx, p.y)))) p.x = tx;
        let ty = clamp(p.y + stepY, 46, ws.h - 10);
        if (!solids.some((b) => circleRectCollide(p.x, ty - 6, PLAYER_R, b)) && (isHutArea(area) || (!inPond(p.x, ty) && !inRiver(p.x, ty)))) p.y = ty;
        dirtyRef.current = true;
      }

      // --- inside a khata? its roof lifts away (fades) while you are in
      const insideNow = houseAt(p.x, p.y);
      for (const id of HOUSE_IDS) {
        const want = insideNow === id ? 0 : 1;
        const cur = roofAlphaRef.current[id];
        roofAlphaRef.current[id] = cur + (want - cur) * Math.min(1, dt * 8);
      }
      if (insideNow !== insideRef.current) {
        insideRef.current = insideNow;
        setHudInside(insideNow);
        if (insideNow) showToast(t(insideNow === "hut0" ? "ui.enterHut.0" : insideNow === "hut1" ? "ui.enterHut.1" : "ui.enterHut.2"));
      }

      // --- the clock: stops while talking, reading, dancing, or keeping
      // the vigil; paid out in 5-minute steps so the HUD is not redrawn
      // every frame.
      if (!frozen) {
        clockAccRef.current += dt * 1000;
        const mins = Math.floor(clockAccRef.current / MS_PER_GAME_MINUTE);
        if (mins >= 5) {
          clockAccRef.current -= mins * MS_PER_GAME_MINUTE;
          if (passTime(mins)) showToast(t("ui.frame.0"));
        }
      }

      // --- Viy's vigil
      const fight = fightRef.current;
      const lookingAway = lookHeldRef.current || keysRef.current.has("shift") || keysRef.current.has("l") || lookAwayHeld(gamepadRef.current);
      if (fight) {
        const events = stepFight(fight, dt, { lookAway: lookingAway, ward: wardQueuedRef.current });
        wardQueuedRef.current = false;
        for (const e of events) {
          if (e.kind === "gazeWarning") showToast(t("ui.frame.1"));
          else if (e.kind === "gazeHit") showToast(t("ui.frame.2", { damage: e.damage }));
          else if (e.kind === "gazeAvoided") showToast(t("ui.frame.3"));
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
        // One world: crossing the steppe onto the mountain just changes the
        // region (the HUD, the sabbath's rules) — no teleport.
        const region: AreaId | null = isHutArea(area) ? null : p.x >= LYSA_BORDER_X && p.y < LYSA_BORDER_Y ? "lysa" : "village";
        if (region && region !== area) {
          areaRef.current = region;
          setHudArea(region);
          fishingRef.current = null;
          promptRef.current = null;
          setPrompt(null);
          promptKey = "";
          if (region === "lysa") {
            if (!flagHas(flagsRef.current, "visitedLysa")) {
              setFlag("visitedLysa");
              showToast(t("ui.frame.4"));
            } else {
              showToast(t("ui.frame.5"));
            }
          }
          dirtyRef.current = true;
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
          setToast(t("ui.frame.7"));
        }
      }

      // --- chickens wander (village only — there are no chickens on the
      // Bald Mountain; the witches ate them, probably)
      for (const ch of !isHutArea(area) ? chickensRef.current : []) {
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
      const camp = chumakyPresent(flagsNow);
      const ostapNow = ostapState(flagsNow);
      // The Chort keeps two addresses: the millstone by day, the sabbath
      // on Lysa Hora by night.
      const night = isNight(clockRef.current.minute);
      const lysaChars = night ? LYSA_CHARS : LYSA_CHARS.filter((c) => c.id !== "chort");
      const villageChars = [
        ...ALL_CHARS.filter((c) => !(c.id === "viy" && flagHas(flagsNow, "viySealed")) && !(c.id === "chort" && night)),
        ...(camp ? [GNAT, ...(ostapNow === "sick" ? [OSTAP] : ostapNow === "healed" ? [OSTAP_WELL] : [])] : []),
      ];
      const vigilReady = flagHas(flagsNow, "chalk") && isNight(clockRef.current.minute);
      let nextPrompt: Prompt = null;
      let best = 64;
      if (area === "lysa") {
        // Lysa Hora interactables: the sabbath host, the night-blooms,
        // the offering stone, and the dance ring.
        for (const npc of lysaChars) {
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
          lspot(LYSA_WORLD.offer.x, LYSA_WORLD.offer.y, 62, () => ({ kind: "offering" }));
        }
        if (flagHas(flagsNow, "lysaOffering") && !flagHas(flagsNow, "lysaDanced")) {
          lspot(LYSA_WORLD.dance.x, LYSA_WORLD.dance.y, 66, () => ({ kind: "dance" }));
        }
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
        // inside the Domovyk's khata: his bed and his pich
        const inHut0 = houseAt(p.x, p.y) === "hut0";
        spot(inHut0, BED_SPOT.x, BED_SPOT.y, 30, () => ({ kind: "sleep" }));
        spot(inHut0 && flagHas(flagsNow, "bread"), PICH_SPOT.x, PICH_SPOT.y, 50, () => ({ kind: "offer" }));
        spot(inHut0 && flagHas(flagsNow, "offering") && !flagHas(flagsNow, "stone"), PICH_SPOT.x, PICH_SPOT.y + 8, 50, () => ({ kind: "gift" }));
        spot(true, WELL.x + WELL.w / 2, WELL.y + WELL.h / 2, 66, () => ({ kind: "wish" }));
        spot(true, COOK_SPOT.x, COOK_SPOT.y, 60, () => ({ kind: "cook" }));
        spot(true, FORGE_SPOT.x, FORGE_SPOT.y, 60, () => ({ kind: "smith" }));
        spot(true, BREW_SPOT.x, BREW_SPOT.y, 60, () => ({ kind: "brew" }));
        spot(true, PLAY_SPOT.x, PLAY_SPOT.y, 54, () => ({ kind: "play" }));
        spot(ostapNow === "dead", GRAVE.x, GRAVE.y, 50, () => ({ kind: "grave" }));
        const tStage = tobaccoStage(flagsNow);
        TOBACCO_SPOTS.forEach((ts, idx) => {
          spot(tStage === "gather" && !flagHas(flagsNow, `tobaccoLeaf${idx}`), ts.x, ts.y, 48, () => ({ kind: "tobacco", idx }));
        });
        spot(tStage === "gather" && !flagHas(flagsNow, "hempFibre"), HEMP_SPOT.x, HEMP_SPOT.y, 50, () => ({ kind: "hemp" }));
        spot(tStage === "hang", BREW_SPOT.x, BREW_SPOT.y, 60, () => ({ kind: "hangTobacco" }));
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
      if (isHutArea(area)) {
        // (no separate rooms any more — the khaty stand in the world)
      } else {
      drawGround(ctx2d, camX, camY, vw, vh, now);
      drawLand(ctx2d, camX, camY, vw, vh, now);
      // the rooms of the khaty you can walk into; their roofs (below, as
      // drawables) cover them unless the kobzar is inside
      for (const id of HOUSE_IDS) {
        const r = HOUSE_RECTS[id];
        if (r.x - camX > vw || r.x + r.w - camX < 0 || r.y - camY > vh || r.y + r.h - camY < -60) continue;
        if (roofAlphaRef.current[id] >= 0.999) continue;
        ctx2d.save();
        ctx2d.beginPath(); ctx2d.rect(r.x - camX, r.y - camY, r.w, r.h); ctx2d.clip();
        drawKhataInterior(ctx2d, id, r.x - camX, r.y - camY, now, flagsNow);
        ctx2d.restore();
      }
      drawRiver(ctx2d, camX, camY, vw, vh, now);
      // the tobacco quest's spots glow softly while they are wanted
      if (tobaccoStage(flagsNow) === "gather") {
        const pulse = 0.35 + Math.sin(now * 0.004) * 0.15;
        const glow = (x: number, y: number) => {
          const g = ctx2d.createRadialGradient(x - camX, y - camY, 2, x - camX, y - camY, 26);
          g.addColorStop(0, `rgba(255,236,150,${pulse})`);
          g.addColorStop(1, "rgba(255,236,150,0)");
          ctx2d.fillStyle = g;
          ctx2d.fillRect(x - 26 - camX, y - 26 - camY, 52, 52);
        };
        TOBACCO_SPOTS.forEach((ts, idx) => { if (!flagHas(flagsNow, `tobaccoLeaf${idx}`)) glow(ts.x, ts.y); });
        if (!flagHas(flagsNow, "hempFibre")) glow(HEMP_SPOT.x, HEMP_SPOT.y);
      }
      // Lysa Hora at the steppe's end: its bald rock, drawn in its own
      // local coordinates and clipped to the mountain's oval.
      const lx = LYSA_ORIGIN.x - camX;
      const ly = LYSA_ORIGIN.y - camY;
      if (lx < vw && lx + LYSA_W > 0 && ly < vh && ly + LYSA_H > 0) {
        ctx2d.save();
        ctx2d.beginPath();
        ctx2d.ellipse(lx + LYSA_W / 2, ly + LYSA_H / 2, LYSA_W / 2 + 40, LYSA_H / 2 + 30, 0, 0, Math.PI * 2);
        ctx2d.clip();
        drawLysaGround(ctx2d, camX - LYSA_ORIGIN.x, camY - LYSA_ORIGIN.y, vw, vh, now, flagHas(flagsNow, "lysaOffering"));
        // feather the mountain's foot into the steppe grass
        ctx2d.translate(lx + LYSA_W / 2, ly + LYSA_H / 2);
        ctx2d.scale(1, (LYSA_H + 60) / (LYSA_W + 80));
        const rim = ctx2d.createRadialGradient(0, 0, (LYSA_W / 2 + 40) * 0.72, 0, 0, LYSA_W / 2 + 40);
        rim.addColorStop(0, "rgba(160,170,92,0)");
        rim.addColorStop(0.55, "rgba(132,140,88,0.55)");
        rim.addColorStop(1, "rgba(160,172,94,1)");
        ctx2d.fillStyle = rim;
        ctx2d.fillRect(-LYSA_W, -LYSA_W, LYSA_W * 2, LYSA_W * 2);
        ctx2d.restore();
        drawLysaFire(ctx2d, camX - LYSA_ORIGIN.x, camY - LYSA_ORIGIN.y, now);
        lysaPatchesRef.current.forEach((patch) => drawLysaFlower(ctx2d, patch.x, patch.y, camX, camY, now, !patch.taken));
      }
      drawWell(ctx2d, camX, camY, now);
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
      if (!isHutArea(area)) {
      for (const id of HOUSE_IDS) {
        const r = HOUSE_RECTS[id];
        const alpha = roofAlphaRef.current[id];
        drawables.push({ y: r.y + r.h, draw: () => id === "otaman"
          ? drawOtamanKhata(ctx2d, r.x - camX, r.y - camY, r.w, r.h, now, alpha)
          : drawKhataBig(ctx2d, r.x - camX, r.y - camY, r.w, r.h, now, r.x, alpha) });
      }
      for (const h of HOUSES) {
        drawables.push({ y: h.y + h.h, draw: () => drawHouse(ctx2d, h, camX, camY, now) });
      }
      drawables.push({ y: OTAMAN_FLAGPOLE.y + 8, draw: () => drawKorohva(ctx2d, OTAMAN_FLAGPOLE.x + 4 - camX, OTAMAN_FLAGPOLE.y + 6 - camY, now) });
      drawables.push({ y: WINDMILL.y, draw: () => drawWindmill(ctx2d, WINDMILL.x - camX, WINDMILL.y - camY, now) });
      for (const k of [KURHAN, KURHAN_STEPPE]) drawables.push({ y: k.y, draw: () => drawKurhan(ctx2d, k.x - camX, k.y - camY) });
      for (const d of DECOR) {
        if (d.x < camX - 40 || d.x > camX + vw + 40 || d.y < camY - 10 || d.y > camY + vh + 80) continue;
        const dx = d.x - camX;
        const dy = d.y - camY;
        drawables.push({
          y: d.y,
          draw: () => (d.kind === "sunflower" ? drawSunflower(ctx2d, dx, dy, now, d.seed) : d.kind === "mallow" ? drawMallow(ctx2d, dx, dy, now, d.seed) : drawKovyla(ctx2d, dx, dy, now, d.seed)),
        });
      }
      if (camp) {
        drawables.push({ y: CART.y + 10, draw: () => drawCart(ctx2d, CART.x, CART.y, camX, camY) });
        for (const o of OXEN) drawables.push({ y: o.y + 8, draw: () => drawOx(ctx2d, o.x, o.y, o.face, camX, camY, now) });
      }
      if (ostapNow === "dead") drawables.push({ y: GRAVE.y, draw: () => drawGrave(ctx2d, camX, camY) });
      for (const tr of TREES) {
        if (tr.x < camX - 90 || tr.x > camX + vw + 90 || tr.y < camY - 130 || tr.y > camY + vh + 40) continue;
        drawables.push({ y: tr.y, draw: () => drawTree(ctx2d, tr, camX, camY, now) });
      }
      }
      for (const npc of [...villageChars, ...lysaChars, ...LYSA_DANCERS]) {
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
            else if (npc.style === "sick") drawSickChumak(ctx2d, sx, sy, npc.tunic, npc.hair, now);
            else {
              drawPerson(ctx2d, sx, sy, {
                tunic: npc.tunic, hair: npc.hair, style: npc.style === "chumak" ? "elder" : npc.style,
                moving: false, phase: 0, face: clamp(p.x - pos.x, -1, 1) * 0.7, t: now,
              });
            }
          },
        });
        // name tag — each kind floats at its own height (Viy's is a warning)
        const tagLift = npc.id === "viy" ? 168 : npc.style === "beelzebub" ? 96 : npc.style === "witch" ? 64 : npc.style === "lisovyk" ? 122 : npc.style === "domovyk" ? 48 : npc.style === "sick" ? 30 : npc.style === "bolotianyk" ? 58 : 66;
        const tagText = npc.id === "viy" ? t("ui.tagText.0") : npc.name;
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
      for (const ch of !isHutArea(area) ? chickensRef.current : []) {
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
      // the air thickens toward Lysa Hora: a cold moonlit wash that grows
      // over the last stretch of steppe and covers the mountain
      if (!isHutArea(area)) {
        const edge = LYSA_ORIGIN.x - camX;
        if (edge - 500 < vw) {
          const g = ctx2d.createLinearGradient(edge - 500, 0, edge + 60, 0);
          g.addColorStop(0, "rgba(16,18,48,0)");
          g.addColorStop(1, "rgba(16,18,48,0.42)");
          ctx2d.fillStyle = g;
          ctx2d.fillRect(Math.max(0, edge - 500), 0, vw, vh);
        }
      }
      const vg = ctx2d.createRadialGradient(vw / 2, vh * 0.42, Math.min(vw, vh) * 0.36, vw / 2, vh * 0.5, Math.max(vw, vh) * 0.78);
      vg.addColorStop(0, "rgba(60,30,0,0)");
      vg.addColorStop(1, area === "lysa" ? "rgba(6,6,24,0.42)" : "rgba(43,26,4,0.28)");
      ctx2d.fillStyle = vg;
      ctx2d.fillRect(0, 0, vw, vh);

      // night over the open village (huts are lamp-lit; Lysa Hora is
      // always moonlit), then the vigil on top so the chalk stays bright
      if (!isHutArea(area)) {
        drawNight(ctx2d, darkness(clockRef.current.minute), vw, vh, FIRE.x + FIRE.w / 2 - camX, FIRE.y + FIRE.h / 2 - camY);
      }
      // lamplight inside a khata, so a room at night is not black
      const lit = insideRef.current;
      if (lit && !isHutArea(area)) {
        const r = HOUSE_RECTS[lit];
        const dark = darkness(clockRef.current.minute);
        if (dark > 0.05) {
          ctx2d.save();
          ctx2d.beginPath(); ctx2d.rect(r.x - camX, r.y - camY, r.w, r.h); ctx2d.clip();
          ctx2d.globalCompositeOperation = "lighter";
          const lg = ctx2d.createRadialGradient(r.x + r.w / 2 - camX, r.y + r.h / 2 - camY, 10, r.x + r.w / 2 - camX, r.y + r.h / 2 - camY, r.w * 0.6);
          lg.addColorStop(0, `rgba(255,170,80,${dark * 0.7})`);
          lg.addColorStop(1, `rgba(255,170,80,${dark * 0.25})`);
          ctx2d.fillStyle = lg;
          ctx2d.fillRect(r.x - camX, r.y - camY, r.w, r.h);
          ctx2d.restore();
        }
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

  // Switching language saves the game first, then reloads: every module
  // resolves its text once, at startup (see i18n/index.ts).
  const switchLanguage = async (l: Lang) => {
    if (started && loadedRef.current) {
      await save.save({
        x: Math.round(playerRef.current.x),
        y: Math.round(playerRef.current.y),
        area: areaRef.current,
        talked: [...talkedRef.current],
        herbs: herbsRef.current,
        flags: [...flagsRef.current],
      });
    }
    setLanguage(l);
    window.location.reload();
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
  const played = flagCount(hudFlags, "played");
  const musicLvl = craftLevel(played);
  const stats = computeStats({
    herbs: hudHerbs, fishTotal, cooked, smithed, brewed,
    played, flags: hudFlags,
  });
  const price = soulPrice(stats);
  const carried = carriedWeight(hudFlags);
  const cap = carryCap(stats);
  const iron = flagCount(hudFlags, "iron");
  const haulingIron = !flagHas(hudFlags, "horseshoe") && iron > 0;
  const soulLost = flagHas(hudFlags, "soulsold") && !flagHas(hudFlags, "soulback");
  const lysaFlowers = flagCount(hudFlags, "lysaFlower");
  const quests = questLog({ area: hudArea, talked: hudTalked, herbs: hudHerbs, flags: hudFlags, soulPrice: price, night: isNight(hudClock.minute), evening: isEvening(hudClock.minute) });
  // where the map puts the kobzar: read once when the map opens (the
  // world is paused while it is open, so this does not go stale)
  const mapPlayer = mapOpen ? { x: playerRef.current.x, y: playerRef.current.y } : { x: 0, y: 0 };
  const objective = hudFight ? t("ui.objective.0") : quests.objective;
  const promptHerb =
    prompt?.kind === "gather" ? HERBS[HERB_SPOTS[prompt.idx]?.kind ?? "kropyva"] : null;
  const promptLabel = !prompt
    ? ""
    : prompt.kind === "talk"
      ? prompt.npc.id === "viy" ? t("ui.promptLabel.0") : t("ui.promptLabel.1", { name: prompt.npc.name })
      : prompt.kind === "enter"
        ? t("ui.promptLabel.2")
        : prompt.kind === "exit"
          ? t("ui.promptLabel.3")
          : prompt.kind === "gather"
        ? t("ui.promptLabel.4", { herb: promptHerb?.name ?? "" })
        : prompt.kind === "cast"
          ? t("ui.promptLabel.5")
          : prompt.kind === "reel"
            ? t("ui.promptLabel.6")
            : prompt.kind === "crust"
              ? t("ui.promptLabel.7")
              : prompt.kind === "offer"
                ? t("ui.promptLabel.8")
                : prompt.kind === "gift"
                  ? t("ui.promptLabel.9")
                  : prompt.kind === "iron"
                    ? t("ui.promptLabel.10")
                    : prompt.kind === "cook"
                      ? t("ui.promptLabel.11")
                      : prompt.kind === "smith"
                        ? t("ui.promptLabel.12")
                        : prompt.kind === "brew"
                          ? stats.int.total >= 3 ? t("ui.promptLabel.13") : t("ui.promptLabel.14")
                          : prompt.kind === "bloom"
                            ? t("ui.promptLabel.15")
                            : prompt.kind === "offering"
                              ? t("ui.promptLabel.16")
                              : prompt.kind === "dance"
                                ? t("ui.promptLabel.17")
                                : prompt.kind === "sleep"
                                  ? t("ui.promptLabel.18")
                                  : prompt.kind === "play"
                                    ? t("ui.promptLabel.play")
                                  : prompt.kind === "grave"
                                    ? t("ui.promptLabel.grave")
                                  : prompt.kind === "tobacco"
                                    ? t("tobacco.prompt.leaf")
                                  : prompt.kind === "hemp"
                                    ? t("tobacco.prompt.hemp")
                                  : prompt.kind === "hangTobacco"
                                    ? t("tobacco.prompt.hang")
                                  : prompt.kind === "vigil"
                                    ? t("ui.promptLabel.19")
                                    : t("ui.promptLabel.20");
  const promptAria = !prompt
    ? ""
    : prompt.kind === "talk"
      ? prompt.npc.id === "viy" ? t("ui.promptAria.0") : t("ui.promptAria.1", { name: prompt.npc.name })
      : prompt.kind === "vigil"
        ? t("ui.promptAria.2")
        : promptLabel.replace(/\s*[🎣🍞✨🍲🔨⚗🌙💃🚪🛏◯]\s*/g, " ").trim();
  const sealed = flagHas(hudFlags, "viySealed");
  const keepsakes: string[] = [
    ...(flagHas(hudFlags, "map") ? [t(flagHas(hudFlags, "mapChort") ? "map.keepsake.chort" : "map.keepsake.chumak")] : []),
    ...(flagHas(hudFlags, "lyulka") ? [t("tobacco.keepsake")] : []),
    ...(sealed ? [t("ui.keepsakes.0")] : []),
    ...(flagHas(hudFlags, "chalk") && !sealed ? [t("ui.keepsakes.1")] : []),
    ...(flagHas(hudFlags, "wreath") && !sealed ? [t("ui.keepsakes.2")] : []),
    ...(flagHas(hudFlags, "ironward") && !sealed ? [t("ui.keepsakes.3")] : []),
    ...(flagHas(hudFlags, "moonstone") ? [t("ui.keepsakes.4")] : []),
    ...(flagHas(hudFlags, "gold") ? [t("ui.keepsakes.5")] : []),
    ...(flagHas(hudFlags, "stone") ? [t("ui.keepsakes.6")] : []),
    ...(flagHas(hudFlags, "horseshoe") ? [t("ui.keepsakes.7")] : []),
    ...(flagHas(hudFlags, "pebble") ? [t("ui.keepsakes.8")] : []),
    ...(flagHas(hudFlags, "bread") ? [t("ui.keepsakes.9")] : []),
  ];
  // Skill rows for the Character sheet: name, level, lifetime count, and
  // what the next level wants.
  const skillRows: Array<{ name: string; level: number; done: number; next: number | null; stat: string }> = [
    { name: t("ui.skillRows.name.0"), level: lvl, done: hudHerbs, next: THRESH[lvl] ?? null, stat: t("ui.skillRows.stat.0") },
    { name: t("ui.skillRows.name.1"), level: fishLvl, done: fishTotal, next: FISH_THRESH[fishLvl] ?? null, stat: t("ui.skillRows.stat.1") },
    { name: t("ui.skillRows.name.2"), level: cookLvl, done: cooked, next: CRAFT_THRESH[cookLvl] ?? null, stat: t("ui.skillRows.stat.2") },
    { name: t("ui.skillRows.name.3"), level: smithLvl, done: smithed, next: CRAFT_THRESH[smithLvl] ?? null, stat: t("ui.skillRows.stat.3") },
    { name: t("ui.skillRows.name.4"), level: alchemyLvl, done: brewed, next: CRAFT_THRESH[alchemyLvl] ?? null, stat: t("ui.skillRows.stat.4") },
    { name: t("ui.skillRows.name.music"), level: musicLvl, done: played, next: CRAFT_THRESH[musicLvl] ?? null, stat: t("ui.skillRows.stat.music") },
  ];
  // --- Quest log: every thread, from systems/quests.ts (the same source
  // as the objective line above, so the two always agree).
  const questStatus = (q: QuestItem): "done" | "active" | "todo" => (q.done ? "done" : q.active ? "active" : "todo");

  const openMap = () => {
    if (fightRef.current || dialogueRef.current) return;
    // the map is a thing you carry (dialogue/mapTopics.ts)
    if (!flagHas(flagsRef.current, "map")) {
      showToast(t("map.none"));
      return;
    }
    panelRef.current = true;
    setMapOpen(true);
  };
  const closeMap = () => {
    panelRef.current = false;
    setMapOpen(false);
  };
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
        <canvas ref={canvasRef} className="block" style={{ touchAction: "none" }} aria-label={t("ui.misc.0")} />
        {/* warm sunlight wash in the village; cold moonwash on Lysa Hora */}
        <div className="pointer-events-none absolute inset-0" style={{ background: hudArea === "lysa" || (hudArea === "village" && isNight(hudClock.minute)) ? "linear-gradient(160deg, rgba(140,160,255,0.13) 0%, rgba(140,160,255,0) 50%)" : hudInside ? "linear-gradient(165deg, rgba(255,170,80,0.15) 0%, rgba(255,170,80,0) 55%)" : "linear-gradient(135deg, rgba(255,196,86,0.14) 0%, rgba(255,196,86,0) 45%)" }} />
      </div>

      {!started && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-[#16281a]/72 p-5"
          style={{ touchAction: "none", overscrollBehavior: "none" }}
        >
          <div className="w-full max-w-xs rounded-2xl border border-[#d9c491]/50 bg-[#f3e9d2] p-6 text-center shadow-2xl">
            <h1 className="font-serif text-3xl font-bold text-[#33241a]">{t("ui.misc.1")}</h1>
            <p className="mt-2 text-sm text-[#5d4630]">{t("ui.misc.2")}</p>
            <button
              type="button"
              aria-label={saveQuery.data?.exists ? t("ui.continue") : t("ui.misc.3")}
              onClick={() => setStarted(true)}
              className="mt-5 w-full rounded-xl bg-[#7a4a2b] px-4 py-3 font-serif text-base font-bold text-[#f3e9d2] shadow active:bg-[#5d3a1f]"
            >
              {saveQuery.data?.exists ? t("ui.continue") : t("ui.misc.4")}
            </button>
            <LanguagePicker className="mt-4" onPick={(l) => void switchLanguage(l)} />
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
                {hudArea === "lysa" ? t("ui.misc.5") : hudInside === "hut0" ? t("ui.misc.6") : hudInside === "hut1" ? t("ui.misc.7") : hudInside === "otaman" ? t("ui.hut.otaman") : t("ui.zalissya")}
                <span className="ml-1.5 normal-case tracking-normal text-[#e8d7ad]">{timeLabel(hudClock)}</span>
              </p>
              <p className="font-serif text-[13px] font-bold leading-tight">
                {objective}
              </p>
              {soulLost && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#f0a696]">
                  {t("ui.hud.soulLost", { price })}
                </p>
              )}
              {carried > cap && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#f0a696]">
                  {t("ui.hud.overfull", { carried, cap })}
                </p>
              )}
            </div>
            <div className="pointer-events-auto mt-2 flex flex-col items-end gap-1.5">
              <div className="flex gap-1.5">
                {flagHas(hudFlags, "map") && (
                  <button
                    type="button"
                    aria-label={t("map.open")}
                    onClick={openMap}
                    className="rounded-lg bg-[#7a4a2b]/85 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow backdrop-blur-[2px]"
                  >
                    {t("map.button")}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={t("ui.misc.12")}
                  onClick={() => openPanel("stats")}
                  className="rounded-lg bg-[#7a4a2b]/85 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow backdrop-blur-[2px]"
                >
                  {t("ui.misc.13")}
                </button>
                <button
                  type="button"
                  aria-label={t("ui.misc.14", { done: quests.done, total: quests.total })}
                  onClick={() => openPanel("quests")}
                  className="rounded-lg bg-[#7a4a2b]/85 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow backdrop-blur-[2px]"
                >
                  {t("ui.misc.15")}
                </button>
              </div>
              {confirmReset ? (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    aria-label={t("ui.misc.16")}
                    onClick={onReset}
                    className="rounded-lg bg-[#a83c32] px-3 py-2 text-xs font-bold text-white shadow"
                  >
                    {t("ui.misc.17")}
                  </button>
                  <button
                    type="button"
                    aria-label={t("ui.misc.18")}
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg bg-[#1c1409]/70 px-3 py-2 text-xs font-bold text-[#f3e9d2] shadow"
                  >
                    {t("ui.misc.19")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={t("ui.misc.20")}
                  onClick={() => setConfirmReset(true)}
                  className="rounded-lg bg-[#1c1409]/55 px-3 py-2 text-xs font-semibold text-[#f3e9d2] backdrop-blur-[2px]"
                >
                  {t("ui.misc.21")}
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
          {JOYSTICK_ALLOWED && controls === "stick" && !dialogue && !panelOpen && !hudFight && (
            <div data-touch-controls>
              <Joystick stickRef={stickRef} />
            </div>
          )}
          {controls === "pad" && !dialogue && !panelOpen && !hudFight && (
            <div data-touch-controls
              className="absolute bottom-5 left-4 z-10"
              style={{ touchAction: "none" }}
              role="group"
              aria-label={t("ui.misc.25")}
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
                  {t("ui.misc.26")}
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
                    <span>{t("ui.misc.27")}</span>
                    <span>{hudFight.nerve}/{hudFight.max}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[#f3e9d2]/20">
                    <div className="h-2 rounded-full bg-[#c23b2a]" style={{ width: `${(100 * hudFight.nerve) / hudFight.max}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-semibold">
                    <span>{t("ui.misc.28")}</span>
                    <span>{t("ui.vigil.secondsLeft", { s: Math.max(0, Math.ceil(VIGIL_SECONDS - hudFight.t)) })}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[#f3e9d2]/20">
                    <div className="h-2 rounded-full bg-[#d99a2b]" style={{ width: `${Math.min(100, (100 * hudFight.t) / VIGIL_SECONDS)}%` }} />
                  </div>
                </div>
              </div>
              {hudFight.gaze !== "closed" && (
                <p className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center font-serif text-2xl font-bold text-[#f0a696] [text-shadow:0_2px_6px_rgba(0,0,0,0.9)]">
                  {hudFight.gaze === "rising" ? t("ui.misc.30") : lookHeld ? t("ui.misc.31") : t("ui.misc.32")}
                </p>
              )}
              <div className="absolute inset-x-0 bottom-6 z-10 flex justify-between gap-3 px-4 pb-safe" style={{ touchAction: "none" }}>
                <button
                  type="button"
                  aria-label={t("ui.misc.33")}
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
                  {t("ui.misc.34")}
                  <span className="text-[10px] font-semibold opacity-75">{t("ui.misc.35")}</span>
                </button>
                <button
                  type="button"
                  aria-label={t("ui.misc.36")}
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
                  {t("ui.misc.37")}
                  <span className="text-[10px] font-semibold opacity-75">{hudFight.ready ? "tap" : t("ui.misc.38")}</span>
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
              {t("ui.misc.39")}
            </p>
          )}

          {/* Dialogue */}
          {dialogue && (
            <div className="absolute inset-x-0 bottom-0 z-20 p-3 pb-safe">
              <div data-pad-scope className="mx-auto max-w-xl rounded-2xl border border-[#d9c491]/60 bg-[#f3e9d2] p-4 shadow-2xl">
                <p className="font-serif text-sm font-bold text-[#7a4a2b]">
                  {dialogue.npc.name}{" "}
                  {dialogue.npc.pron && <span className="font-normal italic text-[#a3805a]">({dialogue.npc.pron}) </span>}
                  <span className="font-normal text-[#a3805a]">· {dialogue.npc.role}</span>
                </p>
                {dialogue.view === "topic" && dialogue.topic && (
                  <p className="mt-1 text-[13px] italic text-[#a3805a]">
                    {t("ui.dialogue.youAsk", { question: dialogue.topic.question })}
                  </p>
                )}
                <p className="mt-1.5 min-h-12 text-[15px] leading-relaxed text-[#33241a]">
                  {dialogue.view === "topic" && dialogue.topic
                    ? dialogue.topic.lines[dialogue.topicLine ?? 0]
                    : dialogue.view === "menu"
                      ? t("ui.misc.41")
                      : dialogue.lines[dialogue.line]}
                </p>
                {dialogue.view === "menu" && dialogue.topics ? (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {dialogue.topics.map((topic) => {
                      const asked = dialogue.asked?.includes(topic.id) ?? false;
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          aria-label={t("ui.misc.42", { name: dialogue.npc.name, label: topic.label })}
                          onClick={() => selectTopic(topic)}
                          className={`rounded-lg px-3.5 py-2 text-left font-serif text-sm font-bold ${
                            asked
                              ? "bg-[#e9dcbc] text-[#8a7350]"
                              : "bg-[#e2d3ae] text-[#5d4630] active:bg-[#d3c096]"
                          }`}
                        >
                          {asked ? "✓ " : ""}{topic.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-label={t("ui.misc.43")}
                      onClick={endDialogue}
                      className="mt-1 rounded-lg bg-[#7a4a2b] px-3.5 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                    >
                      {t("ui.misc.44")}
                    </button>
                  </div>
                ) : dialogue.view === "topic" && dialogue.topic ? (
                  dialogue.topic.action === "bargain" && (dialogue.topicLine ?? 0) >= dialogue.topic.lines.length - 1 ? (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] italic text-[#a3805a]">{t("ui.misc.45")}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label={t("ui.misc.46")}
                          onClick={() => chortChoice(true)}
                          className="rounded-lg bg-[#7e2430] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d1a23]"
                        >
                          {t("ui.misc.47")}
                        </button>
                        <button
                          type="button"
                          aria-label={t("ui.misc.48")}
                          onClick={() => chortChoice(false)}
                          className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                        >
                          {t("ui.misc.49")}
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
                        aria-label={(dialogue.topicLine ?? 0) + 1 < dialogue.topic.lines.length ? t("ui.misc.50") : t("ui.misc.51")}
                        onClick={() => interactRef.current()}
                        className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                      >
                        {(dialogue.topicLine ?? 0) + 1 < dialogue.topic.lines.length ? t("ui.next") : t("ui.misc.52")}
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
                      <span className="text-[11px] italic text-[#a3805a]">{t("ui.misc.53")}</span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-label={t("ui.misc.54")}
                          onClick={() => brewChoice("base")}
                          className="rounded-lg bg-[#4c6b35] px-3.5 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#3a5427]"
                        >
                          {t("ui.misc.55")}
                        </button>
                        <button
                          type="button"
                          aria-label={t("ui.misc.56")}
                          onClick={() => brewChoice("strong")}
                          className="rounded-lg bg-[#5a3a6e] px-3.5 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#462d56]"
                        >
                          {t("ui.misc.57")}
                        </button>
                        <button
                          type="button"
                          aria-label={t("ui.misc.58")}
                          onClick={() => brewChoice(null)}
                          className="rounded-lg bg-[#e2d3ae] px-3.5 py-2 font-serif text-sm font-bold text-[#5d4630] active:bg-[#d3c096]"
                        >
                          {t("ui.misc.59")}
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] italic text-[#a3805a]">{t("ui.misc.60")}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={t("ui.misc.61")}
                        onClick={() => chortChoice(true)}
                        className="rounded-lg bg-[#7e2430] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d1a23]"
                      >
                        {t("ui.misc.62")}
                      </button>
                      <button
                        type="button"
                        aria-label={t("ui.misc.63")}
                        onClick={() => chortChoice(false)}
                        className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                      >
                        {t("ui.misc.64")}
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
                          ? t("ui.misc.65")
                          : dialogue.topics
                            ? t("ui.misc.66")
                            : t("ui.misc.67")
                      }
                      onClick={() => interactRef.current()}
                      className="rounded-lg bg-[#7a4a2b] px-4 py-2 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                    >
                      {dialogue.line + 1 < dialogue.lines.length
                        ? t("ui.next")
                        : dialogue.topics
                          ? t("ui.misc.68")
                          : t("ui.farewell")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {mapOpen && (
            <MapOverlay
              player={mapPlayer}
              flags={hudFlags}
              target={questTarget(quests.activeId, hudFlags)}
              title={t(flagHas(hudFlags, "mapChort") ? "map.title.chort" : "map.title.chumak")}
              onClose={closeMap}
            />
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
                data-pad-scope
                className="max-h-[88dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#d9c491]/60 bg-[#f3e9d2] p-4 shadow-2xl"
                style={{ touchAction: "pan-y" }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-[#33241a]">{panelTab === "quests" ? t("ui.quests") : t("ui.character")}</h2>
                  <button
                    type="button"
                    aria-label={panelTab === "quests" ? t("ui.misc.69") : t("ui.misc.70")}
                    onClick={closePanel}
                    className="rounded-lg bg-[#7a4a2b] px-3 py-1.5 font-serif text-sm font-bold text-[#f3e9d2] active:bg-[#5d3a1f]"
                  >
                    {t("ui.misc.71")}
                  </button>
                </div>
                <div className="mt-2.5 flex gap-1.5" role="tablist" aria-label={t("ui.misc.72")}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={panelTab === "stats"}
                    aria-label={t("ui.misc.73")}
                    onClick={() => setPanelTab("stats")}
                    className={`rounded-lg px-3.5 py-1.5 font-serif text-sm font-bold ${panelTab === "stats" ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
                  >
                    {t("ui.misc.74")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={panelTab === "skills"}
                    aria-label={t("ui.misc.75")}
                    onClick={() => setPanelTab("skills")}
                    className={`rounded-lg px-3.5 py-1.5 font-serif text-sm font-bold ${panelTab === "skills" ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
                  >
                    {t("ui.misc.76")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={panelTab === "quests"}
                    aria-label={t("ui.misc.77")}
                    onClick={() => setPanelTab("quests")}
                    className={`rounded-lg px-3.5 py-1.5 font-serif text-sm font-bold ${panelTab === "quests" ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630]"}`}
                  >
                    {t("ui.misc.78")}
                  </button>
                </div>

                {panelTab === "quests" ? (
                  <div className="mt-3">
                    <p className="text-[12px] italic leading-snug text-[#7a6248]">
                      {t("ui.quests.intro", { done: quests.done, total: quests.total, now: t("ui.misc.83") })}
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
                                    <span className="ml-2 rounded-full bg-[#d99a2b] px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-[#33241a]">{t("ui.misc.83")}</span>
                                  )}
                                  {st === "done" && (
                                    <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-[#7a9a3c]">{t("ui.misc.84")}</span>
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
                              <span className="font-normal text-[#a3805a]">{t("ui.stats.from", { feeds: d.feeds })}</span>
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
                      {t("ui.stats.footer", { price })}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    {skillRows.map((r) => (
                      <div key={r.name} className="border-b border-[#d9c491]/50 py-1.5 last:border-0">
                        <div className="flex items-baseline justify-between">
                          <p className="text-sm font-bold text-[#33241a]">
                            {r.name} <span className="font-normal text-[#a3805a]">{t("ui.skills.feeds", { stat: r.stat })}</span>
                          </p>
                          <p className="font-serif text-base font-bold text-[#7a4a2b]">{t("ui.skills.level", { level: r.level })}</p>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e2d3ae]" aria-hidden="true">
                          <div
                            className="h-full rounded-full bg-[#7a9a3c]"
                            style={{ width: `${r.next != null ? Math.min(100, (r.done / r.next) * 100) : 100}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#7a6248]">
                          {r.next != null ? t("ui.misc.90", { done: r.done, next: r.next, n: r.level + 1 }) : t("ui.misc.91", { done: r.done })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {panelTab !== "quests" && (
                <div className="mt-3 rounded-xl bg-[#e9dcbc] p-3">
                  <p className="font-serif text-sm font-bold text-[#33241a]">{t("ui.misc.92")}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#5d4630]">
                    {t("ui.satchel.basics", { herbStock, fish })}
                    {lysaFlowers > 0 ? t("ui.misc.95", { lysaFlowers }) : ""}
                    {meals > 0 ? t("ui.misc.96", { meals }) : ""}
                    {potions > 0 ? t("ui.misc.97", { potions }) : ""}
                    {strongPotions > 0 ? t("ui.misc.98", { strongPotions }) : ""}
                    {forged > 0 ? t("ui.misc.99", { forged }) : ""}
                  </p>
                  <p className={`mt-0.5 text-[12px] leading-snug ${carried > cap ? "font-semibold text-[#a83226]" : "text-[#5d4630]"}`}>
                    {t("ui.satchel.carrying", { carried, cap, str: stats.str.total })}
                    {haulingIron ? t("ui.misc.103", { iron }) : ""}
                    {carried > cap ? t("ui.misc.104") : ""}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#5d4630]">
                    {t("ui.satchel.songs", { songs: knownSongs(hudFlags).map(songName).join(" · ") })}
                  </p>
                  {keepsakes.length > 0 && (
                    <p className="mt-0.5 text-[12px] leading-snug text-[#5d4630]">{keepsakes.join(" · ")}</p>
                  )}
                  {(flagHas(hudFlags, "wellfed") || flagHas(hudFlags, "tonic") || flagHas(hudFlags, "strongtonic")) && (
                    <p className="mt-0.5 text-[12px] font-semibold text-[#7a4a2b]">
                      {t("ui.misc.105")} {[
                        flagHas(hudFlags, "wellfed") ? t("ui.misc.106") : null,
                        flagHas(hudFlags, "tonic") ? t("ui.misc.107") : null,
                        flagHas(hudFlags, "strongtonic") ? t("ui.misc.108") : null,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-label={t("ui.misc.109")}
                      disabled={meals < 1}
                      onClick={eatMeal}
                      className="rounded-lg bg-[#7a4a2b] px-3 py-2 font-serif text-sm font-bold text-[#f3e9d2] disabled:opacity-40"
                    >
                      {t("ui.misc.110")}
                    </button>
                    <button
                      type="button"
                      aria-label={t("ui.misc.111")}
                      disabled={potions < 1}
                      onClick={drinkTonic}
                      className="rounded-lg bg-[#4c6b35] px-3 py-2 font-serif text-sm font-bold text-[#f3e9d2] disabled:opacity-40"
                    >
                      {t("ui.misc.112")}
                    </button>
                    <button
                      type="button"
                      aria-label={t("ui.misc.113")}
                      disabled={strongPotions < 1}
                      onClick={drinkStrongTonic}
                      className="rounded-lg bg-[#5a3a6e] px-3 py-2 font-serif text-sm font-bold text-[#f3e9d2] disabled:opacity-40"
                    >
                      {t("ui.misc.114")}
                    </button>
                  </div>
                </div>
                )}
                {panelTab === "stats" && <LanguagePicker className="mt-3" onPick={(l) => void switchLanguage(l)} />}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}