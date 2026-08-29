import assert from "node:assert/strict";
import test from "node:test";
import { queueCountsFor, queueTotalFor } from "../src/lib/art-queue.ts";

// One queue file holds every deck and every world at once, so the filtering
// is the part worth being sure about: a sci-fi count drawn on a fantasy card
// would misstate what is about to be generated.
const items = [
  { deck: "craft", theme: "sci-fi", key: "roles.strategist", name: "Strategist", count: 2 },
  { deck: "craft", theme: "fantasy", key: "roles.strategist", name: "Strategist", count: 5 },
  { deck: "craft", theme: "sci-fi", key: "grades.context-scope[1]", name: "Scope", count: 1 },
  { deck: "picture", theme: "gallery", key: "lineages.watercolor", name: "Watercolor", count: 9 },
];

test("counts are scoped to one deck in one world", () => {
  const sciFi = queueCountsFor(items, "craft", "sci-fi");
  assert.equal(sciFi.get("roles.strategist"), 2);
  assert.equal(sciFi.get("grades.context-scope[1]"), 1);
  assert.equal(sciFi.size, 2);

  // The same card in another world is a different image, and counts apart.
  assert.equal(queueCountsFor(items, "craft", "fantasy").get("roles.strategist"), 5);
});

test("another deck's queue is never counted", () => {
  assert.equal(queueCountsFor(items, "craft", "gallery").size, 0);
  assert.equal(queueCountsFor(items, "picture", "sci-fi").size, 0);
});

test("a card with no request has no count", () => {
  assert.equal(queueCountsFor(items, "craft", "sci-fi").get("roles.historian"), undefined);
});

test("the total spans a deck's worlds but not the other deck", () => {
  assert.equal(queueTotalFor(items, "craft"), 8);
  assert.equal(queueTotalFor(items, "picture"), 9);
  assert.equal(queueTotalFor([], "craft"), 0);
});

test("duplicate entries for one key add up rather than overwrite", () => {
  const doubled = [...items, { ...items[0], count: 3 }];
  assert.equal(queueCountsFor(doubled, "craft", "sci-fi").get("roles.strategist"), 5);
});
