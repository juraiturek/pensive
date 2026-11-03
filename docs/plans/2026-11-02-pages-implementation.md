# PAGES Implementation Plan

**Goal:** Deliver the approved PAGES design, including artifact-persisted Ripple changes, without disrupting SWOT.

**Architecture:** Explicit PAGES package and deterministic Node/browser state operations. Reuse the existing canvas stylesheet at build time with PAGES overrides; keep framework semantics and action boundaries explicit. No generic canvas engine or runtime dependencies.

**Tech stack:** Static HTML/CSS/JavaScript, Node test runner, Ajv, offline Playwright, Markdown methods.

The user approved the revised [design](2026-11-02-pages-design.md). Execute sequentially in this workspace; preserve user work, README and legacy sources. Do not publish. Review checkpoints are test results and implementation updates, not additional permission gates.

## 1. State and persistence

- Create `tests/pages-state.test.mjs` covering initialization, baseline diff (including moved/deleted items), reset, schema/runtime agreement, complete requests, action boundaries, stale proposal protection, safe embedding and CLI error behavior.
- Run the new test and observe missing-capability failures.
- Implement `.agents/skills/pensive/frameworks/pages/state.js` and `canvas.schema.json`: baseline optional for pre-baseline imports, explicit initialization/reset, stable IDs, Evaluate/Improve/Ripple, fixed selected sources and artifact persistence.
- Rerun focused tests to green. Do not silently establish a baseline for imported old state.

## 2. Canvas and packaging

- Create `tests/pages-browser.test.mjs` for five bands, edits and change markers, removed summaries, baseline confirmation, import atomicity, complete clipboard requests, candidate review and stale acceptance, saved HTML round-trip, offline safety and mobile width.
- Run and observe missing-canvas failures.
- Create the PAGES template, CSS overrides and runtime plus `scripts/package-pages.mjs`. Reuse SWOT CSS through a build-time resource inclusion, leaving its tested package unchanged. New HTML must use the pristine implementation plus the state slot.
- Run build/state/browser tests and visually inspect desktop/mobile screenshots.

## 3. Methodology and integration

- Baseline-test existing skill routing before changes; retain actual evaluator observations.
- Add PAGES `framework.yaml` and `prompts/{create,evaluate,improve,ripple}.md`, plus PAGES handoff reference. Update skill selection and availability without changing existing SWOT instructions.
- Forward-test discovery, rich context, sparse elicitation, impasse shifting and all three actions. Retain actual generated requests/responses and validate/package those fixtures. Do not call static fixtures a model evaluation.
- Update extraction map, architecture, roadmap and testing records with source identities and actual results.

## 4. Final verification

- Run all `tests/*.test.mjs`, skill validator and local Markdown reference checks. Verify README integrity and legacy read-only status.
- Review implementation for action boundary/import/proposal hazards and resolve findings with reproducing tests.
- Report files, extraction choices, actions, checks and limits; no remote, push or publication.

## Completion record

All four steps implemented and verified; see [testing results](../testing.md). Full suite: 47 passed, zero failed/skipped. Independent code review's imported-reorder issue was reproduced, fixed and regression-tested. README and legacy sources remain unchanged.

Created: `frameworks/pages/{framework.yaml,canvas.schema.json,state.js,canvas.template.html,canvas.css,canvas.js,canvas.html,prompts/{create,evaluate,improve,ripple}.md}`, `scripts/package-pages.mjs`, `references/pages-workflow.md` within the skill; `tests/pages-{state,browser}.test.mjs`; and `tests/methodology/pages{.md,-observed.json}`. Modified: skill orchestration/framework contract, build/test scripts, architecture, extraction map, roadmap and testing records. Design and execution plans are retained here. No new dependency was added.
