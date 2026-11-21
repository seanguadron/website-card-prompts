---
gate: security
date: 2026-11-21
surface: "Shared world preference and local card artwork"
result: PASS
findings: "0 findings"
---

The restore path at src/hooks/use-deck-theme.ts:15 validates parsed storage against the three exact IDs in src/lib/deck-theme.ts:12 before applying state or constructing asset URLs. Malformed JSON, missing storage and unrecognized IDs resolve to Sci-Fi. Cross-tab notifications trigger the same validated restore. The picker writes only its selected ID under the existing preference key.

The deck name comes from a fixed component argument. The allowed theme selects a bundled WebP. SONIC portrait lookup at src/lib/sound-card-art.ts:38 checks own keys and returns filenames from fixed maps. The new paths introduce no provider requests, HTML injection, server writes or session data transfers. The deterministic security check passed.
