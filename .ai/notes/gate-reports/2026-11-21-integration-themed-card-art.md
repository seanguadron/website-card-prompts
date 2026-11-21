---
gate: integration
date: 2026-11-21
surface: "Deck world selection, card backs, SONIC faces and first-visit motion"
result: PASS
findings: "One Medium documentation issue fixed"
---

The revised architecture section in docs/ARCHITECTURE.md:155 documents the shared world preference, the Gallery face pack and SONIC face lookup. The three existing routes retain their common shell and art frame. src/hooks/use-deck-theme.ts validates restored state via the fixed list in src/lib/deck-theme.ts. No card catalog or prompt output changed. Typecheck and both focused test files passed, including shipped-file checks for nine backs and every built-in SONIC face.
