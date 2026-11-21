import type { CardArtRef } from "./card-engine";

// Existing Gallery illustrations chosen for the audible subject, surface, or
// perspective. A lineage keeps its portrait as the emphasis dial changes.
const subjects: Readonly<Record<string, string>> = {
  friction: "charcoal-drawing", whoosh: "motion-blur-action",
  creature: "winged-beast", weather: "rainswept-city",
  crowd: "crowd-of-many", electricity: "neon-glow", "sharp-attack": "storm-light",
  "slow-swell": "tropical-shore", stutter: "double-exposure", looping: "van-gogh-swirl",
  "single-hit": "silhouette-shot", rising: "mountain-heights", "decay-tail": "long-exposure",
  metallic: "cold-steel", wooden: "ancient-forest", glassy: "stained-glass",
  hollow: "grand-library", organic: "botanical-plate", gritty: "desert-expanse",
  watery: "underwater-depths", synthetic: "vaporwave-grid", quiet: "overcast-soft",
  loud: "storm-light", deep: "underwater-depths", bright: "harsh-noon",
  distant: "wide-establishing", close: "close-portrait", forceful: "low-angle-hero",
  cinematic: "cinematic-still", scifi: "space-frontier", cartoon: "comic-ink-flats",
  horror: "ghostly-presence", "small-room": "cozy-interior", cavernous: "grand-library",
  outdoors: "ancient-forest", trailer: "baroque-drama",

  "laser-zap": "space-frontier", "creature-lair": "winged-beast",
  "rain-bed": "rainswept-city", "haunted-hall": "ghostly-presence",
  "storm-front": "storm-light", "crowd-murmur": "crowd-of-many",
  "whoosh-cut": "motion-blur-action", "cartoon-boing": "comic-ink-flats",

  S: "clockwork-automaton", O: "motion-blur-action", N: "cold-steel",
  I: "storm-light", C: "grand-library",
};

const soundPortraits: Readonly<Record<string, string>> = {
  impact: "impact",
  "trailer-hit": "impact",
  mechanism: "mechanism",
  "machine-room": "mechanism",
  "ui-click": "interface-click",
  "glass-break": "glass-break",
};

export function soundFaceArt(id: string): CardArtRef | undefined {
  if (Object.hasOwn(soundPortraits, id)) {
    return { status: "generated", src: `/card-art/sonic/${soundPortraits[id]}.webp` };
  }
  const subject = Object.hasOwn(subjects, id) ? subjects[id] : undefined;
  return subject ? { status: "generated", src: `/card-art/gallery/cards/${subject}/lineage.webp` } : undefined;
}
