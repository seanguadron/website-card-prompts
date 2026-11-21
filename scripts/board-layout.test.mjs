import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BOARD_GAP,
  BOARD_SCALE_MAX,
  BOARD_SCALE_MIN,
  BOARD_WIDTH,
  boardOrigin,
  clampScale,
  fitRect,
  nearestBoardIndex,
  normalizeWheelDelta,
  panBy,
  screenToWorld,
  unionRect,
  zoomAround,
  zoomTier,
} from "../src/lib/board-layout.ts";

test("boards sit in a row, one gap apart", () => {
  assert.deepEqual(boardOrigin(0), { x: 0, y: 0 });
  assert.deepEqual(boardOrigin(3), { x: 3 * (BOARD_WIDTH + BOARD_GAP), y: 0 });
});

test("clampScale keeps the camera inside its range and survives NaN", () => {
  assert.equal(clampScale(0.01), BOARD_SCALE_MIN);
  assert.equal(clampScale(9), BOARD_SCALE_MAX);
  assert.equal(clampScale(0.5), 0.5);
  assert.equal(clampScale(Number.NaN), BOARD_SCALE_MIN);
});

test("fitRect centers a board that fits and never scales above 1", () => {
  const view = fitRect({ x: 0, y: 0, w: 400, h: 300 }, { width: 1000, height: 800 }, 20);
  assert.equal(view.scale, 1);
  assert.equal(view.tx, 300);
  assert.equal(view.ty, 250);
});

test("the All overview can frame every board below the manual zoom limit", () => {
  const rect = { x: 0, y: 0, w: 8 * BOARD_WIDTH + 7 * BOARD_GAP, h: 900 };
  const view = fitRect(rect, { width: 286, height: 680 }, 28, 1, 0);
  assert.ok(view.scale > 0 && view.scale < BOARD_SCALE_MIN);
  assert.ok(Math.abs(view.tx - 28) < 1e-8);
  assert.ok(Math.abs(view.tx + view.scale * rect.w - 258) < 1e-8);
});

test("fitRect scales a wide board down and top-aligns a tall one", () => {
  const wide = fitRect({ x: 1780, y: 0, w: 1560, h: 900 }, { width: 1200, height: 900 }, 28);
  assert.ok(Math.abs(wide.scale - (1200 - 56) / 1560) < 1e-9);
  // The board's left edge lands at the padding.
  assert.ok(Math.abs(1780 * wide.scale + wide.tx - 28) < 1e-9);

  const tall = fitRect({ x: 0, y: 0, w: 800, h: 3000 }, { width: 1000, height: 800 }, 28);
  assert.ok(Math.abs(tall.scale - (800 - 56) / 3000) < 1e-9);
  assert.equal(tall.ty, 28);
});

test("zoomAround keeps the cursor's world point fixed", () => {
  const view = { tx: 100, ty: 50, scale: 0.8 };
  const before = screenToWorld(view, 640, 360);
  const zoomed = zoomAround(view, 1.5, 640, 360);
  const after = screenToWorld(zoomed, 640, 360);
  assert.ok(Math.abs(before.x - after.x) < 1e-9);
  assert.ok(Math.abs(before.y - after.y) < 1e-9);
  assert.ok(Math.abs(zoomed.scale - 1.2) < 1e-9);
});

test("zoomAround returns the same view at the range limits", () => {
  const view = { tx: 0, ty: 0, scale: BOARD_SCALE_MAX };
  assert.equal(zoomAround(view, 2, 10, 10), view);
});

test("panBy is additive and a no-op for zero", () => {
  const view = { tx: 10, ty: 20, scale: 1 };
  assert.deepEqual(panBy(view, 5, -5), { tx: 15, ty: 15, scale: 1 });
  assert.equal(panBy(view, 0, 0), view);
});

test("unionRect wraps every board and is null for none", () => {
  assert.equal(unionRect([]), null);
  assert.deepEqual(
    unionRect([
      { x: 0, y: 0, w: 100, h: 50 },
      { x: 300, y: 10, w: 100, h: 200 },
    ]),
    { x: 0, y: 0, w: 400, h: 210 },
  );
});

test("nearestBoardIndex picks the board under the viewport center", () => {
  const rects = [0, 1, 2].map((index) => ({
    ...boardOrigin(index),
    w: BOARD_WIDTH,
    h: 900,
  }));
  const framedSecond = fitRect(rects[1], { width: 1400, height: 900 });
  assert.equal(nearestBoardIndex(framedSecond, rects, { width: 1400, height: 900 }), 1);
  assert.equal(nearestBoardIndex(framedSecond, [], { width: 1400, height: 900 }), -1);
});

test("zoom tiers and wheel normalization", () => {
  assert.equal(zoomTier(0.3), "far");
  assert.equal(zoomTier(0.6), "mid");
  assert.equal(zoomTier(1), "near");
  assert.equal(normalizeWheelDelta(3, 1), 48);
  assert.equal(normalizeWheelDelta(1, 2), 400);
  assert.equal(normalizeWheelDelta(-40, 0), -40);
});
