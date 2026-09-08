---
gate: design
date: 2026-09-08
surface: The deck board (built 2026-09-05; board view of /tools/prompt-builder, /tools/picture-deck, /tools/sound-deck) - deck-board.tsx, board-archetype-socket.tsx, the Deck Board CSS zone, the three *-flow-panels.tsx, the Board/Flow switch in the three deck roots
result: fail
findings: 5
---

# Design review: the deck board (default view)

## Result: FAIL (2 high / 2 medium / 1 low), every finding fixed the same day

| Check | Status | Sev | Finding | Fix applied |
|---|---|---|---|---|
| Board-mode responsive collapse | FAIL | High | The unscoped `.builder-main-layout.is-board-mode` rule outranked the 1180px and 1100px collapse resets by specificity, so below 1100px board mode kept reserving a 380px dock column the dock had already left (the dock goes `position: absolute` there) and never collapsed to one column. Contradicts DESIGN_DIRECTION → Layout ("below 900px the work area becomes one column"). | Board-mode rules added inside both media queries in the Deck Board zone: `minmax(0,1fr) 360px` / `52px` at 1180px, a single `"work"` column at 1100px. |
| Pasteboard focus ring | FAIL | High | `.deck-board:focus-visible` used a 45%-alpha cyan ring: ≈1.7:1 on the light canvas, under the 3:1 non-text floor; ≈3.3:1 dark. The sitewide ring is fully opaque. | Ring now `0 0 0 3px var(--brand-cyan)`, full token strength, both themes. |
| Complete pip | FAIL | Medium | "Complete" differed from incomplete only by border and text colour; PRODUCT.md forbids colour alone for state, and the step strip's own complete state uses a fill. | A `::after` check badge (cyan fill, dark ink, a 1px ring in the bar's surface so it reads on the active fill too); the pip is now `position: relative`. |
| Far-zoom simplification | FAIL | Medium | Lineage and role cards drop to art below 45%, archetype cards kept their topline and name illegibly visible. | `.board-archetype-topline` and `.board-archetype-card strong` added to the far-tier hide list. |
| Dead tilt plumbing on the archetype hand | Note | Low | `data-motion-card` and the tilt custom properties were declared but no `useCardDeckMotion` handlers were wired, so the hand never tilted. | `useCardDeckMotion` wired onto `.board-archetype-hand`, matching the sibling card grids. |
| Color tokens (accent by job) | PASS | — | Fills pair with `--brand-cyan-foreground`, text with `--brand-cyan-text`, borders/rings/fills with `--brand-cyan`; no raw hex, no magenta; "the board adds no hue" holds. | — |
| Geometry, camera, Setup board, table layout, the deal, the bar, keyboard, voice, anti-goals | PASS | — | Every literal in the direction (14px/20px radii, 1280 world width, 380ms glide, 8–200% zoom, 45% tier, 420ms/70ms deal, bottom-left bar, the shortcut set) matched the code by line; no glass, no parallax, the only rotateY is the one-shot deal; no page-load choreography. | — |

## Notes recorded by the gate, and what was done with them

- **Duration tension**: the general Motion cap (150–200ms, 240ms settle) read as contradicting the board's 380ms glide and 420ms deal. Resolved in `docs/DESIGN_DIRECTION.md` → Motion: the two are named exceptions because they move a whole scene, user-initiated, run once, cut under reduced motion.
- **Sitewide**: many hover/active transitions (pre-existing and a few new ones in this zone) animate border-color / background / box-shadow beside transform, exceeding "opacity or transform only" read literally. Pre-existing pattern; a documentation clarification is proposed, not a board fix (flagged for the sessions log).
- The surface's inset 1px highlight beside its drop shadow was read as a rim light, not a second large shadow; accepted as is.
- Verified after the fixes in the running dev server at 1440px and 1000px widths, both themes.

Run by the design-gate agent (read-only); fixes and this record by the main
agent per STANDARDS §3.2.
