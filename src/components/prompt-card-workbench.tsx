"use client";

import { useHandTools } from "./hand-workspace";
import { CardInspector } from "@/components/card-inspector";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CardBio, CardIllustrationFrame } from "@/components/prompt-builder-ui";
import type { ArtQueueApi } from "@/hooks/use-art-queue";
import { useCardDeckMotion } from "@/hooks/use-card-deck-motion";
import { usePortalTarget } from "@/hooks/use-portal-target";
import type {
  CardEngine,
  CardLineageOf,
  TrackValuesOf,
} from "@/lib/card-engine";
import { useCardInspection } from "@/hooks/use-card-inspection";

type ActiveDrag = {
  lineageId: string;
  kind: "card" | "slot";
  fromSlot?: number;
};

function CardFace<
  S extends string,
  T extends string,
  L extends CardLineageOf<S, T>,
>({
  engine,
  lineage,
  values,
  selected,
}: {
  engine: CardEngine<S, T, L>;
  lineage: L;
  values: TrackValuesOf<T>;
  selected: boolean;
}) {
  const grade = engine.getCardGrade(lineage, values);

  return (
    <>
      <span className="lineage-card-topline">
        <span>{engine.cardFamily(lineage.section)}</span>
        <span>{lineage.code}</span>
      </span>
      <CardIllustrationFrame
        className="lineage-card-art"
        illustration={engine.getCardArt(lineage, values)}
        fallback={lineage.code.slice(0, 1)}
      />
      <span className="lineage-card-copy" key={grade.name}>
        <strong>{grade.name}</strong>
      </span>
      {selected ? (
        <span className="lineage-card-action" aria-hidden="true">
          Equipped
        </span>
      ) : null}
    </>
  );
}

function SnapTrack<
  S extends string,
  T extends string,
  L extends CardLineageOf<S, T>,
>({
  engine,
  trackId,
  value,
  vocabularyKey,
  onChange,
}: {
  engine: CardEngine<S, T, L>;
  trackId: T;
  value: number;
  vocabularyKey: string;
  onChange: (value: number) => void;
}) {
  const definition = engine.getTrackDefinition(trackId, vocabularyKey);
  const activeLabel =
    definition.points[value] ?? definition.points[definition.points.length - 1];

  return (
    <div className="tuning-track">
      <div className="tuning-track-heading">
        <strong>{definition.label}</strong>
        <span>{activeLabel}</span>
      </div>
      <input
        type="range"
        min={0}
        max={definition.points.length - 1}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={definition.label}
        aria-valuetext={activeLabel}
      />
      <div
        className="tuning-track-points"
        style={{
          gridTemplateColumns: `repeat(${definition.points.length}, minmax(0, 1fr))`,
        }}
      >
        {definition.points.map((point, index) => (
          <button
            className={index === value ? "is-active" : ""}
            type="button"
            onClick={() => onChange(index)}
            aria-pressed={index === value}
            key={point}
          >
            <span aria-hidden="true" />
            {point}
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkbenchCard<
  S extends string,
  T extends string,
  L extends CardLineageOf<S, T>,
>({
  engine,
  lineage,
  values,
  selected,
  suggested,
  onToggle,
  onPreview,
  onClearPreview,
  artQueue,
}: {
  engine: CardEngine<S, T, L>;
  lineage: L;
  values: TrackValuesOf<T>;
  selected: boolean;
  suggested: boolean;
  onToggle: () => void;
  onPreview: (element: HTMLElement) => void;
  onClearPreview: () => void;
  artQueue?: ArtQueueApi;
}) {
  const grade = engine.getCardGrade(lineage, values);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card:${lineage.id}`,
    data: { lineageId: lineage.id, kind: "card" } satisfies ActiveDrag,
  });

  // Edit mode repoints the card at the art queue. The key is the art the card
  // is showing RIGHT NOW - a lineage card wears its grade's image once that
  // grade has one - so queuing from here asks for more of what you are
  // looking at, not more of the lineage in the abstract.
  const queuing = artQueue?.editing ?? false;
  // The art may be a pack entry (has a key, can be queued) or a catalog's
  // inline illustration (no key, nothing to ask a pack for). Narrow rather
  // than put a phantom field on the data schema to make the types line up.
  const currentArt = engine.getCardArt(lineage, values);
  const artKey =
    currentArt && "key" in currentArt ? currentArt.key : undefined;
  const queued = queuing ? artQueue!.countFor(artKey) : 0;

  return (
    <button
      ref={setNodeRef}
      className={[
        "lineage-card",
        selected ? "is-selected" : "",
        suggested ? "is-compatible-suggestion" : "",
        isDragging ? "is-dragging" : "",
        queuing ? "is-queuing" : "",
        queued > 0 ? "is-queued" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      data-motion-card
      aria-keyshortcuts="Alt+ArrowDown"
      onClick={queuing ? () => artQueue!.queueOne(artKey, grade.name) : onToggle}
      onMouseEnter={(event) => onPreview(event.currentTarget)}
      onMouseLeave={onClearPreview}
      onFocus={(event) => onPreview(event.currentTarget)}
      onBlur={onClearPreview}
      aria-label={
        queuing
          ? `Queue another ${grade.name} image${queued > 0 ? `. ${queued} queued` : ""}`
          : `${selected ? "Remove" : "Equip"} ${grade.name}. ${grade.description}`
      }
      {...(queuing ? {} : listeners)}
      {...attributes}
      aria-pressed={queuing ? undefined : selected}
    >
      <CardFace
        engine={engine}
        lineage={lineage}
        values={values}
        selected={selected}
      />
      {queued > 0 ? (
        <span className="art-queue-badge" aria-hidden="true">
          {queued}&times;
        </span>
      ) : null}
    </button>
  );
}

function SlotCard<
  S extends string,
  T extends string,
  L extends CardLineageOf<S, T>,
>({
  engine,
  lineage,
  values,
  slotIndex,
  settling,
  onPreview,
  onClearPreview,
}: {
  engine: CardEngine<S, T, L>;
  lineage: L;
  values: TrackValuesOf<T>;
  slotIndex: number;
  settling: boolean;
  onPreview: (element: HTMLElement) => void;
  onClearPreview: () => void;
}) {
  const hand=useHandTools();
  const grade = engine.getCardGrade(lineage, values);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `slot:${slotIndex}`,
    data: {
      lineageId: lineage.id,
      kind: "slot",
      fromSlot: slotIndex,
    } satisfies ActiveDrag,
  });

  return (
    <div
      aria-keyshortcuts="Alt+ArrowDown"
      id={`equipped-${lineage.id}`} data-equipped-card={lineage.id} data-highlight={hand.highlight===lineage.id}
      ref={setNodeRef}
      className={[
        "lineage-card slot-card is-selected",
        isDragging ? "is-dragging" : "",
        settling ? "is-settling" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={(event) => onPreview(event.currentTarget)}
      onMouseLeave={onClearPreview}
      onFocus={(event) => onPreview(event.currentTarget)}
      onBlur={onClearPreview}
      aria-label={`Move ${grade.name} from slot ${slotIndex + 1}`}
      {...listeners}
      {...attributes}
    >
      <CardFace engine={engine} lineage={lineage} values={values} selected />
    </div>
  );
}

function CardSlot<
  S extends string,
  T extends string,
  L extends CardLineageOf<S, T>,
>({
  engine,
  section, slotIndex,
  lineage,
  values,
  settling,
  onRemove,
  onPreview,
  onClearPreview,
}: {
  engine: CardEngine<S, T, L>;
  section: S;
  slotIndex: number;
  lineage: L | null;
  values: TrackValuesOf<T>;
  settling: boolean;
  onRemove: (slotIndex: number) => void;
  onPreview: (element: HTMLElement) => void;
  onClearPreview: () => void;
}) {
  const hand = useHandTools();
  const proposed = hand.proposal?.[lineage?.section ?? section]?.[slotIndex] ?? "";
  const willChange = hand.proposal && !hand.locked.includes(lineage?.id ?? "") && proposed !== (lineage?.id ?? "");
  const { setNodeRef, isOver } = useDroppable({
    id: `dropslot:${slotIndex}`,
    data: { slotIndex, kind: "slot" },
  });
  const grade = lineage ? engine.getCardGrade(lineage, values) : null;

  return (
    <div
      ref={setNodeRef}
      className={[
        "card-slot",
        lineage ? "is-filled" : "",
        isOver ? "is-drop-target" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-proposed={willChange ? "true" : undefined}
      role="group"
      aria-label={
        lineage && grade
          ? `Slot ${slotIndex + 1}: ${grade.name}`
          : `Slot ${slotIndex + 1}: empty`
      }
    >
      <span>Slot {slotIndex + 1}</span>
      {lineage && <button type="button" className="pin-card" aria-label={`Lock ${grade?.name} during archetype deals`}
        aria-pressed={hand.locked.includes(lineage.id)} onClick={()=>hand.toggleLock(lineage.id)}>
        {hand.locked.includes(lineage.id) ? "Pinned" : "Pin"}</button>}
      {lineage && grade ? (
        <>
          <SlotCard
            engine={engine}
            lineage={lineage}
            values={values}
            slotIndex={slotIndex}
            settling={settling}
            onPreview={onPreview}
            onClearPreview={onClearPreview}
          />
          <button
            type="button"
            onClick={() => onRemove(slotIndex)}
            aria-label={`Remove ${grade.name} from slot ${slotIndex + 1}`}
          >
            <span aria-hidden="true">x</span>
          </button>
        </>
      ) : (
        <>
          <strong className="card-slot-empty-mark" aria-hidden="true">
            +
          </strong>
          <span className="sr-only">Empty. Drop a compatible card here.</span>
        </>
      )}
    </div>
  );
}

function DeckDropZone({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "deck",
    data: { kind: "deck" },
  });

  return (
    <section
      ref={setNodeRef}
      className={
        isOver && active ? "category-deck is-remove-target" : "category-deck"
      }
      aria-label="Category card deck"
    >
      {children}
    </section>
  );
}

function ReserveCard({id, name, selected, onEquip, onRemove}: {
  id: string; name: string; selected: boolean; onEquip: () => void; onRemove: () => void;
}) {
  const {attributes, listeners, setNodeRef} = useDraggable({
    id: `reserve:${id}`, data: {lineageId:id, kind:"card"} satisfies ActiveDrag,
  });
  return <span>
    <button type="button" ref={setNodeRef} {...attributes} {...listeners} aria-pressed={selected}
      onClick={onEquip} title="Equip or drag to a slot">{name}</button>
    <button type="button" aria-label={`Remove ${name} from reserve`} onClick={onRemove}>×</button>
  </span>;
}

function ReserveDrop({children}: {children: ReactNode}) {
  const {setNodeRef,isOver}=useDroppable({id:"reserve", data:{kind:"reserve"}});
  return <div ref={setNodeRef} className="reserve-row" data-over={isOver}><strong>Reserve</strong>{children}</div>;
}

export function PromptCardWorkbench<
  S extends string,
  T extends string,
  L extends CardLineageOf<S, T>,
>({
  engine,
  section,
  vocabularyKey,
  values,
  equippedIds,
  suggestedId,
  onTrackChange,
  onToggleCard,
  onDropCard,
  onRemoveCard,
  onClearCards,
  artQueue,
}: {
  engine: CardEngine<S, T, L>;
  section: S;
  vocabularyKey: string;
  values: TrackValuesOf<T>;
  equippedIds: string[];
  suggestedId: string | null;
  onTrackChange: (trackId: T, value: number) => void;
  onToggleCard: (lineageId: string) => void;
  onDropCard: (slotIndex: number, lineageId: string) => void;
  onRemoveCard: (slotIndex: number) => void;
  onClearCards: () => void;
  /** Development-only card authoring. The PICTURE deck passes none. */
  artQueue?: ArtQueueApi;
}) {
  const hand = useHandTools();
  const [overSlot,setOverSlot]=useState<number|null>(null);
  const deck = useMemo(
    () => engine.getSectionDeck(section, values),
    [engine, section, values],
  );
  const { preview, show: previewCard, dismiss: clearPreview, leave, panelEvents } = useCardInspection();
  const previewId = preview?.id;
  const previewAnchor = preview?.position;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [settlingSlot, setSettlingSlot] = useState({ index: -1, token: 0 });
  const deckMotion = useCardDeckMotion();
  const slotMotion = useCardDeckMotion();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const portalTarget = usePortalTarget();
  const visibleDeck = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return deck;
    }

    return deck.filter((lineage) => {
      const grade = engine.getCardGrade(lineage, values);
      return [
        lineage.code,
        engine.cardFamily(lineage.section),
        grade.name,
        grade.description,
        ...lineage.goals,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [deck, engine, searchQuery, values]);
  const previewLineage = engine.getLineage(previewId ?? "");
  const previewGrade = previewLineage
    ? engine.getCardGrade(previewLineage, values)
    : null;
  const slotBudget = engine.slotBudgets[section];
  const dragLineage = activeDrag
    ? engine.getLineage(activeDrag.lineageId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as ActiveDrag | undefined;
    if (data) {
      setActiveDrag(data);
    }
    hand.setHighlight("");
    clearPreview();
  }

  function handleDragEnd(event: DragEndEvent) {
    const data = event.active.data.current as ActiveDrag | undefined;
    setActiveDrag(null);
    setOverSlot(null);
    const overData = event.over?.data.current as
      | { kind?: string; slotIndex?: number }
      | undefined;

    if (!data || !overData) {
      return;
    }

    if (overData.kind === "reserve") {
      if (!hand.reserve.includes(data.lineageId)) hand.toggleReserve(data.lineageId);
      return;
    }
    if (overData.kind === "slot" && typeof overData.slotIndex === "number") {
      onDropCard(overData.slotIndex, data.lineageId);
      setSettlingSlot((current) => ({
        index: overData.slotIndex as number,
        token: current.token + 1,
      }));
    } else if (overData.kind === "deck" && data.kind === "slot") {
      if (typeof data.fromSlot === "number") {
        onRemoveCard(data.fromSlot);
      }
    }
  }

  const [replacement, setReplacement] = useState<L | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (replacement && !dialog.current?.open) dialog.current?.showModal();
  }, [replacement]);

  function chooseCard(lineage: L) {
    if (equippedIds.includes(lineage.id) || equippedIds.filter(Boolean).length < slotBudget) {
      onToggleCard(lineage.id);
    } else if (slotBudget === 1) {
      onDropCard(0, lineage.id);
    } else {
      clearPreview();
      setReplacement(lineage);
    }
  }

  function renderHand() {
    return visibleDeck.map((lineage) => (
      <WorkbenchCard
        engine={engine}
        lineage={lineage}
        values={values}
        selected={equippedIds.includes(lineage.id)}
        suggested={suggestedId === lineage.id}
        onToggle={() => chooseCard(lineage)}
        onPreview={element => {
          hand.setHighlight(equippedIds.includes(lineage.id) ? lineage.id : "");
          previewCard(lineage.id, element);
        }}
        onClearPreview={() => { hand.setHighlight(""); leave(); }}
        artQueue={artQueue}
        key={lineage.id}
      />
    ));
  }

  return (
    <DndContext
      id={`workbench-${section}`}
      sensors={sensors}
      collisionDetection={args => {
        const hits = args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);
        const reserve = hits.find(hit => hit.id === "reserve");
        return reserve ? [reserve] : hits;
      }}
      onDragStart={handleDragStart}
      onDragOver={({over})=>setOverSlot(over?.data.current?.kind==="slot" ? Number(over.data.current.slotIndex) : null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {setActiveDrag(null);setOverSlot(null);}}
    >
      <div className={`card-workbench card-workbench--${section}`}>
        {replacement && portalTarget && createPortal(
          <dialog ref={dialog} className="slot-replacement-dialog"
            aria-labelledby={`replace-${section}-title`} onClose={() => setReplacement(null)}>
            <h2 id={`replace-${section}-title`}>Equip {engine.getCardGrade(replacement, values).name}</h2>
            <p>Choose a card to replace.</p>
            {equippedIds.map((id, index) => {
              const current = engine.getLineage(id);
              if (!current) return null;
              const grade = engine.getCardGrade(current, values);
              return <button type="button" key={index} onClick={() => {
                onDropCard(index, replacement.id);
                dialog.current?.close();
              }}><strong>Slot {index + 1}: {grade.name}</strong><small>{grade.instruction}</small></button>;
            })}
            <button type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          </dialog>, portalTarget)}
        <section className="card-slot-board" aria-label="Equipped card slots">
          <div className="workbench-section-heading">
            <strong>Loadout</strong>
            <small>
              {equippedIds.filter(Boolean).length}/{slotBudget}
            </small>
          </div>
          <div
            className="card-slot-grid"
            onPointerMove={slotMotion.onPointerMove}
            onPointerLeave={slotMotion.onPointerLeave}
          >
            {Array.from({ length: slotBudget }, (_, slotIndex) => (
              <CardSlot
                engine={engine}
                section={section} slotIndex={slotIndex}
                lineage={engine.getLineage(equippedIds[slotIndex] ?? "") ?? null}
                values={values}
                settling={settlingSlot.index === slotIndex}
                onRemove={onRemoveCard}
                onPreview={element => {
                  const id = equippedIds[slotIndex] ?? "";
                  hand.setHighlight(id);
                  previewCard(id, element);
                }}
                onClearPreview={()=>{hand.setHighlight("");leave();}}
                key={`${slotIndex}-${equippedIds[slotIndex] ?? "empty"}-${
                  settlingSlot.index === slotIndex ? settlingSlot.token : 0
                }`}
              />
            ))}
          </div>
          <button
            className="loadout-clear-button"
            type="button"
            onClick={onClearCards}
            disabled={!equippedIds.some(Boolean)}
          >
            Clear
          </button>
        </section>

        {activeDrag && overSlot !== null && dragLineage && (() => {
          const outgoing=engine.getLineage(equippedIds[overSlot] ?? "");
          if (!outgoing || outgoing.id===dragLineage.id) return null;
          return <div className="swap-preview" role="status"><div><b>{equippedIds.includes(activeDrag.lineageId) ? `To slot ${equippedIds.indexOf(activeDrag.lineageId)+1}` : "Leaving"}</b>{engine.getCardGrade(outgoing,values).instruction}</div>
            <div><b>To slot {overSlot+1}</b>{engine.getCardGrade(dragLineage,values).instruction}</div></div>;
        })()}
        <DeckDropZone active={activeDrag?.kind === "slot"}>
          <div className="workbench-section-heading">
            <strong>Cards</strong>
            <small>
              {searchQuery ? `${visibleDeck.length}/${deck.length}` : deck.length}
            </small>
          </div>
          <div
            className="lineage-card-grid"
            onPointerMove={deckMotion.onPointerMove}
            onPointerLeave={deckMotion.onPointerLeave}
          >
            {renderHand()}
            {visibleDeck.length === 0 ? (
              <p className="deck-empty-state">No matching cards.</p>
            ) : null}
          </div>
          <label className="deck-search">
            <span className="sr-only">Search cards</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Find cards"
            />
            <small>{visibleDeck.length} shown</small>
          </label>
          <ReserveDrop>
            {hand.reserve.map(id => {
              const card = engine.getLineage(id);
              if (!card || card.section !== section) return null;
              return <ReserveCard id={id} key={id} name={engine.getCardGrade(card,values).name}
                selected={equippedIds.includes(id)} onEquip={() => chooseCard(card)} onRemove={() => hand.toggleReserve(id)} />;
            })}
            <small>Drag a candidate here, or use its inspector.</small>
          </ReserveDrop>
        </DeckDropZone>

        <section className="tuning-console" aria-label="Tuning tracks">
          <div className="workbench-section-heading">
            <strong>Tuning</strong>
            <small>{engine.sectionTracks[section].length}</small>
          </div>
          <div className="tuning-track-list">
            {engine.sectionTracks[section].map((trackId) => (
              <SnapTrack
                engine={engine}
                trackId={trackId}
                value={values[trackId]}
                vocabularyKey={vocabularyKey}
                onChange={(value) => onTrackChange(trackId, value)}
                key={trackId}
              />
            ))}
          </div>
        </section>

        {portalTarget && previewLineage && previewGrade && previewAnchor && !activeDrag
          ? createPortal(
              <CardInspector
                className="floating-card-panel"
                {...panelEvents}
                style={previewAnchor}
                aria-live="polite"
              >
                <CardIllustrationFrame
                  className="floating-card-art"
                  illustration={engine.getCardArt(previewLineage, values)}
                  fallback={previewLineage.code.slice(0, 1)}
                />
                <div className="floating-card-panel-identity">
                  <span>{previewLineage.code} / {engine.cardFamily(previewLineage.section)}</span>
                  <strong>{previewGrade.name}</strong>
                  <p>{previewGrade.description}</p>
                </div>
                <button type="button" aria-pressed={hand.reserve.includes(previewLineage.id)} onClick={()=>hand.toggleReserve(previewLineage.id)}>
                  {hand.reserve.includes(previewLineage.id) ? "Remove from reserve" : "Place in reserve"}</button>
                <details className="grade-inspection"><summary>Compare all grades</summary>
                  {previewLineage.grades.map((grade,i)=><p key={i}><b>{grade.name}</b><br/>{grade.instruction}</p>)}
                </details>
                <CardBio text={engine.getCardBio(previewLineage)} />
                <div className="ability-guidance">
                  <span>What this adds</span>
                  <ul>
                    {previewLineage.goals.map((goal) => (
                      <li key={goal}>{goal}</li>
                    ))}
                  </ul>
                </div>
                <code>
                  {previewGrade.instruction} Focus on these outcomes:{" "}
                  {previewLineage.goals.join(" ")}
                </code>
              </CardInspector>,
              portalTarget,
            )
          : null}
      </div>

      {portalTarget
        ? createPortal(
            <DragOverlay dropAnimation={null} zIndex={120}>
              {dragLineage ? (
                <div className="lineage-card card-drag-overlay is-selected">
                  <CardFace
                    engine={engine}
                    lineage={dragLineage}
                    values={values}
                    selected
                  />
                </div>
              ) : null}
            </DragOverlay>,
            portalTarget,
          )
        : null}
    </DndContext>
  );
}
