"use client";

import {
  Children,
  createContext,
  useState,
  useRef,
  useLayoutEffect,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { PHONE_MEDIA_QUERY } from "@/lib/tool-registry";
import { RailToggle } from "./rail-toggle";
import { createPortal } from "react-dom";
import { usePortalTarget } from "@/hooks/use-portal-target";
import { useBoardCamera } from "@/hooks/use-board-camera";
import { BOARD_GAP, BOARD_WIDTH, boardOrigin } from "@/lib/board-layout";

export const BoardTrayTarget = createContext<HTMLElement | null>(null);

export type DeckBoardSpec = {
  key: string;
  /** The tile letter: the section's acronym letter, "S" for Setup. */
  letter: string;
  label: string;
  complete: boolean;
  summary?: string;
};

/**
 * The deck board: a pasteboard with a camera over a row of boards, one per
 * child. It is a CONTAINER for the same panels the flow renders - the deck
 * hands it the panel contents in order and says which board is active; the
 * camera follows. The header's Workspace menu holds camera controls. Keyboard: [ and ] move between boards, 0 fits the active
 * one, - and = zoom, arrows pan when the pasteboard itself is focused, and
 * Space + drag pans from anywhere. Focus moving into another board frames
 * it, so tabbing never leaves the user looking at the wrong board.
 */
export function DeckBoard({
  boards,
  activeIndex,
  onActivate,
  dealing,
  deck,
  ariaLabel,
  children,
}: {
  boards: readonly DeckBoardSpec[];
  activeIndex: number;
  onActivate: (index: number) => void;
  /** True while an archetype is being dealt: slot cards flip in. */
  dealing?: boolean;
  deck: "craft" | "picture" | "sonic";
  ariaLabel: string;
  children: ReactNode;
}) {
  const cameraTools = usePortalTarget("workspace-camera-tools");
  const tray = usePortalTarget("board-archetype-tray");
  const phoneWidth = useMediaQuery(PHONE_MEDIA_QUERY);
  const [collapsedChoice, setCollapsed] = useState<boolean|null>(null);
  const collapsed = collapsedChoice ?? phoneWidth;
  const [handTarget, setHandTarget] = useState<HTMLDivElement | null>(null);
  const nodes = Children.toArray(children);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const camera = useBoardCamera({
    viewportRef,
    boardCount: boards.length,
    activeIndex,
    onActivate,
  });
  // A section change deals its visible hand from a common point in board space.
  // Offset coordinates stay independent of the camera's transform.
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const surface = viewportRef.current?.querySelector(".deck-board-surface.is-active");
    const grid = surface?.querySelector<HTMLElement>(".lineage-card-grid, .role-card-grid");
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-motion-card]"))
      .filter(card => card.offsetLeft + card.offsetWidth > grid.scrollLeft &&
        card.offsetLeft < grid.scrollLeft + grid.clientWidth);
    const pile = cards[0];
    if (!pile) return;
    cards.forEach((card, index) => {
      card.style.setProperty("--deal-x", (pile.offsetLeft - card.offsetLeft) + "px");
      card.style.setProperty("--deal-y", (pile.offsetTop - card.offsetTop + 8) + "px");
      card.style.setProperty("--deal-delay", Math.min(index, 8) * 28 + "ms");
      card.classList.add("is-entering-hand");
    });
    const clear = () => cards.forEach(card => card.classList.remove("is-entering-hand"));
    const timer = window.setTimeout(clear, 680);
    return () => { window.clearTimeout(timer); clear(); };
  }, [activeIndex]);
  const { view } = camera;
  const style = {
    "--board-scale": view.scale,
    "--board-tx": `${view.tx}px`,
    "--board-ty": `${view.ty}px`,
  } as CSSProperties;

  function followFocus(event: FocusEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest(".board-overview")) return;
    const surface = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-board-index]",
    );
    if (!surface) {
      return;
    }
    const index = Number(surface.dataset.boardIndex);
    if (Number.isInteger(index) && index !== activeIndex) {
      onActivate(index);
    }
  }

  return (
    <div
      className="deck-board"
      data-component="Board:Deck"
      data-deck={deck}
      ref={viewportRef}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      data-zoom={camera.tier}
      data-panning={camera.panning ? "true" : undefined}
      data-space={camera.spaceDown ? "true" : undefined}
      data-dealing={dealing ? "true" : undefined}
      data-ready={camera.ready ? "true" : undefined}
      style={style}
      onFocus={followFocus}
      {...camera.handlers}
    >
      {tray && createPortal(<>
        <RailToggle side="left" title="Archetypes" expanded={!collapsed} controls="board-card-library" onToggle={() => setCollapsed(!collapsed)} />
        <div id="board-card-library" inert={collapsed} aria-hidden={collapsed} hidden={collapsed}>
          <div className="tray-hand" ref={setHandTarget} />
        </div>
      </>, tray)}
      <div
        className={
          camera.animating ? "deck-board-world is-animating" : "deck-board-world"
        }
        style={{
          transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
        }}
      >
        {boards.map((board, index) => {
          const origin = boardOrigin(index, BOARD_WIDTH, BOARD_GAP);
          return (
            <section
              className={
                index === activeIndex
                  ? "deck-board-surface is-active"
                  : "deck-board-surface"
              }
              tabIndex={-1}
              data-board-index={index}
              ref={(node) => camera.registerBoard(index, node)}
              style={{ left: origin.x, top: origin.y, width: BOARD_WIDTH }}
              aria-label={`${board.label} board`}
              // Every board stays present and reachable (a long document of
              // labelled regions, not a slider); this marks the framed one.
              aria-current={index === activeIndex ? "true" : undefined}
              key={board.key}
            >
              <header className="deck-board-nameplate" aria-hidden="true">
                <b>{board.letter}</b>
                <span>{board.label}</span>
                {board.complete ? <i>Complete</i> : null}
              </header>
              {camera.tier === "far" && (
                <button
                  type="button"
                  className="board-overview"
                  onClick={() => camera.inspectBoard(index)}
                >
                  <b>{board.label}</b>
                  <span>{board.summary ?? "Choose an archetype"}</span>
                </button>
              )}
              <BoardTrayTarget.Provider value={index === 0 ? handTarget : null}>
                {nodes[index] ?? null}
              </BoardTrayTarget.Provider>
            </section>
          );
        })}
      </div>

      {cameraTools && createPortal(<div className="workspace-camera" role="toolbar" aria-label="Board navigation">
        <div className="deck-board-pips" role="group" aria-label="Boards">
          {boards.map((board, index) => (
            <button
              className={[
                "deck-board-pip",
                index === activeIndex ? "is-active" : "",
                board.complete ? "is-complete" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`${board.label}${board.complete ? ", complete" : ""}`}
              title={board.label}
              onClick={() => onActivate(index)}
              key={board.key}
            >
              {board.letter}
            </button>
          ))}
        </div>
        <div className="deck-board-zoom">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => camera.zoomBy(1 / 1.25)}
          >
            <span aria-hidden="true">&minus;</span>
          </button>
          <output aria-label="Zoom level">{Math.round(view.scale * 100)}%</output>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => camera.zoomBy(1.25)}
          >
            <span aria-hidden="true">+</span>
          </button>
          <button
            type="button"
            onClick={() => camera.frameBoard(activeIndex, true)}
            title="Fit the active board (0)"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={camera.frameAll}
            title="See every board"
          >
            All
          </button>
        </div>
      </div>, cameraTools)}
    </div>
  );
}
