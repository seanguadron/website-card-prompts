"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import {
  BOARD_FIT_PADDING,
  fitRect,
  normalizeWheelDelta,
  panBy,
  unionRect,
  zoomAround,
  zoomTier,
  type BoardRect,
  type BoardView,
} from "@/lib/board-layout";

const ANIMATION_MS = 380;
const KEY_PAN_STEP = 96;
const ZOOM_STEP = 1.25;

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

/**
 * The camera over a deck board: translate + scale state, the gestures that
 * move it (wheel zooms to the cursor, space+drag or the
 * middle button pans from anywhere, the pasteboard's own background drags),
 * keyboard moves, and the framing helpers the board chrome calls. It follows
 * `activeIndex`: whenever the active board changes, the camera frames it.
 *
 * Board rects come from the DOM (`registerBoard`), measured through offset
 * metrics, which ignore the world transform - so the world can be scaled
 * while the boards still report their unscaled size.
 *
 * The pasteboard ref is the caller's: a hook that hands a ref back mixed
 * with render values trips the compiler's ref rule on every read.
 */
export function useBoardCamera({
  viewportRef,
  boardCount,
  activeIndex,
  onActivate,
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
  boardCount: number;
  activeIndex: number;
  onActivate: (index: number) => void;
}) {
  const boardRefs = useRef<Array<HTMLElement | null>>([]);
  const [view, setView] = useState<BoardView>({ tx: 0, ty: 0, scale: 1 });
  const [animating, setAnimating] = useState(false);
  const [panning, setPanning] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [ready, setReady] = useState(false);
  const spaceHeldRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const animationTimerRef = useRef<number | null>(null);
  const activeIndexRef = useRef(activeIndex);
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    tx: number;
    ty: number;
  } | null>(null);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const registerBoard = useCallback((index: number, node: HTMLElement | null) => {
    boardRefs.current[index] = node;
  }, []);

  const boardRect = useCallback((index: number): BoardRect | null => {
    const node = boardRefs.current[index];
    if (!node) {
      return null;
    }
    return {
      x: node.offsetLeft,
      y: node.offsetTop,
      w: node.offsetWidth,
      h: node.offsetHeight,
    };
  }, []);

  const viewportSize = useCallback(() => {
    const node = viewportRef.current;
    return {
      width: node?.clientWidth ?? 0,
      height: node?.clientHeight ?? 0,
    };
  }, [viewportRef]);

  const moveTo = useCallback((next: BoardView, animate: boolean) => {
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    const smooth = animate && !reducedMotionRef.current;
    setAnimating(smooth);
    setView(next);
    if (smooth) {
      animationTimerRef.current = window.setTimeout(() => {
        setAnimating(false);
        animationTimerRef.current = null;
      }, ANIMATION_MS);
    }
  }, []);

  const frameBoard = useCallback(
    (index: number, animate = true) => {
      const rect = boardRect(index);
      const viewport = viewportSize();
      if (!rect || viewport.width === 0 || viewport.height === 0) {
        return;
      }
      moveTo(fitRect(rect, viewport, BOARD_FIT_PADDING), animate);
    },
    [boardRect, moveTo, viewportSize],
  );

  const frameAll = useCallback(() => {
    const rects: BoardRect[] = [];
    for (let index = 0; index < boardCount; index += 1) {
      const rect = boardRect(index);
      if (rect) {
        rects.push(rect);
      }
    }
    const union = unionRect(rects);
    const viewport = viewportSize();
    if (!union || viewport.width === 0) {
      return;
    }
    moveTo(fitRect(union, viewport, BOARD_FIT_PADDING), true);
  }, [boardCount, boardRect, moveTo, viewportSize]);

  const zoomBy = useCallback(
    (factor: number) => {
      const viewport = viewportSize();
      moveTo(
        zoomAround(view, factor, viewport.width / 2, viewport.height / 2),
        true,
      );
    },
    [moveTo, view, viewportSize],
  );

  // Reduced motion: the camera cuts instead of gliding.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = query.matches;
    const onChange = () => {
      reducedMotionRef.current = query.matches;
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // First measure, before paint: frame the active board without a glide, then
  // reveal the world. Deferred one frame so the boards have laid out.
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      frameBoard(activeIndexRef.current, false);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
    // Mount only: later activeIndex changes glide (the effect below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the active board. Skipped on mount (the layout effect framed it).
  const followedRef = useRef<number | null>(null);
  useEffect(() => {
    if (followedRef.current === null) {
      followedRef.current = activeIndex;
      return;
    }
    if (followedRef.current === activeIndex) {
      return;
    }
    followedRef.current = activeIndex;
    const frame = window.requestAnimationFrame(() => frameBoard(activeIndex, true));
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, frameBoard]);

  // The viewport resized (dock collapse, window resize): re-frame in place.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) {
      return;
    }
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      frameBoard(activeIndexRef.current, false);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [frameBoard, viewportRef]);

  // Zoom around the pointer; text fields keep their native scrolling.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (isTyping(event.target)) return;
      const hand = event.target instanceof Element
        ? event.target.closest<HTMLElement>(".lineage-card-grid, .role-card-grid")
        : null;
      if (hand && hand.scrollWidth > hand.clientWidth && !event.ctrlKey &&
          (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))) {
        event.preventDefault();
        hand.scrollLeft += normalizeWheelDelta(event.deltaX || event.deltaY, event.deltaMode);
        return;
      }
      event.preventDefault();
      const delta = normalizeWheelDelta(event.deltaY, event.deltaMode);
      const bounds = node.getBoundingClientRect();
      setView((current) => zoomAround(
        current, Math.exp(-delta * 0.0016),
        event.clientX - bounds.left, event.clientY - bounds.top,
      ));
      setAnimating(false);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [viewportRef]);

  // Space held = pan modifier (Figma muscle memory). Ignored while typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTyping(event.target) || event.repeat) {
        return;
      }
      if (event.target !== viewportRef.current) {
        return;
      }
      event.preventDefault();
      spaceHeldRef.current = true;
      setSpaceDown(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spaceHeldRef.current = false;
        setSpaceDown(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [viewportRef]);

  useEffect(
    () => () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    },
    [],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const middle = event.button === 1;
    const primary = event.button === 0;
    if (!(event.target instanceof Element) || !event.currentTarget.contains(event.target)) return;
    const control = event.target.closest(
      'button, a, input, select, textarea, label, summary, [contenteditable="true"], [role="button"], [role="slider"], [draggable="true"], .deck-board-bar',
    );
    if (!middle && !(primary && (spaceHeldRef.current || !control))) {
      return;
    }
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A synthetic or expired pointer; capture is best-effort.
    }
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      tx: view.tx,
      ty: view.ty,
    };
    setAnimating(false);
    setPanning(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - pan.startX;
    const dy = event.clientY - pan.startY;
    setView((current) => ({ ...current, tx: pan.tx + dx, ty: pan.ty + dy }));
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) {
      return;
    }
    panRef.current = null;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.target as Node)) return;
    if (isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const onPasteboard = event.target === event.currentTarget;
    switch (event.key) {
      case "[":
      case "]": {
        const next = Math.max(0, Math.min(boardCount - 1, activeIndex + (event.key === "]" ? 1 : -1)));
        event.preventDefault();
        boardRefs.current[next]?.focus({ preventScroll: true });
        onActivate(next);
        return;
      }
      case "0":
        event.preventDefault();
        frameBoard(activeIndex, true);
        return;
      case "-":
      case "_":
        event.preventDefault();
        zoomBy(1 / ZOOM_STEP);
        return;
      case "=":
      case "+":
        event.preventDefault();
        zoomBy(ZOOM_STEP);
        return;
      default:
        break;
    }
    if (!onPasteboard) {
      return;
    }
    const step =
      event.key === "ArrowLeft"
        ? [KEY_PAN_STEP, 0]
        : event.key === "ArrowRight"
          ? [-KEY_PAN_STEP, 0]
          : event.key === "ArrowUp"
            ? [0, KEY_PAN_STEP]
            : event.key === "ArrowDown"
              ? [0, -KEY_PAN_STEP]
              : null;
    if (step) {
      event.preventDefault();
      moveTo(panBy(view, step[0], step[1]), false);
    }
  }

  return {
    registerBoard,
    view,
    tier: zoomTier(view.scale),
    animating,
    panning,
    spaceDown,
    ready,
    frameBoard,
    frameAll,
    zoomBy,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown,
    },
  };
}
