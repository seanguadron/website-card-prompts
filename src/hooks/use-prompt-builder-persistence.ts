"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { restoreDeckSnapshot } from "@/lib/restore-deck-snapshot";
import { useLocalDraft } from "@/hooks/use-local-draft";
import {
  createCardSystem,
  EMPTY_DRAFT,
  restoreCardSystem,
  restoreDraft,
} from "@/lib/prompt-builder-state";
import type {
  CardSystemState,
  PromptDraft,
} from "@/lib/prompt-builder-state";
import type { PromptRole } from "@/lib/prompt-types";

const DRAFT_STORAGE_KEY = "digitools.prompt-builder.craft-v1";
const CARD_STORAGE_KEY = "digitools.prompt-builder.cards-v1";
const SAVED_AT_STORAGE_KEY = "digitools.prompt-builder.saved-at-v1";

type BuilderSnapshot = {
  draft: PromptDraft;
  cardSystem: CardSystemState;
};

export function usePromptBuilderPersistence({
  roles,
  draft,
  cardSystem,
  setDraft,
  setCardSystem,
  setActiveRoleCategory,
}: {
  roles: PromptRole[];
  draft: PromptDraft;
  cardSystem: CardSystemState;
  setDraft: Dispatch<SetStateAction<PromptDraft>>;
  setCardSystem: Dispatch<SetStateAction<CardSystemState>>;
  setActiveRoleCategory: Dispatch<SetStateAction<string>>;
}) {
  const restore = useCallback(() => {
    const snapshot = restoreDeckSnapshot(
      localStorage.getItem(DRAFT_STORAGE_KEY),
      localStorage.getItem(CARD_STORAGE_KEY),
      localStorage.getItem(SAVED_AT_STORAGE_KEY),
      {
        draft: (raw) => restoreDraft(raw, roles),
        cards: (raw, restoredDraft) => {
          const format = restoredDraft?.format ?? EMPTY_DRAFT.format;
          return raw ? restoreCardSystem(raw, format) : createCardSystem(format);
        },
      },
    );
    if (snapshot.draft) {
      setDraft(snapshot.draft);
      const leadRoleId = snapshot.draft.roleIds[0];
      const leadRole = roles.find((role) => role.id === leadRoleId);
      if (leadRole) {
        setActiveRoleCategory(leadRole.category);
      }
    }
    setCardSystem(snapshot.cardSystem);
    return { status: "saved" as const, savedAt: snapshot.savedAt };
  }, [roles, setActiveRoleCategory, setCardSystem, setDraft]);

  const save = useCallback((snapshot: BuilderSnapshot, savedAt: Date) => {
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
