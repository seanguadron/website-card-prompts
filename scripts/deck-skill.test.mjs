import assert from "node:assert/strict";
import test from "node:test";
import { buildDeckSkill } from "../src/lib/deck-skill.ts";

test("a PICTURE hand carries its lighting into a new brief", () => {
  const skill = buildDeckSkill("picture", "studio-light", [
    { label: "Light", body: "soft window light" },
  ]);
  assert.match(skill, /^---\nname: picture-studio-light\n/);
  assert.match(skill, /soft window light/);
  assert.match(skill, /new subject/i);
});

test("hand notes remain literal Markdown examples", () => {
  const skill = buildDeckSkill("craft", "format", [
    { label: "Format", body: "First line\n![preview](sample.png)\r<aside>sample</aside>" },
  ]);
  assert.match(skill, /\n    !\[preview\]/);
  assert.match(skill, /\n    <aside>/);
});
