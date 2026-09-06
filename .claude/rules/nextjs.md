---
paths:
  - "src/app/**"
  - "src/hooks/**"
  - "next.config.ts"
---
<!-- gov:node id=rule-nextjs kind=rule title="Next.js rules (path-scoped, Claude Code)" reads=docs/ARCHITECTURE.md,docs/STANDARDS.md -->

# Next.js rules (loaded when framework code is touched)

## Version truth (AGENTS.md rule 7)

- `package.json` says what is installed (Next 16 App Router and React 19 at
  the time of writing; re-read it, do not trust memory). Patterns differ
  across 14 / 15 / 16: async `params`, the `middleware` → `proxy` rename,
  caching directives. Use `next-best-practices` for file conventions, RSC
  boundaries, metadata, and hydration errors.

## Boundaries

- `page.tsx` is a server component carrying metadata; it renders one
  `"use client"` component from `src/components/`. Push `"use client"` to the
  leaves.
- Browser state comes through `useSyncExternalStore` (`useMediaQuery` is the
  model); the lint rules reject effect-driven `setState` for it.
- Portals: `usePortalTarget`, never a `document` read during render (see the
  UI rules for why).

## Route handlers are the exception, and guarded

- The app ships NO server surface to users. The only handler is the
  development-only Card Studio writer (`src/app/api/card-art/route.ts`).
  Any handler must: bail on `NODE_ENV === "production"` (`check:security`
  S4 fails the build otherwise), require a loopback `Host`, check the
  request's origin (`Sec-Fetch-Site` / `Origin`) plus a write-intent header
  outside the CORS safelist, take KEYS never paths, and validate a candidate
  catalog with the real validator before writing (`docs/ARCHITECTURE.md`
  §1). `allowedDevOrigins` is not a security boundary.
- `src/components/theme-script.tsx` is the ONLY allowlisted injected script.
  Growing that list requires the owner's consent (STANDARDS §2.4).

## Persistence (`docs/ARCHITECTURE.md` §6)

- Keys are `digitools.<tool>.<thing>-v1` plus a sibling `...saved-at`. New
  tools use `useLocalDraft`, `useUndoableState`, and `SaveStatus`.
- Every localStorage read of externally influenced data is a trust boundary:
  shape-validate, degrade to defaults, never bare-cast (STANDARDS §2.3). Do
  not unify the two existing saved-at byte formats.

## Dev and deploy

- Dev server on port 5100; never start a second; never `npm run build` while
  one may be live (shared `.next/`). `npm run dev:clean` clears a stale
  Turbopack cache.
- Vercel deploys `main`. Large static trees (`public/card-art`,
  `public/proof-outcomes`) must stay out of any function bundle through
  `outputFileTracingExcludes` (the 250MB ceiling broke a deploy on
  2026-08-20). Card-art URLs carry `?v=`; `images.localPatterns` admits it.
- A cockpit tool gates on phones through the registry (`mobileSupport:
  "gated"`); `PHONE_MEDIA_QUERY` stays byte-identical to the CSS query.
