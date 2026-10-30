import { t } from "../i18n";
import { knowsSong } from "../systems/songs";
import { type DialogueTopic } from "./topics";

// Who teaches the kobzar which song (see systems/songs.ts). Asking the
// topic teaches it on the spot: the topic's `grant` names the song.
//   Vesna      — the lullaby (kolyskova), for the Domovyk's hut
//   the Chort  — the hopak, in the village or on the mountain
//   Motrya     — the hopak too, on the mountain, for the shy
// (The storm duma comes with the otaman's chalk: dialogue/viyNight.ts.)
export function songTopics(npcId: string, area: string, flags: ReadonlySet<string>): DialogueTopic[] {
  if (npcId === "vesna" && !knowsSong(flags, "kolyskova")) {
    return [{
      id: "song-kolyskova", label: t("song.topic.vesna.label"), question: t("song.topic.vesna.question"),
      grant: "kolyskova", lines: [t("song.topic.vesna.0"), t("song.topic.vesna.1")],
    }];
  }
  if (npcId === "chort" && !knowsSong(flags, "hopak")) {
    return [{
      id: "song-hopak", label: t("song.topic.chort.label"), question: t("song.topic.chort.question"),
      grant: "hopak", lines: [t("song.topic.chort.0"), t("song.topic.chort.1")],
    }];
  }
  if (npcId === "motrya" && area === "lysa" && !knowsSong(flags, "hopak")) {
    return [{
      id: "song-hopak", label: t("song.topic.motrya.label"), question: t("song.topic.motrya.question"),
      grant: "hopak", lines: [t("song.topic.motrya.0")],
    }];
  }
  return [];
}
