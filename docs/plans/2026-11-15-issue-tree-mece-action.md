# Issue Tree MECE Evaluation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give MECE Evaluation its own button and keep its current structural review below the tree, while general evaluation/rationale notes use collapsible cards above the tree.

**Architecture:** Retain the single Issue Tree state, append-only thought collection and paired-file workflow. Add one action (`mece_evaluate`) and optional evaluation-note `scope`; derive scope deterministically from the validated request, never from model text. Split note presentation by scope, retaining all historical notes. No issue tracking or Takeaways feature.

**Tech Stack:** Existing standalone HTML/CSS/JavaScript, framework-local state/schema, existing shared safe Markdown renderer, Node tests and offline Playwright Chromium. No external dependencies or services.

## Approved boundaries

- Toolbar: **Evaluate Decomposition**, **MECE Evaluation**, **Alternative Decomposition**.
- Remove evaluation-scope radios. All three use the existing dialog with Optional guidance, Cancel and Copy AI request.
- General Evaluate remains broad: meaning, reasoning, framing fit and supplied-evidence support, including consequential structural weaknesses.
- MECE is a focused structural review: substantive sibling overlap, plausible coverage gaps, mixed dimensions, parent–child coherence and cross-cutting factors, relative to each parent and the governing question.
- MECE findings identify affected node IDs/titles or branches, explain why a concern matters, and suggest a possible structural improvement. Coverage remains contextual and uncertain, never a forced exhaustive checklist or mechanical pass/fail verdict.
- No external research, scoring, ranking, automatic tree changes, finding objects/IDs, checkboxes, acceptance of individual findings, issue statuses, resolution comparison or Takeaways integration.
- No retention limit: newest review is prominent; earlier reviews are collapsed, never silently deleted. Do not infer that a finding is resolved because it is absent from a later review.
- Existing user node notes, flags, cursor, proposals and complete exported state must survive unchanged.

## Contract decisions

New requests:

```json
{"canvas":"<complete state>","action":{"id":"mece_evaluate","comment":"optional guidance"}}
```

The string above is illustrative only: actual `canvas` is the complete state object. The response stays:

```json
{"thought":"Markdown review"}
```

Persisted MECE result:

```json
{"id":"thought_<generated-id>","kind":"evaluation","scope":"mece","text":"Markdown review"}
```

Rules:

| Input | Stored result / behavior |
| --- | --- |
| `mece_evaluate` | Append evaluation with `scope: "mece"` |
| `evaluate`, no scope | Append evaluation with `scope: "full"` |
| Legacy `evaluate` + `evaluation_scope: "full"` | Append full evaluation |
| Legacy `evaluate` + `evaluation_scope: "mece"` | Append MECE evaluation |
| Existing evaluation without `scope` | Valid; display as general evaluation |
| Alternative/rationale without scope | Valid; display above the tree after acceptance |
| `scope` on an alternative note | Reject as invalid |
| Invalid/null note scope | Reject as invalid |
| `evaluation_scope` on `alternative` or `mece_evaluate` | Reject to avoid conflicting selectors |

Keep schema_version `1.0` with an optional additive field. New readers accept legacy state without rewriting it; old renderers may reject newly scoped notes, so upgrade a saved renderer before importing newly scoped results into it. Preserve pending legacy alternatives and immutable saved snapshots exactly. Do not classify unscoped historical notes by searching their titles/body or infer past request scope from chat.

## Task 1 — State/action contract and compatibility

**Files:**
- Modify `.agents/skills/pensive/frameworks/issue_tree/state.js`
- Modify `.agents/skills/pensive/frameworks/issue_tree/canvas.schema.json`
- Test `tests/issue-tree-state.test.mjs`

1. Add failing tests for the contract table above. Cover `validateRequest`, detached `buildRequest`, `composeResult`, schema/runtime parity and the full paired-file request/result path. Use both explicit new action and legacy scoped request.
2. Assert evaluation appends exactly one note and preserves content, cursor, old thoughts and all node flags. Assert extra response fields such as `tree`, `scope` or replacement `content` fail. Pending Alternative still blocks every AI action. Legacy unscoped notes/proposal rationale remain valid.
3. Run `node --test tests/issue-tree-state.test.mjs` and confirm failures are the missing action/field, not environment failures.
4. Extend `thought()` validation: optional `scope`, allowed only on evaluation, enum `full|mece`. Mirror this as an optional schema property with a conditional forbidding scope for alternative thoughts.
5. Extend `validateRequest` with `mece_evaluate`; keep `evaluation_scope` strictly as an `evaluate` compatibility input. In `composeResult`, derive scope only for evaluation results:

```js
if (!alternative) {
  t.scope = request.action.id === 'mece_evaluate'
    || request.action.evaluation_scope === 'mece' ? 'mece' : 'full';
  s.thoughts = [...(s.thoughts || []), t];
}
```

6. Rerun the focused state suite and require all cases to pass. Do not mutate old notes or migrate historical snapshots.

## Task 2 — Method and routing

**Files:**
- Create `.agents/skills/pensive/frameworks/issue_tree/prompts/mece-evaluate.md`
- Modify `.agents/skills/pensive/frameworks/issue_tree/prompts/evaluate.md`
- Modify `.agents/skills/pensive/frameworks/issue_tree/framework.yaml`
- Modify `.agents/skills/pensive/references/issue-tree-workflow.md`
- Modify `.agents/skills/pensive/SKILL.md`

1. Register `mece_evaluate` as a canvas-level append-only action and link its method in the manifest and Issue Tree handoff/skill routing.
2. Move focused MECE instructions out of the general method into the dedicated method, reusing existing methodology rather than introducing a second analytical framework.
3. General Evaluate instructions retain broad assessment. Legacy `evaluate` with `evaluation_scope: "mece"` explicitly delegates to the dedicated method without rewriting the saved request envelope.
4. MECE uses only supplied context, preserves distinctions between evidence/assumptions/uncertainty, references specific branches and returns only `{thought}` Markdown. Ask for needed evidence as part of the review when structure cannot be judged, without initiating research.
5. Explain flags as user judgments; preserve `needsInvestigation` and priority marks, and do not treat them as proof of error. Previous reviews are context, not an issue ledger to reconcile. No automatic resolved claims.
6. Validate local documentation links and the skill after changes.

## Task 3 — Separate button and note presentation

**Files:**
- Modify `.agents/skills/pensive/frameworks/issue_tree/canvas.template.html`
- Modify `.agents/skills/pensive/frameworks/issue_tree/canvas.js`
- Modify `.agents/skills/pensive/frameworks/issue_tree/canvas.css`
- Modify `.agents/skills/pensive/scripts/package-issue-tree.mjs`
- Test `tests/issue-tree-browser.test.mjs`
- Read-only references: SWOT `.thought` styles in `frameworks/swot/canvas.css`, disclosure styles in `frameworks/swot/interactions.css`, and `renderReview()` in `frameworks/swot/canvas.js`; existing `shared/markdown.js` and `shared/markdown.css`.

1. Replace the scope-radio browser test with tests for the dedicated button, distinct action IDs, complete state/guidance, no radios, Cancel/Escape and denied-clipboard fallback. Keep state tests for legacy request compatibility.
2. Add mixed-history fixtures: unscoped evaluation, full evaluation, multiple MECE reviews and accepted alternative rationale. Assert correct placement relative to the tree, newest MECE visible, previous reviews collapsed and retained. General history must not absorb scoped MECE notes. Empty groups stay hidden. No-MECE legacy state must not create an empty review block.
3. Add the new `[data-ai="mece_evaluate"]` button. Existing generic dialog title/submit handlers serve it. Remove radio markup, related CSS and all `#evaluation-scopes`/radio access. New UI emits no `evaluation_scope` field for any action. Existing `[data-ai]` proposal disabling applies to all three buttons.
4. Place general thoughts between toolbar and tree workspace. Use the established `.thought` card appearance; make the latest general note collapsible and initially open, with previous notes under an `Earlier notes (N)` native disclosure. Use fixed method titles in summaries; do not add model-generated summary fields.
5. Below the tree, show a clearly titled **Latest MECE review** card, expanded by default, and an `Earlier MECE reviews (N)` disclosure. Use append order, not invented timestamps. Keep original note text/IDs and all reviews in export.
6. Reuse existing safe `PensiveMarkdown.render(document, text)` and its stylesheet for note bodies; embed them through two template markers in the Issue Tree builder, following the existing VARS packager pattern. This avoids raw Markdown markers in reviews without a new parser/dependency. Reuse the small existing disclosure styles locally without creating a new shared abstraction or changing other frameworks.
7. Add inert/hostile Markdown, long-body/narrow viewport, native disclosure keyboard, JSON import/export and HTML save/reopen checks. Save/reopen must retain the same review grouping and text. Native disclosure open/closed state need not be persisted.
8. Keep the pending Alternative review panel and its whole-tree acceptance unchanged; pending rationale is not an accepted general note. Keep selection, inline drafts, deselection, flags and Full Tree unaffected.
9. Rebuild framework HTML with `node .agents/skills/pensive/scripts/package-issue-tree.mjs` and rerun focused tests.

## Task 4 — Validation and saved canvas upgrade

**Files:**
- Update `docs/architecture.md`, `docs/testing.md` and current capability notes in `docs/roadmap.md`.
- Rebuild generated `.agents/skills/pensive/frameworks/issue_tree/canvas.html`.
- During implementation, upgrade the known analysis renderer at `outputs/issue-tree-6c15c3cb/issue_tree/canvas.html` only after checks pass.

1. Run focused tests:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright node --test tests/issue-tree-state.test.mjs tests/issue-tree-browser.test.mjs
```

2. Run full regression and require zero failures/skips:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright node --test --test-concurrency=2 tests/*.test.mjs
```

3. Run the skill validator at `/Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py`, JavaScript syntax checks and `git diff --check`. Confirm README remains unchanged. Use temporary PyYAML only if required and remove it afterward.
4. Validate one synthetic MECE response and one full response through real paired-file operations. Check thought scope, append-only content, unchanged user flags and idempotent result retry. Record this as synthetic contract/method QA, not a live-model quality benchmark.
5. Inspect desktop and narrow screenshots for general cards, latest MECE, collapsed history, long Markdown and toolbar wrapping. Preserve the existing tree geometry and editing interactions.
6. Review the final diff, fixing actionable regressions before delivery. Existing checkout contains earlier uncommitted Issue Tree changes; preserve them and avoid staging or committing unrelated work.
7. Rebuild the user's same HTML path using `buildCanvas(savedState)` under the existing short-lived store lock; verify current.json/head/history are unchanged. Do not reconstruct browser-only edits or refresh an open tab. Tell the user to export unsaved edits before refreshing.
8. Record checks actually run and limitations. No distribution builds, legacy source extraction, README edits, remote changes or publishing. This plan itself does not authorize a commit or implementation.

## Done when

The UI has a direct MECE Evaluation action, no scope radios, distinct persisted note scopes, above/below review placement with retained collapsed history, safe readable Markdown, legacy request/state compatibility and unchanged analysis/proposal behavior. Relevant tests and required validation pass, and the same saved canvas can be refreshed to load the upgraded renderer.

## Execution note

Write access to the protected Issue Tree directory was verified via a temporary probe under elevated execution before source changes. Work continues on local branch `codex/issue-tree-mece-review`, preserving earlier uncommitted UX changes. No commit or distribution was requested.
