---
gate: security
date: 2026-09-05
surface: The deck board (board view of /tools/prompt-builder, /tools/picture-deck, /tools/sound-deck) - src/lib/board-prefs.ts, src/components/board-archetype-socket.tsx, src/components/deck-board.tsx, src/hooks/use-board-camera.ts, src/lib/board-layout.ts, the three *-flow-panels.tsx, the three deck roots, the Deck Board CSS zone
result: pass
findings: 0
---

# Security audit: Deck Board (CRAFT / PICTURE / SONIC, 2026-09-05)

## Result: PASS (0 findings)

Evidence the gate recorded:

1. `src/lib/board-prefs.ts` validates the new localStorage key before use:
   `isBoardMode` is a real type guard (string + allowlist of two values),
   `readBoardMode` reads `unknown` and returns the caller's fallback on
   anything else. All three call sites restore post-mount. The STANDARDS
   §2.3 pattern, and the reference the two latent bare-cast sites
   (`prompt-session.ts`, `prompt-storage.ts`, unchanged today) should adopt.
2. `board-archetype-socket.tsx` drag ids carry only an id from the deck's
   own in-memory lists (catalog + already shape-validated custom presets);
   `applyArchetypeById` in every deck root resolves by strict-equality lookup
   and no-ops on a miss. Rendered fields go through JSX escaping; no new
   `dangerouslySetInnerHTML` anywhere (the allowlisted theme bootstrap remains
   the only instance).
3. `deck-board.tsx` / `use-board-camera.ts`: the `data-board-index`
   readback is app-authored DOM, narrowed anyway (`Number` +
   `Number.isInteger`); keyboard navigation clamps; an out-of-range index
   only makes `boardRect` return null. Listeners are added and removed
   symmetrically; Space-to-pan capture is scoped to the pasteboard subtree.
4. The three panels files build board specs from static constants and render
   catalog strings as text; no exporter or download path changed.
5. The Deck Board CSS zone is presentation-only (no `url()`, `attr()`,
   `expression()`, `javascript:`).
6. The Card Studio endpoint files did not change; no re-audit owed.
7. `npm run check:security` passes.

## Notes

- No STANDARDS amendment proposed.
- Run by the security-gate agent (read-only); saved by the main agent per
  STANDARDS §3.2.
