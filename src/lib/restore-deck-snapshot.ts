type DeckDecoders<Draft, Cards> = {
  draft: (raw: string) => Draft;
  cards: (raw: string | null, draft: Draft | null) => Cards;
};

export function restoreDeckSnapshot<Draft, Cards>(
  rawDraft: string | null,
  rawCards: string | null,
  rawSavedAt: string | null,
  decoders: DeckDecoders<Draft, Cards>,
) {
  let draft: Draft | null = null;
  if (rawDraft) {
    try {
      draft = decoders.draft(rawDraft);
    } catch {
      // A damaged draft can still accompany a usable hand.
    }
  }
  let cardSystem: Cards;
  try {
    cardSystem = decoders.cards(rawCards, draft);
  } catch {
    cardSystem = decoders.cards(null, draft);
  }
  const timestamp = rawSavedAt ? Date.parse(rawSavedAt) : NaN;
  const savedAt = Number.isFinite(timestamp) ? new Date(timestamp) : null;
  return { draft, cardSystem, savedAt };
}
