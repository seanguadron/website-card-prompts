---
gate: design
date: 2026-11-21
surface: "Compact Archetypes and Output chevron headers"
result: PASS
findings: "0 findings"
---

The compact header follows the framework PanelHeader pattern: a full-width native button groups the chevron and title, and an expanded panel shows a downward chevron. Collapsed chevrons point into the workspace from opposite edges. The 32px minimum target, inset focus ring, accessible name, aria-expanded and aria-controls survive the change. References: src/components/rail-toggle.tsx:9 and src/app/globals.css:3180. No catalog, art, motion or provider behavior changed.
