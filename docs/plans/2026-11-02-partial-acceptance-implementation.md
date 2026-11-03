# Partial Acceptance Implementation Plan

**Goal:** Implement the approved node-level review in PAGES and SWOT/TOWS, leaving bullet-level decisions deferred.

**Architecture:** Share small deterministic proposal-resolution and review-UI helpers, embedded in standalone HTML at build time. Each framework still validates its own content and action boundaries. Optional resolution metadata extends current proposals; original bases and candidates remain immutable until completion.

**Tech stack:** Existing static JavaScript/CSS, Node tests, Ajv and offline Playwright. No dependency additions.

1. Add `tests/partial-acceptance-state.test.mjs`, parameterized over both frameworks. Observe missing partial API failures; implement shared proposal review state plus framework wrappers/schema extension. Check mixed decisions, persistence, duplicate-ID subset failures, stale edits, original boundaries and no-change/legacy proposals.
2. Add focused browser tests for both frameworks. Observe failures before UI changes. Implement shared review renderer with per-node controls, selection and batch controls, persistent decision statuses and accurate final rationale. Rebuild both templates and test offline desktop/mobile/save behavior.
3. Update operational skill references, manifests and roadmap claims. Run validator/link checks and review changes independently. Fix findings with regression tests.
4. Run all tests, inspect screenshots, verify unchanged README/legacy sources, record checks and limits. Leave work local; no publication or unrelated feature work.

The user approved the [design](2026-11-02-partial-acceptance-design.md). Execute in this existing workspace while preserving current uncommitted work; no new approval gate is needed.
