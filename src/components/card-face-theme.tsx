"use client";

import { createContext, useContext, type ReactNode } from "react";
import { deckBackPath, type DeckTheme, type ThemedDeck } from "@/lib/deck-theme";

const CardFaceArt = createContext<string | undefined>(undefined);

export function CardFaceThemeProvider({ deck, theme, children }: {
  deck: ThemedDeck;
  theme: DeckTheme;
  children: ReactNode;
}) {
  return <CardFaceArt.Provider value={deckBackPath(deck, theme)}>{children}</CardFaceArt.Provider>;
}

export function useCardFaceEmblem() {
  return useContext(CardFaceArt);
}
