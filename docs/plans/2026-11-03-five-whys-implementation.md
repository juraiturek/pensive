# 5 Whys Implementation Plan

**Goal:** Deliver the approved local-first 5 Whys migration while preserving V2 strand/side-door/overview UX.
**Architecture:** Framework-local recursive state, safe static DOM, mechanically ported layout helpers, Markdown reasoning, deterministic packaging. Full state requests with separately validated target/context/modification scopes; atomic append proposals.
**Tech Stack:** Static HTML/CSS/JavaScript, Node built-in tests, existing Ajv/Playwright development dependencies.

Approved design: [Phase A review](2026-11-03-five-whys-phase-a-review.md). User approved core → Reflect → Expand Deepen → Expand Branch and proposed deviations on 2026-11-03. No root-generation action, generalized engine, history or dedicated research mode.

1. In isolated worktree, retain current fit guidance and run baseline regressions. Preserve README and fingerprint V2.
2. Write failing `tests/five-whys-state.test.mjs` for nested identities, framing/root edits, add/close/reopen/delete, cursor repair, first-child navigation, strand/overview geometry, wide/deep input validation. Implement `frameworks/five_whys/state.js` and schema; run focused tests.
3. Write browser/packaging tests for safe standalone build, exclusive output, import/export/save, original interactions and offline full-tree navigation. Extract focused V2 CSS/markup; implement local UI/template and packager; run focused tests and inspect screenshots.
4. Write failing Evaluate request/result tests. Implement thought-only Evaluate and UI handoff; verify no analytical mutation.
5. Write failing Deepen/Branch scope/proposal tests. Implement action-specific append composition and local atomic review, full-content stale guard excluding cursor; verify preserved branches/framing and hostile metadata rejection.
6. Add manifest, create/evaluate/expand Markdown methods, handoff and activation. Retain methodology scenarios/responses; validate with actual schema/composer/CLI and review against requested causal cases.
7. Run focused and full regressions, offline desktop/narrow visual review, skill validator, YAML/link checks, README/source hashes and whitespace. Request independent code review under requesting-code-review skill; resolve material findings. Bring only migration changes back to shared workspace and report actual checks/limits.

Each executable stage follows failing-test → implementation → passing focused tests. No push/publication. Review checkpoints are progress reports; approval already authorizes all selected stages.
