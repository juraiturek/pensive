# VPC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add approved local VPC creation, editing, Evaluate and Improve without changing existing framework behavior.

**Architecture:** Framework-owned six-list state with five framing strings, established standalone packaging and contextual Markdown reasoning. Whole-canvas proposals only; no baseline, Ripple, Restate, partial review or generic-tool implementation.

**Tech Stack:** Static HTML/CSS/JS, Node built-in tests, Ajv, Playwright; existing development dependencies only.

## Task 1 — Core state, packaging and blank canvas

Create `frameworks/vpc/{framework.yaml,canvas.schema.json,state.js,canvas.template.html,canvas.css,canvas.js,canvas.html}` within the skill and `scripts/package-vpc.mjs`. Create `tests/vpc-state.test.mjs` and `tests/vpc-browser.test.mjs` first; run focused tests and observe missing VPC failure. Implement core operations, strict validation, unique IDs, safe exclusive packaging, confirmed import, clipboard fallback, saved HTML reopening and responsive two-half layout. No AI action code yet. Run focused tests to green. Review spec then code quality before next task.

## Task 2 — Evaluate

Add failing tests for complete-state requests and thought-only result boundaries. Implement Evaluate state/UI support and `prompts/evaluate.md`. Verify no content/framing mutation, annotation preservation, pending-proposal blocking, safe thought rendering and result packaging. Run focused tests to green; review spec then quality before proceeding.

## Task 3 — Improve

Add failing tests for framing-preserving stable-ID candidates, pending review, stale atomic acceptance and rejection preserving edits. Implement only Improve with whole-canvas accept/reject and `prompts/improve.md`; no partial-resolution protocol or source baseline. Run tests to green, then spec and quality review.

## Task 4 — Creation, routing and methodological verification

Add `prompts/create.md`, `references/vpc-workflow.md`, `references/framing-content.md`, framework-selection routing in `SKILL.md`, and a link in `references/framework-contract.md`. Preserve other framework methods. Creation must extract framing, resolve essential gaps adaptively (zero to two question turns), generate supported content and check coherence. Record observed rich/partial/unsupported-fit/mismatch and action scenarios in `tests/methodology/vpc.md` and `vpc-observed.json`; validate/package those observations independently of quality judgments.

## Task 5 — Integration and final verification

Add VPC build command to `package.json`; update architecture, extraction map and testing records. Run bundled Node `--test tests/*.test.mjs` with documented Chromium permissions; verify deterministic build, inspect desktop/mobile screenshots, run skill validator, local reference checks, unchanged README SHA-256 and `git diff --check`. Report actual results and limits. No push or publication.

Each executable task follows failing test → minimal implementation → passing focused test. Commit verified work locally in the isolated branch; do not publish. Source provenance is in the approved audit and fingerprints. Final review checks whole-canvas-only VPC boundaries and unchanged SWOT/PAGES behavior.
