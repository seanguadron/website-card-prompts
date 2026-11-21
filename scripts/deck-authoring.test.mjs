import test from "node:test";
import assert from "node:assert/strict";
import { buildDeckSkill } from "../src/lib/deck-skill.ts";
import { buildFieldDirections, restoreSkillFields } from "../src/lib/skill-fields.ts";
import { framingDirections, readFraming } from "../src/lib/framing-board.ts";
import { buildPicturePrompt, buildPictureHandSections, PICTURE_SECTIONS } from "../src/lib/picture-prompt.ts";
import { sketchEnvelope } from "../src/lib/sound-envelope.ts";
import { readFileSync } from "node:fs";
import { summarizeSlots } from "../src/lib/hand-summary.ts";

test("CRAFT replaces every bound phrase in the reusable hand and its excerpts", () => {
  const prompt = "Read the quarterly report for the board.\nRefer to the quarterly report twice.";
  const fields = restoreSkillFields([{ name: "Source", phrase: "quarterly report" }, { name: "Audience", phrase: "board" }]);
  const choices = buildFieldDirections(prompt, [{ label: "Tactic", body: "Read the quarterly report." }], fields);
  const skill = buildDeckSkill("craft", "Review", choices);
  assert.ok(skill.includes("Read the [Source] for the [Audience]"));
  assert.ok(skill.includes("Ask for Source"));
  assert.ok(!skill.includes("quarterly report"));
  assert.ok(prompt.startsWith("Read the quarterly report"));
});

test("restore filters malformed, duplicate and overlapping bindings", () => {
  const valid = { name: "Input", phrase: "filtered report" };
  assert.deepEqual(restoreSkillFields([null, valid, { ...valid, name: "Other" }, { name: "input", phrase: "memo" },
    { name: "File", phrase: "report" }, { name: "bracket]", phrase: "card" }]), [valid]);
  assert.deepEqual(buildFieldDirections("Different brief", [], [valid]), []);
});

test("PICTURE frame marks agree across plain text and skill", () => {
  assert.deepEqual(readFraming("junk|lower left"), ["", ""]);
  assert.deepEqual(readFraming("lower left|lower left"), ["lower left", ""]);
  const fragments = Object.fromEntries(PICTURE_SECTIONS.map(key => [key, []]));
  fragments.execution.push(...framingDirections("middle right|upper left", "16:9"));
  const tail = { enabled:false, aspectRatio:"16:9", negative:"", stylize:null, chaos:null, weird:null };
  const prompt = buildPicturePrompt("a copper cup", fragments, tail);
  const skill = buildDeckSkill("picture", "Product", buildPictureHandSections(fragments, tail));
  for (const phrase of ["16:9 composition", "middle right", "upper left", "clear for lettering"]) {
    assert.ok(prompt.includes(phrase));
    assert.ok(skill.includes(phrase));
  }
  assert.ok(!prompt.includes("--ar"));
});

test("SONIC shows release length, repeated cycles and rising pitch", () => {
  const tracks = JSON.parse(readFileSync(new URL("../src/data/sound-deck/tracks.json", import.meta.url), "utf8"));
  assert.ok(tracks.slotBudgets.onset >= 2, "A strike and its release must fit in the hand together");
  assert.notEqual(sketchEnvelope(["single-hit","decay-tail"],0).path, sketchEnvelope(["single-hit","decay-tail"],2).path);
  assert.equal(sketchEnvelope(["looping"],1).cycles, 3);
  const rise = sketchEnvelope(["rising"],1);
  assert.equal(rise.level, false);
  assert.ok(rise.pitchPath);
});

test("overview counts occupied sockets and capacity", () => {
  assert.equal(summarizeSlots(["a","","c"]), "2 equipped · 1 empty slot");
  assert.equal(summarizeSlots(["lead"],3), "1 equipped · 2 empty slots");
});
