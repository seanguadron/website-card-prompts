// SONIC exports one sound per rack entry. Ambience puts the setting first.
//
// There is no parameter tail: Firefly has no numeric flags. Layering happens
// on audio tracks in Firefly, so the deck's rack holds whole separate
// prompts (one sound each) instead of appending anything here.
//
// Kept free of path aliases and JSON imports so the scripts/*.test.mjs
// runner can load it directly (same constraint as picture-prompt.ts).

// Panel order — S.O.N.I.C.
export const SOUND_SECTIONS = [
  "source",
  "onset",
  "nature",
  "intensity",
  "context",
] as const;

export type SoundSection = (typeof SOUND_SECTIONS)[number];

// The order terms join into the prompt line: what it is, what it is made of,
// how it moves, how big it is, and where it lives — the shape of Firefly's
// own examples ("orchestra hit, sharp attack, low pitch, dramatic trailer").
export const SOUND_MERGE_ORDER: readonly SoundSection[] = [
  "source",
  "nature",
  "onset",
  "intensity",
  "context",
];

export const SOUND_INCOMPLETE_TEXT =
  "Name a sound to build your prompt.";

const AMBIENCE_MERGE_ORDER: readonly SoundSection[] = ["context", "source", "nature", "onset", "intensity"];

// The rack holds separate one-sound prompts to generate individually and
// layer on Firefly audio tracks. Capped so a stored draft stays a draft.
export const SOUND_LAYER_LIMIT = 12;

const SECTION_HEADINGS: Record<SoundSection, { heading: string; label: string }> = {
  source: { heading: "SOURCE", label: "Source" },
  onset: { heading: "ONSET", label: "Onset" },
  nature: { heading: "NATURE", label: "Nature" },
  intensity: { heading: "INTENSITY", label: "Intensity" },
  context: { heading: "CONTEXT", label: "Context" },
};

export type SoundPromptSection = {
  key: SoundSection | "subject";
  heading: string;
  label: string;
  body: string;
};

// Everything that lands in the one-line prompt goes through this: collapse
// whitespace, trim, and drop trailing commas so joining with ", " can never
// double up. Same discipline as the PICTURE merge.
function cleanFragment(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/,+$/, "")
    .trim();
}

// Firefly's first rule is "describe the sound directly", with "the sound
// of a lion roaring" as the canonical don't. The deck enforces it instead
// of hoping: a leading "the sound of" (or "a sound of" / "sound of") is
// stripped from the typed line before composing. Only the LEADING phrase -
// Adobe's own examples end in "...babbling sound", which is fine.
const SOUND_OF_PREFIX = /^(?:the\s+|a\s+)?sounds?\s+of\s+/i;

export function cleanSoundSubject(subject: string) {
  return cleanFragment(cleanFragment(subject).replace(SOUND_OF_PREFIX, ""));
}

function cleanedSectionFragments(
  fragments: Record<SoundSection, readonly string[]>,
) {
  const seen = new Set<string>();
  const cleaned = {} as Record<SoundSection, string[]>;

  for (const section of SOUND_SECTIONS) {
    cleaned[section] = (fragments[section] ?? [])
      .map(cleanFragment)
      .filter((fragment) => {
        if (!fragment) {
          return false;
        }
        const key = fragment.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }

  return cleaned;
}

function mergedTerms(
  fragments: Record<SoundSection, readonly string[]>,
  ambience: boolean,
) {
  const cleaned = cleanedSectionFragments(fragments);
  const order = ambience ? AMBIENCE_MERGE_ORDER : SOUND_MERGE_ORDER;
  return order.flatMap((section) =>
    cleaned[section].map((fragment) => ({ section, fragment })),
  );
}

export function buildSoundPrompt(
  subject: string,
  fragments: Record<SoundSection, readonly string[]>,
  ambience: boolean,
): string {
  const cleanSubject = cleanSoundSubject(subject);
  if (!cleanSubject) {
    return SOUND_INCOMPLETE_TEXT;
  }

  return [
    cleanSubject,
    ...mergedTerms(fragments, ambience).map((term) => term.fragment),
  ].join(", ");
}

export function buildSoundSections(
  subject: string,
  fragments: Record<SoundSection, readonly string[]>,
  ambience: boolean,
): SoundPromptSection[] | null {
  const cleanSubject = cleanSoundSubject(subject);
  if (!cleanSubject) {
    return null;
  }

  const sections: SoundPromptSection[] = [
    {
      key: "subject",
      heading: "SOUND",
      label: "Sound",
      body: cleanSubject,
    },
  ];

  return [...sections, ...buildSoundHandSections(fragments, ambience)];
}

export function buildSoundSkillChoices(fragments: Record<SoundSection, readonly string[]>, ambience: boolean) {
  const sections = buildSoundHandSections(fragments, ambience);
  return ambience ? [{ label: "Ambience", body: "Describe the environment first and retain the selected audible details." }, ...sections] : sections;
}

export function buildSoundHandSections(
  fragments: Record<SoundSection, readonly string[]>,
  ambience: boolean,
): SoundPromptSection[] {
  const sections: SoundPromptSection[] = [];
  const terms = mergedTerms(fragments, ambience);
  for (const section of SOUND_SECTIONS) {
    const body = terms
      .filter((term) => term.section === section)
      .map((term) => term.fragment)
      .join(", ");
    if (body) {
      sections.push({
        key: section,
        heading: SECTION_HEADINGS[section].heading,
        label: SECTION_HEADINGS[section].label,
        body,
      });
    }
  }

  return sections;
}
