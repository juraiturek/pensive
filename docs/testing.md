# Testing strategy

## Slice 0: structure

Slice 0 used structural checks; Slice 1 now has executable tests below. Run the installed skill-creator validator for skill changes:

```sh
python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive
```

This environment-specific tool is not a project dependency. Elsewhere, use the corresponding installed skill-creator validator. It validates skill structure and metadata, not reasoning quality.

Check local Markdown links, conditional reference routing, absence of unfinished scaffolding, and honest capability claims. Verify README SHA-256 remains `372931125511c5fae95971c88a11fd725dffaa3724672c4bfb95291b23ea8c4e`. Review whitespace and file inventory for unexpected files or legacy code. These are structural checks, not runtime tests.

## Deterministic software tests

The SWOT slice implements the relevant tests described below. Add further tests alongside later executable slices. Prefer a standard-library or selected runtime's built-in runner. Add browser automation only when required for real browser behavior. No large framework, dependency manifest, or empty test suite is needed now.

| Area | Observable behavior |
| --- | --- |
| Standalone HTML | Opens through `file://` with network disabled; editing/export need no server or AI. |
| Editing and round-trip | Add/edit/delete/arrange supported content; import/export preserves complete semantic state and pending proposals. |
| State validation | Accept valid state; reject malformed input, wrong versions, invalid relationships, duplicate IDs, incompatible actions before mutation. |
| Safe embedding | Closing tags, quotes, ampersands, Unicode, and script-like strings round-trip without execution or markup corruption. |
| Identity | Existing IDs survive editing, round-trip, transformations, and acceptance; new IDs remain unique. |
| Proposals | Preserve content/proposals; require user acceptance/rejection; invalid or stale acceptance leaves state unchanged atomically. |
| Packaging | Each transformation creates new output; input stays intact; established HTML/CSS/JS outside the state slot is preserved. |
| Framework visuals | Verify distinctive layouts/interactions at useful viewport sizes; use focused screenshots/manual review as appropriate. |
| Shared actions | Exercise explicit concept/target mappings; reject incompatible targets and frameworks. |
| Regression | Run focused and relevant existing tests across implemented frameworks after shared behavior changes. |

Ground fixtures in actual schemas and extracted capabilities. Test meaningful invariants and failure paths rather than exact wording or mirrored implementation details. Verify a second transformation cycle preserves prior content; separate deterministic protocol testing from reasoning quality.

## Methodology evaluations

Keep LLM evaluations separate from software tests. Use realistic scenarios and documented rubrics to assess framework fidelity, useful reasoning, evidence/assumption distinctions, target adherence, user intent, proposal clarity, and handling of missing context. Apply framework-specific quality criteria. Record enough inputs and observed results to explain findings without requiring identical model wording.

Add scenarios as methods are implemented. Neither a structural validator pass nor valid response JSON proves analytical quality. Automated model-backed evaluations are not required for slice 0.

## Reporting

Report commands or review procedures actually performed, results, relevant regression coverage, and limitations. Record verification with each extraction. Do not claim offline operation, acceptance safety, or framework regressions until exercised against executable implementations.

## Slice-1 commands and results

Prerequisites: Node.js (tested with 24.22.1), pnpm, and Playwright Chromium. Install development dependencies with the committed lockfile:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm build
pnpm test
```

Alternatively, after installation, run `node --test tests/*.test.mjs`. For a custom browser cache, set `PLAYWRIGHT_BROWSERS_PATH` consistently for installation and test execution. `PENSIVE_BROWSER` can point to a Chromium executable; the executed suite used Playwright's matching browser. The local macOS shell sandbox requires elevated process access to launch Chromium; this is a testing-environment constraint, not a canvas requirement.

Focused commands: `pnpm test:state` and `pnpm test:browser`. `pnpm build` rebuilds the committed blank canvas from separate source files; tests check byte-for-byte reproducibility. State/CLI tests check invalid data and operations, schema/runtime agreement, identity uniqueness, JSON round-trip, safe embedding, unchanged implementation bytes, and refusal to overwrite packaged files.

Browser tests run through `file://` with offline contexts and fail on unexpected HTTP/WebSocket requests, page exceptions, or console errors. They exercise all factor and strategy editors, toggles, read-only context, the count indicator, actual clipboard JSON, denied-clipboard fallback, downloaded HTML reopening twice, adversarial text, and invalid embedded state. They also check mobile overflow and keyboard focus. Screenshots are written under ignored `test-results/` for visual review.

Executed on 2026-11-01: 14 tests passed (7 state/packaging, 7 Chromium browser); no tests skipped. Chromium desktop and mobile-width screenshots were inspected. README SHA-256 remained unchanged. Skill validation and local reference checks are also required before delivery.

Limits: Chromium was exercised, not Safari or Firefox, and mobile checks use a desktop browser viewport rather than a physical phone. Clipboard success is tested with test-context permissions; real browser permissions vary, so the tested manual-copy fallback remains available. No page file-loading test applies because loading was explicitly deferred. JSON import is a validated developer packaging operation, not a product UI. No legacy server suites were run: their server/application dependencies are intentionally absent; regression coverage here exercises the adapted capabilities in the destination implementation. No LLM methodology evaluations apply without AI methods.

If sources change after a recorded run, rerun the relevant tests and refresh the results. The initial tests failed before state operations and canvas implementation existed. Later tests exposed a file-URL decoding bug in paths with spaces and an Add button name polluted by decorative CSS content; both are covered by the final suite.

## Slice-1 UI refinement

The browser-comment refinement removes the introductory paragraph, view-description/hint row, and SWOT empty-state prompts; clipboard JSON export is now primary. Empty SWOT quadrant clicks enter Add mode, with double-clicks creating one draft and retaining editor focus even when the second click lands below the input. Existing Add buttons remain keyboard-accessible. The heading label is now SWOT & TOWS: STRATEGIC ANALYSIS. Contextual help is deferred.

The updated full suite executes 15 tests (7 state/packaging and 8 offline Chromium browser tests), including empty-quadrant editing across all four SWOT sections, deletion/reset, populated-quadrant clicks, and export persistence. README is unchanged; runtime and cross-browser limits above still apply.

Next-bullet refinement: clicking blank space below populated SWOT factors adds and focuses the next item across all four quadrants. An unfinished trailing draft is focused rather than duplicated, including double-clicks. Existing rows, headers, and controls do not trigger background additions. The executed full suite now passes 16 tests (7 state/packaging, 9 offline Chromium), including multiple successive factors and stable existing IDs.

## Slice 2A: creation methodology verification

On 2026-11-01, a read-only baseline evaluation of the old skill rejected all four creation scenarios because AI creation was explicitly unavailable. After the change, instruction-following simulations exercised rich nonprofit context (zero questions), sparse pottery context (offer stub and wait), explicit stub authorization (zero questions), mixed expansion scope (one question), explicit correction, the two-question ceiling, and unsupported existing-state refinement. Expected routing and sparse-draft behavior were observed. See `tests/methodology/swot-create.md` for repeatable inputs and rubric. These were manual subagent simulations, not independent live-user conversations or statistical model evaluations.

The evaluator actually generated the rich-case complete state through existing initialState/addItem/editItem utilities and packaged it using the unchanged CLI. Ajv and runtime validation passed; embedded JSON exactly matched input; all strategies were empty; HTML outside the state slot was identical to the established canvas. This checks the artifact handoff, not broad analytical validity.

Executed checks:

- `PYTHONPATH=/tmp/pensive-validator-deps python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive`: passed. The initial default Python attempt lacked PyYAML; reused existing local validator dependencies without installing project dependencies.
- Local Markdown link check across the skill: no missing targets.
- `PATH=/Users/juraj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright pnpm test`: 16 passed, zero failures/skips (7 state/packaging, 9 offline Chromium). Plain pnpm initially lacked Node on PATH. The sandboxed retry passed state tests but blocked Chromium process registration; the final full run used elevated process access as documented above.
- `git diff --check`: passed. README SHA-256 matches the documented unchanged value.

No schema, state utility, packager, HTML, CSS, or canvas JavaScript changed. Browser results cover the existing Chromium workflow, not other browser engines. No research, legacy server tests, acceptance machinery, or live-user elicitation tests were performed. No commit or push was made.

## Slice 2B: guided Strategize / Evaluate / Improve

Executed on 2026-11-02:

- `PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright node --test tests/*.test.mjs`: **28 passed, 0 failed/skipped** (15 state/result-packaging, 13 offline Chromium browser tests). The actual command used the bundled Node executable and elevated macOS process access, as in prior browser runs.
- Skill-creator `quick_validate.py` with temporary PyYAML dependency path: passed.
- Local Markdown references: 34 links resolved before adding this record. README SHA-256 unchanged; `git diff --check` passed. V2 tracked diff is empty at the recorded revision; V1 files remain read-only with recorded source hashes.
- Desktop/mobile screenshots for the action dialog and proposal review were generated and visually inspected.

New automated coverage verifies complete cloned requests and steering/scope/mode, actual clipboard plus denied-copy fallback, cancel/Escape, evaluation-only thoughts above the matrix, current annotation preservation, candidate-before-acceptance behavior, whole-canvas acceptance/rejection, stale acceptance leaving local edits intact, Strategize boundaries and extend preservation, exact-text stable IDs, malformed metadata, adversarial thoughts/candidates, result CLI validity/no-output-on-error, and multiple action cycles. Existing manual editing, view, identity, offline operation, safe embedding and saved-file regressions remain in the full run.

An independent code review found an exact-text re-identification gap in Improve. A failing test reproduced it; the deterministic boundary now rejects replacing unchanged text with a new ID while allowing consolidation onto an existing matching ID. Semantic identity across rewritten text still requires methodological judgment.

Separately, an independent read-only methodology forward-test applied all three methods to one synthetic constrained pottery-studio scenario. The first Evaluate output was overly long; after narrowing the default guidance, a second run returned a compact five-sentence assessment. Actual retained inputs/outputs are in `tests/methodology/swot-actions-observed.json`, with observations and remaining scenarios in `tests/methodology/swot-actions.md`. The deterministic suite also composes/packages those observed responses, which establishes protocol compatibility, not analytical quality in general.

Limits: no live API calls are made by this product or these tests. One synthetic methodological case is not a statistical model evaluation or live-user study. Browser behavior was exercised in Chromium at desktop/mobile widths, not Safari/Firefox or physical devices. No old server regression suites were run; required adapted behavior is covered in destination tests. Research, generic node actions, section/item acceptance, history, file loading and local storage remain out of scope. The original creation workflow remains available and its methodological routing scenarios were updated to recognize the separately implemented transformations.

## PAGES creation, actions and persistent Ripple comparison

Executed on 2026-11-02 after the user approved the revised PAGES design:

- `PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright /Users/juraj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/*.test.mjs`: **47 passed, 0 failed/skipped**. This includes all 28 existing SWOT tests and 19 new PAGES tests (12 state/schema/packaging, 7 offline Chromium). Chromium required elevated macOS process access, as in prior slices.
- PAGES tests were written and observed failing before the state operations and canvas existed. State tests then passed; the first browser run passed five tests and exposed two ambiguous test selectors (region versus checkbox, and export versus import textbox), corrected by explicit role/exact-label selection.
- Independent review reproduced a reorder-only source bypass in imported Ripple proposals. A regression test failed before the fix; proposal validation now uses an ID/text comparison that ignores array ordering, consistent with normal Ripple requests. All tests passed afterward.
- `node .agents/skills/pensive/scripts/package-pages.mjs` using the bundled Node built the committed standalone canvas. State tests independently rebuild it and compare exact output. CLI tests verify safe data-only packaging, exclusive output creation, invalid-input no-output behavior and `--result` composition.
- `PYTHONPATH=/tmp/pensive-validator-deps python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive`: passed. PAGES manifest parsed with PyYAML; every declared method exists. All 39 local Markdown links in the skill resolved.
- `git diff --check`: passed. README SHA-256 remains `372931125511c5fae95971c88a11fd725dffaa3724672c4bfb95291b23ea8c4e`. Existing SWOT framework files, package utility and tests have no diff. V2 tracked diff is empty; its pre-existing untracked audio file remains untouched. V1 was read-only; inspected file identities are in the extraction map.

Coverage: empty initialization; stable identity and validation; additions/edits/removals/moves/reverts against a copied baseline; explicit reset; baseline-missing imports; multiple selected Ripple sources including an emptied source; source/framing preservation; rejected invalid sources and reorder-only changes; Evaluate-only thoughts; Improve/Ripple proposals; atomic stale content/baseline acceptance checks; rejection preserving local edits; annotation collision and exact-text re-identification rejection; invalid/tampered imported proposal metadata; safe embedding; full clipboard handoff and denied-copy fallback; dialog cancellation; import errors/cancel/confirmed replacement; consecutive saved HTML generations; adversarial strings in current/baseline/candidate/thought data; desktop/mobile width and keyboard focus; no network requests while offline.

Desktop/mobile canvas, proposal and Ripple-dialog screenshots were generated and visually inspected under `test-results/`. Representative discovery, elicited impasse and pending shift-proposal HTML artifacts were packaged there from the retained methodology fixtures. Those are local review artifacts, not published or runtime dependencies.

Methodology: [pages.md](../tests/methodology/pages.md) and [pages-observed.json](../tests/methodology/pages-observed.json) retain an actual synthetic subagent simulation of rich discovery, two-turn conversational elicitation, an impasse, explicit blank routing, optional recommendation, ordinary uncertainty, declined recommendation and all three action responses. The deterministic suite validates and packages the generated states and responses. The observed Ripple qualified speculative effects and did not infer new authority from a changed self-concept. Baseline routing was a read-only inspection of unavailable capabilities, not a separately sampled model experiment.

Limits: Chromium desktop/mobile viewports only, not Safari/Firefox or physical devices. Synthetic user answers and a small methodology sample are not live-user evidence or a statistical evaluation. Repeated cumulative Ripple quality is not broadly evaluated. The book named by the V1 prompt was not independently inspected. No legacy backend tests or live API calls were run; the product has no API client. Six Hats, partial acceptance, Restate framing, revision history and generic action availability on SWOT remain deferred. Ripple is currently exposed only for PAGES despite its generic conceptual scope. No commit, remote, push or publication was made.

## Proposal bullet labels — 2026-11-02

Added muted-green `New` and `Updated` tags to the Proposed column in both PAGES and SWOT/TOWS review. Comparison uses item ID and text within the displayed collection; unchanged bullets and the Current column remain untagged. Tags are presentation only, separate from Ripple baseline markers; JSON and acceptance semantics are unchanged. Modified both canvas runtimes and the shared SWOT stylesheet, then rebuilt both standalone HTML files.

Two new focused browser tests first failed with missing tags, then passed after implementation. They cover new/updated/unchanged bullets, Current-column exclusion, mobile wrapping, save/reopen and accept/reject behavior. Desktop/mobile screenshots were visually inspected. The full offline Chromium/state regression command documented above passed **49 tests, zero failures/skips**. `git diff --check` passed and README checksum is unchanged. Existing exported HTML embeds its old runtime; repackage its JSON with the current template to add the labels without changing state. No state/schema or skill-instruction changes were needed.

## Pre-push verification — 2026-11-02

The full bundled-Node command above, with `PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright` and elevated Chromium process access, passed **71 tests, zero failures/skips**. Coverage includes PAGES, SWOT/TOWS, Ripple baseline persistence, new/updated proposal labels, and collection-level acceptance/rejection with saved partial decisions and stale-edit protection. Skill validation passed using the documented temporary PyYAML path; all 48 local skill Markdown links resolved. README checksum is unchanged and `git diff --check` passed. Browser coverage remains Chromium only; this run does not establish Claude compatibility or broad analytical quality.
