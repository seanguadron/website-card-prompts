import type { CSSProperties } from "react";

export const DECK_THEMES = [
  { id: "sci-fi", name: "Sci-Fi" },
  { id: "fantasy", name: "Fantasy" },
  { id: "superhero", name: "Superhero" },
] as const;

export type DeckTheme = typeof DECK_THEMES[number]["id"];
export type ThemedDeck = "craft" | "picture" | "sonic";

export function isDeckTheme(value: unknown): value is DeckTheme {
  return DECK_THEMES.some(({ id }) => id === value);
}

export function deckBackPath(deck: ThemedDeck, theme: DeckTheme) {
  return `/card-backs/${deck}-${theme}.webp`;
}

export function deckThemeAttributes(deck: ThemedDeck, theme: DeckTheme) {
  return {
    "data-deck-theme": theme,
    style: { "--card-back": `url("${deckBackPath(deck, theme)}")` } as CSSProperties,
  };
}
