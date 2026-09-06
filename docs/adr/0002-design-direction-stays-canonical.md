# `docs/DESIGN_DIRECTION.md` stays the canonical design direction; root `DESIGN.md` is a pointer

Status: accepted · 2026-09-05 (deliberate deviation from stack v2's ADR-0002)

Stack v2 replaces `docs/DESIGN_DIRECTION.md` with `PRODUCT.md` + `DESIGN.md`
at the project root, because impeccable reads and writes those files and the
`awesome-design-md` library shares `DESIGN.md`'s format. Here the direction
document is 20KB of accumulated resolutions (the accent-token split by job,
the whole CRAFT card grammar, the PICTURE sibling rules), it carries a
gov:node marker, the Design gate agent reads it by name, STANDARDS §1.2 and
AGENTS.md's precedence name it, and the Skills wiki and sessions log refer to
it. Migrating would rewrite gate definitions and a consent-gated rule for no
gain in content, and the next major change (the board direction,
`docs/BOARD_VISION.md`) will reshape the direction anyway. We keep
`docs/DESIGN_DIRECTION.md` canonical, keep `PRODUCT.md` real at the root
(impeccable's `context.mjs` prints it today), and keep root `DESIGN.md` as a
compatible pointer so impeccable's context step still resolves.

**Consequences.** impeccable's `init` is never run here (it would write a
competing `DESIGN.md`); design resolutions are recorded once in
`docs/DESIGN_DIRECTION.md`. If the board redesign produces a fresh visual
system, revisit: a from-scratch `DESIGN.md` in the library format could then
become canonical, with the gate and STANDARDS §1.2 updated under consent in
the same change.
