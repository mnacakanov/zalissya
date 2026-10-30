DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE game_saves (
  id integer PRIMARY KEY NOT NULL,
  player_x real NOT NULL,
  player_y real NOT NULL,
  talked text DEFAULT '[]' NOT NULL,
  herbs integer DEFAULT 0 NOT NULL,
  updated_at integer NOT NULL
);
