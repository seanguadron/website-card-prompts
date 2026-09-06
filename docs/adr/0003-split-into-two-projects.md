# The repository split: Digi Tools keeps the card decks; Digi Editors takes the rest

Status: accepted · 2026-09-05 (the owner's direction, executed the same day)

Digi Tools had grown into seven tools of two kinds: three card decks (CRAFT,
PICTURE, SONIC) that share one card engine, one art-pack model, and one
prompt-composition idea, and four tools (Architect Wizard, Image Editor,
Vector Editor, Skills wiki) that shared nothing with them but the shell. The
owner's next major change turns the decks into a board workspace
(`docs/BOARD_VISION.md`), which will reshape the shell itself, and he wants
to evaluate the card system on its own. We split by import closure: this
repository keeps everything the three deck routes, the Card Studio, and the
card-art endpoint reach; the sibling project `W:\Local Files\Codex\DigiEditors`
(package `digi-editors`, port 5200) took the four tools with a copy of the
shell, the governance layer, the primitives both sides use, and the Codex
skill home. History stays here: the editors repository starts from an import
commit of this tree at `c45c821`, and the 264MB card-art tree with its 6GB of
history never leaves.

**Considered.** One repository with two apps (a monorepo): more tooling for
no shared runtime. Feature flags hiding the editors: the shell, the CSS, and
the dependencies would still carry them. Keeping everything and building the
board around the editors: the owner ruled it out.

**Consequences.** Both sides carry the same shell contract and governance
layer today, so a fix to the shell is made twice or ported deliberately; the
expected divergence (the board replacing the three-bar shell here) is the
point of the split. `EditorTabs`, `prompt-storage`, `save-status`,
`useLocalDraft`, `useUndoableState`, `browser-download`, `tool-subbar`,
`mobile-tool-gate`, and `theme-script` exist in both. The editors project has
no server surface, no generated docs, and one catalog without a validator
(`skills.json`), so its copies of STANDARDS §2.1 and §2.2 were edited to say
so under this direction; the consent trail is this ADR and the sessions
entry. Digi Tools stays on its Vercel project; Digi Editors has no remote yet.
