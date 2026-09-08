---
paths:
  - "src/app/**"
  - "src/components/**"
  - "**/*.tsx"
  - "**/*.css"
---
<!-- gov:node id=rule-ui kind=rule title="UI rules (path-scoped, Claude Code)" reads=docs/DESIGN_DIRECTION.md,docs/ARCHITECTURE.md,PRODUCT.md -->

# UI rules (loaded when interface code is touched)

These are the load-bearing reminders. The canonical documents they point at
win over anything written here.

## Direction

- `docs/DESIGN_DIRECTION.md` is canonical and outranks impeccable and every
  other design skill (STANDARDS §1.2). Read the section for the surface you
  are touching before writing UI. `PRODUCT.md` carries the personality
  (calm, precise, capable) and the anti-references. Root `DESIGN.md` is a
  pointer, not a second source (ADR-0002).
- Pages and components with visual presence owe the **design-gate** agent
  before delivery; a new tool or substantial UI owes the **integration-gate**
  too (AGENTS.md rules 18–20). Reports go to `.ai/notes/gate-reports/`.
- A deck without its own DESIGN_DIRECTION section is a gap to record, not a
  license to improvise.

## Shell contract (`docs/ARCHITECTURE.md` §2–§4)

- A tool is a registry entry + `src/app/tools/<id>/page.tsx` (a thin server
  component) + one `"use client"` component. The header portals through
  `<ToolSubbar>`. Nothing touches the top bar.
- Any portal that renders on first render resolves its target through
  `usePortalTarget`. Never read `document` during render: the hydration
  mismatch silently client-renders the whole document and wipes the theme
  bootstrap (2026-07-17).
- `FlowNavDock` stays a direct child of `.flow-workspace`; its
  `data-dock-corner` attribute is for CSS only.
- Reuse the primitives table in §3 before writing a new one. The decks share
  their classes on purpose: a restyle lands on every deck at once, so never
  redefine a shared class inside one deck's CSS section.

## The board (`docs/DESIGN_DIRECTION.md` → The board; ADR-0004)

- The board is a container for the same panels, not a second
  implementation: change a section's content in its `*-flow-panels.tsx` and
  both views get it. Board-only styling lives in the
  `/* ===== Deck Board ===== */` zone under `.deck-board`.
- The camera is the only thing that moves the pasteboard: never scroll an
  ancestor inside it (`overflow: clip` is deliberate), measure boards with
  offset metrics, and keep framing math in `src/lib/board-layout.ts` (pure,
  tested), never in components.
- Every board control keeps a keyboard path. Motion on the board is the
  camera glide, the deal flip, and the hover lift, each with a
  reduced-motion fallback; add nothing that loops.

## Color and contrast

- Tokens only, no raw hex. Accents split by JOB: `--brand-cyan` and
  `--brand-magenta` for borders, focus rings, markers, and fills;
  `--brand-cyan-text` / `--brand-magenta-text` for any text, including inside
  `color-mix()`; `--brand-cyan-foreground` for text sitting ON a cyan fill.
  Cyan is never light-theme text.
- Check BOTH themes, text (4.5:1) AND non-text (3:1), and a surface WITH
  content in it, not its empty state.

## Motion

- Motion communicates state. 150–200ms for common transitions, the card drop
  settle up to 240ms, `transform` and `opacity` only, ease-out, a
  `prefers-reduced-motion` fallback for every animation, no page-load
  choreography. Card motion is bounded and non-looping.

## CSS and files

- `globals.css` is zone-ordered with `/* ===== <Tool> ===== */` banners; a
  new tool section appends before the trailing mobile-gate zone; classes are
  prefixed `<id>-`. The shared form, button, and card primitives live in the
  Skills zone (§5): check there before adding a primitive.
- Component filenames are kebab-case (`check:standards` fails otherwise).
- When CSS edits stop taking effect, use the Turbopack stale-stylesheet
  routine in `docs/STATE.md` → Runbook.

## Accessibility and verification

- WCAG 2.2 AA from the start: semantic elements, labelled controls, visible
  focus, and full keyboard parity for every drag interaction. Run the
  `audit` skill before anything client-facing ships.
- Verify rendered in the running dev server on port 5100 (never start a
  second). The headless-preview quirks (lazy card images, the 0×0 viewport,
  navigating with the navigate tool) are in `docs/STATE.md` → Runbook.
