import assert from "node:assert/strict";
import test from "node:test";
import {
  OUTCOME_SHARD_COUNT,
  composeOutcomePrompt,
  enumerateOutcomeCombos,
  outcomeComboKey,
  outcomeShard,
} from "../src/lib/outcome-lab.ts";

const SCENARIO = {
  context: "What is known about X?",
  target: "A general audience.",
};

// The enumeration order is the contract between submitting a batch and
// landing its results - request N means combo N on both sides.
test("enumeration covers exactly the combinations of up to three", () => {
  const four = enumerateOutcomeCombos(["d", "b", "a", "c"]);
  // C(4,0)+C(4,1)+C(4,2)+C(4,3) = 1+4+6+4
  assert.equal(four.length, 15);
  assert.deepEqual(four[0], []);
  assert.deepEqual(four[1], ["a"]);
  assert.deepEqual(four[5], ["a", "b"]);
  assert.deepEqual(four[14], ["b", "c", "d"]);

  const thirtyTwo = enumerateOutcomeCombos(
    Array.from({ length: 32 }, (_, i) => `card-${String(i).padStart(2, "0")}`),
  );
  assert.equal(thirtyTwo.length, 5489);
});

test("the combo key ignores equip order and names the empty set", () => {
  assert.equal(outcomeComboKey([]), "baseline");
  assert.equal(
    outcomeComboKey(["format-summary", "context-scope"]),
    outcomeComboKey(["context-scope", "format-summary"]),
  );
  assert.equal(outcomeComboKey(["b", "a"]), "a+b");
});

test("shards are stable and in range", () => {
  const key = "action-analyze+context-scope";
  assert.equal(outcomeShard(key), outcomeShard(key));
  for (const candidate of ["baseline", key, "a+b+c"]) {
    const shard = outcomeShard(candidate);
    assert.ok(shard >= 0 && shard < OUTCOME_SHARD_COUNT);
  }
});

test("the baseline prompt is context and target alone", () => {
  const prompt = composeOutcomePrompt(SCENARIO, []);
  assert.equal(
    prompt,
    "CONTEXT\nWhat is known about X?\n\nTARGET AUDIENCE\nA general audience.",
  );
  // The sections a card never touched must not appear as empty headings.
  assert.ok(!prompt.includes("ACTION"));
  assert.ok(!prompt.includes("FORMAT"));
});

test("cards land in their sections; action lines are numbered", () => {
  const prompt = composeOutcomePrompt(SCENARIO, [
    { id: "action-verify", section: "action", instruction: "Verify claims." },
    { id: "action-analyze", section: "action", instruction: "Analyze it." },
    { id: "context-scope", section: "context", instruction: "State the goal." },
    { id: "target-language", section: "target", instruction: "Plain words." },
  ]);
  assert.equal(
    prompt,
    [
      "CONTEXT\nWhat is known about X?\nState the goal.",
      // Canonical id order, not equip order: analyze before verify.
      "ACTION\n1. Analyze it.\n2. Verify claims.",
      "TARGET AUDIENCE\nA general audience.\nPlain words.",
    ].join("\n\n"),
  );
});

test("the same cards in any order compose the same prompt", () => {
  const cards = [
    { id: "context-scope", section: "context", instruction: "State the goal." },
    { id: "format-summary", section: "format", instruction: "Lead summary." },
  ];
  assert.equal(
    composeOutcomePrompt(SCENARIO, cards),
    composeOutcomePrompt(SCENARIO, [...cards].reverse()),
  );
});
