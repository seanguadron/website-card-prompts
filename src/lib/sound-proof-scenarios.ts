import proofScenariosData from "@/data/sound-deck/proof-scenarios.json";
import type {
  SoundProofScenario,
  SoundProofScenariosCatalog,
} from "@/lib/sound-types";

const proofScenariosCatalog =
  proofScenariosData as SoundProofScenariosCatalog;

export const SOUND_PROOF_SCENARIOS: SoundProofScenario[] =
  proofScenariosCatalog.scenarios;
export const SOUND_PROOF_BASE_DRAFT = proofScenariosCatalog.baseDraft;

export type { SoundProofScenario } from "@/lib/sound-types";
