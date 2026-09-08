# The board is a second container for the same panels, built in DOM and CSS transforms

Status: accepted · 2026-09-05

The board direction (`docs/BOARD_VISION.md`) could have been built three
ways: a new component tree per deck (the panels rebuilt as board objects), a
canvas or WebGL scene (Balatro-like table physics, off the DOM), or a camera
over the existing DOM. We chose the last. Each deck's panels file builds its
panel contents once and hands them to either the flow container or the board
container (`DeckBoard`); the board is a pasteboard with a translate-and-scale
world layer, the pattern of the WebGamingPlatform spec canvas. The sockets,
the hand, and the tuning console ARE the existing workbench, restyled by one
CSS zone.

**Considered.** React Flow: a node-graph library whose nodes are not forms,
whose measurement already fought the shell (the Architect Wizard's breakout),
and which left with the split. A canvas or WebGL scene: every card, slider,
and textarea would be re-implemented off the DOM and keyboard parity would
start from zero, against a standing rule. A parallel component tree: two
implementations of every section to keep in step.

**Consequences.** The board inherits every existing behaviour for free (drag
and drop, previews, dictation, sessions, undo, the output dock, the mobile
gate), and the flow stays one click away, so the evaluation the owner wants
is a switch, not a branch. The cost is that a board is a scaled DOM subtree:
dnd-kit and the floating previews work because they measure client rects,
but anything that scrolls an ancestor would fight the camera, which is why
the pasteboard is `overflow: clip` and boards are measured with offset
metrics. Richer table physics (free card placement, shuffles, card backs)
will be additions to the world layer, not a rewrite.
