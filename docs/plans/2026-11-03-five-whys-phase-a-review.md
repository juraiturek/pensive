# 5 Whys Phase A — extraction audit and design for approval

Status: approved by the user on 2026-11-03; core → Reflect → Expand Deepen → Expand Branch and UX deviations 1–7 authorized. Audit date: 2026-11-03. V2 access is authorized for this focused, read-only extraction. No V1 access is needed. Existing uncommitted cross-framework-fit work is preserved.

## Recommendation and alternatives

Extract V2's active strand, side doors and full-tree overview; port its deterministic Python helpers to framework-local JavaScript. Reuse its tree markup structure, CSS geometry and inline interaction semantics. Implement core/creation, then Reflect/Evaluate, then Expand/Hypothesize (Deepen and Branch). Treat standalone root generation as optional and defer generic Improve, hats and reframing.

Alternatives: core plus Reflect alone is smaller but leaves assisted exploration manual. Implementing all legacy generic actions adds unsupported methods and broad mutation surfaces: V2 does not actually register those methods for 5 Whys. Replacing the UI with a generic graph editor would discard the primary extraction asset and is rejected.

This document is the decision gate, not an implementation authorization. No runtime, skill routing, schema or prompts have been changed.

## 1. Current destination architecture

Sources: README.md (vision, unchanged), docs/architecture.md (especially extraction policy and fit), docs/roadmap.md, docs/testing.md; `.agents/skills/pensive/SKILL.md`, `references/{framework-contract,state-action-contract,framing-content,proposal-review,vpc-workflow}.md`; VPC manifest and creation prompt; package.json and existing framework file organization.

Use a framework-owned package at `.agents/skills/pensive/frameworks/five_whys/`: manifest, JSON Schema, split template/CSS/state/UI sources, committed standalone HTML and progressively loaded Markdown methods. Add `scripts/package-five-whys.mjs` using the existing exclusive, escaped state-slot packaging pattern. No runtime dependencies, service, generic graph engine or new action engine. Shared collection proposal review cannot be applied to a recursive tree by pretending branches are fixed collections; use a small framework-specific append-proposal resolver.

Existing complete `{canvas,action}` requests, immutable accepted content, deterministic result validation, pending-proposal guards and explicit local review remain applicable. Review granularity and action target scope are separate. Existing framework executable files should remain unchanged.

## 2. V2 implementation audit and source map

Paths below are relative to `/Users/juraj/Code/Codex workspace/pensive-v2`. Source HEAD: `a75617205cf342ebe851379ab43db52e35a07a5e`. The companion JSON records SHA-256 of inspected files; the working source, rather than an assumed pristine HEAD, is the reference.

| Component / source location | Observed behavior | Disposition |
| --- | --- | --- |
| `templates/partials/canvas_tree_strand.html:1–321` | Connected vertical active causal strand; depth/role badges; tip/terminal cues; right-hand sibling side doors; connector add forms at ancestors and tip; inline terminal/countermeasure form | Reuse structure and classes nearly unchanged. Replace Jinja loops with safe DOM rendering and HTMX forms with local mutations. Preserve interaction placement. |
| Same, inline Alpine editors | Click text/pencil, focus/select, Enter or blur save; Escape/cancel restore; empty/unchanged draft cancels; 300-character input limit | Port small interaction routines with the same behavior. Remove arbitrary text cap; keep wrapping/readability. |
| `templates/partials/canvas_tree_overview_overlay.html:1–174` | Scrollable modal, full-tree cards and orthogonal SVG edges, active strand/tip/terminal/unresolved-leaf cues, truncated text with full title, countermeasure cards; click non-root switches strand; Escape/backdrop/close dismiss | Reuse markup and layout representation; local events replace posts. Add modal focus containment/return without changing layout. |
| `static/css/pensive.css:1019–1329,1382–1574` | Strand minimum width 860px; two lanes (52% spine), connector halves/add button, side doors; positioned overview cards and SVG; terminal outputs | Copy focused tree selectors, map colors/fonts/radii to destination tokens. Retain horizontal scrolling rather than squeeze into generic cards. Check exact selector boundaries on extraction. |
| `app/routes/canvas_pages.py:124–464` | Path lookup, node lookup, first-child preferred continuation, role labeling, strand/sibling derivation; overview leaf-width layout and edges | Mechanical JS port with parity fixtures. This is the main layout logic; it is Python, not reusable browser JS. Preserve constants first: cards 196×86, column step 228, row step 148, padding 122/52, min board 960×320. |
| Same, `:1644–1696` | Side-door/overview navigation finds target path then descends first children to leaf/terminal | Preserve exactly for navigation. Explicit AI selection must remain separate from automatic continuation. |
| Same, `:510–613`; `templates/partials/canvas_detail_body.html:139–190,339–360` | Derives framing/root-lock flags, view tabs and full-tree toolbar; root generation empty-framing warning and replacement confirmation | Adapt Problem/Canvas tabs to Framing/Investigation, preserve overview affordance and confirmations. Drop history/debug/application chrome. |
| `app/frameworks/registry.py:310–394,448–458,516–549,591–686` | Four framing fields; nested tree; path cursor; stable IDs; terminal leaves with required countermeasure; max three children; depth heuristic five; validation | Preserve nested semantics/IDs/cursor and terminal invariants, adapting envelope. Proposed deviations below. Do not inherit coercion of malformed values. |
| `app/services/canvas_service.py:232–443` | Add child (cursor follows new child), mark/unmark terminal, move cursor, root/non-root text edits; root locks after first child | Port deterministic mutation rules. Replace append-state/repository persistence with in-memory state and explicit exports. |
| `app/services/canvas_ai_service.py:310–365`; `prompt_templates/rules.json:194–203`; `prompt_templates/{system/generate_problem_statement_base,user/five_whys_generate_problem_statement}.j2` | Only registered 5 Whys AI action generates one root sentence from four framing fields; nonempty framing and child-lock checks; direct persisted replacement | Adapt method into Markdown only if selected. Use reviewable root proposal, not silent replacement. |
| `docs/reports/session-2026-03-05-five-whys-framing-and-editing.md`; recursive foundation/UI session reports | Corroborates intended strand, framing and editing design and historic checks | Reference context, not evidence of current browser correctness. |
| `tests/views/test_canvas_pages.py` recursive cases, notably first-child preference and mid-strand insertion (`:2831–2936`) | Tests navigation continuation and adding an alternative under an ancestor (old continuation becomes side door) | Reuse scenarios as local JS/browser parity tests. Do not copy service fixtures or claim legacy tests executed. |

### What V2 does not provide

The inspected tree template/service/route surface has no delete-subtree, drag/reparent, sibling reorder, or explicit expand/collapse operation. “Move cursor” navigates; it does not move nodes. Adding at a connector appends a sibling alternative beneath that ancestor, not an insertion between two existing nodes. Inactive branches are concealed by strand projection and available through side doors/overview. The full-tree overview displays all nodes; it has no zoom/pan engine or collapse state. Undo/redo relies on legacy snapshots and will not be migrated because history is excluded.

There is no registered 5 Whys creation wizard, full-tree Generate, Reflect, Guidance, Improve, Restate or Six Hats prompt in `rules.json`. Generic service methods and toolbar availability do not establish a supported 5 Whys method. Only Generate Problem Statement has a dedicated prompt mapping. New context creation, Expand and Reflect are original destination methods, not extracted legacy capabilities.

## 3. UX preservation and proposed deviations

Preserve: strand/side-door hierarchy, ancestor connector additions, new-child focus path, insertion-order preferred continuation, depth badges without a depth limit, terminal countermeasure cards, full-tree spatial geometry/edges/state cues, scrollable wide/deep navigation, Enter/blur/Escape editing and full-tree dismiss behavior.

Decisions requiring approval:

1. **Three-child limit becomes advisory.** Preserve the narrowing reminder after three alternatives, but allow more children. A hard cap excludes competing explanations; wide-tree validation must exercise this. No child quota or fixed five levels.
2. **Retain root lock after branching initially.** Framing stays editable; Reflect may recommend reframing but cannot change it. Deleting the last child restores root editing, matching the actual children-based guard. A later explicit reframing operation requires separate scope approval.
3. **Closure is a user decision, not proof.** Keep terminal flag/countermeasure structure and Unmark, but label it “Close branch” / “Investigated cause” with a visible qualification that closure does not verify causation. Countermeasure remains required for this existing closure path; an unresolved leaf can simply remain open when questioning stops for lack of evidence. No automatic root-cause verdict.
4. **Add confirmed subtree deletion**, absent in V2 but required by this migration request. No root deletion. Show descendant count, repair cursor to nearest surviving ancestor/preferred continuation, preserve other branches. No undo history.
5. **No new collapse or rearrangement widget in the first slice.** Preserve V2's strand projection as its existing branch management behavior; explicitly document that overview collapse and drag/reparent/reorder are absent. Adding them would be a separately approved deviation. This is a proposed interpretation of the preservation requirement, not a claim of explicit collapse support.
6. Remove server/auth/CSRF/HTMX, Alpine runtime, snapshots, debug UI and backend-dependent history. Reproduce their relevant local event semantics; use local inline SVG icons instead of shipping a large icon/runtime dependency. Preserve CSS connections and overview SVG paths.
7. Keep long text editable without the legacy 300-character restriction. Preserve overview truncation/title while allowing readable full strand text; verify countermeasure cards do not overlap following levels and increase row clearance if needed. Any geometry adjustment is documented against original fixtures.

No interactive browser comparison has yet been performed. Fidelity claims at this stage are based on source inspection; implementation requires rendered side-by-side fixture review, not only selector assertions.

## 4. Schema, framing and causal contracts

Proposed state (framework-owned, version 1.0):

```json
{
  "framework": "five_whys",
  "schema_version": "1.0",
  "content": {
    "framing": {
      "observable_symptom": "",
      "expected_condition": "",
      "system_or_process": "",
      "investigation_owner": ""
    },
    "tree": {
      "id": "root",
      "text": "",
      "children": [],
      "is_terminal": false,
      "output": null
    }
  },
  "cursor": ["root"]
}
```

Retain V2's recursive node fields rather than normalize to edges. `cursor` is top-level view state so navigation does not invalidate analytical content guards. Child order is meaningful for preferred continuation. All nodes use unique destination-compatible IDs; cursor must be an actual root-to-node path. Root cannot be terminal. Terminal nodes are childless with nonempty output; nonterminal output is null. Empty root/framing and no children form a valid blank canvas. Duplicate/unknown IDs, malformed children, invalid cursor, unsupported fields/version and inconsistent terminal states fail before replacement/mutation. JSON parsing cannot contain pointer cycles; programmatic state must also reject cycles. Avoid arbitrary depth/count quotas; use explicit resource-error handling rather than silently truncate.

Optional current `thoughts` and at most one framework-specific `proposals` entry follow existing envelope conventions. No baseline/history. Plain creation needs neither proposals nor action envelope. Import/export preserves complete supported state, including cursor, thoughts and pending proposals; legacy database state is not silently accepted as destination JSON. If conversion is later needed, make it an explicit narrowly validated converter.

Framing retains all four V2 fields. Put supplied scope/timeframe/context in readable symptom/system text rather than invent new framing dimensions. Expected condition and owner may remain unknown. Keep investigation ownership distinct from blame. Root is the observed gap/effect; child is a possible direct cause of its parent. Observed effects need not have demonstrated causes.

Use readable `Observed:`, `Reported:`, `Hypothesis:` and `Inference:` qualifiers, supporting/contradicting evidence and provenance in node text and evaluation thoughts. No new causal-confidence numbers or evidence ontology is needed. A user edit can change a hypothesis; do not infer verification from terminal status or depth.

External fit reviews problem/system/scope/time boundary alignment. Internal fit checks direct mechanism, time order, evidence and alternatives, missing intermediates, circularity and competing versus complementary causes. Plausibility is not demonstrated causation. A credible out-of-frame branch may justify a reframing recommendation rather than deletion. AI actions preserve framing unless separately authorized.

### Creation and activation

Blank: copy established empty interface. Context: extract four framing strings and observed problem first, clarify consequential gaps adaptively, then create only supported shallow branches and review internal/external fit. Follow the established zero-to-two question-turn convention; if still insufficient, offer a sparse draft or blank and wait for agreement unless already requested. No fixed five-question wizard, mandatory five levels, or invented deep chains. Do not turn inferred observations into facts merely to satisfy the legacy root prompt's ban on hedging.

Activation explicitly honors 5 Whys requests. Offer it selectively for recurring failures, unexpected effects and competing causal explanations; SWOT is strategic factors/options, PAGES perspective structure, VPC customer–offering fit. Ordinary decisions do not automatically require causal investigation.

Methodology check: [ASQ Five Whys](https://asq.org/quality-resources/five-whys) explicitly allows fewer or more than five questions. This supports retaining depth as a heuristic, not a completion target. Other evidence/fit requirements here are user requirements and destination adaptations, not attributed to uninspected external sources.

## 5. AI inventory and operation scopes

All existing-state actions receive full submitted state. Target identifies the analytical focus; context can be broader; modification permissions are validated independently. Navigation cursor is not implicit authorization. Use a selected node ID in each node action, not a whole-canvas assumption. No generalized scope picker.

| Action / provenance | Target scope | Context scope | Modification scope / output | Research | Value, complexity, dependencies / priority |
| --- | --- | --- | --- | --- | --- |
| Context Create — new method | New canvas | Conversation and supplied materials, extracted framing | Initialize framing/root and supported tree, no existing state replacement | None by default | Essential core; medium; schema/packager/create Markdown; B |
| Generate Problem Statement — only dedicated V2 AI action | Root before children | Four framing fields, current root and user steering | Proposed root text only; fixed framing and no children; review before replacement | None | Useful optional refinement, overlaps creation; low–medium; root proposal/guard; defer standalone UI unless selected |
| Reflect / Evaluate — proposed new method | Full causal canvas initially | Full framing/tree, terminal outputs, selected current thoughts and user steering | Append evaluation thought only; no node/framing/cursor changes | Optional conversational research | High value; medium; thought result validation; C1 |
| Expand / Hypothesize: Deepen — proposed new method | Explicit selected nonterminal node | Framing, root-to-target chain, existing children/siblings; full tree for duplicate/cycle checks, user evidence/steering | Propose new immediate children of target only; never overwrite target/descendants/unrelated branches | Optional conversational research | High value; medium; stable target resolution, append proposal review/stale guard; C2 |
| Expand / Hypothesize: Branch — proposed mode | Explicit selected non-root node; root uses Deepen | Same full context, especially selected node's parent and sibling explanations | Propose new siblings under selected node's parent only; no change to selected subtree or existing siblings | Optional conversational research | High value; small increment after Deepen; parent must be nonterminal; C3 |
| Generic V2 Generate / Reflect / Guidance / Improve / Restate / hats | No registered 5 Whys target/method | Generic service surface exists for other frameworks | No working 5 Whys output contract found; cannot call these migrated actions | Not applicable | Defer; broad Improve/reframing/hats need a separate methodological and mutation design |

Reflect examines strongest and weakest links with reasons, supportive and contrary evidence, causal leaps, time order, circularity, actionable conditions, competing/complementary branches, discriminating tests and framing reconsideration. It must provide investigative next steps rather than praise. It cannot label an unverified explanation the root cause. Node/branch-focused Reflect can be a later compatible extension, not included in the first mode.

Deepen asks what directly produces the target condition. Branch asks what else could explain its parent, generating sibling alternatives to the selected explanation. They belong in one Expand action with explicit mode because their method and review contract are shared, but their permitted parent differs. Both may return no additions when information is insufficient. Each suggested child includes mechanism/qualification in readable text; append no redundant/circular or speculative long chains.

### Proposed simple request and review contract

Example action: `{"id":"expand","target":{"type":"node","id":"cause_7"},"mode":"deepen","comment":"Consider the timing evidence"}` inside the existing two-key envelope. `branch` resolves the selected node's parent deterministically. `evaluate` initially needs no target. Optional `use_thoughts` follows existing patterns. No user-supplied arbitrary modification path.

Model output: Evaluate returns only a thought; Expand returns a thought plus proposed direct-child text items for the resolved parent. The deterministic composer allocates fresh IDs, validates full result, and creates proposal metadata; the model cannot choose arbitrary parents or send a replacement tree. Existing IDs/text/ordering/terminal outputs/framing/cursor stay exact. A single append batch is accepted/rejected atomically; individual suggested-child selection is deferred. Display proposed children adjacent to their intended parent and rationale, without making them accepted content.

Guard proposal acceptance against the complete original analytical content (including framing) to reject stale premises even if unrelated edits would structurally permit append; cursor-only navigation remains allowed. Preserve prior thoughts and unrelated branches byte-for-data unchanged. Pending proposals block new AI actions. Rejecting preserves local edits. Validate target still exists/is nonterminal, resolved parent matches mode, IDs remain unique and no protected content changes. Root generation, if selected, uses its own root-only boundary and child-lock guard. No shared collection-review rewrite.

## 6. Research interaction model

Recommend conversational follow-up with explicit user control, using available Codex/web tools, rather than a browser research switch or new infrastructure. Basic Expand/Reflect always works without research. If useful, offer a bounded research question; research only when requested/authorized, then use cited findings in the next normal action and preserve specific source attribution in readable rationale/node text. No automatic browsing for editing or navigation.

A supplied export and user research request can be handled in one conversation. Distinguish local observations, general evidence from comparable situations, derived hypotheses and unsupported possibilities. General failure mechanisms suggest candidates/tests, not proof of this incident. If tools are absent, disclose and continue without invented sources. Dedicated Research action or UI mode adds little MVP value and is deferred. The small methodology lookup during this audit is not incident research or implementation of research behavior.

## 7. Implementation sequence after approval

1. Freeze source fingerprints and provenance; create V2 parity fixtures for strand/side doors, preferred continuation and full-tree coordinates/edges. Record initial visual baseline via focused isolated fixture rendering without starting legacy services or modifying V2.
2. Build schema/state validation and tree mutations first: blank, framing edit, root lock, add/edit/closure/unmark, proposed deletion and repaired cursor. Tests cover malformed imports, stable identities, terminal rules, deep/wide trees and unrelated branch preservation.
3. Extract markup/CSS and port helpers; implement local editing/navigation/forms/overview. Preserve classes/geometry, use safe DOM text and inline SVG. Verify browser behavior and review desktop/narrow screenshots against V2 fixtures. Test long text/output clearance and keyboard/focus/scroll behavior.
4. Add deterministic build/exclusive packager, full JSON import with validated confirmed replacement, clipboard fallback, save/reopen and hostile text protection. Offline browser requests must remain zero. Verify consecutive save and complete-state round-trips.
5. Add creation Markdown, handoff, manifest and selective activation; update extraction map, architecture/roadmap/current capability guidance only as implemented. Preserve README. Retain synthetic rich/sparse creation and adaptive elicitation observations; run skill validator and reference/manifest checks.
6. Implement approved Reflect first, independently test thought-only output and methodological cases.
7. Implement approved Expand Deepen, then Branch; add target/mode dialog, framework-local composer and append-batch review. Independently test exact modification boundaries and stale guards before proceeding to next mode. Optional root-generation control only if expressly selected.
8. Run focused and full SWOT/PAGES/VPC regressions following docs/testing.md; inspect saved artifacts and report actual results/limits. No push/publish/remote; no runtime dependency added.

Planned files: framework `five_whys/{framework.yaml,canvas.schema.json,canvas.template.html,canvas.css,state.js,canvas.js,canvas.html,prompts/create.md}`; approved `prompts/evaluate.md` and `prompts/expand.md`; `scripts/package-five-whys.mjs`; `references/five-whys-workflow.md`; routing/contracts as necessary; `tests/five-whys-{state,browser,methodology}.test.mjs` and retained methodology fixtures; package build script and development docs. Do not introduce absent action files/declarations in advance of approval.

Validation must cover: multiple plausible competing explanations; insufficient evidence; attractive unsupported story; credible branch outside framing; suspected root requiring a test; temporal/circular/missing-intermediate failures; no forced depth; deletion and navigation repair; more than three siblings and more than five levels; original side-door/overview behavior; closed branch reopening; blank/context/sparse creation; import/export/save; invalid target/mode/root-branch request; pending/stale proposal; exact unrelated branch and framing preservation; research qualification if user-invoked. Methodological observations establish narrow protocol/reasoning evidence, not causal truth or broad model quality. Browser coverage should report Chromium-only limits unless others actually run.

## 8. Approval requested

Approve or revise the recommended sequence **core/creation → Reflect (whole canvas, thought-only) → Expand Deepen → Expand Branch**, with a single Expand action and two modes; standalone Generate Problem Statement deferred.

Approve or revise deviations 1–7, especially advisory branching limit, root lock, qualified branch closure, confirmed subtree deletion, and preserving strand-based branch management without new collapse/reparent controls. Research remains explicit conversational follow-up, with no dedicated UI/action.

Phase A verification: source and destination inspection only; no product execution, browser fidelity test, legacy tests, skill changes or implemented feature claims. The companion fingerprint manifest and whitespace/README checks are recorded separately. This is a reviewable proposal awaiting the user's explicit gate.
