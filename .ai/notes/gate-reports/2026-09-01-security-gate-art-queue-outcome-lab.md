---
gate: security
date: 2026-09-01
surface: "CRAFT deck art-queue mode + Outcome Lab (93c1672, 9913dc8, b741b11); /api/card-art"
result: FAIL -> fixed
findings: 1 High / 1 Medium / 1 Low, all applied same day
---

# Security gate: art-queue mode + Outcome Lab

- **High — the writer authenticated its target, not its caller.**
  `/api/card-art` checked only the `Host` header; a cross-origin page in the
  same browser could blind-POST JSON as text/plain (no CORS preflight) while
  the dev server ran, reaching every write op. Architectural and
  pre-existing, surfaced because the route changed this session. **Fixed:**
  `isSameOriginRequest` (rejects `Sec-Fetch-Site` other than
  same-origin/none; rejects mismatched `Origin`) on GET and POST, plus a
  second independent layer — POST requires `x-card-art-intent: write`, a
  non-safelisted header that forces any cross-origin sender into a preflight
  the endpoint never approves. Clients (deck queue lib + studio send) attach
  it. Verified live: same-origin GET 200, header POST 200, header-less POST
  403.
- **Medium — fetched outcome JSON trusted by cast.** A malformed
  `public/proof-outcomes/` shard would throw during render with no error
  boundary above it (STANDARDS §2.3). **Fixed:** `isOutcomeMeta` /
  `isOutcomeShardFile` / `isOutcomeEntry` shape guards; failures degrade to
  the existing "missing" state.
- **Low — prototype-chain lookup.** `entries[comboKey]` without an
  own-property check. **Fixed:** `Object.hasOwn` guard, matching the route's
  own `deck=__proto__` precedent.

Gate notes worth keeping: `ART_AUTHORING` + loopback probe hold up
(production bundle compiles the mode out; LAN Hosts refuse); zero
`dangerouslySetInnerHTML` anywhere touched; model text renders only as React
text children — a tampered shard could crash (now guarded), never script.
`@anthropic-ai/sdk` is a devDependency reached only by dynamic import in the
node-only script; `.env.local` and the batch state file are gitignored and
key-free. Proposed amendment (m) flagged in SESSIONS.md: threat-6 should
require origin validation, not just Host, on write-capable handlers.
