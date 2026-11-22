---
gate: design
date: 2026-11-21
surface: "All-deck review fixes, storage, archetype previews and hand semantics"
result: PASS
findings: "One Medium keyboard issue corrected"
---

On narrow screens, archetype details use the space beside the rail and scroll at native text size. src/components/board-archetype-socket.tsx:106 makes the read-only details panel programmatically focusable and names it. src/hooks/use-card-inspection.ts routes Alt+Down from the card into that panel and Escape back to the card. The desktop fit and reduced-motion behavior remain available. The preset form gives a visible alert and preserves editable input after a failed save. Keyboard behavior was reviewed in source; the implementer is running the interaction check.
