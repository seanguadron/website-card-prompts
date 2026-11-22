---
gate: integration
date: 2026-11-21
surface: "All-deck review fixes, storage, archetype previews and hand semantics"
result: PASS
findings: "One documentation issue corrected"
---

The three decks retain separate persisted keys and delegate library operations to createDeckLibrary, including the existing record limit. §6 of docs/ARCHITECTURE.md now describes independent restoration and nested validation. Preset write failures return to the caller before state or success messages change. CRAFT preserves gaps during deals and labels roles by their socket. PICTURE's preset summary and application share the same tail mode. Typecheck and 37 focused restore, engine and prompt tests passed.
