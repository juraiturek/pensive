# 5 Whys migration report

Implemented the scope approved on 2026-11-03: core and creation → Reflect → Expand Deepen → Expand Branch. The [Phase A audit](plans/2026-11-03-five-whys-phase-a-review.md) and [source fingerprints](plans/2026-11-03-five-whys-phase-a-sources.json) identify the read-only V2 sources. README remains unchanged. Existing cross-framework-fit work is preserved.

## Reuse and adaptations

Nearly unchanged: focused V2 strand/side-door/connector/overview CSS geometry and DOM class structure; 196×86 overview cards, 228/148 spacing, leaf-width layout and orthogonal connectors; first-child preferred continuation, sibling side doors, ancestor add placement and inline Enter/blur/Escape semantics. Actual original helper outputs are retained for parity tests.

Adapted: Python path/layout/state helpers ported to local JavaScript; Jinja and HTMX/Alpine events replaced by safe DOM and local events. Original nested node fields and four framing fields remain. Destination JSON separates analytical content from persisted navigation cursor. Pensive colors/type/controls and complete JSON/HTML exports use established destination conventions. Native dialogs plus explicit Tab cycling retain focus and return behavior. Overview countermeasures are scrollable with extra bottom clearance to preserve full text and geometry.

Approved changes: more than three children allowed with an advisory reminder; root lock retained while children exist; branch closure qualified as an investigation decision rather than proof; confirmed subtree deletion with navigation repair; arbitrary text cap removed. Existing V2 has no explicit collapse, drag/reparent or sibling reorder; strand navigation remains its branch management model. No history/undo backend migrated. Added action controls increase strand card height while preserving the two lanes and connectors.

Original destination work: context creation/adaptive elicitation, internal/external causal-fit methods, Reflect assessment, Expand Deepen/Branch, action-specific append composition and atomic review, validation/import/export/safe packaging, confirmed deletion and tests. V2's only dedicated AI action was root statement generation; its useful gap/problem formulation is folded into creation, while a standalone action remains deferred.

## Supported behavior

- Blank or context-based creation; focused elicitation when necessary, without fixed five-question or five-level requirements.
- Manual framing and unlocked-root editing; add/edit causes at any active ancestor; side-door and full-tree navigation; close/reopen with countermeasure; delete a confirmed non-root subtree.
- Complete JSON import with validation and confirmation; clipboard fallback; editable standalone HTML save/reopen. No server, storage service or network dependency.
- Reflect (`evaluate`): complete-canvas qualitative assessment, thought-only result.
- Expand (`expand`): explicit selected node, Deepen direct children or Branch sibling alternatives. Context includes framing/ancestors/siblings/full tree, while modification is confined to new direct causes under the deterministically resolved parent. Existing nodes, framing, outputs and unrelated branches are preserved.
- One pending append batch with explicit all-at-once acceptance/rejection. Analytical edits make acceptance stale; navigation alone does not. Empty additions return an investigative rationale without a proposal.
- Research is an explicitly authorized conversational follow-up with available tools. No research switch/action/pipeline or automatic browsing.

## Files created or modified

New operational package: `.agents/skills/pensive/frameworks/five_whys/` contains `framework.yaml`, `canvas.schema.json`, `canvas.template.html`, `canvas.css`, `state.js`, `canvas.js`, compiled `canvas.html`, and `prompts/{create,evaluate,expand}.md`. Added `.agents/skills/pensive/scripts/package-five-whys.mjs` and `references/five-whys-workflow.md`.

Updated skill orchestration/discovery, framework/state-action references and package build commands. Other frameworks' executable sources, schemas and canvases are unchanged. Development records: architecture, roadmap, extraction map, testing notes, approved Phase A record, implementation plan and this report.

New verification files: `tests/five-whys-{state,browser,methodology}.test.mjs`, `tests/generate-five-whys-v2-fixtures.py`, `tests/methodology/five-whys-{observed,agent-observed,v2-parity}.json` and `tests/methodology/five-whys.md`. Ignored `test-results/` contains desktop/narrow screenshots, original static V2/current comparison fixtures and a context example; these are local review artifacts, not dependencies.

## Verification and limits

See [testing record](testing.md#5-whys-migration--2026-11-03) for exact commands/results. Baseline: 109 existing tests passed. Final full regression: 135 passed, zero failures/skips. Focused new checks: 15 state/packaging/parity tests, nine offline Chromium tests and two retained-methodology protocol tests. Independent review found no material runtime/scope defect, corrected missing skill discovery metadata and an unsupported scope detail in a synthetic example; new source was formatted for readability. A keyboard regression exposed Chromium's native-dialog end-of-cycle body focus; explicit cycling now passes.

Retained methodology examples cover competing explanations, insufficient evidence/no additions, attractive unsupported blame, credible scope drift, suspected root needing investigation, adaptive sparse creation and selected Deepen/Branch. Author reference walkthroughs and a separate fresh-agent application observation are validated through real schema/composer/CLI. The latter retains actual synthetic creation and action reasoning; neither is a deployed-model benchmark or live-user evidence. They do not establish causal truth or broad model quality.

V2 helper parity/static-template comparison does not execute the legacy application, its HTMX/Alpine interactions or backend tests. Browser validation is Chromium at desktop/narrow viewports, not Safari/Firefox or physical devices. No incident research was run. Remaining limitations: no explicit collapse/reparent/reorder, standalone root generation, broad Improve/applied reframing, per-suggestion acceptance, numerical causal confidence or history. Local edits require export/save to persist. The work remains uncommitted and unpublished; no remote was added and nothing was pushed.
