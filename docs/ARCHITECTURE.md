<!-- gov:node id=architecture kind=doc title="ARCHITECTURE.md (the app framework contract)" reads=docs/DESIGN_DIRECTION.md -->

# Card Prompts architecture

What the app IS, structurally: the shared shell every tool lives in, the
contract a tool signs to join it, and the primitives it recycles instead of
reinventing. Read this BEFORE building or substantially changing a tool.
STANDARDS §1.4 makes conformance to this contract a gated rule; the visual
language for everything named here is `docs/DESIGN_DIRECTION.md`.

## 1. System shape

Next.js App Router. Every shipped tool is client-side: no accounts, no cloud
sync, no server. State lives in `localStorage`; files enter and leave via the
browser (`src/lib/browser-download.ts`, file inputs). Every tool is:

- a **registry entry** in `src/lib/tool-registry.ts` (`ToolDescriptor`:
  `id`, `name`, `shortName`, `tagline`, `href`, `fullBleed?`,
  `mobileSupport?` + `mobileGateNotes?` — see the mobile gate, §2 — and
  `stage?: "alpha"`, which puts an Alpha flag on the tool's top-bar tab),
- a **route** at `src/app/tools/<id>/page.tsx` — a thin server component
  rendering one `"use client"` component from `src/components/`,
- an optional **catalog** under `src/data/<tool>/` validated by a script +
  schema in the same change (STANDARDS §2.1).

The registry drives the shell tabs. The root route redirects to the registered CRAFT deck.

### Two containers, one deck

Since 2026-09-05 (`docs/adr/0004-board-is-a-second-container.md`) every deck
renders the same panels in one of two containers, chosen from the Workspace menu
and remembered per browser (`src/lib/board-prefs.ts`): the **flow**
(`.flow-viewport` + `.flow-track`, one panel at a time) or the **board**
(`src/components/deck-board.tsx`), the default. The board is a pasteboard
with a camera (`src/hooks/use-board-camera.ts`; the geometry is pure and
tested in `src/lib/board-layout.ts`) over a row of surfaces, one per panel,
plus the Setup board's archetype socket
(`src/components/board-archetype-socket.tsx`). The deck root owns all state
either way; its panels file (`*-flow-panels.tsx`) builds each panel's
contents once and hands them to whichever container is active. Nothing about
the prompt, sessions, undo, or persistence changes with the view. The CSS
zone `/* ===== Deck Board ===== */` restyles the panel internals on the board
(sockets and tuning on top, the hand fanned below); the visual grammar is
`docs/DESIGN_DIRECTION.md` → The board.

The collapsible left rail lives outside the camera transform. The shared rail renders the archetype hand directly and puts its socket in the Setup panel through a portal. Dropping a rail card on the Board or Flow workspace applies the preset. Section cards and CRAFT roles use their workbench drag handlers to equip a particular slot. Clicking a card also equips it. Board and Flow render the same archetype inspection content. Wheel zoom follows the pointer. Primary dragging on a non-interactive surface pans.

Three rules come with it. **The camera is the only thing that moves the
pasteboard**: it is `overflow: clip`, so a focus or a `scrollIntoView` inside
the world cannot shift it; measure boards with offset metrics (they ignore
the world transform), never client rects. **`DeckBoard` positions its
children**: a panel never sets its own `left`, `top`, or `width` on the
board; `BOARD_WIDTH` and `BOARD_GAP` are the layout module's. And **boards
are never inerted**: the flow hides and inerts inactive panels, the board
keeps every board present as a labelled region with the framed one
`aria-current`, because Tab-driven focus is what glides the camera; an
`inert` on inactive boards would break the very navigation the design relies
on (integration gate, 2026-09-08).

### The one server surface: the Card Studio

There is exactly one exception to "no server", and it is an authoring
surface, not a tool. `/studio/cards` and its route handler
`src/app/api/card-art/route.ts` edit the card catalogs and write generated
card art to disk, so the owner does not rename, convert, and move 226 files
by hand or hand-edit JSON to fix a typo. It is **not** in the tool registry:
no nav tab, no home card, nothing links to it.

The studio is no longer the endpoint's only caller, though. The CRAFT deck
has a dev-only **art-queue mode** ("Queue art" in the nav dock): clicking a
card queues one more image of it, through the same route's queue ops. The
gating pattern is the one to copy if a shipped tool ever needs an authoring
affordance again: a build-time flag (`ART_AUTHORING` in
`src/lib/art-queue.ts`, an inlined `NODE_ENV` check that compiles the mode
out of production bundles) decides whether the code exists, and a runtime
probe (fetching the queue on mount) decides whether the control renders —
the endpoint's own production-404 + loopback-Host + same-origin guards stay
the actual boundary. The flag is the affordance; the endpoint is the
boundary; the probe keeps the affordance from appearing anywhere the
boundary would refuse it.

Each card opens with one tab per facet: **Card** (what the card is —
universal, the same in every world) and one per art pack (**Sci-Fi** with
generated art; **Fantasy** and **Superhero** fully authored — 226 briefs
each, 98 with bios — awaiting generation).

What keeps it safe, and what a reviewer should check:

- **Development only, and local only.** Both the page and the handlers bail on
  `process.env.NODE_ENV === "production"`, and the handlers additionally
  require a loopback `Host` — `next dev` binds every interface and
  `allowedDevOrigins` does not gate application routes, so the tools staying
  LAN-previewable must not drag the writer along with them. A raw client can
  forge a Host header, so treat that as narrowing, not sealing.
  `check:security` **S4** fails the build if any route handler under
  `src/app` loses the production guard — checked per handler, and accepting a
  call to a local helper that carries the check.
- **Keys, never paths.** A caller names an entry (`roles.researcher`). Every
  directory and filename is derived server-side by `scripts/art-pack.mjs`
  from the pack id plus that key, and `scripts/card-art-store.mjs` asserts
  each resolved path sits lexically inside its own root. There is no
  client-supplied path anywhere. (Lexical, not `realpath` — a symlink planted
  inside the working tree would still be followed, which presupposes an
  attacker who can already write to the repo.)
- **It makes `src/data` runtime-mutable**, which the trust model otherwise
  forbids. Three writes, each narrow:
  - **status**, in the art pack: selecting an image flips one entry to
    `"generated"` (and back to `"planned"` on "Remove from card"), then
    re-renders the pack's generated doc so a committed doc cannot drift.
  - **bio**, in the art pack: one string, length-capped to the schema's own
    ceiling.
  - **card text**, in a catalog: only the fields in `scripts/card-record.mjs`'s
    closed table are writable — names, descriptions, abilities, goals, grade
    lines, effects, audience. Ids, codes, sections, drivers, affinities,
    track values and equipped cards are readable and never writable, because
    other records reference them.
- **A card edit cannot break the build.** A save builds a *candidate* catalog
  and runs `validateCatalog` — the same function `npm run build` runs — over
  it, writing only if it passes. A rejected save returns the validator's own
  message. That check is deliberately the real one rather than a second,
  weaker copy, and `validateCatalog` is kept a pure function of the catalog
  it is handed so it can be used this way.

The logic lives in `scripts/card-art-store.mjs` rather than the route so the
node runner can test it directly (`scripts/card-art-store.test.mjs`); the
route is a thin HTTP shell. Two working trees, and only one of them is in
git: `card-art-source/` holds the full-res candidates and crops, is never
built, and is **gitignored** (owner's call, 2026-08-19 — ~9GB across four
packs, PNGs that do not delta-compress, growing every art session), while
`public/card-art/` holds the one live webp per card that the app renders and
IS committed. Nothing is lost by that split: the pack files carry the brief
that produced every image, so any card can be regenerated from the repo
alone. The originals live on the machine that generates them and want a
backup that is not git.

### Art packs: what a card looks like, per world

A card is two things, kept in two files:

- **the card** — universal, in `src/data/prompt-builder/*.json`: id, name,
  description, mechanics. Strategist is Strategist in every world.
- **the pack** — per world, in `src/data/prompt-builder/art-themes/<id>.json`:
  the image brief, its alt text, the character **bio**, and whether that
  image exists yet.

A pack stores **no path**. `scripts/art-pack.mjs` derives every path from the
pack id plus the entry key, which is what makes a second world a drop-in:
no file moves, no collisions, an honest per-pack `status`, and no way for
renaming a card in the studio to orphan its art. The deck engine takes
optional `cardArt`/`cardBio` callbacks, so each deck resolves through its own
typed resolver. CRAFT uses `src/lib/art-pack.ts` for its three illustrated worlds. PICTURE uses `src/lib/picture-art-pack.ts` for Gallery. SONIC uses `src/lib/sound-card-art.ts` to associate sources, acoustic characteristics, guide cards and archetypes with dedicated sound illustrations or selected Gallery portraits.

**PICTURE has one face pack**, `src/data/picture-deck/art-themes/gallery.json`. A Watercolor card demonstrates watercolor across all three worlds. Gallery tracks the status and artwork of each entry, including the seven acronym letters on the guide.

The Workspace world picker selects a common art direction for all three decks. `src/lib/deck-theme.ts` resolves the nine card backs and the emblems used on faces awaiting artwork. A CRAFT world also changes its illustrated face pack. CRAFT offers an illustrated
**card style tier** on the guide page — three cards showing the same
Researcher in each world's art, so the reskin is discoverable rather than
hidden in a control. `setActiveArtPack(id)` points every resolver at another
pack, the deck re-renders, and because art and bios resolve at render time
nothing else needs wiring. The guide's style cards read three packs at once
through `packArtFor(packId, key)`, which resolves from a NAMED pack instead
of the active one. The choice persists in localStorage
(`digitools.prompt-builder.art-pack-v1`), restored through the `isArtPackId`
guard — an unknown or tampered value degrades to the default pack
(`PACKS[0]`, sci-fi) rather than throwing.

The shared Workspace menu hosts deck view options, navigation and camera controls. Both the flow and board use the deck root's navigation state. The board's zoom overview names each section and reports its loadout; selecting it frames that section.

A pack whose `theme.draft` is true is skipped by the generator and the
coverage check, so scaffolding a world cannot fail the build. Clearing that
flag is the moment it has to be complete.

## 2. The shell contract

The shell renders one header above the full-width stage. The header contains deck tabs, deck-specific commands and the Workspace menu. Each deck supplies its archetypes, artwork and preset actions to the shared Archetypes rail. The rail lives outside the Board and Flow containers so layout changes preserve the same hand. Archetypes and Output use the same toggle component, mirrored at the workspace edges.

| Region | Component | Content |
|---|---|---|
| Header | `app-shell.tsx` | Brand, deck tabs, deck commands, Workspace menu |
| Deck commands | `tool-subbar.tsx` | Save state, step navigation, history and Tools |
| Workspace menu | `flow-nav-dock.tsx` and `deck-board.tsx` | Board/Flow, navigation, camera and theme |
| Stage | `main.page-stage` | Full-bleed tool workspace |

Shared controls mount in header slots through `usePortalTarget`. The portal targets resolve on the client. Keep deck state in the route component so resizing the shell or switching views preserves the hand. Camera and view commands remain available in the header at narrow widths.

### The mobile gate (registry-driven)

A registry entry with `mobileSupport: "gated"` keeps its cockpit off phone
screens. Below 768px the shell carries `.is-mobile-gated`, which hides the
stage content and any portaled sub-bar/status-bar chrome and shows
`src/components/mobile-tool-gate.tsx` instead (name, tagline,
`mobileGateNotes`, a "Preview anyway" override). The override is
session-scoped — `digitools.mobile-preview.<id>` in sessionStorage via
`src/hooks/use-mobile-preview.ts` — and flips the shell to
`.is-mobile-preview`: the tool renders normally, prefixed by a squeeze-in
notice chip. Both classes are INERT at 768px and above: the media query in
`globals.css` is the only judge of "phone", so SSR output and desktop
rendering are identical with or without them. Cockpit tools gate;
document-style pages (Skills) stay full. Decide per tool in the registry —
the shell and CSS need no changes for a new gated tool.

Two load-bearing details: the phone threshold lives in ONE place
(`PHONE_MEDIA_QUERY` in `tool-registry.ts`, byte-identical to the CSS media
query) so a width can never be gated while a tool's own layout still thinks
it is on a desktop; and the gate section re-enables document scrolling,
because the full-bleed lock (`html:has(.page-stage.is-fluid) { overflow:
hidden }`) is written for the fixed-height desktop cockpit and would
otherwise strand the gate's buttons below the fold on a short screen.

## 3. What the shell does NOT provide — and what to recycle

Left tool strips, right docks/inspectors, canvases, panels: **tool-owned**,
built inside the full-bleed stage. Each deck owns its own layout (the flow
workspace, the card workbench grid, the right-edge output dock). Do not
expect a shell rail; DO recycle these primitives:

| Primitive | File | Use it for |
|---|---|---|
| `ToolSubbar` + parts | `src/components/tool-subbar.tsx` | Deck commands in the shared header (§2). |
| `usePortalTarget` | `src/hooks/use-portal-target.ts` | ANY portal that renders on first render — resolves `document.body` or a slot id without breaking hydration (§2). |
| `formatSaveStatusLabel`, `SaveStatus` | `src/lib/save-status.ts` | Autosave chip labels ("Saved 2:41 PM…"). |
| `useUndoableState` | `src/hooks/use-undoable-state.ts` | Undo/redo: past/future stacks, tag coalescing, `seal`, `jump`, `depth`/`position` for history panels. |
| `useLocalDraft` | `src/hooks/use-local-draft.ts` | Debounced, quota-guarded localStorage autosave with restore-on-mount lifecycle. |
| `EditorTabs` + `tabPanelProps` | `src/components/editor-tabs.tsx` | Accessible roving-tabindex tablists used by Card Studio. |
| `downloadBlob` etc. | `src/lib/browser-download.ts` | All file downloads. |
| `readStored`, `writeStored` | `src/lib/prompt-storage.ts` | SSR-safe JSON localStorage access (see §6 landmine). |
| `useMediaQuery` | `src/hooks/use-media-query.ts` | Live matchMedia state, SSR-safe (`useSyncExternalStore`; the lint rules reject effect-driven setState). |
| `DeckBoard` | `src/components/deck-board.tsx` | The board container: pasteboard, camera, one surface per child, the pips/zoom bar. Hand it the panel contents in FLOW_PANEL order. |
| `useBoardCamera` + `board-layout.ts` | `src/hooks/use-board-camera.ts`, `src/lib/board-layout.ts` | The camera (gestures, keyboard, framing) and its pure geometry (`fitRect`, `zoomAround`, `panBy`, tiers). Reuse for any future world-space surface. |
| `BoardArchetypeSocket` | `src/components/board-archetype-socket.tsx` | The Setup board's socket + hand, generic over `{id, code, name, description, details, art?}`. |
| `readBoardMode`, `writeBoardMode` | `src/lib/board-prefs.ts` | The per-deck view preference behind an `isBoardMode` guard. |
| Output dock | `prompt-output-dock.tsx` | All three decks use this panel to preview, copy and download locally assembled prompts and skills. |

Since the 2026-09-05 split (`docs/adr/0003-split-into-two-projects.md`) the
Architect Wizard, Image Editor, Vector Editor, and Skills wiki live in the
sibling Digi Editors project, with their primitives (`EditorMenubar`,
`EditorDialog`, `zip.ts`, `units.ts`, `useCanvasViewport`, `CopyButton`).
Port one back deliberately if a deck needs it; do not re-add the tools.

## 4. Adding a tool, end to end

1. **Registry**: add the `ToolDescriptor` to `src/lib/tool-registry.ts`
   (extends the `ToolId` union — this is the only compile-time guard).
   Decide `fullBleed` intentionally: `true` for cockpit tools, `false` for
   document-style pages (Skills is the simple template). Decide
   `mobileSupport` the same way: cockpits gate (`"gated"` +
   `mobileGateNotes`), document pages don't (§2, the mobile gate).
2. **Route**: `src/app/tools/<id>/page.tsx` (server component, metadata) →
   renders `src/components/<id>.tsx` (`"use client"`).
3. **Header**: portal via `<ToolSubbar className="<id>-subbar">` (§2).
   Report save and action status beside its associated control.
4. **State**: `useLocalDraft` for persistence (keys
   `digitools.<id>.<thing>-v1`), `useUndoableState` for history,
   `SaveStatus` for the chip.
5. **Navigation**: the registered route appears in the deck tabs. CRAFT remains the root destination.
6. **Styles**: append a banner-delimited section to `src/app/globals.css`
   (`/* ===== <Tool name> ===== */`), classes prefixed `<id>-`. Reuse the
   shared form/button/card vocabulary (§5) before writing new primitives.
7. **Data**: any catalog under `src/data/` ships WITH its validator/schema
   wiring and test-count updates (STANDARDS §2.1).
8. **Gates**: Integration (§1.1 registration + §1.4 shell contract) and
   Design are owed; Security too if you touch import/export, localStorage,
   downloads, or rendering paths (Rules 18–20). Reports → the gate ledger.
9. **Checks**: `npm run typecheck · lint · test · data:validate ·
   check:standards · check:security`; verify rendered UI in the running dev
   server (port 5100 — never start a second; headless-preview quirks are in
   STATE.md's runbook).

## 5. globals.css zones

One file, zone-ordered: tokens (`:root`, ~1–54) → shell chrome (~56–376) →
Welcome → **the SHARED form/button/card primitives and the deck guide pages
interleaved** (`.tool-kicker`, `.button`, `.field`, inputs — check here
before adding a primitive; the Skills wiki block that used to open this range
left with the split) → Prompt Builder → PICTURE Deck → SONIC Deck → Deck
Board (the board container and its overrides of the panel internals) → Card
Art Studio (`/* ===== ... ===== */` banners) → Mobile tool gate (the phone-width
§2 rules; last because its overrides must beat the shell and tool rules on
source order). New tool sections append before that trailing zone, with a
banner.

## 6. Persistence conventions

- Keys: `digitools.<tool>.<thing>-v1`, plus a sibling `...saved-at` key.
- The theme key is `digitools.theme` (read pre-paint by the bootstrap in
  `src/components/theme-script.tsx`, injected into the streamed `<head>` via
  `useServerInsertedHTML`; the toggle in `app-shell.tsx` writes it).
- **Landmine — two saved-at byte formats coexist**: `writeStored` JSON-encodes
  (quoted) what it stores, and the Architect Wizard (now in Digi Editors)
  wrote its saved-at that way; the decks store raw ISO strings via direct
  `setItem`. Do NOT unify existing keys — you'd orphan users' timestamps.
  New tools: use `useLocalDraft` and its documented format.
- The three decks keep separate storage keys. `restoreDeckSnapshot` recovers the draft text and equipped cards independently. `createDeckLibrary` shares saved-entry validation, writes and the 50-entry limit. Each deck validates nested card and draft data when it loads the entry.
- Every localStorage READ of externally-influenced data is a trust boundary:
  validate shape before use, never bare-cast (STANDARDS §2.3).

## Exporting a hand as a skill

The shared output dock previews and downloads a local SKILL.md. Decks supply their reusable choices to the compiler in `src/lib/deck-skill.ts`. The current subject or one-off brief belongs to the prompt export. Browser storage keys keep their original namespace for compatibility.
