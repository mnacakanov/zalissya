// Drizzle schema for this space — a single-row game save for the village game.

import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gameSaves = sqliteTable("game_saves", {
  id: integer("id").primaryKey(),
  playerX: real("player_x").notNull(),
  playerY: real("player_y").notNull(),
  // Which area the player is in: "village" (Zalissya), "lysa" (Lysa Hora),
  // or a hut interior ("hut0" = the Domovyk's NW hut, "hut1" = Vesna's NE hut).
  area: text("area").notNull().default("village"),
  // JSON array of villager ids the player has spoken with.
  talked: text("talked").notNull().default("[]"),
  herbs: integer("herbs").notNull().default(0),
  // JSON array of story/quest flags and counters ("bread", "fish=3", …)
  // for the non-combat village life systems: offerings, fishing, bargains.
  flags: text("flags").notNull().default("[]"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
