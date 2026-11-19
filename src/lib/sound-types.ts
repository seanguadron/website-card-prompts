import type {
  CardLineageOf,
  CardSystemStateOf,
  EquippedCardsOf,
  SnapMemoryOf,
  TrackDefinitionOf,
  TrackValuesOf,
} from "@/lib/card-engine";
import type { SoundSection } from "@/lib/sound-prompt";

// One dial, like PICTURE's Intensity. Named "emphasis" because this deck
// already HAS an Intensity - the I section - and a track that shared the
// name would make every conversation about it ambiguous.
export type SoundTrackId = "emphasis";

export type SoundTrackValues = TrackValuesOf<SoundTrackId>;
export type SoundTrackDefinition = TrackDefinitionOf<SoundTrackId>;
export type SoundCardLineage = CardLineageOf<SoundSection, SoundTrackId>;
export type SoundEquippedCards = EquippedCardsOf<SoundSection>;
export type SoundSnapMemory = SnapMemoryOf<SoundSection>;
export type SoundCardSystemState = CardSystemStateOf<
  SoundSection,
  SoundTrackId
>;

/** One line in the rack: a whole, separate one-sound prompt to generate on
 *  its own and layer on a Firefly audio track. */
export type SoundLayer = {
  id: string;
  prompt: string;
};

export type SoundDraft = {
  subject: string;
  // Place setting terms immediately after the sound in ambience mode.
  ambience: boolean;
  layers: SoundLayer[];
};

export type SoundDraftTextField = "subject";

export type SoundArchetype = {
  id: string;
  code: string;
  name: string;
  description: string;
  tracks: SoundTrackValues;
  equipped: Partial<Record<SoundSection, readonly string[]>>;
  // A preset that IS an ambience bed switches the mode on when applied.
  ambience?: boolean;
  effects: readonly string[];
};

export type SoundProofScenario = {
  id: string;
  name: string;
  proves: string;
  panel: number;
  tracks?: Partial<SoundTrackValues>;
  equipped?: Partial<Record<SoundSection, readonly string[]>>;
  draft?: Partial<SoundDraft>;
  checks: readonly string[];
};

export type SoundPart = {
  letter: string;
  label: string;
  summary: string;
};

export type SoundTracksCatalog = {
  schemaVersion: 1;
  sectionTracks: Record<SoundSection, readonly SoundTrackId[]>;
  slotBudgets: Record<SoundSection, number>;
  definitions: SoundTrackDefinition[];
  defaultValues: SoundTrackValues;
};

export type SoundCardsCatalog = {
  schemaVersion: 1;
  cards: SoundCardLineage[];
};

export type SoundArchetypesCatalog = {
  schemaVersion: 1;
  archetypes: SoundArchetype[];
};

export type SoundBuilderCatalog = {
  schemaVersion: 1;
  emptyDraft: SoundDraft;
  exampleDraft: SoundDraft;
  soundParts: SoundPart[];
  requiredFields: {
    label: string;
    field: keyof SoundDraft;
  }[];
};

export type SoundProofScenariosCatalog = {
  schemaVersion: 1;
  baseDraft: Partial<SoundDraft>;
  scenarios: SoundProofScenario[];
};
