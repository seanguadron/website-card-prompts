import archetypesData from "@/data/sound-deck/archetypes.json";
import type {
  SoundArchetype,
  SoundArchetypesCatalog,
} from "@/lib/sound-types";

const archetypesCatalog = archetypesData as SoundArchetypesCatalog;

export const SOUND_ARCHETYPES: SoundArchetype[] = archetypesCatalog.archetypes;

export type { SoundArchetype } from "@/lib/sound-types";
