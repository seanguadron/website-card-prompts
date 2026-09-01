import scenariosData from "@/data/prompt-builder/outcome-scenarios.json";
import type { OutcomeScenario } from "@/lib/outcome-lab";

// The lab's fixed questions. Tiny and imported eagerly; the ANSWERS are the
// heavy part and stay out of the bundle entirely - they live in
// public/proof-outcomes/ and are fetched shard by shard when looked at.
export const OUTCOME_SCENARIOS = (
  scenariosData as { scenarios: OutcomeScenario[] }
).scenarios;
