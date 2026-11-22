"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { restoreDeckSnapshot } from "@/lib/restore-deck-snapshot";
import { useLocalDraft } from "@/hooks/use-local-draft";
import {
  createPictureCardSystem,
  restorePictureCardSystem,
  restorePictureDraft,
} from "@/lib/picture-deck-state";
import type {
  PictureCardSystemState,
  PictureDraft,
} from "@/lib/picture-types";

const DRAFT_STORAGE_KEY = "digitools.picture-deck.draft-v1";
const CARD_STORAGE_KEY = "digitools.picture-deck.cards-v1";
const SAVED_AT_STORAGE_KEY = "digitools.picture-deck.saved-at-v1";

type DeckSnapshot = {
  draft: PictureDraft;
  cardSystem: PictureCardSystemState;
};

export function usePictureDeckPersistence({
  draft,
  cardSystem,
  setDraft,
  setCardSystem,
}: {
  draft: PictureDraft;
  cardSystem: PictureCardSystemState;
  setDraft: Dispatch<SetStateAction<PictureDraft>>;
  setCardSystem: Dispatch<SetStateAction<PictureCardSystemState>>;
}) {
  const restore = useCallback(() => {
    const snapshot = restoreDeckSnapshot(
      localStorage.getItem(DRAFT_STORAGE_KEY),
      localStorage.getItem(CARD_STORAGE_KEY),
      localStorage.getItem(SAVED_AT_STORAGE_KEY),
      {
        draft: restorePictureDraft,
        cards: (raw) => raw ? restorePictureCardSystem(raw) : createPictureCardSystem(),
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
