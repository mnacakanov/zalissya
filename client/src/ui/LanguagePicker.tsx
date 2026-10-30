import { lang, type Lang, LANG_NAMES, LANGS, t } from "../i18n";

// Language choice: each language is named in itself (Українська, English).
// Picking one hands it to `onPick`; App saves the game and reloads, since
// text is resolved once at startup.
export function LanguagePicker(props: { onPick: (l: Lang) => void; className?: string }) {
  const current = lang();
  return (
    <div className={`flex items-center justify-center gap-1.5 ${props.className ?? ""}`} role="group" aria-label={t("ui.language")}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === current}
          onClick={() => l !== current && props.onPick(l)}
          className={`rounded-lg px-3 py-1.5 font-serif text-xs font-bold ${
            l === current ? "bg-[#7a4a2b] text-[#f3e9d2]" : "bg-[#e2d3ae] text-[#5d4630] active:bg-[#d3c096]"
          }`}
        >
          {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
