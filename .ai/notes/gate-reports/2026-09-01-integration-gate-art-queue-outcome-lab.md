---
gate: integration
date: 2026-09-01
surface: "CRAFT deck art-queue mode + Outcome Lab (93c1672, 9913dc8, b741b11)"
result: FAIL -> fixed
findings: 3 substantive + 1 cosmetic, all applied same day
---

# Integration gate: art-queue mode + Outcome Lab

- **§2.1 — `outcome-scenarios.json` was an unvalidated catalog:**
  data:validate was green only because it never read the file. **Fixed:**
  registered in `catalogFiles`, given a schema block in
  `prompt-catalog.schema.json` (required, additionalProperties false, id
  pattern), a duplicate-id check beside the proof-scenario precedent, and a
  line in the data README.
- **§2.3 — fetched shard JSON trusted by cast:** same finding as the
  security gate's Medium; fixed once with shape guards (see the security
  report).
- **§1.4 — ARCHITECTURE.md understated reality:** the studio was documented
  as the endpoint's only caller, and the output-dock row predated the
  Prompt|Outcome switch. **Fixed:** §1 documents the deck as a second,
  dev-gated caller and names the flag+probe gating pattern for reuse; the
  primitives table notes the optional `outcomeView` slot.
- **Cosmetic:** `artQueue={artQueue}` indentation aligned with its siblings.

Passed as-built: shell contract (dock stays a direct workspace child; the
lab composes into the existing dock primitive, no new portal), §2.4, §3.3,
naming conventions, test coverage (162 incl. 11 new cases), dependency rules
(devDependency, dynamic import, never in src/), dev-only guards (S4 covers
the new view; ART_AUTHORING inlines out of production).
