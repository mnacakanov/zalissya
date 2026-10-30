// Actions for the Slavic Village Game: one durable save slot (position,
// villagers met, herbs gathered) so progress survives between sessions.

import { defineAction, z, type ActionsModule } from "@hatch/space-sdk";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const SAVE_ID = 1;

const areaEnum = z.enum(["village", "lysa", "hut0", "hut1"]);

const saveShape = z.object({
  exists: z.boolean(),
  x: z.number(),
  y: z.number(),
  // Current area — optional in the shape for backward compatibility with
  // saves written before Lysa Hora existed (they read back as "village").
  area: areaEnum,
  talked: z.array(z.string()),
  herbs: z.number(),
  flags: z.array(z.string()),
});

type SaveShape = z.infer<typeof saveShape>;

function parseStringArray(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export const Actions = {
  getSave: defineAction({
    request: z.object({}),
    response: saveShape,
    async handler(ctx): Promise<SaveShape> {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.gameSaves)
        .where(eq(schema.gameSaves.id, SAVE_ID))
        .limit(1);
      const row = rows[0];
      if (!row) {
        return { exists: false, x: 800, y: 700, area: "village" as const, talked: [], herbs: 0, flags: [] };
      }
      return {
        exists: true,
        x: row.playerX,
        y: row.playerY,
        area: row.area === "lysa" ? ("lysa" as const) : row.area === "hut0" ? ("hut0" as const) : row.area === "hut1" ? ("hut1" as const) : ("village" as const),
        talked: parseStringArray(row.talked),
        herbs: row.herbs,
        flags: parseStringArray(row.flags),
      };
    },
  }),

  saveProgress: defineAction({
    request: z.object({
      x: z.number(),
      y: z.number(),
      // Optional so older callers (and any in-flight client) keep working;
      // omitted means the village.
      area: areaEnum.optional(),
      talked: z.array(z.string()).max(80),
      herbs: z.number().int().min(0).max(100000),
      flags: z.array(z.string()).max(250),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const values = {
        id: SAVE_ID,
        playerX: args.x,
        playerY: args.y,
        area: args.area ?? "village",
        talked: JSON.stringify(args.talked),
        herbs: args.herbs,
        flags: JSON.stringify(args.flags),
        updatedAt: new Date(),
      };
      await db
        .insert(schema.gameSaves)
        .values(values)
        .onConflictDoUpdate({
          target: schema.gameSaves.id,
          set: {
            playerX: values.playerX,
            playerY: values.playerY,
            area: values.area,
            talked: values.talked,
            herbs: values.herbs,
            flags: values.flags,
            updatedAt: values.updatedAt,
          },
        });
      return { ok: true as const };
    },
  }),

  resetSave: defineAction({
    request: z.object({}),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.gameSaves).where(eq(schema.gameSaves.id, SAVE_ID));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),
} satisfies ActionsModule;
