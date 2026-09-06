<!-- gov:node id=board-vision kind=doc title="BOARD_VISION.md (owner direction for the next major change, captured, not designed)" reads=docs/ARCHITECTURE.md,docs/DESIGN_DIRECTION.md,docs/adr/README.md -->

# Board vision — the next major change, captured before it is designed

**Status: direction captured 2026-09-05 from the owner's dictation. Nothing
here is decided, designed, or scheduled.** The owner asked for this to be
stored for a later step and asked, in the same breath, that it NOT be
conceptualized yet. More inputs are coming (§5). When the work starts it
begins at the design layer with the owner's clarifying interview, and the
first decisions that pass the ADR bar get `docs/adr/` entries. Until then
`docs/DESIGN_DIRECTION.md`, `docs/ARCHITECTURE.md`, and `docs/STANDARDS.md`
govern everything that ships.

## 1. What the owner said, kept close to his words

**The split.** This project becomes the card project: the **CRAFT, SONIC,
and PICTURE** decks. The **Vector Editor, Image Editor, and Skills wiki** go
to a separate project, and so does the **Architect Wizard** ("Arc"). "These
things are not going to be the same." *Done 2026-09-05 on the owner's
instruction: the four tools now live in `W:\Local Files\Codex\DigiEditors`
(`docs/adr/0003-split-into-two-projects.md`).*

**The board.** The card project becomes "more like a board system": a
Miro-like board that archetypes drag onto. There is an archetype slot, "an
archetype master area." Dropping an archetype builds out everything. You do
not see everything spread out at once (not Context, Action, and Role side by
side); you go to the next board, "like next page, next board." The board
zooms in and out, scrolls, and pans. "You're going to be free now."

**The space.** Boards exist in a quasi-2D/3D space, "2.5D," where cards can
flip and shuffle, "more like a card game."

**Where the feel comes from.** The Architect Wizard's 2D platform (the
endless board, dragging and dropping components) is the direction even
though Arc itself leaves. The owner will provide another codebase for
inspiration and references for what the card system should be. The
reference codebase named so far is `W:\Local Files\ClaudeCode\WebGamingPlatform`
(§3).

## 2. The advisor note the owner relayed

Quoted as given:

> "I think you're heading toward a workspace, not a site. I couldn't pull up
> your current cards from the public web, but for references, Miro, FigJam,
> Apple Freeform for spatial canvas patterns, and for card feel, Balatro,
> Marvel Snap, and even Inscryption in tone though it's much heavier. I'd
> suggest 2.5D cards, depth and tilt, soft shadows, smooth flips. Keep the
> board mostly flat and treat sockets as scaffolding for context, target,
> archetype. That feels more like a design tool for prompts, not a website
> with cards."

The only reading recorded here: the board stays flat and the cards carry the
depth; "sockets" are the slots for context, target, and archetype.

## 3. Reference code, with pointers

### WebGamingPlatform (the board reference)

Its spec-board tool is described in its own `AGENTS.md` as "an infinite
Miro-style canvas." The parts worth reading first:

- `src/app/specs/[specId]/spec-canvas.tsx`: the pointer contract is in the
  file header. Background drag is marquee; space+drag or the middle button
  pans; wheel pans; ctrl+wheel zooms to the cursor; eight resize handles;
  snapping to sibling and parent edges with guide lines; inline text edit on
  double-click. Items render in one transformed world layer
  (`translate(tx, ty) scale(s)`), and handles, strokes, and guides divide by
  scale so they stay screen-sized.
- `src/app/specs/[specId]/spec-workspace.tsx`: the single-draft doctrine.
  Every mutation goes through `changeDraft(updater, gestureKey)`; history
  entries with the same gesture key within 1.5s coalesce, so a drag is one
  undo step. Debounced autosave after every change.
- `src/lib/spec-geometry.ts`: pure helpers shared by canvas, layers pane,
  and compiler: containment, `snapRect` / `snapEdge` / `snapCandidates`,
  reading order.
- `docs/adr/0003-spec-items-world-coordinates-parent-id.md`: items store
  WORLD coordinates; containment is a `parentId`, one level deep; moving a
  frame moves its children explicitly; dropping an element's center inside a
  frame re-parents it.
- `src/components/board/board-scaler.tsx`: fit-scale a fixed design space;
  the applied scale flows through React (`onScale`), not a DOM observer.
- Its model, per its `AGENTS.md`: frames (screens) hold shapes, text, and
  images with semantic roles; cards are typed templates defined as data;
  connectors are semantic; `items` array order is z-order.

### This repository (what already exists and carries over)

- `../DigiEditors/src/components/architect-canvas.tsx` (moved with the
  split): the `@xyflow/react` canvas, the infinite pan/zoom precedent. The
  full-bleed cockpit pattern (`fullBleed: true` in the registry,
  `.page-stage.is-fluid`) stayed here in the shell.
- `src/components/prompt-card-workbench.tsx`: the only `@dnd-kit` importer.
  Card drag, slots, the drop settle; with `prompt-role-workbench.tsx` it is
  also where `src/hooks/use-card-deck-motion.ts` runs the pointer tilt
  (`--card-tilt-x/y`, `perspective(720px)` in `globals.css`), the seed of
  "2.5D."
- `../DigiEditors/src/hooks/use-canvas-viewport.ts` (moved with the split):
  the Image Editor's viewport hook (canvas, minimap).
- `src/components/flow-nav-dock.tsx`: a movable, snapping, persisted window
  inside the workspace; the first object that lives "on" a surface rather
  than in a column.
- The shared card engine, the three catalogs, and the art packs (1,104
  images; `docs/ARCHITECTURE.md` §1). The cards themselves are unchanged by
  any of this.
- `docs/DESIGN_DIRECTION.md` → CRAFT Deck card system: the current card
  grammar (5:7 ratio, tilt on fine pointers, drop settle up to 240ms,
  bounded non-looping motion, keyboard parity for every drag).
- The Outcome Lab (`src/lib/outcome-lab.ts`): precached answers keyed by
  card combination; a board that builds out a combination has something
  real to show for it.

## 4. Tensions the design step will have to resolve

Questions for the interview, not answers:

- `PRODUCT.md` lists "site-wide 3D tilt" and "cinematic reveals" among the
  anti-references, and `docs/DESIGN_DIRECTION.md` says motion communicates
  state. A 2.5D card space has to give each motion a meaning (flip, shuffle,
  tilt) or amend the direction with consent.
- The shell contract (three bars and a stage, `docs/ARCHITECTURE.md` §2) was
  written for tools in a toolbox. A single workspace may not want a tool tab
  bar; STANDARDS §1.1 and §1.4 name the registry and the shell.
- What a board IS relative to a C.R.A.F.T., P.I.C.T.U.R.E., or S.O.N.I.C.
  section, and how "next board" relates to the current step strip and
  nav dock.
- Persistence: boards as local JSON under the existing `useLocalDraft`
  doctrine, versus the reference project's file-JSON server storage. This
  project ships no server.
- Keyboard access for a spatial canvas. Keyboard parity for every drag is a
  standing rule; a board needs a keyboard model, not just a pointer one.
- The mobile gate: a board is a desktop cockpit; the gate pattern exists.
- ~~The split itself~~: decided and done, ADR-0003. This repository kept the
  history, the Vercel project, the shell, the studio, and the art pipeline.

## 5. Pending inputs from the owner

- The second codebase for inspiration (not yet provided).
- References for the card system (not yet provided).
- The clarifying interview before any plan: his stated pattern is questions
  until roughly 95% confidence.

## 6. What this document is not

Not a spec, not a plan, not a design direction, and it supersedes nothing.
Append to it when the owner adds direction; do not design in it.
