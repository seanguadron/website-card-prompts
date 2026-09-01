"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useLocalDraft } from "@/hooks/use-local-draft";
import {
  createSoundCardSystem,
  restoreSoundCardSystem,
  restoreSoundDraft,
} from "@/lib/sound-deck-state";
import type { SoundCardSystemState, SoundDraft } from "@/lib/sound-types";

const DRAFT_STORAGE_KEY = "digitools.sound-deck.draft-v1";
const CARD_STORAGE_KEY = "digitools.sound-deck.cards-v1";
const SAVED_AT_STORAGE_KEY = "digitools.sound-deck.saved-at-v1";

type DeckSnapshot = {
  draft: SoundDraft;
  cardSystem: SoundCardSystemState;
};

// Thin adapter over the shared useLocalDraft lifecycle, mirroring the other
// decks: restore validation stays here (restoreSoundDraft /
// restoreSoundCardSystem shape-check the stored JSON); corrupt data clears
// the keys and degrades to defaults.
export function useSoundDeckPersistence({
  draft,
  cardSystem,
  setDraft,
  setCardSystem,
}: {
  draft: SoundDraft;
  cardSystem: SoundCardSystemState;
  setDraft: Dispatch<SetStateAction<SoundDraft>>;
  setCardSystem: Dispatch<SetStateAction<SoundCardSystemState>>;
}) {
  const restore = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        setDraft(restoreSoundDraft(savedDraft));
      }

      const savedCardSystem = localStorage.getItem(CARD_STORAGE_KEY);
      setCardSystem(
        savedCardSystem
          ? restoreSoundCardSystem(savedCardSystem)
          : createSoundCardSystem(),
      );
      const savedAt = localStorage.getItem(SAVED_AT_STORAGE_KEY);
      return {
        status: "saved" as const,
        savedAt: savedAt ? new Date(savedAt) : null,
      };
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(CARD_STORAGE_KEY);
      localStorage.removeItem(SAVED_AT_STORAGE_KEY);
      return { status: "unavailable" as const };
    }
  }, [setCardSystem, setDraft]);

  const save = useCallback((snapshot: DeckSnapshot, savedAt: Date) => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(snapshot.draft));
    localStorage.setItem(
      CARD_STORAGE_KEY,
      JSON.stringify(snapshot.cardSystem),
    );
    localStorage.setItem(SAVED_AT_STORAGE_KEY, savedAt.toISOString());
    return "saved" as const;
  }, []);

  const value = useMemo(() => ({ draft, cardSystem }), [cardSystem, draft]);

  return useLocalDraft({ value, restore, save });
}
