"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { restoreDeckSnapshot } from "@/lib/restore-deck-snapshot";
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
    const snapshot = restoreDeckSnapshot(
      localStorage.getItem(DRAFT_STORAGE_KEY),
      localStorage.getItem(CARD_STORAGE_KEY),
      localStorage.getItem(SAVED_AT_STORAGE_KEY),
      {
        draft: restoreSoundDraft,
        cards: (raw) => raw ? restoreSoundCardSystem(raw) : createSoundCardSystem(),
      },
    );
    if (snapshot.draft) {
      setDraft(snapshot.draft);
    }
    setCardSystem(snapshot.cardSystem);
    return { status: "saved" as const, savedAt: snapshot.savedAt };
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
