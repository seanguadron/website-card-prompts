---
gate: design
date: 2026-11-19
surface: "Shared board rail, card geometry and deal"
result: PASS
findings: "One Medium and one Low resolved"
---

The review identified a horizontal bounds issue when the viewport resized. CardInspector now clamps both axes and scales to the available height. The motion specification now matches the 400ms flip.
