# CRAFT deck editorial proposal

**For Sean’s review · November 19, 2026 · proposed catalog changes**

The owner approved the four-hand text pilot and its resulting refits. The catalog counts below describe the pre-pilot edition. Change record is optional. Other proposed mergers and new hands remain proposals.

The best part of CRAFT is that a hand can express a reusable way of working. A Researcher with Source Support and Evidence Notes asks where a claim came from. An Editor with a revision brief asks what should change and what must survive. I would make that difference legible on the cards themselves, before adding another illustrated world.

The recent release added skill export and shortened the role instructions assembled into prompts. It added **zero** CRAFT cards. The current catalog contains **25 starting hands, 35 roles, 32 tactic lineages with 128 graded faces, eight output formats and eight four-position dials**. The recommendations below concern authored content. Starter-hand counts measure catalog design, not player behavior. We have no usage or comparative model-performance data for these recommendations.

## The edition I would build

- Offer **24 starting hands**. Keep or refit 21 current hands, fold four into variants, and introduce three with distinct deliverables.
- Offer **35 tactic lineages**. Preserve 29 current mechanics, retire three from the picker, and introduce six. Every existing lineage appears in the editorial ledger below.
- Start each hand with one lead role and roughly three to six defining tactics. Leave room for the player to make a choice. Add a support role only when it contributes a different review or craft step.
- Keep the existing slot budgets for the pilot. CRAFT already allows three Context, five Action, three Format and three Target cards. A full rack need not be the starting position.
- Give each lineage a stable name. A player who picks “Check assumptions” should still recognize it after turning a dial. Put the grade name underneath. Each grade should change an observable part of the result.

**Why change the defaults?** All 25 current archetypes equip Scope. Twenty-three equip Language, 21 equip Stance, and 19 equip Inspect. All 32 lineages are used somewhere, but only one starting hand uses Compare. The scarcity is useful decision space. A player opening Decision advisor should see Compare doing work that no other opening hand does quite as well.

## Starting hands

| Current archetype | Proposed disposition | What the opening hand should produce |
|---|---|---|
| Executive summary | Keep, lighten | A bottom line, the few facts that change it, and a material caveat. Require a decision only if the source calls for one. |
| Creative concept | Refit | Three genuinely different directions for the same brief. Compare them against one named constraint and develop the selected direction. |
| Note taker | Refit as Meeting record | Decisions, open questions and commitments traceable to the notes. An unassigned owner stays unassigned. |
| Message & email | Fold into Writing draft | A correspondence variant supplies recipient, purpose, desired response and a sendable draft. |
| Prompt improver | Refit as Instruction repair | Show the original failure, the smallest useful change, and a test input that distinguishes the two versions. |
| Learning guide | Keep | Establish one learning goal, teach it through a worked example, then give a practice task with an answer check. |
| App build handoff | Fold into Spec / PRD | A build-ready variant adds interfaces, dependencies and acceptance checks to the product brief. |
| Agent skill | Refit as Skill author | Produce a named procedure with trigger examples, required inputs, steps, exceptions and a sample invocation. The site's own Skill download packages the hand; this preset teaches someone to author a skill. |
| Agent gate | Fold into Critique & review | A review-gate variant names the judgment criteria, evidence required, and action for each verdict. |
| Social post | Keep as a writing specialty | Draft for an identified channel and audience, with one concrete takeaway. Constrain length only when the brief supplies a limit. |
| Quick explanation | Fold into Learning guide | A short-answer variant gives the mechanism and one example. Skip the lesson sequence. |
| Research brief | Refit | Answer a bounded question, distinguish source claims from inference, and identify gaps that affect the answer. |
| Decision advisor | Keep | Compare viable options against the user's priorities. Include the condition under which the recommendation would change. |
| Data analysis | Refit | Inspect field definitions, denominators and missingness before interpreting patterns. Include one check someone else can repeat. |
| Risk premortem | Keep | A failure, an early observable signal, and a practical mitigation per material risk. Let the user set the time horizon. |
| Writing draft | Keep | Produce the requested artifact in the intended voice. Refer to a supplied example when one exists. |
| Rewrite & polish | Refit as Revision pass | Preserve facts, commitments and deliberate voice. Show one consequential edit and why it helps. |
| Critique & review | Keep | Findings anchored to passages or features, ordered by impact, each with a concrete revision. |
| Presentation outline | Keep | One audience question and one takeaway per slide. Identify what the visual should demonstrate. |
| Project plan | Keep, lighten | Milestones, dependencies, and a check for completion. Mark owners and dates as open when the brief omits them. |
| Spec / PRD | Keep | User problem, intended behavior, exclusions, and testable acceptance examples. |
| Code implementation | Refit | Work within the existing project conventions; include changed behavior and checks actually run. |
| Debug & fix | Refit | Record the observed symptom, competing explanations, a discriminating check, and regression evidence. |
| Explain code | Keep | Follow one input through the code to its output, with references to the relevant symbols. |
| Extract to data | Refit | A small schema, source-grounded values, missing-value rules and an explicit validation result. |

**Three new starting hands**

| Hand | Lead and opening tactics | Distinct result |
|---|---|---|
| Reconcile sources | Researcher · Input inventory, Extract fields, Compare, Evidence notes | A disagreement sheet. For each disputed point, show what each source says, whether date or scope explains it, and what remains unresolved. |
| Write a runbook | Technical Troubleshooter · Constraints, Plan, Check result, Handoff | A repeatable procedure with prerequisites, observable checkpoints, recovery steps and a stop condition. A project plan orders future work; this hand helps the next operator perform it. |
| Example-led production | Editor · Reference example, Create, Check result | A new artifact that follows specified traits of a supplied example. Identify the reusable traits and check that facts or names from the example did not leak into the new work. |

## Every existing tactic

“Keep” preserves the mechanic. The right column is the editorial brief for its four faces. “Retire” removes a choice from the new picker while preserving old saved hands.

| Context lineage | Decision | Editorial brief |
|---|---|---|
| Scope | Rewrite | Start with the task and the decision it supports. Add history or stakeholders only where they change the result. Remove it from hands whose brief already establishes scope. |
| Evidence | Rewrite | Replace “Given As True” with “Supplied evidence.” Attribute claims at low grades. At higher grades ask for independent corroboration where feasible, preserving unresolved disagreement. |
| Constraints | Keep | Give each limit a consequence. Higher grades distinguish hard limits from negotiable preferences and explain a real trade-off. |
| Assumptions | Keep | Follow one consequential unknown through the result. Reserve a register for work with several material assumptions. |
| Success | Rewrite | Ask for acceptance examples. Use supplied thresholds, or label a proposed threshold for approval. |
| Exclusions | Keep | Show what gets left out and why it is near enough to the brief to tempt scope creep. Avoid routine scope commentary in the deliverable. |

| Action lineage | Decision | Editorial brief |
|---|---|---|
| Inspect | Rewrite | Locate a specific gap in the input and say what it prevents. Equip selectively. |
| Analyze | Keep | Separate observation, interpretation and a plausible alternative explanation. |
| Compare | Keep | Start with a common basis. Use scores only when the brief supplies defensible weights. |
| Create | Rewrite | Name the artifact being made and deliver a usable first version. Remove generic ownership language. |
| Recommend | Rewrite | Give the choice, deciding evidence and reversal condition. Replace “Full Conviction” with “Conditional recommendation.” |
| Verify | Rewrite | Separate checks actually performed from checks that require access or user action. Give the result of each performed check. |
| Summarize | Keep | Preserve source meaning at every grade. At higher grades change the selection rule or audience, not the certainty of the claims. |
| Research | Rewrite | Make available sources and access explicit. End when the central question is answered or a named gap prevents it. |
| Plan | Keep | Sequence work around dependencies and exit checks. Avoid inventing dates, owners or commitments. |
| Ideate | Keep | Vary the mechanism between ideas. Show why two apparently different ideas would lead to the same result. |
| Explain | Keep | Progress from a direct answer through a worked mechanism to an example where intuition fails. |
| Clarify | Rewrite | Ask the smallest question that changes the work. Replace the 95% confidence language with an observable blocker. Higher autonomy must still allow a question when guessing would invalidate the deliverable. |

| Format lineage | Decision | Editorial brief |
|---|---|---|
| Info card | Retire | Its range from plain answer to reference piece duplicates output presets. Preserve the reference-piece layout as a report variant. |
| Key points | Keep | Each point carries one finding or action. Allow evidence below a bullet where needed. |
| Summary | Keep | This is placement and structure: open a longer document with a short summary. The Summarize action decides what content survives. |
| Sections | Keep | Use requested headings. When a field is required but lacks evidence, say so. |
| Evidence notes | Keep | Put provenance near the claim. Include a locator when available and distinguish a quotation from an inference. |
| Comparison | Rewrite | Render comparable fields in a table. Leave the reasoning and choice to Compare and Recommend. |
| Next steps | Rewrite as Handoff | Give the next action, prerequisites and completion signal. Assign responsibility only when known. |
| Length | Rewrite | Let the user set an actual budget in words, bullets, slides or reading time. High grades must still honor that budget. |
| Tiers | Retire | Move its essentials/detail/deep structure into an optional Sections template. Only one current hand equips it. |

| Target lineage | Decision | Editorial brief |
|---|---|---|
| Language | Keep | Calibrate vocabulary to what the reader knows. Define terms when understanding them changes the task. |
| Voice | Rewrite | Use a consistent register and directness. Absorb the useful tone choices from Stance. |
| Examples | Keep | Choose an example the reader can use. Higher grades introduce an exception that tests understanding. |
| Decisions | Rewrite as Reader’s next move | Name what the reader must decide or do after reading. Leave the decision-record template to Format. |
| Stance | Retire | Merge interpersonal tone into Voice. Remove “authoritative” as a proxy for evidence. This affects 21 starting hands and needs an explicit migration. |

## Six new lineages worth drawing

| Section and card | Four face names, low to high | Example of the instruction a player buys |
|---|---|---|
| Context · Input inventory | Material list → Source map → Coverage check → Provenance ledger | “List the supplied documents, their dates and what each can establish. Flag missing material only if it changes the answer.” |
| Context · Reference example | Show a sample → Name its traits → Separate constants → Contrast two examples | “Identify which traits to reproduce and which belong only to the original subject. Use the new brief for all names, facts and claims.” |
| Action · Extract fields | Pick values → Map fields → Resolve ambiguity → Trace every value | “For each requested field, extract its value and source location. Use null for missing values. Keep competing values visible when the source disagrees.” |
| Action · Revise to brief | Local edit → Targeted revision → Preserve invariants → Review the changes | “Revise the draft against the requested change. Preserve dates, commitments and quoted language unless the brief explicitly changes them.” |
| Action · Diagnose | Describe symptom → List explanations → Choose a discriminating check → Verify the cause | “Choose a check whose possible outcomes separate the leading explanations. Report what was observed and what remains untested.” |
| Format · Data contract | Field list → Typed record → Missing-value rules → Validated example | “Return records with the requested keys and types. Include a representative valid record in the specification. Keep commentary outside machine-consumed output.” |

**One fully written four-grade example** for *Revise to brief*. The front names the move, the hover panel explains its effect, and the export carries the exact instruction.

| Grade | Hover description | Exported instruction |
|---|---|---|
| Local edit | Change one named passage. | Edit the passage the user identified. Preserve the surrounding text and return the replacement passage. |
| Targeted revision | Apply the same change wherever the issue occurs. | Find each passage affected by the requested change. Revise those passages and return a clean draft. |
| Preserve invariants | Protect facts and deliberate voice during a wider rewrite. | First identify the facts, commitments and voice cues that must survive. Revise for the stated audience, then compare the draft with those invariants. |
| Review the changes | Make consequential edits easy to accept or reverse. | Return the revised draft plus a short change record for edits that alter meaning, emphasis or structure. Flag any requested change that conflicts with a source fact. |

## Roles, formats and dials

Roles should change the method. Give each one a sentence a player could recognize in a finished artifact. For example, Fact-checker should “trace a material claim to the cited passage and flag any stronger wording in the draft.” That is easier to distinguish from Researcher than a second instruction to be thorough.

| Role decision | Current roles covered | Treatment |
|---|---|---|
| Keep the distinct checking methods | Researcher, Historian, Fact-checker, Critical Reviewer, QA / Test Engineer, Security Reviewer | Differentiate finding sources, establishing chronology, checking a claim, critiquing a work, testing behavior and reviewing trust boundaries. |
| Keep the builder and diagnostic roles | Developer, Technical Troubleshooter, Systems Designer, Workflow Architect, UX / UI Advisor, Data Analyst | Name each role’s working material and its characteristic check. Preserve Workflow Architect as a CRAFT role. |
| Keep the editorial and teaching specialists | Writer, Editor, Copywriter, Presentation Designer, Creative Director, Explainer / Educator, Tutor, Curriculum Designer | Distinguish producing copy, revising it, directing it, explaining, tutoring interactively and designing a sequence of lessons. |
| Keep the decision and synthesis roles | Analyst, Synthesizer, Product Manager, Positioning Strategist, Summarizer, Organizer | Analyst evaluates an interpretation. Synthesizer reconciles inputs. Organizer arranges existing material. Summarizer compresses it. Write the distinction into their lead abilities. |
| Rename or refocus | Strategist, Prompt Engineer, Mentor | Give Strategist a decision horizon and trade-off. Recast Prompt Engineer as Instruction Designer with a before/after test. Make Mentor surface options and consequences from the learner’s situation. |
| Fold into named variants | Rewriter → Editor; Brainstorming Partner and Concept Developer → Creative Director; Pitch Strategist → Positioning Strategist; Product Strategist → Strategist; Consultant → Analyst | Keep discoverable aliases and old role IDs for restores. Validate these six merges on paired tasks before hiding any role. |

**Output presets.** Keep LIST, PLAN, VS, RPT, DRAFT, DECK, JSON and CODE for compatibility. Change LIST to “List or checklist” so ordering is optional. Make VS descriptive by default and let Recommend add a winner. Change JSON to “JSON records” with a missing-value policy. Make CODE return the artifact that fits the environment, such as a patch or snippet. PLAN, RPT, DRAFT and DECK already describe recognizable deliverables. Add **Procedure** for an operator-facing runbook. Keep **SKILL.md** as the reusable export available from every hand. Selecting a file extension should never be the only thing that makes a skill reusable.

**The eight dials.** Keep Context depth, Evidence rigor, Output detail, Structure and Audience expertise. Replace the endpoint “Exhaustive” with a level tied to requested coverage. Keep Autonomy for delegating decisions and Challenge for testing explanations. Separate them from permission to invent missing facts or credentials. Keep Voice formality as register alone. The present Clarify ladder moves from a full interview to asking no questions, and Stance ties formal presentation to confidence. Those are priority rewrites. For all new lineages, test that turning the linked dial changes one coherent dimension. If the four proposed faces cannot pass that test, split the mechanic or ship fewer faces.

## A hand in use

**Brief:** “Turn these meeting notes into a handoff for the next shift.” The notes say a pump alarm recurred, Lee will inspect it, and no deadline was agreed.

**Opening hand:** Meeting record, Organizer, Input inventory, Extract fields and Handoff. A useful one-off result contains “Lee — inspect the recurring pump alarm — deadline unassigned.” It should preserve the distinction between a reported symptom and a confirmed cause.

**Reusable skill:** Ask for the new shift notes. Extract each decision, owner, pending check and unresolved date. Attach a source line where available. Return a handoff ordered by the next action. Run it on unrelated meeting notes and verify that neither Lee nor the pump appears. This example tests both the catalog and the exporter: the hand’s reusable action should survive, and details of the original meeting should stay in its prompt.

## A compiler change the content needs

The current Skill export carries roles, the chosen format and equipped tactic instructions. Some of the most distinctive instructions in a preset live in its action text, format notes and audience default. A skill built from the Research brief can therefore retain general research tactics while losing part of the brief-specific method. Copying the entire draft into SKILL.md would also copy private, one-off details. Give each new preset a small authored reusable procedure, named input fields, and one example of when to use it. Keep the current task, source documents and filled-in answers in the one-off prompt. Preview both products while authoring the preset.

## Editorial pilot and artwork

1. **Test four hands before rewriting 128 faces.** Use Meeting record, Research brief, Revision pass and Decision advisor. Give each two different briefs, including one with a missing input or contradictory sources. Save the current and proposed prompt and skill for each. Use the same model and inputs for both editions and hide edition labels during review.
2. **Judge the artifacts.** Check factual carryover, completion of the requested deliverable, and whether the change promised on the card is visible. A fabricated owner, source or test result fails that case. For each new lineage remove it once and inspect what disappears. If reviewers cannot point to a useful difference, revise or cut the card. Separate the prompt-export results from the skill-on-a-second-brief results.
3. **Migrate before hiding anything.** Preserve original IDs, names and instructions for existing sessions, imports, share links, custom presets and saved library entries. Add a catalog revision for new hands. Offer an explicit upgrade preview for merges, especially Stance plus Voice on the same hand. Preserve both old choices until the player accepts the mapping.
4. **Commission only the approved pilot.** First make a single Sci-Fi contact sheet in Higgsfield for the six new mechanics. Use a manifest stamped at intake for Input inventory, paired annotated prints for Reference example, a ledger with cut-out fields for Extract, a marked-up proof for Revise, branching test leads for Diagnose, and a record fitted to a template for Data contract. Check recognition at rail size, grayscale contrast, and freedom from baked-in text. Then commission grade variants and Fantasy/Superhero translations. Keep existing art keys for retained mechanics. Agree on the paid batch and budget before rendering.
5. **Carry the method to PICTURE and SONIC after the pilot.** Compare visible differences in two images for a PICTURE card and audible differences in two clips for a SONIC card. Those decks need medium-specific checks; CRAFT’s role or evidence vocabulary would obscure what their cards actually control.

**First approval decision:** I recommend approving the four-hand text pilot and its eight briefs. Defer catalog-wide migration and production artwork until the results show which distinctions players can use.

Catalog sources: [starting hands](../src/data/prompt-builder/archetypes.json), [all graded tactics](../src/data/prompt-builder/cards.json), [roles](../src/data/prompt-builder/roles.json), [formats](../src/data/prompt-builder/formats.json), [dials and slot budgets](../src/data/prompt-builder/tracks.json).
