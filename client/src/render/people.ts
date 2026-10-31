import { CAM, rr } from "./shapes";

// --- People, storybook style --------------------------------------------------
// The owner chose the "storybook" look for people (variant C of the style
// sheet): figures about five heads tall, painted with soft shading and a
// thin ink outline, each in the costume of who they are. Everyone human is
// drawn here — the kobzar, the khutir, the chumaky, the korchma — from a
// costume picked by style (and, for a few, by who it is). The spirits keep
// their own drawings (render/spirits.ts).
//   kobzar    — embroidered shirt, a brown svytka, sharovary, a straw brryl,
//               the kobza on his back
//   elder     — the otaman: a red zhupan with gold trim, blue sharovary, a
//               sash, the oseledets and grey moustaches, his lyulka
//   chumak    — a tarred svytka, a straw brryl, moustaches
//   smith     — Radek: a leather apron over a grey shirt, a Polish cap
//   herbalist — Vesna: plakhta, a green kersetka, an apron, the vinok
//               with ribbons, a braid
//   shynkarka — Odarka: a married woman's kerchief, a white apron
//   kozak     — Okhrim: a red zhupan, the oseledets, moustaches to the chest
//   vorozhbyt — Did Prokip: a long patched svyta, wild white hair, a beard
//               to the belt, a crooked staff
//   oldkobzar — Omelko: a blind old kobzar, white hair, drooping moustaches,
//               milky eyes

export type FolkStyle = "player" | "elder" | "herbalist" | "smith" | "shynkarka" | "kozak" | "chumak" | "witch" | "warlock" | "vorozhbyt" | "oldkobzar";

export type FolkOpts = {
  tunic: string; hair: string; style: FolkStyle;
  moving: boolean; phase: number; face: number; t: number;
  shadow?: boolean;
  who?: string;
  // "dance": arms up and swinging (the Lysa Hora sabbath)
  // "dance": arms up (the sabbath); "sit": on a bench or a log; "sleep":
  // lying under a blanket; "bathe": in the pond to the chest; "play":
  // seated with the kobza on the knees, playing
  pose?: "dance" | "sit" | "sleep" | "bathe" | "play";
  // (the kobza is in his hands, not on his back)
  kobzaHeld?: boolean;
};

type Costume = {
  kind: "m" | "f";
  skin: string; hair: string;
  shirt: string; emb: string;
  coat?: string; trim?: string; coatLen?: number;
  vest?: string;
  pants?: string; boots: string;
  skirt?: string; skirt2?: string; apron?: string;
  sash?: string; leather?: string;
  kobza?: boolean; hat?: "brryl" | "cap" | "khustka" | "witch" | "kuchma";
  goatee?: boolean;
  beard?: boolean; staff?: boolean;
  loose?: boolean;
  oseledets?: boolean; moust?: string; longMoust?: boolean; pipe?: boolean;
  vinok?: boolean; braid?: boolean;
  blind?: boolean;
};

function costumeFor(o: FolkOpts): Costume {
  switch (o.style) {
    case "player":
      return { kind: "m", skin: "#e8bf96", hair: o.hair, shirt: "#f4ecdc", emb: "#b0302a", coat: "#6e5a44", trim: "#3a2a1c", coatLen: 0.3,
        pants: "#3c4a6a", boots: "#2c2015", sash: "#a8322a", kobza: true, hat: "brryl", moust: o.hair };
    case "elder":
      return { kind: "m", skin: "#e2b48a", hair: o.hair, shirt: "#f4ecdc", emb: "#b0302a", coat: o.tunic, trim: "#d9a441", coatLen: 0.22,
        pants: "#2c4a8a", boots: "#5a2a14", sash: "#d9a441", oseledets: true, moust: "#d8d2c4", pipe: o.who === "myroslav" };
    case "chumak":
      return { kind: "m", skin: "#d8a47a", hair: o.hair, shirt: "#e4dccb", emb: "#5a3a22", coat: o.tunic, trim: "#3a2a1c", coatLen: 0.28,
        pants: "#5a5448", boots: "#2c2015", sash: "#7a4a24", hat: "brryl", moust: o.hair };
    case "smith":
      return { kind: "m", skin: "#e0b088", hair: o.hair, shirt: "#cfc6b4", emb: "#5a5448", pants: o.tunic, boots: "#2c2015",
        leather: "#6e4a2a", hat: "cap", moust: o.hair };
    case "herbalist":
      return { kind: "f", skin: "#ecc39c", hair: o.hair, shirt: "#f6efe0", emb: "#b0302a", vest: "#2c4a3a",
        skirt: o.tunic, skirt2: "#1e1a16", apron: "#3a5a8a", boots: "#7a3a1c", vinok: true, braid: true };
    case "shynkarka":
      return { kind: "f", skin: "#e6b890", hair: o.hair, shirt: "#f4ecdc", emb: "#2c4a8a", vest: "#3a2a2a",
        skirt: o.tunic, skirt2: "#3a1a1a", apron: "#f3ead8", boots: "#4a2a14", hat: "khustka" };
    case "witch":
      // a vidma of Lysa Hora: dark skirt, loose hair, the pointed hat
      return { kind: "f", skin: "#e2b894", hair: o.hair, shirt: "#e8dfcc", emb: "#5a2a5a", vest: "#241f2c",
        skirt: o.tunic, skirt2: "#141018", apron: darken(o.tunic, 0.7), boots: "#241a1c", hat: "witch", loose: true };
    case "warlock":
      // a vidmak: a man like any man, but in a long dark svytka, a tall
      // black sheepskin kuchma with a red top, and a goat's beard
      return { kind: "m", skin: "#d6b08a", hair: o.hair, shirt: "#cfc6b4", emb: "#5a2a5a", coat: o.tunic, trim: "#7a2a5a", coatLen: 0.14,
        pants: "#241f2c", boots: "#1a1418", sash: "#5a2a5a", hat: "kuchma", moust: o.hair, goatee: true };
    case "vorozhbyt":
      // the vorozhbyt: a svyta down to the boots, patched; no hat, because
      // the hair would not fit under one
      return { kind: "m", skin: "#d8ae88", hair: o.hair, shirt: "#e4dccb", emb: "#3a6a3a", coat: o.tunic, trim: "#3a3226", coatLen: 0.08,
        pants: "#4a4438", boots: "#3a2a1c", sash: "#7a3a24", moust: o.hair, beard: true, staff: true };
    case "oldkobzar":
      // blind Omelko: a faded svytka, white hair, long drooping moustaches
      return { kind: "m", skin: "#d4a880", hair: o.hair, shirt: "#e8e0cc", emb: "#8a3a2a", coat: o.tunic, trim: "#5a4a30", coatLen: 0.26,
        pants: "#4a4a58", boots: "#2c2015", sash: "#6a4a2a", kobza: true, moust: o.hair, longMoust: true, blind: true };
    case "kozak":
      return { kind: "m", skin: "#dcae86", hair: o.hair, shirt: "#efe6d4", emb: "#b0302a", coat: o.tunic, trim: "#c9a040", coatLen: 0.24,
        pants: "#2c4a8a", boots: "#4a2a14", sash: "#3a5a8a", oseledets: true, moust: o.hair, longMoust: true };
  }
}

export function darken(hex: string, f: number): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgb(${Math.round((n >> 16) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
}

const H = 50; // height in world px, feet to crown
const HEADS = 5.2;
const INK = "rgba(40,26,14,0.85)";
const INK_W = 0.9;

export function drawFolk(c: CanvasRenderingContext2D, x: number, y: number, o: FolkOpts): void {
  if (o.pose === "sleep") { drawSleeper(c, x, y, o); return; }
  if (o.pose === "sit" || o.pose === "play") {
    // seated: the figure sinks onto the seat, the legs fold forward
    const drop = 11;
    const C = costumeFor(o);
    const hh = H / HEADS;
    const playing = o.pose === "play";
    c.save();
    c.beginPath(); c.rect(x - 60, y - H - 80, 120, H + 80 - H * 0.36 + drop); c.clip();
    drawFolk(c, x, y + drop, { ...o, pose: undefined, moving: false, shadow: false, kobzaHeld: playing });
    c.restore();
    c.fillStyle = "rgba(20,30,10,0.3)";
    c.beginPath(); c.ellipse(x, y + 3, 15, 4, 0, 0, Math.PI * 2); c.fill();
    for (const s of [-1, 1]) {
      const kx = x + s * hh * 0.42;
      const col = C.kind === "f" ? (C.skirt ?? "#7a2a3a") : (C.pants ?? "#3c4a6a");
      c.fillStyle = col;
      c.beginPath(); c.ellipse(kx, y - H * 0.36 + drop + 3, hh * 0.32, hh * 0.3, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = INK_W; c.stroke();
      c.fillStyle = C.boots;
      c.beginPath(); c.ellipse(kx, y, hh * 0.28, hh * 0.18, 0, 0, Math.PI * 2); c.fill();
      c.fillRect(kx - hh * 0.2, y - H * 0.36 + drop + 4, hh * 0.4, Math.max(0, H * 0.36 - drop - 4));
    }
    if (playing) drawKobzaPlayed(c, x, y - H * 0.36 + drop, hh, o.t, o.face);
    return;
  }
  if (o.pose === "bathe") {
    // in the pond to the chest: only what is above the water shows
    const sink = H * 0.5;
    c.save();
    c.beginPath(); c.rect(x - 60, y - H - 80, 120, H + 80 - 2); c.clip();
    drawFolk(c, x, y + sink, { ...o, pose: undefined, moving: false, shadow: false });
    c.restore();
    const r = (o.t * 0.004 + x * 0.01) % 1;
    c.strokeStyle = `rgba(230,244,248,${0.6 * (1 - r)})`; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(x, y, 12 + r * 10, 3.6 + r * 3, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "rgba(230,244,248,0.7)";
    c.beginPath(); c.ellipse(x, y, 11, 3, 0, 0, Math.PI * 2); c.stroke();
    return;
  }
  const C = costumeFor(o);
  const hh = H / HEADS;
  // walking: a bob, legs stepping, arms swinging against them
  const step = o.moving ? Math.sin(o.phase) : 0;
  const bob = o.moving ? Math.abs(step) * 1.4 : Math.sin(o.t * 0.002 + (x + CAM.x) * 0.13) * 0.4;
  const top = y - H - bob;
  const headCy = top + hh * 0.52;
  const neckY = top + hh;
  const shY = neckY + hh * 0.12;
  const waist = y - H * 0.47 - bob;
  const hip = y - H * 0.42 - bob;
  const knee = y - H * 0.2;
  const shW = hh * (C.kind === "f" ? 1.5 : 1.75);
  const hipW = hh * (C.kind === "f" ? 1.45 : 1.25);
  const fx = Math.max(-1, Math.min(1, o.face)) * hh * 0.12; // the face turns
  const paint = (col: string, x0: number, w: number): CanvasGradient | string => {
    if (!col.startsWith("#")) return col;
    const g = c.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, col); g.addColorStop(0.55, col); g.addColorStop(1, darken(col, 0.72));
    return g;
  };
  const ink = () => { c.strokeStyle = INK; c.lineWidth = INK_W; c.stroke(); };
  const limb = (x1: number, y1: number, x2: number, y2: number, w: number, col: string) => {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round";
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  };

  // shadow — unless the Chort has it (the soul bargain)
  if (o.shadow !== false) {
    c.fillStyle = "rgba(20,30,10,0.3)";
    c.beginPath(); c.ellipse(x, y + 1, shW * 0.75, hh * 0.28, 0, 0, Math.PI * 2); c.fill();
  }
  // the kobza on the back
  if (C.kobza && !o.kobzaHeld) {
    c.save(); c.translate(x + shW * 0.25, shY + hh * 0.9); c.rotate(-0.5 + step * 0.05);
    c.fillStyle = paint("#b07a3a", -hh * 0.6, hh * 1.2);
    c.beginPath(); c.ellipse(0, hh * 0.5, hh * 0.62, hh * 0.8, 0, 0, Math.PI * 2); c.fill(); ink();
    c.fillStyle = "#6e4525"; c.fillRect(-hh * 0.09, -hh * 1.5, hh * 0.18, hh * 1.6);
    c.restore();
  }
  // legs: sharovary into boots, or a skirt
  if (C.kind === "m") {
    for (const s of [-1, 1] as const) {
      const lift = o.moving ? Math.max(0, s * step) * 3 : 0;
      const stride = o.moving ? s * step * hh * 0.18 : 0;
      c.fillStyle = paint(C.pants ?? "#3c4a6a", x + s * hipW * 0.5 - hipW * 0.45, hipW * 0.9);
      c.beginPath();
      c.moveTo(x + s * hipW * 0.05, hip);
      c.quadraticCurveTo(x + s * hipW * 0.95 + stride, hip + H * 0.1, x + s * hipW * 0.55 + stride, knee + H * 0.07 - lift);
      c.lineTo(x + s * hipW * 0.15 + stride, knee + H * 0.07 - lift);
      c.closePath(); c.fill(); ink();
      c.fillStyle = paint(C.boots, x + s * hipW * 0.35 - hh * 0.25, hh * 0.5);
      rr(c, x + s * hipW * 0.36 - hh * 0.24 + stride, knee + H * 0.05 - lift, hh * 0.48, y - knee - H * 0.05, hh * 0.12); c.fill(); ink();
      c.fillStyle = darken(C.boots, 0.8);
      c.beginPath(); c.ellipse(x + s * hipW * 0.36 + s * hh * 0.08 + stride, y - hh * 0.05 - lift, hh * 0.3, hh * 0.12, 0, 0, Math.PI * 2); c.fill();
    }
  } else {
    const sway = o.moving ? step * hh * 0.12 : 0;
    const hem = y - hh * 0.35;
    c.fillStyle = paint(C.skirt ?? "#a8322a", x - hipW * 0.7, hipW * 1.4);
    c.beginPath();
    c.moveTo(x - hipW * 0.5, waist); c.lineTo(x + hipW * 0.5, waist);
    c.lineTo(x + hipW * 0.72 + sway, hem); c.lineTo(x - hipW * 0.72 + sway, hem);
    c.closePath(); c.fill(); ink();
    c.strokeStyle = C.skirt2 ?? "#1e1a16"; c.lineWidth = Math.max(1, hh * 0.07);
    for (let i = 1; i < 4; i++) {
      const yy = waist + (hem - waist) * i / 4;
      const sp = 0.5 + 0.22 * i / 4;
      c.beginPath(); c.moveTo(x - hipW * sp + sway * i / 4, yy); c.lineTo(x + hipW * sp + sway * i / 4, yy); c.stroke();
    }
    c.fillStyle = paint(C.apron ?? "#3a5a8a", x - hipW * 0.25, hipW * 0.5);
    c.fillRect(x - hipW * 0.25 + sway * 0.5, waist, hipW * 0.5, hem - hh * 0.05 - waist);
    for (const s of [-1, 1] as const) {
      const lift = o.moving ? Math.max(0, s * step) * 2 : 0;
      c.fillStyle = C.boots;
      rr(c, x + s * hipW * 0.25 - hh * 0.2, y - hh * 0.42 - lift, hh * 0.4, hh * 0.42, hh * 0.1); c.fill();
    }
  }
  // the shirt, with its embroidery at the collar and down the chest
  const shirtBottom = C.kind === "f" ? waist : hip;
  c.fillStyle = paint(C.shirt, x - shW / 2, shW);
  rr(c, x - shW / 2, shY, shW, shirtBottom - shY, hh * 0.3); c.fill(); ink();
  c.fillStyle = C.emb;
  for (let i = 0; i < 4; i++) c.fillRect(x - hh * 0.06, shY + hh * 0.12 + i * hh * 0.2, hh * 0.12, hh * 0.1);
  c.fillRect(x - hh * 0.32, shY + hh * 0.05, hh * 0.64, hh * 0.08);
  // a leather apron for the smith
  if (C.leather) {
    c.fillStyle = paint(C.leather, x - shW * 0.4, shW * 0.8);
    rr(c, x - shW * 0.38, shY + hh * 0.35, shW * 0.76, knee - shY - hh * 0.1, hh * 0.15); c.fill(); ink();
    c.strokeStyle = C.leather; c.lineWidth = hh * 0.08;
    c.beginPath(); c.moveTo(x - shW * 0.3, shY + hh * 0.4); c.lineTo(x - hh * 0.2, neckY); c.moveTo(x + shW * 0.3, shY + hh * 0.4); c.lineTo(x + hh * 0.2, neckY); c.stroke();
  }
  // the coat — svytka or zhupan — open over the shirt
  if (C.coat) {
    const hemY = y - H * (C.coatLen ?? 0.3);
    for (const s of [-1, 1] as const) {
      c.fillStyle = paint(C.coat, x + s * shW * 0.25 - shW * 0.25, shW * 0.5);
      c.beginPath();
      c.moveTo(x + s * hh * 0.18, shY); c.lineTo(x + s * shW * 0.52, shY + hh * 0.1);
      c.lineTo(x + s * shW * 0.6, hemY); c.lineTo(x + s * hh * 0.25, hemY);
      c.closePath(); c.fill(); ink();
      c.strokeStyle = C.trim ?? "#3a2a1c"; c.lineWidth = Math.max(1, hh * 0.06);
      c.beginPath(); c.moveTo(x + s * hh * 0.2, shY + hh * 0.05); c.lineTo(x + s * hh * 0.26, hemY - 0.5); c.stroke();
    }
  }
  // the kersetka (sleeveless vest) for the women
  if (C.vest) {
    for (const s of [-1, 1] as const) {
      c.fillStyle = paint(C.vest, x + s * shW * 0.25 - shW * 0.25, shW * 0.5);
      c.beginPath();
      c.moveTo(x + s * hh * 0.2, shY + hh * 0.15); c.lineTo(x + s * shW * 0.48, shY + hh * 0.08);
      c.lineTo(x + s * shW * 0.42, waist); c.lineTo(x + s * hh * 0.12, waist);
      c.closePath(); c.fill(); ink();
    }
  }
  // the sash, its end hanging at the hip
  if (C.sash) {
    c.fillStyle = paint(C.sash, x - shW * 0.55, shW * 1.1);
    rr(c, x - shW * 0.55, hip - hh * 0.32, shW * 1.1, hh * 0.3, hh * 0.1); c.fill(); ink();
    c.fillRect(x + shW * 0.3, hip - hh * 0.1, hh * 0.16, hh * 0.6 + (o.moving ? step * 1.5 : 0));
  }
  // arms swinging against the stride, and the hands
  const armCol = C.coat ?? C.shirt;
  for (const s of [-1, 1] as const) {
    const swing = o.moving ? -s * step * hh * 0.35 : 0;
    const ax = x + s * shW * 0.5;
    const ay = shY + hh * 0.15;
    const up = o.pose === "dance";
    const wave = Math.sin(o.t * 0.006 + (x + CAM.x) + s) * hh * 0.25;
    const hx = up ? x + s * shW * 0.95 + wave * 0.5 : x + s * shW * 0.62 + swing * 0.4;
    const hy = up ? top + hh * 0.2 + wave : hip - hh * 0.1 - Math.abs(swing) * 0.3;
    limb(ax, ay, hx, hy, hh * 0.36, s > 0 ? darken(armCol, 0.82) : armCol);
    c.fillStyle = C.skin;
    c.beginPath(); c.arc(hx, hy + hh * 0.12, hh * 0.17, 0, Math.PI * 2); c.fill(); ink();
  }
  // the neck and the head
  c.fillStyle = C.skin;
  c.fillRect(x - hh * 0.14, neckY - hh * 0.08, hh * 0.28, hh * 0.22);
  c.fillStyle = paint(C.skin, x - hh * 0.42, hh * 0.84);
  c.beginPath(); c.ellipse(x, headCy, hh * 0.4, hh * 0.5, 0, 0, Math.PI * 2); c.fill(); ink();
  c.fillStyle = darken(C.skin, 0.9);
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.ellipse(x + s * hh * 0.4, headCy + hh * 0.05, hh * 0.07, hh * 0.12, 0, 0, Math.PI * 2); c.fill();
  }
  // hair and what is worn on the head
  if (C.oseledets) {
    c.fillStyle = darken(C.skin, 0.95);
    c.beginPath(); c.ellipse(x, headCy - hh * 0.2, hh * 0.38, hh * 0.3, 0, Math.PI, 0); c.fill();
    c.strokeStyle = C.hair; c.lineWidth = hh * 0.12;
    c.beginPath(); c.moveTo(x, headCy - hh * 0.48);
    c.quadraticCurveTo(x - hh * 0.55, headCy - hh * 0.7, x - hh * 0.45, headCy + hh * 0.1); c.stroke();
  } else if (C.hat === "khustka") {
    c.fillStyle = paint("#2c4a8a", x - hh * 0.5, hh);
    c.beginPath(); c.ellipse(x, headCy - hh * 0.12, hh * 0.5, hh * 0.48, 0, Math.PI, 0); c.fill(); ink();
    c.fillRect(x - hh * 0.5, headCy - hh * 0.14, hh * 0.12, hh * 0.45);
    c.fillRect(x + hh * 0.38, headCy - hh * 0.14, hh * 0.12, hh * 0.45);
    c.fillStyle = "#e8b84a";
    for (let i = 0; i < 4; i++) c.fillRect(x - hh * 0.3 + i * hh * 0.18, headCy - hh * 0.4, hh * 0.08, hh * 0.08);
  } else if (C.kind === "m") {
    c.fillStyle = C.hair;
    c.beginPath(); c.ellipse(x, headCy - hh * 0.22, hh * 0.42, hh * 0.32, 0, Math.PI, 0); c.fill();
    c.fillRect(x - hh * 0.42, headCy - hh * 0.24, hh * 0.84, hh * 0.14);
  } else {
    c.fillStyle = C.hair;
    c.beginPath(); c.ellipse(x, headCy - hh * 0.12, hh * 0.44, hh * 0.42, 0, Math.PI, 0); c.fill();
    c.fillRect(x - hh * 0.44, headCy - hh * 0.14, hh * 0.1, hh * 0.5);
    c.fillRect(x + hh * 0.34, headCy - hh * 0.14, hh * 0.1, hh * 0.5);
    if (C.loose) {
      c.fillRect(x - hh * 0.5, headCy - hh * 0.1, hh * 0.16, hh * 1.3);
      c.fillRect(x + hh * 0.34, headCy - hh * 0.1, hh * 0.16, hh * 1.3);
    }
    if (C.braid) for (let i = 0; i < 5; i++) {
      c.beginPath(); c.ellipse(x + hh * 0.42, headCy + hh * 0.4 + i * hh * 0.28, hh * 0.1, hh * 0.16, 0.2, 0, Math.PI * 2); c.fill();
    }
  }
  if (C.hat === "brryl") {
    c.fillStyle = paint("#d8b860", x - hh * 0.75, hh * 1.5);
    c.beginPath(); c.ellipse(x, headCy - hh * 0.3, hh * 0.78, hh * 0.2, 0, 0, Math.PI * 2); c.fill(); ink();
    c.fillStyle = paint("#e4c878", x - hh * 0.35, hh * 0.7);
    rr(c, x - hh * 0.34, headCy - hh * 0.72, hh * 0.68, hh * 0.42, hh * 0.12); c.fill(); ink();
    c.fillStyle = "#a8322a";
    c.fillRect(x - hh * 0.34, headCy - hh * 0.42, hh * 0.68, hh * 0.08);
  } else if (C.hat === "cap") {
    // Radek's cap from home, the peak pulled low
    c.fillStyle = paint("#3a3a44", x - hh * 0.45, hh * 0.9);
    rr(c, x - hh * 0.44, headCy - hh * 0.62, hh * 0.88, hh * 0.36, hh * 0.1); c.fill(); ink();
    c.fillStyle = "#24242a";
    c.beginPath(); c.ellipse(x + fx * 2, headCy - hh * 0.26, hh * 0.36, hh * 0.08, 0, 0, Math.PI * 2); c.fill();
  }
  if (C.hat === "kuchma") {
    // the tall black sheepskin hat, its red cloth top flopped to one side
    c.fillStyle = paint("#2a2428", x - hh * 0.46, hh * 0.92);
    rr(c, x - hh * 0.46, headCy - hh * 1.25, hh * 0.92, hh * 0.92, hh * 0.22); c.fill(); ink();
    c.fillStyle = "rgba(90,80,86,0.6)";
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x - hh * 0.3 + (i % 3) * hh * 0.3, headCy - hh * (1.05 - Math.floor(i / 3) * 0.32), hh * 0.08, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = "#9a2430";
    c.beginPath(); c.moveTo(x - hh * 0.3, headCy - hh * 1.22); c.quadraticCurveTo(x + hh * 0.2, headCy - hh * 1.5, x + hh * 0.6, headCy - hh * 1.0); c.lineTo(x + hh * 0.3, headCy - hh * 1.2); c.closePath(); c.fill(); ink();
  }
  if (C.hat === "witch") {
    // the honest silhouette of a vidma: a broad brim and a crooked point
    c.fillStyle = paint("#241f2c", x - hh * 0.9, hh * 1.8);
    c.beginPath(); c.ellipse(x, headCy - hh * 0.36, hh * 0.9, hh * 0.2, 0, 0, Math.PI * 2); c.fill(); ink();
    c.beginPath();
    c.moveTo(x - hh * 0.4, headCy - hh * 0.4);
    c.quadraticCurveTo(x + hh * 0.1, headCy - hh * 1.5, x + hh * 0.7, headCy - hh * 1.8);
    c.quadraticCurveTo(x + hh * 0.2, headCy - hh * 1.0, x + hh * 0.42, headCy - hh * 0.4);
    c.closePath(); c.fill(); ink();
    c.fillStyle = "#7a2a5a";
    c.fillRect(x - hh * 0.4, headCy - hh * 0.52, hh * 0.82, hh * 0.1);
  }
  if (C.vinok) {
    const cols = ["#d94f3d", "#f2c14e", "#f5efdc", "#4a7ad0", "#d96a5a", "#f2c14e", "#d94f3d"];
    cols.forEach((col, i) => {
      c.fillStyle = col;
      c.beginPath(); c.arc(x - hh * 0.42 + i * hh * 0.14, headCy - hh * 0.42 - Math.sin(i / 6 * Math.PI) * hh * 0.12, hh * 0.11, 0, Math.PI * 2); c.fill();
    });
    const flutter = Math.sin(o.t * 0.004) * hh * 0.08 + (o.moving ? step * hh * 0.1 : 0);
    ["#d94f3d", "#4a7ad0", "#f2c14e"].forEach((col, i) => {
      c.strokeStyle = col; c.lineWidth = hh * 0.06;
      c.beginPath(); c.moveTo(x - hh * 0.35 + i * hh * 0.05, headCy - hh * 0.3);
      c.quadraticCurveTo(x - hh * 0.6 + flutter, headCy + hh * 0.5, x - hh * 0.5 + i * hh * 0.08 + flutter * 1.5, headCy + hh * (1.2 + i * 0.15));
      c.stroke();
    });
  }
  // the face: eyes, brows, nose — turned a little toward where they look
  c.fillStyle = "#2e2018";
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.ellipse(x + s * hh * 0.15 + fx, headCy + hh * 0.02, hh * 0.05, hh * 0.065, 0, 0, Math.PI * 2); c.fill();
  }
  if (C.blind) {
    // milky, unseeing eyes
    c.fillStyle = "#d8d6d0";
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.ellipse(x + s * hh * 0.15 + fx, headCy + hh * 0.02, hh * 0.075, hh * 0.085, 0, 0, Math.PI * 2); c.fill();
    }
  }
  c.strokeStyle = darken(C.hair, 0.9); c.lineWidth = hh * 0.04;
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(x + s * hh * 0.07 + fx, headCy - hh * 0.1); c.lineTo(x + s * hh * 0.24 + fx, headCy - hh * 0.12); c.stroke();
  }
  c.fillStyle = darken(C.skin, 0.82);
  c.beginPath(); c.ellipse(x + fx * 1.3, headCy + hh * 0.14, hh * 0.05, hh * 0.09, 0, 0, Math.PI * 2); c.fill();
  if (C.kind === "f") {
    c.fillStyle = "#c05a50";
    c.beginPath(); c.ellipse(x + fx, headCy + hh * 0.3, hh * 0.08, hh * 0.035, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(220,110,100,0.35)";
    for (const s of [-1, 1] as const) { c.beginPath(); c.arc(x + s * hh * 0.24 + fx, headCy + hh * 0.2, hh * 0.08, 0, Math.PI * 2); c.fill(); }
  }
  if (C.moust) {
    c.fillStyle = C.moust;
    const drop = C.longMoust ? 0.85 : C.oseledets ? 0.6 : 0.4;
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(x + fx, headCy + hh * 0.24);
      c.quadraticCurveTo(x + s * hh * 0.3 + fx, headCy + hh * 0.2, x + s * hh * 0.34 + fx, headCy + hh * drop);
      c.quadraticCurveTo(x + s * hh * 0.18 + fx, headCy + hh * 0.36, x + fx, headCy + hh * 0.3); c.fill();
    }
  }
  if (C.goatee) {
    c.fillStyle = C.hair;
    c.beginPath(); c.moveTo(x - hh * 0.1 + fx, headCy + hh * 0.36); c.lineTo(x + hh * 0.1 + fx, headCy + hh * 0.36); c.lineTo(x + fx, headCy + hh * 0.8); c.closePath(); c.fill();
  }
  // a beard to the belt, never combed (Vesna's opinion: "crooked")
  if (C.beard) {
    const sway = Math.sin(o.t * 0.0017 + (x + CAM.x) * 0.05) * hh * 0.04;
    c.fillStyle = paint(C.hair, x - hh * 0.4, hh * 0.8);
    c.beginPath();
    c.moveTo(x - hh * 0.36 + fx, headCy + hh * 0.18);
    c.quadraticCurveTo(x - hh * 0.46 + fx, headCy + hh * 0.9, x - hh * 0.12 + fx + sway, headCy + hh * 1.7);
    c.lineTo(x + hh * 0.06 + fx + sway, headCy + hh * 1.56);
    c.lineTo(x + hh * 0.16 + fx + sway, headCy + hh * 1.74);
    c.quadraticCurveTo(x + hh * 0.48 + fx, headCy + hh * 0.9, x + hh * 0.36 + fx, headCy + hh * 0.18);
    c.quadraticCurveTo(x + fx, headCy + hh * 0.36, x - hh * 0.36 + fx, headCy + hh * 0.18);
    c.closePath(); c.fill(); ink();
    c.strokeStyle = "rgba(160,150,136,0.5)"; c.lineWidth = hh * 0.03;
    for (const k of [-0.18, 0, 0.18]) { c.beginPath(); c.moveTo(x + hh * k + fx, headCy + hh * 0.5); c.lineTo(x + hh * k * 0.6 + fx + sway, headCy + hh * 1.4); c.stroke(); }
    // and the wild hair standing out round the head
    c.fillStyle = C.hair;
    for (const s2 of [-1, 1] as const) {
      c.beginPath(); c.ellipse(x + s2 * hh * 0.46, headCy - hh * 0.06, hh * 0.16, hh * 0.3, s2 * 0.3, 0, Math.PI * 2); c.fill();
    }
  }
  // a crooked staff of blackthorn, taller than he is
  if (C.staff) {
    const sx = x + hh * 0.78;
    c.strokeStyle = INK; c.lineWidth = hh * 0.16; c.lineCap = "round";
    c.beginPath(); c.moveTo(sx, y); c.quadraticCurveTo(sx + hh * 0.2, top + hh * 2, sx - hh * 0.05, top - hh * 0.2); c.stroke();
    c.strokeStyle = "#5a3e26"; c.lineWidth = hh * 0.11;
    c.beginPath(); c.moveTo(sx, y); c.quadraticCurveTo(sx + hh * 0.2, top + hh * 2, sx - hh * 0.05, top - hh * 0.2); c.stroke();
    c.lineCap = "butt";
    c.fillStyle = "#4a3220";
    c.beginPath(); c.arc(sx - hh * 0.05, top - hh * 0.26, hh * 0.14, 0, Math.PI * 2); c.fill(); ink();
  }
  // the otaman's lyulka, smoking
  if (C.pipe) {
    c.strokeStyle = "#5a3a22"; c.lineWidth = hh * 0.08;
    c.beginPath(); c.moveTo(x + hh * 0.12 + fx, headCy + hh * 0.3); c.lineTo(x + hh * 0.62, headCy + hh * 0.55); c.stroke();
    c.fillStyle = "#3a2a1c";
    rr(c, x + hh * 0.56, headCy + hh * 0.38, hh * 0.16, hh * 0.22, hh * 0.04); c.fill();
    for (let i = 0; i < 3; i++) {
      const ph = (o.t * 0.0006 + i / 3) % 1;
      c.fillStyle = `rgba(235,232,226,${0.5 * (1 - ph)})`;
      c.beginPath(); c.arc(x + hh * 0.64 + Math.sin(ph * 5 + i) * 2, headCy + hh * 0.3 - ph * hh * 1.6, hh * (0.08 + ph * 0.18), 0, Math.PI * 2); c.fill();
    }
  }
}

// Asleep: lying on the bed or bench under a blanket, the head on a pillow,
// breathing slow.
function drawSleeper(c: CanvasRenderingContext2D, x: number, y: number, o: FolkOpts): void {
  const C = costumeFor(o);
  const br = Math.sin(o.t * 0.0018 + x * 0.1) * 0.8;
  // the pillow and the head, toward the left
  c.fillStyle = "#f4efe2";
  c.beginPath(); c.ellipse(x - 16, y - 4, 7, 4.6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = INK_W; c.stroke();
  c.fillStyle = C.skin;
  c.beginPath(); c.ellipse(x - 14, y - 6, 4.4, 4.8, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = C.hat === "khustka" ? "#2c4a8a" : C.hair;
  c.beginPath(); c.ellipse(x - 16.4, y - 7, 4, 4.4, 0, Math.PI * 0.5, Math.PI * 1.6); c.fill();
  if (C.moust) { c.fillStyle = C.moust; c.fillRect(x - 12, y - 4.4, 3.6, 1.4); }
  c.strokeStyle = "#2e2018"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(x - 13, y - 6.6); c.lineTo(x - 11, y - 6.6); c.stroke(); // eyes shut
  // the blanket over the body, rising with the breath
  const g = c.createLinearGradient(x - 10, 0, x + 18, 0);
  const col = o.style === "player" ? "#8a3a2e" : (C.coat ?? C.skirt ?? o.tunic);
  g.addColorStop(0, col); g.addColorStop(1, darken(col, 0.7));
  c.fillStyle = g;
  c.beginPath(); c.ellipse(x + 4, y - 4 - br * 0.5, 15, 5.6 + br * 0.3, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = INK_W; c.stroke();
  c.fillStyle = C.boots;
  c.beginPath(); c.ellipse(x + 19, y - 4, 2.6, 2.2, 0, 0, Math.PI * 2); c.fill();
}

// The kobza played on the knees: the round body across the lap, the neck
// up and to the side, the strings catching the light, the right hand
// strumming over them; and the tune rising in little notes that drift up
// and fade (their phase from the world position, so they never slide).
function drawKobzaPlayed(c: CanvasRenderingContext2D, x: number, lapY: number, hh: number, t: number, face: number): void {
  const s = face < 0 ? -1 : 1;
  const bx = x + s * hh * 0.15;
  const by = lapY + hh * 0.1;
  // the neck, up toward the left hand
  c.save();
  c.translate(bx, by); c.rotate(s * -0.9);
  c.fillStyle = "#6e4525";
  c.fillRect(-hh * 0.1, -hh * 2.1, hh * 0.2, hh * 1.9);
  c.fillStyle = "#4a2e18";
  c.fillRect(-hh * 0.16, -hh * 2.3, hh * 0.32, hh * 0.3); // the head with its pegs
  c.restore();
  // the body: a round, deep bowl of pale wood
  const g = c.createLinearGradient(bx - hh * 0.8, 0, bx + hh * 0.8, 0);
  g.addColorStop(0, "#d09a52"); g.addColorStop(1, "#8a5a2a");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(bx, by, hh * 0.85, hh * 0.62, s * -0.35, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = INK_W; c.stroke();
  c.fillStyle = "#3a2414";
  c.beginPath(); c.arc(bx - s * hh * 0.1, by - hh * 0.05, hh * 0.17, 0, Math.PI * 2); c.fill(); // the rose
  // strings
  c.strokeStyle = "rgba(250,236,200,0.85)"; c.lineWidth = 0.5;
  for (let k = -1; k <= 1; k++) {
    c.beginPath(); c.moveTo(bx + s * hh * 0.4, by + hh * 0.2 + k * 1.2); c.lineTo(bx - s * hh * 1.5, by - hh * 1.2 + k * 1.2); c.stroke();
  }
  // the strumming hand
  const strum = Math.sin(t * 0.02 + x) * hh * 0.18;
  c.fillStyle = "#e8bf96";
  c.beginPath(); c.ellipse(bx + s * hh * 0.25, by + strum * 0.4, hh * 0.2, hh * 0.15, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = INK_W * 0.8; c.stroke();
  // the tune: three notes drifting up and fading
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.0005 + i / 3 + x * 0.003) % 1;
    const nx = x + s * (hh * 0.8 + ph * hh * 2.2) + Math.sin(ph * 6 + i) * hh * 0.3;
    const ny = lapY - H * 0.55 - ph * H * 0.8;
    c.globalAlpha = Math.sin(ph * Math.PI) * 0.85;
    c.fillStyle = "#3a2414"; c.strokeStyle = "#3a2414"; c.lineWidth = 1;
    c.beginPath(); c.ellipse(nx, ny, 2.4, 1.8, -0.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(nx + 2.1, ny - 0.5); c.lineTo(nx + 2.1, ny - 8); c.lineTo(nx + 5, ny - 6); c.stroke();
    c.globalAlpha = 1;
  }
}
