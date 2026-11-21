// SONIC-deck instance of the generic card engine: binds the sound-deck
// catalogs and names the bound members in this deck's vocabulary. The panel
// list itself lives in sound-prompt.ts (alias-free) so the merge module and
// its tests never touch JSON.
import cardsData from "@/data/sound-deck/cards.json";
import tracksData from "@/data/sound-deck/tracks.json";
import { createCardEngine, resolveCardIllustration } from "@/lib/card-engine";
import { soundFaceArt } from "@/lib/sound-card-art";
import { SOUND_SECTIONS } from "@/lib/sound-prompt";
import type { SoundSection } from "@/lib/sound-prompt";
import type {
  SoundCardLineage,
  SoundCardsCatalog,
  SoundTrackId,
  SoundTracksCatalog,
} from "@/lib/sound-types";

export const SOUND_TRACK_IDS: readonly SoundTrackId[] = ["emphasis"];

const cardsCatalog = cardsData as SoundCardsCatalog;
const tracksCatalog = tracksData as SoundTracksCatalog;

// Card-family label per panel: what the topline of a card face reads.
const SECTION_FAMILIES: Record<SoundSection, string> = {
  source: "Source",
  onset: "Attack",
  nature: "Texture",
  intensity: "Dynamics",
  context: "World",
};

export function getSoundCardFamily(section: SoundSection): string {
  return SECTION_FAMILIES[section];
}

export const soundCardEngine = createCardEngine<
  SoundSection,
  SoundTrackId,
  SoundCardLineage
>({
  sections: SOUND_SECTIONS,
  trackIds: SOUND_TRACK_IDS,
  cards: cardsCatalog.cards,
  sectionTracks: tracksCatalog.sectionTracks,
  slotBudgets: tracksCatalog.slotBudgets,
  trackDefinitions: tracksCatalog.definitions,
  defaultTrackValues: tracksCatalog.defaultValues,
  cardFamily: getSoundCardFamily,
  cardArt(lineage, gradeIndex) {
    const illustration = resolveCardIllustration(lineage.grades[gradeIndex]?.illustration, lineage.illustration);
    return illustration?.status === "generated" ? illustration : soundFaceArt(lineage.id);
  },
});

export const SOUND_SLOT_BUDGETS = tracksCatalog.slotBudgets;
export const SOUND_DEFAULT_TRACK_VALUES = tracksCatalog.defaultValues;

// The equipped cards' grade terms per section — the fragments the
// sound-prompt merge joins into the comma line.
export const getEquippedTerms = soundCardEngine.getEquippedInstructions;
