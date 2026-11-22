---
gate: security
date: 2026-11-21
surface: "All-deck review fixes, storage, archetype previews and hand semantics"
result: PASS
findings: "0 findings"
---

Restore isolates failed draft, hand and timestamp decoding at src/lib/restore-deck-snapshot.ts:6. The common autosave hook handles denied storage access and each deck uses its existing field/card validators. src/lib/deck-library.ts validates the stored entry envelope; deck-specific decoders validate nested data on load. Library names and errors render through React as text. Save and delete failures keep the previous in-memory preset list. No new network recipient, executable content or server write is introduced. The deterministic security check passed.
