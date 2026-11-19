import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSoundPrompt,
  buildSoundSections,
  buildSoundSkillChoices,
  cleanSoundSubject,
  SOUND_INCOMPLETE_TEXT,
  SOUND_MERGE_ORDER,
  SOUND_SECTIONS,
} from "../src/lib/sound-prompt.ts";

const EMPTY_TERMS = Object.fromEntries(
  SOUND_SECTIONS.map((section) => [section, []]),
);

test("merge order is a permutation of the panel sections", () => {
  assert.deepEqual([...SOUND_MERGE_ORDER].sort(), [...SOUND_SECTIONS].sort());
});

test("an empty sound line yields the incomplete text and null sections", () => {
  assert.equal(
    buildSoundPrompt("  ", EMPTY_TERMS, false),
    SOUND_INCOMPLETE_TEXT,
  );
  assert.equal(buildSoundSections("", EMPTY_TERMS, false), null);
});

// Firefly's first don't, enforced rather than taught: "the sound of a lion
// roaring" composes as "a lion roaring". Only the LEADING phrase goes -
// Adobe's own workflow example ends in "...babbling sound" and must survive.
test("a leading \"the sound of\" is stripped; a trailing \"sound\" is not", () => {
  assert.equal(cleanSoundSubject("the sound of a lion roaring"), "a lion roaring");
  assert.equal(cleanSoundSubject("Sound of rain"), "rain");
  assert.equal(cleanSoundSubject("a sound of thunder"), "thunder");
  assert.equal(
    cleanSoundSubject("a relaxing stream babbling sound"),
    "a relaxing stream babbling sound",
  );
  assert.equal(
    buildSoundPrompt("the sound of a lion roaring", EMPTY_TERMS, false),
    "a lion roaring",
  );
});

test("terms join comma-separated in S, N, O, I, C order", () => {
  const prompt = buildSoundPrompt(
    "orchestra hit",
    {
      ...EMPTY_TERMS,
      source: ["heavy impact"],
      onset: ["sharp attack"],
      nature: ["metallic"],
      intensity: ["very loud"],
      context: ["dramatic trailer"],
    },
    false,
  );
  assert.equal(
    prompt,
    "orchestra hit, heavy impact, metallic, sharp attack, very loud, dramatic trailer",
  );
});

test("duplicate and empty terms drop out; whitespace and commas are cleaned", () => {
  const prompt = buildSoundPrompt(
    "  rain   on a metal roof ",
    {
      ...EMPTY_TERMS,
      nature: ["metallic,", "  ", "metallic"],
      context: ["outdoors"],
    },
    false,
  );
  assert.equal(prompt, "rain on a metal roof, metallic, outdoors");
});

test("ambience leads with place and retains every selected descriptor", () => {
  const terms = {
    ...EMPTY_TERMS,
    source: ["light drizzle"],
    nature: ["wet, splashy"],
    intensity: ["distant"],
    context: ["outdoors, natural ambience"],
  };
  assert.equal(buildSoundPrompt("forest at dusk", terms, true),
    "forest at dusk, outdoors, natural ambience, light drizzle, wet, splashy, distant");
  assert.equal(buildSoundSkillChoices(terms, true)[0].label, "Ambience");
  assert.ok(buildSoundSkillChoices(terms, false).every(section => section.label !== "Ambience"));
  const specific = buildSoundPrompt("forest at dusk", terms, false);
  assert.equal(
    specific,
    "forest at dusk, light drizzle, wet, splashy, distant, outdoors, natural ambience",
  );
});

test("the sections view carries exactly what the prompt carries", () => {
  const terms = {
    ...EMPTY_TERMS,
    source: ["heavy impact"],
    nature: ["glassy"],
    intensity: ["close"],
  };
  const sections = buildSoundSections("window pane breaking", terms, true);
  assert.ok(sections);
  assert.deepEqual(
    sections.map((section) => section.key),
    ["subject", "source", "nature", "intensity"],
  );
  assert.equal(sections[0].body, "window pane breaking");

  const full = buildSoundSections("window pane breaking", terms, false);
  assert.ok(full);
  assert.deepEqual(
    full.map((section) => section.key),
    ["subject", "source", "nature", "intensity"],
  );
});
