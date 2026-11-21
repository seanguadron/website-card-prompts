import test from "node:test";
import assert from "node:assert/strict";
import { promptTraces } from "../src/lib/prompt-traces.ts";

const card = {id:"light", name:"Light", section:"illumination", text:"soft light"};
test("duplicate subject and exclusion words are attributed only to the equipped image card", () => {
  const sections = [
    {key:"subject", heading:"SUBJECT", body:"soft light"},
    {key:"illumination", heading:"LIGHT", body:"soft light"},
    {key:"tail", heading:"PARAMETERS", body:"--no soft light"},
  ];
  const prompt = "soft light, soft light --no soft light";
  assert.deepEqual(promptTraces(prompt,[card],sections,["illumination"]),
    [{card, at:12, text:"soft light"}]);
});
test("CRAFT traces the appended context and the prepended action on repeated wording", () => {
  const sections = [
    {key:"context", heading:"CONTEXT", body:"Repeat this.\nRepeat this."},
    {key:"action", heading:"ACTION", body:"1. Do it.\n2. Do it."},
  ];
  const prompt = sections.map(s => s.heading+"\n"+s.body).join("\n\n");
  const cards = [{...card, section:"context",text:"Repeat this."}, {...card,section:"action",text:"Do it."}];
  assert.deepEqual(promptTraces(prompt,cards,sections).map(s=>s.at), [prompt.lastIndexOf("Repeat this."),prompt.indexOf("Do it.")]);
});
