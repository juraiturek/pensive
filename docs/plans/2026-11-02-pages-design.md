# PAGES extraction findings and proposed design

Status: revised following user review on 2026-11-02 and approved by the user. Implementation follows [the execution plan](2026-11-02-pages-implementation.md). README remains unchanged. Legacy sources were inspected read-only. This document is development guidance; operational methodology lives in the skill package.

## Research and review

Destination reference: the current SWOT package separates a manifest, schema, readable Markdown methods, source HTML/CSS/runtime/state operations, and a deterministic standalone packager. Stable item identities, complete-state handoff, safe embedding, thoughts, whole-canvas proposals and stale-base protection are useful established behavior. The current canvas exports JSON and HTML but has no import UI. PAGES requires an explicit import implementation rather than a capability claim based only on packaging.

V1 reference: `../Old-obsolete-app-codebase/pensieve-main`, an unversioned snapshot. Relevant inspected sources:

- `prompts/generate/pages_generate.j2`: explicitly attributes the principles to *The Craft of Creativity* by Matthew Cronin and Jeffrey Loewenstein. Preserve that legacy attribution; reject forced population of every list.
- `schemas/pages.yml`: Parts, Actions, Goals, Events, Self-Concepts; framing is problem, why, intuition. The internal self-concept key is `selfconcept`.
- `templates/frameworks/pages.html` and `static/pages/pages.css`: five horizontal bands, displayed Self-concept, Events, Goals, Actions, Parts. A pale label rail and editable content distinguish PAGES from SWOT's matrix.
- `static/pages/pages.js`: per-dimension thinking tools and Ripple; Ripple takes the selected dimension's current values and explores effects elsewhere. The dialog explicitly describes the impact of the latest change. Results currently mutate legacy state through server calls.
- `prompts/ripple/pages_ripple.j2`: preserve coherence after a selected dimension changes. `pages_ripple_selfconcept.j2` explicitly connects self-concept changes to goals and other dimensions.
- `prompts/reflect/pages_reflect.j2`: inspect patterns, gaps, connections and imbalance, with one or two useful observations.
- `prompts/improve/pages_improve.j2`: revise the canvas with an explanatory thought.
- `prompts/tools/pages_tool.j2`: generic selected-node transformation, too underspecified to establish a distinctive PAGES method by itself.
- `prompts/viewpoints/pages_viewpoint_default.j2` and `pages_viewpoint_white.j2`: Six Thinking Hats, explicitly attributed to Edward de Bono. This attribution is for Six Hats, not evidence of PAGES authorship. Reject the White Hat prompt's forced scientific reference.

V2 reference: `../pensive-v2`, revision `a75617205cf342ebe851379ab43db52e35a07a5e`. Relevant inspected sources:

- `app/frameworks/registry.py`: authoritative implemented expansion agrees with V1; framing is what, why, intuition, with `self_concepts` as the core key. Its recommendation text explicitly describes perspective as composed of five elements and invites deliberate lens changes when stuck.
- `prompt_templates/user/pages_generate.j2`: concrete, distinct core items and preserved framing; reject forced 3–8-item quotas and character limits.
- `pages_guidance.j2`: focal situation, description versus interpretation, atomic items, observable Parts/Actions, explicit Goals, temporal Events, identity rules, cross-dimension links, alternatives and coherence. These are useful implementation guidance, not independently verified historical axioms.
- `pages_improve.j2`: core-only revision and explanatory thought, preserving framing.
- `pages_reflect.j2`: thought-only tension/gap/opportunity discovery.
- `pages_restate_problem.j2`: framing-only restatement based on current core evidence, with an explanation.
- `pages_viewpoint_{white,red,black,yellow,green,blue}.j2`: thought-only Six Hats views; a supplementary method rather than the distinctive PAGES shifting operation.
- `docs/status/current.md` and layout rollout notes: PAGES remains on the linear fallback, so V1 supplies the more distinctive presentation.
- `docs/plans/2026-03-03-dashboard-canvas-management-design.md`: expands the acronym as Players, Aspirations, Goals, Enablers, Scope. Reject this isolated draft description because it contradicts both versions' implemented schemas and PAGES-specific prompts.

### Methodology and source limits

PAGES represents how a focal situation is currently understood through Parts, Actions, Goals, Events and Self-concepts. Discovery makes that representation explicit; shifting deliberately questions a dimension and examines consequences across the others. Neither population of five lists nor an arbitrary alternate viewpoint is sufficient by itself.

V1’s generation prompt explicitly links its PAGES principles to *The Craft of Creativity* by Matthew Cronin and Jeffrey Loewenstein. Preserve this source attribution while distinguishing it from independent verification of the book’s exact formulation. Do not attribute PAGES to de Bono merely because Six Hats is present. Parts should not silently become only people; Self-concepts should not become diagnoses or asserted beliefs about other people. V2's “I am…” rule can be a useful elicitation form without forcing every entry into it. Distinguish user-reported experience, observed events, interpretation, assumptions and hypothetical alternatives in plain text where relevant.

## Approaches considered

1. **Recommended: dedicated PAGES package with small shared presentation assets.** Retain explicit framework-owned state, constraints and methods; extract only common styles and proven handoff helpers that actually have two consumers. This preserves methodological boundaries and limits SWOT regression risk.
2. Duplicate the complete SWOT package and replace its fields. Faster initially, but duplicates visual infrastructure and risks retaining TOWS assumptions.
3. Introduce a generic framework engine. Avoid: adds abstraction and migration risk beyond this MVP slice.

## Proposed design

### Model and presentation

Use `framework: pages`, `schema_version: 1.0`, `content.framing: {what, why, intuition}`, and five stable `{id, text}` collections: `parts`, `actions`, `goals`, `events`, `self_concepts`. Permit valid blank drafts and empty dimensions. Use the existing optional thought and whole-canvas proposal conventions, with framework-specific validation.

Display five responsive horizontal bands, preserving V1's S/E/G/A/P visual order while explaining the PAGES acronym in its canonical P/A/G/E/S order. Reuse Pensive's warm paper palette, serif hierarchy, controls, editing feedback, dialogs and proposal review. Describe bands without implying a proven causal hierarchy. No graph editor, links schema, or new relationships infrastructure.

### Creation and activation

Explicit PAGES choice routes directly to empty creation or context-driven drafting. Rich context requires no redundant questions. Sparse context uses a short adaptive conversation about the focal situation, the user's current interpretation and what they want to understand or shift; allow a disclosed sparse draft. Never fabricate beliefs or fill every dimension to a quota.

Implicit relevance should normally produce one brief optional recommendation explaining how decomposing the current lens may help. Distinguish perspective discovery and shifting from strategic SWOT/TOWS analysis. Ordinary uncertainty or disagreement is insufficient. Respect declines and avoid repeated suggestions.

### Initial AI actions

- **Evaluate:** assess how well PAGES is formulated: appropriate balance (not equal list lengths), verbosity, clarity, atomicity, gaps and content inconsistencies within and across dimensions. Ground observations in the submitted canvas and distinguish missing information from contradiction. Return a thought only, with concise best-practice guidance; no replacement content.
- **Improve:** propose core-content changes following PAGES best practices and user steering: clearer, concise entries; less duplication; better distinctions and cross-dimension coherence. Preserve framing, evidence boundaries and retained identities. Do not fabricate missing facts or beliefs to fill gaps, or confuse methodological improvement with imposing another perspective. Return a whole-canvas proposal with an explanation.
- **Ripple:** a generic thinking tool with especially strong relevance to PAGES. Answer: “If these nodes changed, what are the logical implications for the other nodes?” Compare selected changed source dimensions against a persisted initialization baseline, preserve their current values as premises, and propose consequences in other dimensions. Support multiple selected dimensions. Explain which change supports each implication and distinguish logical dependencies from plausible hypotheses. Do not infer a change solely from current values or conversation memory.

Hold off on **Restate framing**. Defer generic node tools beyond Ripple.

**Six Hats roadmap:** a cross-framework tool producing both reflections and suggested changes, not a PAGES-only or thought-only action. Implement after at least two frameworks are stable and partial accept/reject for suggested changes is available. Partial acceptance remains outside the current PAGES slice and is not its prerequisite. The legacy thought-only prompts are source findings, not the future product contract.

### Persistent change tracking for Ripple (proposed)

Persist one `ripple_baseline` containing the five core collections, captured when an empty or generated canvas is initialized. Track changes deterministically by stable ID and text against that snapshot: additions, edits, deletions and collection moves. Display changed markers plus a readable removed-item summary so deletion remains visible. This is a single comparison baseline, not a revision log or undo history.

Include the baseline in complete JSON, saved HTML and action requests; validate it on import and packaging. Saving, reopening, packaging and AI proposal acceptance must preserve it. Pending proposals are not accepted changes. Accepting Improve or Ripple can change the current content, but must not silently advance the baseline. If every dimension is selected, explain that no other dimension remains to receive changes.

Let the user explicitly select changed source dimensions for Ripple and review their before/after difference in the request dialog. No selected source change means explain that there is nothing to propagate, rather than inventing one. Preserve framing and every selected source collection deterministically in the resulting candidate. Other unselected edits remain visible in current state; the method must consider them rather than blindly restore baseline content. Ripple requests retain the full current state and baseline, never just a diff.

Provide an explicit “Set current state as Ripple baseline” control, warning that it clears change markers. This allows a new round of deliberate changes without accumulating a history system. Do not reset after a Ripple run or acceptance automatically. For an imported state without a baseline, explain that prior changes cannot be recovered and offer to establish the imported current state as the baseline; do not imply it records the original initialization.

This baseline approach is a new destination design motivated by the user's clarification. The inspected V1 Ripple request supplied current source values, not a persisted before/after record. Its prompts alone do not recover the original change.

### Local data flow and safety

Use complete `{canvas, action}` requests, Markdown reasoning, strict response validation, deterministic `--result` packaging, thought preservation and local whole-canvas accept/reject. Preserve stable IDs and stale-base protection. Keep action boundaries explicit. Add JSON import with full validation before atomic replacement, visible parse errors, and explicit replacement confirmation if local work exists. Export remains complete JSON and editable standalone HTML. Persist the single Ripple baseline inside the artifact itself; no localStorage or service is required. No network calls, storage service, revision history, partial acceptance or backend.

## Implementation and verification sequence

1. Add failing state/schema tests for valid blank state, persisted initialization baseline, change detection, identity, invalid input, safe packaging and action boundaries; implement the smallest PAGES core and package utility.
2. Add the five-band editable canvas and shared styles; test offline editing, export, import, invalid-import preservation and saved HTML reopening.
3. Add guided Evaluate/Improve/Ripple requests and whole-canvas proposal review; exercise every action, multiple Ripple sources, deleted sources, no-change requests, stale acceptance, rejection and repeated cycles. Verify baseline preservation across imports, exports, saves and AI results, and explicit baseline reset.
4. Add manifest, creation/action Markdown methods and selection guidance; check skill metadata and local links.
5. Retain representative methodology inputs and observed outputs: rich-context discovery, sparse conversational elicitation, impasse shifting, each action and unsupported-assumption handling. Separate actual observed runs from scenario descriptions and deterministic fixtures.
6. Run all existing SWOT regressions plus PAGES tests; inspect desktop/mobile screenshots; verify README and legacy integrity, and document checks and limits.

At the original design checkpoint, no executable changes or tests had been performed. Subsequent implementation and results are recorded in docs/testing.md. No legacy files have been modified, and no commit, remote, push or publication has been made.
