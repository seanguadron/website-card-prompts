import { DECK_THEMES, type DeckTheme } from "@/lib/deck-theme";

export function DeckThemePicker({ theme, onSelect }: {
  theme: DeckTheme;
  onSelect: (theme: DeckTheme) => void;
}) {
  return <div className="art-pack-switch" role="group" aria-label="Card art world">
    {DECK_THEMES.map(({ id, name }) => (
      <button key={id} type="button" aria-pressed={theme === id}
        className={theme === id ? "art-pack-switch-option is-active" : "art-pack-switch-option"}
        onClick={() => onSelect(id)}>{name}</button>
    ))}
  </div>;
}
