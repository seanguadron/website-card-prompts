---
gate: design
date: 2026-09-01
surface: "CRAFT deck art-queue mode + Outcome Lab UI (93c1672, 9913dc8)"
result: FAIL -> fixed
findings: 1 High / 2 Medium / 2 Low, all applied same day
---

# Design gate: art-queue mode + Outcome Lab

- **High — "The exact question asked" disclosure was under the 24px target
  floor** (a bare 0.72rem summary with no padding; every other summary in
  the codebase sets an explicit size). **Fixed:** flex, `min-height: 28px` —
  the same control tier as the rest of the feature.
- **Medium — the queue badge painted over the card's own identity code**
  (both toplines render a right-aligned code in the same corner, z-index 1
  under the badge's 2). **Fixed:** badge moved to `top: 34px`, below the
  topline, on the art face's textless corner.
- **Medium — the Outcome view had no live region** while its Prompt sibling
  announces via `aria-live`. **Fixed:** the result body renders inside
  `.outcome-result[aria-live="polite"]`.
- **Low — pressed translation missing** on the two new switch idioms and the
  dock toggle/clear, breaking parity with the world switch they mirror.
  **Fixed:** `:active:not(.is-active) { transform: scale(0.97); }` on all.
- **Low — `.outcome-answer` at 0.8rem** — the dock's one real prose element,
  under the documented body floor. **Fixed:** 0.875rem.

Passed as-built: mode legibility before the click (border tint + copy cursor
+ toggle text swap), badge color pairing (--brand-cyan/-foreground), aria
semantics (aria-pressed dropped when click stops meaning equip), the switch
idiom byte-matching the world switch, contrast on all new token combos, dock
structure (a view state, not a new column), voice, motion. Amendment (l)
(document the new idioms in DESIGN_DIRECTION) is flagged in SESSIONS.md; the
0.66-0.72rem micro-label sizes fold into the already-pending micro-type-tier
amendment rather than re-flagging.
