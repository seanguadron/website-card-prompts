---
gate: integration
date: 2026-11-21
surface: "Shared Archetypes rail, Board and Flow, all three decks"
result: PASS
findings: "One Medium documentation issue fixed"
---

docs/ARCHITECTURE.md:46 now accurately describes the shared rail and portaled Setup socket. All three registered deck roots reuse BoardArchetypeSocket across Board and Flow. The deck-specific save and delete handlers and existing per-deck favorites keys remain wired through the shared component. Typecheck and the standards check passed.
