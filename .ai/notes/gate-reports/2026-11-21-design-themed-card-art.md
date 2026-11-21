---
gate: design
date: 2026-11-21
surface: "Deck world selection, card backs, SONIC faces and first-visit motion"
result: PASS
findings: "No required fixes"
---

The nine shipped WebPs were visually inspected together. The pen, prism and waveform remain recognizable at thumbnail size, with engraved, botanical and comic borders distinguishing the worlds. The four SONIC-specific assets show impact, breaking glass, an interface switch and a mechanism. Existing Gallery illustrations supply the other subjects. The picker uses labeled buttons with aria-pressed. src/components/deck-board.tsx:33 tracks visited sections and honors reduced motion. The frame in src/components/prompt-builder-ui.tsx:89 preserves existing face art and uses the themed emblem as a fallback. docs/DESIGN_DIRECTION.md:389 records the bounded deal and deck art direction.
