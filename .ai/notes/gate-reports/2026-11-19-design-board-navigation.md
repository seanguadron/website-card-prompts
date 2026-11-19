---
gate: design
date: 2026-11-19
surface: Direct CRAFT entry, full-width deck board, archetype tray and camera
result: pass
findings: 0
---

The first pass caught horizontal wheel input being consumed over overflowing card hands. The final handler scrolls those hands for horizontal or Shift-wheel gestures and zooms on vertical wheel. Source recheck passed.

Edge verification covered 3840 by 2160, a 1000px top strip, and a 390px phone gate. All decks accepted real pointer drops onto a section. CRAFT role-hand horizontal scrolling and keyboard activation passed.
