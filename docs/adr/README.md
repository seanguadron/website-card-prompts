<!-- gov:node id=adr-index kind=doc title="ADR index (decision records)" reads=docs/STANDARDS.md -->

# Decision records

One file per decision, `NNNN-short-slug.md`, numbered sequentially (find the
highest, add one). The format is deliberately minimal; the value is
recording *that* a decision was made and *why*.

```md
# Short title of the decision

Status: accepted · YYYY-MM-DD

1–3 sentences: the context, what we decided, and why.
```

Optional, only when they earn their place: **Considered options**,
**Consequences**, and a `Status:` of proposed / deprecated / superseded by
ADR-NNNN.

## When to write one

All three must be true:

1. **Hard to reverse.** Changing your mind later costs something real.
2. **Surprising without context.** A future reader would look at the code or
   the docs and ask why it was done this way.
3. **A real trade-off.** There were genuine alternatives and you picked one
   for specific reasons.

Qualifies: architectural shape, integration patterns, technology with
lock-in, boundary and scope decisions, deliberate deviations from the obvious
path, constraints not visible in the code, rejected alternatives whose
rejection is non-obvious.

Does not qualify: a library that takes an afternoon to swap, the obvious
choice, anything you would simply reverse.

## Where decisions live in this repository

This project already records decisions in three places; ADRs are the fourth,
and each has a job:

| Place | Job |
|---|---|
| `docs/STANDARDS.md` | Rules that are enforced. Changes only with the owner's consent. |
| `.ai/notes/SESSIONS.md` | The diary: every session's decisions, learnings, and corrections, newest first. |
| `docs/DESIGN_DIRECTION.md` | Design resolutions, recorded once where the Design gate reads them. |
| `docs/adr/` | One findable record per decision that passes the test above, so nobody has to read the diary to learn why. |

A SESSIONS.md entry that records an ADR-worthy decision links the ADR. An ADR
that implies a standing rule still goes through the consent gate before it
becomes a STANDARDS line. `grill-with-docs` offers ADRs in this format during
a planning session.
