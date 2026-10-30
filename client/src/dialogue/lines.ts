import { type Npc } from "../data/characters";
import { flagCount, flagHas } from "../systems/flags";
import { t } from "../i18n";

// Dialogue scripts are chosen when a conversation opens, from the world
// state at that moment (herbs gathered, flags, fish) — so a script can
// branch on what the player has done: the Domovyk before and after his
// crust of bread, Radek before and after the bog iron, the Chort before
// and after you sign away your soul.
export function linesFor(npc: Npc, herbs: number, flags: ReadonlySet<string>, fish: number, price = 3, intTotal = 1): string[] {
  switch (npc.id) {
    case "myroslav":
      return [
        t("line.myroslav.0"),
        t("line.myroslav.1"),
        t("line.myroslav.2"),
        t("line.myroslav.3"),
        t("line.myroslav.4"),
        t("line.myroslav.5"),
        t("line.myroslav.6"),
        t("line.myroslav.7"),
        t("line.myroslav.8"),
      ];
    case "vesna":
      return herbs >= 5
        ? [
            t("line.vesna.0"),
            t("line.vesna.1"),
            t("line.vesna.2"),
            ...(intTotal >= 3
              ? [t("line.vesna.3")]
              : [t("line.vesna.4", { intTotal })]),
            ...(fish > 0
              ? [t("line.vesna.5")]
              : [t("line.vesna.6")]),
          ]
        : [
            t("line.vesna.7"),
            t("line.vesna.8"),
            t("line.vesna.9"),
            t("line.vesna.10"),
          ];
    case "radek": {
      const iron = flagCount(flags, "iron");
      if (flagHas(flags, "horseshoe")) {
        return [
          t("line.radek.0"),
          t("line.radek.1"),
          t("line.radek.2"),
        ];
      }
      if (iron >= 3) {
        return [
          t("line.radek.3"),
          t("line.radek.4"),
          t("line.radek.5"),
        ];
      }
      return [
        t("line.radek.6"),
        t("line.radek.7"),
        ...(iron > 0
          ? [t("line.radek.8", { n: 3 - iron })]
          : [t("line.radek.9")]),
        t("line.radek.10"),
        t("line.radek.11"),
      ];
    }
    case "domovyk":
      if (flagHas(flags, "stone")) {
        return [
          t("line.domovyk.0"),
          t("line.domovyk.1"),
          t("line.domovyk.2"),
        ];
      }
      if (flagHas(flags, "offering")) {
        return [
          t("line.domovyk.3"),
          t("line.domovyk.4"),
        ];
      }
      return [
        t("line.domovyk.5"),
        t("line.domovyk.6"),
        t("line.domovyk.7"),
        t("line.domovyk.8"),
        t("line.domovyk.9"),
      ];
    case "lisovyk":
      return [
        t("line.lisovyk.0"),
        t("line.lisovyk.1"),
        t("line.lisovyk.2"),
        t("line.lisovyk.3"),
      ];
    case "chort": {
      if (flagHas(flags, "soulback")) {
        return [
          t("line.chort.0"),
          t("line.chort.1"),
          t("line.chort.2"),
        ];
      }
      if (flagHas(flags, "soulsold")) {
        return [
          t("line.chort.3"),
          t("line.chort.4"),
          ...(fish >= price
            ? [t(price === 2 ? "line.chort.5" : "line.chort.5b")]
            : [t("line.chort.6", { price, n: price === 2 ? t("line.chort.7") : "" })]),
        ];
      }
      return [
        t("line.chort.8"),
        t("line.chort.9"),
        t("line.chort.10"),
      ];
    }
    case "bolotianyk":
      return [
        t("line.bolotianyk.0"),
        t("line.bolotianyk.1"),
        t("line.bolotianyk.2"),
        ...(fish > 0
          ? [t("line.bolotianyk.3")]
          : []),
        t("line.bolotianyk.4"),
      ];
    case "viy":
      return [
        t("line.viy.0"),
        t("line.viy.1"),
        t("line.viy.2"),
        t("line.viy.3"),
      ];
    default:
      return ["…"];
  }
}

// Lysa Hora scripts — chosen the same way as village ones, from the state
// of the sabbath chain: nichnyky gathered (counter "lysaFlower"), the
// offering laid ("lysaOffering"), the dance danced ("lysaDanced"), and
// the blessing received ("moonstone").
export function linesForLysa(npc: Npc, flags: ReadonlySet<string>): string[] {
  const flowers = flagCount(flags, "lysaFlower");
  const offered = flagHas(flags, "lysaOffering");
  const danced = flagHas(flags, "lysaDanced");
  const blessed = flagHas(flags, "moonstone");
  switch (npc.id) {
    case "beelzebub":
      if (blessed) {
        return [
          t("line.beelzebub.0"),
          t("line.beelzebub.1"),
        ];
      }
      if (danced) {
        return [
          t("line.beelzebub.2"),
          t("line.beelzebub.3"),
          t("line.beelzebub.4"),
        ];
      }
      if (offered) {
        return [
          t("line.beelzebub.5"),
          t("line.beelzebub.6"),
        ];
      }
      return [
        t("line.beelzebub.7"),
        t("line.beelzebub.8"),
        t("line.beelzebub.9"),
      ];
    case "chort":
      if (blessed) {
        return [
          t("line.chort.11"),
          t("line.chort.12"),
        ];
      }
      if (danced) {
        return [
          t("line.chort.13"),
        ];
      }
      if (offered) {
        return [
          t("line.chort.14"),
        ];
      }
      if (flowers >= 3) {
        return [
          t("line.chort.15"),
        ];
      }
      return [
        t("line.chort.16"),
        t("line.chort.17"),
        t("line.chort.18"),
      ];
    case "solokha":
      if (blessed) {
        return [
          t("line.solokha.0"),
          t("line.solokha.1"),
        ];
      }
      if (danced) {
        return [
          t("line.solokha.2"),
        ];
      }
      if (offered) {
        return [
          t("line.solokha.3"),
        ];
      }
      if (flowers >= 3) {
        return [
          t("line.solokha.4"),
        ];
      }
      return [
        t("line.solokha.5"),
        t("line.solokha.6"),
        t("line.solokha.7"),
      ];
    case "motrya":
      if (blessed) {
        return [
          t("line.motrya.0"),
        ];
      }
      if (danced) {
        return [
          t("line.motrya.1"),
        ];
      }
      if (offered) {
        return [
          t("line.motrya.2"),
        ];
      }
      return [
        t("line.motrya.3"),
        t("line.motrya.4"),
        ...(flowers > 0 && flowers < 3 ? [t("line.motrya.5", { flowers, n: 3 - flowers })] : []),
      ];
    default:
      return ["…"];
  }
}