---
gate: security
date: 2026-11-21
surface: "Shared Archetypes rail, Board and Flow, all three decks"
result: PASS
findings: "0 findings"
---

src/components/board-archetype-socket.tsx:152 accepts only a JSON boolean for the shared expansion preference. Malformed JSON, blocked storage and wrong types fall back to the responsive default. Favorites use the existing string-array reader and affect item ordering. Save and delete use the deck's existing local preset callbacks. The deterministic security check passed.
