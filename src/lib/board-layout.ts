// The deck board's geometry: boards laid out in a row in world space, and a
// camera (translate + scale) over them. Pure functions, no DOM, no aliases,
// so scripts/board-layout.test.mjs can load this file directly.
//
// World units are CSS pixels at scale 1. The camera maps a world point (wx,
// wy) to the screen as (wx * scale + tx, wy * scale + ty), the same contract
// the WebGamingPlatform spec canvas uses (docs/BOARD_VISION.md §3).

export type BoardView = { tx: number; ty: number; scale: number };
export type BoardRect = { x: number; y: number; w: number; h: number };
export type BoardViewport = { width: number; height: number };

/** One board's world width. Tall content grows the board downward. Sized so
 *  a ~1000px workspace (the output dock open) frames a board near 0.75 and
 *  a full-width one near 1:1. */
export const BOARD_WIDTH = 1280;
/** Breathing room between boards in the row. */
export const BOARD_GAP = 200;
/** Low enough for "All" to show a seven-board row in a 1000px workspace. */
export const BOARD_SCALE_MIN = 0.08;
export const BOARD_SCALE_MAX = 2;
/** Screen padding kept around a framed board. */
export const BOARD_FIT_PADDING = 28;

export function clampScale(
  scale: number,
  min = BOARD_SCALE_MIN,
  max = BOARD_SCALE_MAX,
) {
  if (!Number.isFinite(scale)) {
    return min;
  }
  return Math.min(max, Math.max(min, scale));
}

/** Where board `index` sits in the row: boards share y = 0. */
export function boardOrigin(index: number, width = BOARD_WIDTH, gap = BOARD_GAP) {
  return { x: index * (width + gap), y: 0 };
}

/** The smallest rect containing every rect given. */
export function unionRect(rects: readonly BoardRect[]): BoardRect | null {
  if (rects.length === 0) {
    return null;
  }
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const rect of rects) {
    left = Math.min(left, rect.x);
    top = Math.min(top, rect.y);
    right = Math.max(right, rect.x + rect.w);
    bottom = Math.max(bottom, rect.y + rect.h);
  }
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * The view that shows `rect` whole: scaled to fit the viewport minus the
 * padding (never above `maxScale`, so a small board is not blown up),
 * centered horizontally, and centered vertically when it fits, otherwise
 * top-aligned so a tall board starts at its nameplate.
 */
export function fitRect(
  rect: BoardRect,
  viewport: BoardViewport,
  padding = BOARD_FIT_PADDING,
  maxScale = 1,
): BoardView {
  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);
  const scale = clampScale(
    Math.min(availableWidth / rect.w, availableHeight / rect.h, maxScale),
  );
  const scaledWidth = rect.w * scale;
  const scaledHeight = rect.h * scale;
  const tx = (viewport.width - scaledWidth) / 2 - rect.x * scale;
  const ty =
    scaledHeight + padding * 2 <= viewport.height
      ? (viewport.height - scaledHeight) / 2 - rect.y * scale
      : padding - rect.y * scale;
  return { tx, ty, scale };
}

/** Zoom by `factor` keeping the screen point (px, py) fixed under the cursor. */
export function zoomAround(
  view: BoardView,
  factor: number,
  px: number,
  py: number,
  min = BOARD_SCALE_MIN,
  max = BOARD_SCALE_MAX,
): BoardView {
  const scale = clampScale(view.scale * factor, min, max);
  if (scale === view.scale) {
    return view;
  }
  const wx = (px - view.tx) / view.scale;
  const wy = (py - view.ty) / view.scale;
  return { scale, tx: px - wx * scale, ty: py - wy * scale };
}

export function panBy(view: BoardView, dx: number, dy: number): BoardView {
  if (dx === 0 && dy === 0) {
    return view;
  }
  return { ...view, tx: view.tx + dx, ty: view.ty + dy };
}

export function screenToWorld(view: BoardView, px: number, py: number) {
  return { x: (px - view.tx) / view.scale, y: (py - view.ty) / view.scale };
}

/** Which board's center is nearest the viewport center, in world space. */
export function nearestBoardIndex(
  view: BoardView,
  rects: readonly BoardRect[],
  viewport: BoardViewport,
) {
  if (rects.length === 0) {
    return -1;
  }
  const center = screenToWorld(view, viewport.width / 2, viewport.height / 2);
  let best = 0;
  let bestDistance = Infinity;
  rects.forEach((rect, index) => {
    const distance = Math.hypot(
      rect.x + rect.w / 2 - center.x,
      rect.y + rect.h / 2 - center.y,
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

export type BoardZoomTier = "near" | "mid" | "far";

/** Far out, card faces simplify to their art (legibility and paint cost). */
export function zoomTier(scale: number): BoardZoomTier {
  if (scale < 0.45) {
    return "far";
  }
  if (scale < 0.75) {
    return "mid";
  }
  return "near";
}

/** A wheel delta in pixels regardless of the event's deltaMode. */
export function normalizeWheelDelta(delta: number, deltaMode: number) {
  // 1 = lines, 2 = pages; both are rare (Firefox lines, some trackpads).
  if (deltaMode === 1) {
    return delta * 16;
  }
  if (deltaMode === 2) {
    return delta * 400;
  }
  return delta;
}
