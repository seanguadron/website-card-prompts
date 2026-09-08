---
gate: integration
date: 2026-09-08
surface: The deck board (built 2026-09-05; board view of /tools/prompt-builder, /tools/picture-deck, /tools/sound-deck) - deck-board.tsx, use-board-camera.ts, board-layout.ts, board-prefs.ts, board-archetype-socket.tsx, the three *-flow-panels.tsx, the three deck roots, the Deck Board CSS zone, ARCHITECTURE/DESIGN_DIRECTION/CONTEXT/ADR-0004 docs
result: pass
findings: 0
---

# Integration audit: the deck board (board view, default)

## Result: PASS (0 issues)

| Rule | Status | Evidence |
|------|--------|----------|
| §1.1 registration | N/A | No new tool; the board is a view inside the three registered decks. |
| §1.4 workspace containment | PASS | `DeckBoard` renders only inside the existing `.flow-workspace` form; no shell bar, portal target, or page.tsx touched. |
| §1.4 header/dock unchanged | PASS | The three deck headers and `flow-nav-dock.tsx` are byte-identical; the Board/Flow switch enters through the dock's existing `children` extension point. |
| §1.4 primitive reuse | PASS | `usePortalTarget` for the archetype DragOverlay portal (the exact case ARCHITECTURE §2 warns about); `board-prefs.ts` mirrors the art-pack/dock-corner guard + deferred-restore idiom; the camera's reduced-motion `matchMedia` ref matches the `use-card-deck-motion.ts` precedent; the new primitives were added to the ARCHITECTURE §3 table in the same change. |
| §2.1 / §2.2 catalogs | N/A | No `src/data` change; the PROMPT_ROLES drift check passes. |
| §2.3 trust boundary | PASS | `isBoardMode` is a real two-value guard; `readBoardMode` falls back, never casts; all three call sites restore post-mount. |
| §2.4 injection | PASS | No eval / new Function / dangerouslySetInnerHTML in any new file. |
| §3.3 gov:node graph | PASS | `check:standards` green; ADRs carry no marker by existing convention. |
| Conventions | PASS | Kebab-case files, `use-*` hook, `"use client"` on every hook/JSX file and absent from the alias-free `board-layout.ts`. |
| Flow-mode aria-hidden / inert parity | PASS | Traced through the diff: six per-panel pairs replaced by one generic pair keyed on array index, equivalent because the panels array is built in FLOW/PICTURE/SOUND_PANEL_INDEX order (0..N, literal). Flow behaviour unchanged. |
| Board-mode scoping | JUDGMENT | Inactive boards carry no `aria-hidden`/`inert`, deliberately: Tab-driven focus is what glides the camera. Resolved the same day (below). |
| Docs cross-check | PASS | Every concrete claim (zoom range, 45% tier, 380ms glide, 420ms/70ms deal, zone order) matches code by line number. |
| Build verification | PASS | typecheck, lint, check:standards, check:security clean; 146/146 tests; `next build` 9 routes. |

## Required fixes

None blocking.

## Resolution of the judgment note (main agent, 2026-09-08)

- The assistive-technology model is now written down: every board stays
  present and reachable as a labelled region, the framed board carries
  `aria-current="true"` (`deck-board.tsx`), and `docs/DESIGN_DIRECTION.md` →
  The board plus `docs/ARCHITECTURE.md` → "Two containers, one deck" state
  the rule "boards are never inerted" and why.
- `docs/BOARD_VISION.md`'s "the only `@dnd-kit` importer" line corrected.
- A screen-reader pass with the `audit` skill on board mode is still owed
  (recorded in STATE.md); the deterministic and structural checks passed.

## Notes

- Design gate owed for the same surface (rule 20); run the same day.
- Run by the integration-gate agent (read-only); saved by the main agent per
  STANDARDS §3.2.
