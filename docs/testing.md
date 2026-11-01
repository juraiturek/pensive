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
