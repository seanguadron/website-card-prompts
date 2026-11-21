"use client";

import { CardInspector } from "@/components/card-inspector";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { RailToggle } from "./rail-toggle";
import { useMediaQuery } from "@/hooks/use-media-query";
import { OVERLAY_RAIL_MEDIA_QUERY } from "@/lib/tool-registry";
import { readStored, readStoredStringArray, writeStored } from "@/lib/prompt-storage";
import { useHandTools, type Loadout } from "./hand-workspace";
import { useCardInspection } from "@/hooks/use-card-inspection";
import { CardIllustrationFrame } from "@/components/prompt-builder-ui";
import { useCardDeckMotion } from "@/hooks/use-card-deck-motion";
import { usePortalTarget } from "@/hooks/use-portal-target";
import type { CardArtRef } from "@/lib/card-engine";

export type BoardArchetypeItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  details: ReactNode;
  equipped?: Loadout;
  art?: CardArtRef;
  custom?: boolean;
};

const SOCKET_ID = "archetype-socket";
const RAIL_KEY = "cardprompts.archetypes-expanded";

function ArchetypeFace({ item }: { item: BoardArchetypeItem }) {
  return (
    <>
      <span className="board-archetype-topline">
        <span>{item.custom ? "Preset" : "Archetype"}</span>
        <span>{item.code}</span>
      </span>
      <CardIllustrationFrame
        className="board-archetype-art"
        illustration={item.art}
        fallback={item.code.slice(0, 1)}
      />
      <strong>{item.name}</strong>
      <small>{item.description}</small>
    </>
  );
}

function HandCard({
  item,
  active,
  onApply,
}: {
  item: BoardArchetypeItem;
  active: boolean;
  onApply: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `archetype:${item.id}`,
    data: { archetypeId: item.id },
  });

  const hand = useHandTools();
  const { preview, show, leave, dismiss, panelEvents } = useCardInspection();
  const portalTarget = usePortalTarget();
  return (<>
    <button
      ref={setNodeRef}
      onMouseEnter={(event) => { hand.setProposal(item.equipped ?? {}); show(item.id, event.currentTarget); }}
      onFocus={(event) => { hand.setProposal(item.equipped ?? {}); show(item.id, event.currentTarget); }}
      onBlur={()=>{hand.setProposal(null);dismiss();}}
      onMouseLeave={()=>{hand.setProposal(null);leave();}}
      className={[
        "board-archetype-card",
        active ? "is-active" : "",
        isDragging ? "is-dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      data-motion-card
      onClick={()=>{hand.setProposal(null);dismiss();onApply();}}
      aria-label={`Seat the ${item.name} archetype. ${item.description}`}
      {...listeners}
      {...attributes}
      aria-describedby={[attributes["aria-describedby"], preview && panelEvents.id].filter(Boolean).join(" ")}
      aria-pressed={active}
    >
      <ArchetypeFace item={item} />
    </button>
    {portalTarget && preview && !isDragging && createPortal(
      <CardInspector className="floating-card-panel floating-card-panel--archetype" {...panelEvents} style={preview.position}>
        {item.details}
      </CardInspector>, portalTarget)}
  </>);
}

/**
 * The archetype socket: the Setup board's master slot. Drop (or click) an
 * archetype card from the fixed tray and the deck builds itself out -
 * roles, cards, and tracks across every section board. The seated card shows
 * which archetype is in play; editing any board unseats it (the deck's
 * existing rule), and the socket empties while the cards stay.
 */
export function BoardArchetypeSocket({
  tool,
  items,
  socketTarget,
  saveFormOpen,
  onSaveFormOpenChange,
  onSaveCustom,
  onDeleteCustom,
  activeId,
  onApply,
  onUnseat,
  hint,
}: {
  tool: "prompt-builder" | "picture-deck" | "sound-deck";
  items: readonly BoardArchetypeItem[];
  socketTarget: HTMLElement | null;
  saveFormOpen: boolean;
  onSaveFormOpenChange: (open: boolean) => void;
  onSaveCustom: (name: string) => void;
  onDeleteCustom: (id: string) => void;
  activeId: string | null;
  onApply: (id: string) => void;
  onUnseat: () => void;
  hint: string;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const portalTarget = usePortalTarget();
  const overlayRails = useMediaQuery(OVERLAY_RAIL_MEDIA_QUERY);
  const [expandedChoice, setExpandedChoice] = useState<boolean | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [presetName, setPresetName] = useState("");
  const expanded = saveFormOpen || (expandedChoice ?? !overlayRails);
  const favoritesKey = `digitools.${tool}.favorites-v1`;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = readStored(RAIL_KEY, null);
      setExpandedChoice(typeof saved === "boolean" ? saved : null);
      setFavorites(readStoredStringArray(favoritesKey));
    });
    return () => cancelAnimationFrame(frame);
  }, [favoritesKey]);
  const ordered = [
    ...items.filter(item => favorites.includes(item.id)),
    ...items.filter(item => !favorites.includes(item.id)),
  ];
  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
    setFavorites(next);
    writeStored(favoritesKey, next);
  }
  function closeSaveForm() {
    setPresetName("");
    onSaveFormOpenChange(false);
  }
  // The same pointer tilt the card grids have: cards near the pointer lean
  // toward it on fine pointers (DESIGN_DIRECTION, the CRAFT card system).
  const handMotion = useCardDeckMotion();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const seated = items.find((item) => item.id === activeId) ?? null;
  const dragging = items.find((item) => item.id === draggingId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { archetypeId?: string } | undefined;
    setDraggingId(data?.archetypeId ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const data = event.active.data.current as { archetypeId?: string } | undefined;
    setDraggingId(null);
    if (event.over?.id === SOCKET_ID && data?.archetypeId) {
      onApply(data.archetypeId);
    }
  }

  return (
    <DndContext
      id="board-archetypes"
      sensors={sensors}
      collisionDetection={({ pointerCoordinates }) => {
        if (!pointerCoordinates) return [];
        const under = document.elementFromPoint(pointerCoordinates.x, pointerCoordinates.y);
        return under?.closest(".deck-board, .flow-viewport") && !under.closest(".deck-board-bar")
          ? [{ id: SOCKET_ID }] : [];
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      {socketTarget && createPortal(<section className="board-archetype" aria-labelledby="board-archetype-title">
        <div className="workbench-section-heading board-archetype-heading">
          <strong id="board-archetype-title">Archetype socket</strong>
          <small>{seated ? seated.code : `${items.length} in hand`}</small>
        </div>
        <Socket seated={seated} onUnseat={onUnseat} hint={hint} />
      </section>, socketTarget)}
      <aside id="board-archetype-tray" aria-label="Archetypes">
        <RailToggle side="left" title="Archetypes" expanded={expanded} controls="board-card-library" onToggle={() => {
          if (saveFormOpen) closeSaveForm();
          setExpandedChoice(!expanded);
          writeStored(RAIL_KEY, !expanded);
        }} />
        <div id="board-card-library" hidden={!expanded} inert={!expanded}>
          {saveFormOpen && <form className="archetype-save-form" onSubmit={event => {
            event.preventDefault();
            if (!presetName.trim()) return;
            onSaveCustom(presetName.trim());
            closeSaveForm();
          }}>
            <input autoFocus aria-label="Preset name" placeholder="Preset name" value={presetName}
              onChange={event => setPresetName(event.target.value)} onKeyDown={event => {
                if (event.key === "Escape") closeSaveForm();
              }} />
            <button type="submit" disabled={!presetName.trim()}>Save</button>
            <button type="button" onClick={closeSaveForm}>Cancel</button>
          </form>}
          <div className="tray-hand">
            <div
              className="board-archetype-hand"
              role="list"
              aria-label="Archetype cards"
              onPointerMove={handMotion.onPointerMove}
              onPointerLeave={handMotion.onPointerLeave}
            >
              {ordered.map((item) => (
                <div role="listitem" key={item.id}>
                  <HandCard
                    item={item}
                    active={item.id === activeId}
                    onApply={() => onApply(item.id)}
                  />
                  <div className="archetype-card-tools">
                    <button type="button" aria-pressed={favorites.includes(item.id)}
                      aria-label={`${favorites.includes(item.id) ? "Unpin" : "Pin"} ${item.name}`}
                      onClick={() => toggleFavorite(item.id)}>{favorites.includes(item.id) ? "★" : "☆"}</button>
                    {item.custom && <button type="button" aria-label={`Delete ${item.name} preset`}
                      onClick={() => onDeleteCustom(item.id)}>Delete</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {portalTarget
        ? createPortal(
            <DragOverlay style={{ pointerEvents: "none" }} dropAnimation={null} zIndex={120}>
              {dragging ? (
                <div className="board-archetype-card card-drag-overlay is-active">
                  <ArchetypeFace item={dragging} />
                </div>
              ) : null}
            </DragOverlay>,
            portalTarget,
          )
        : null}
    </DndContext>
  );
}

function Socket({
  seated,
  onUnseat,
  hint,
}: {
  seated: BoardArchetypeItem | null;
  onUnseat: () => void;
  hint: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: SOCKET_ID });

  return (
    <div
      ref={setNodeRef}
      className={[
        "board-socket",
        seated ? "is-seated" : "",
        isOver ? "is-over" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label={seated ? `Socket: ${seated.name}` : "Socket: empty"}
    >
      <span>Socket</span>
      {seated ? (
        <>
          <div className="board-archetype-card board-socket-card is-active">
            <ArchetypeFace item={seated} />
          </div>
          <button
            className="board-socket-unseat"
            type="button"
            onClick={onUnseat}
            aria-label={`Unseat ${seated.name}. Your cards stay in place.`}
          >
            <span aria-hidden="true">x</span>
          </button>
        </>
      ) : (
        <div className="board-socket-empty">
          <strong aria-hidden="true">+</strong>
          <small>{hint}</small>
        </div>
      )}
    </div>
  );
}
