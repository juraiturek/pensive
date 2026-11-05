# SWOT consumer improvements implementation plan

Status: implemented and verified 2026-11-04; full regression 144 passed. See `docs/testing.md` for commands, observed failures and limits. Independent review found no blocking findings. No commit or push requested.

**Goal:** Implement approved E1–E8 from the consumer test, preserving local agency and existing JSON/action contracts.

**Architecture:** Refine Markdown guidance for collaborative transitions, concise proofreading/rationales and optional strategy breadth. Keep executable changes SWOT-only: compact accepted thoughts, clearer export wording, and pointer-based within-collection ordering using stable IDs. Reuse the established packaging and review machinery; no new schema or dependency.

**Tech stack:** Standalone JavaScript/CSS/HTML, Node test runner, Playwright, Markdown skill guidance.

## Approved design

- Latest accepted thought is expanded; earlier thoughts are collapsed behind a count, retained unchanged in JSON and saved HTML. Pending proposal rationale remains separate.
- Bullet-marker area reveals a drag handle after a brief mouse hover, without moving text. Touch tap selects a row and reveals its handle. Drag begins only on the handle and has a visible insertion marker.
- Dragging stays within the collection and commits only on a valid drop. Pointer cancellation or Escape leaves state unchanged. Keyboard reordering is deferred by user instruction.
- Reordering is disabled in collections with unresolved proposed changes, with an explanation. Existing stale-review safeguards still apply to other manual edits during review.
- Keep Export to clipboard wording compatible while explaining that it copies state for discussion, distinct from Copy AI request. Both clipboard success and fallback identify what was copied.
- No Outcomes, cross-collection moves, annotations, individual strategy decisions or framing changes in this slice.

## Task 1: guidance (E1/E2/E3/E5/E6)

Files: `.agents/skills/pensive/SKILL.md`, relevant SWOT prompts and workflow references, `tests/methodology/` observations.

Use the consumer experiment as documented baseline. Exercise representative creation/reconciliation/proofreading/breadth cases before and after changes; distinguish instruction inspection and synthetic application from live quality evidence. Preserve state authority, framing boundaries, Evaluate thought-only behavior and pending-review rules. Run skill validator and local reference checks.

## Task 2: ordering state operations (E8)

Files: `.agents/skills/pensive/frameworks/swot/state.js`, `tests/swot-state.test.mjs`.

Write failing tests for within-collection reorder identity/order persistence, invalid operation atomicity and pending collection protection. Add a narrow `reorderItem(state, section, id, finalIndex)` operation, with integer bounds and no cross-collection API. Keep no-op moves harmless. Run focused state tests.

## Task 3: interface (E4/E7/E8)

Files: SWOT `canvas.js`, `interactions.css`, `canvas.template.html`, `scripts/package-swot.mjs`, `tests/swot-browser.test.mjs`. The base `canvas.css` is imported by other frameworks; preserve it and embed the SWOT-only stylesheet separately.

Add failing browser tests for compact thought display/save, export explanations, drag visibility and stable text geometry, mouse moves up/down in factors and strategies, invalid/cancelled drops, pending proposal protection and touch reveal/drag. Implement pointer capture from a handle, with a same-list insertion marker and commit-on-drop. Preserve text editing, blank-space Add, read-only TOWS context and offline save implementation. Rebuild SWOT HTML with bundled Node.

## Task 4: verification and documentation

Files: `docs/testing.md`, `docs/architecture.md`, `docs/roadmap.md`, consumer report status, this plan.

Run focused tests, complete Node/Chromium regression suite, validator, reference checks, README hash and whitespace checks. Inspect desktop and narrow/touch screenshots. Request independent code review; resolve material findings and rerun affected checks. Record exact results and limits, particularly simulated touch versus physical devices and Safari. No commit, push, remote or publication requested.

## Commands

Bundled Node: `/Users/juraj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.

- Focused: bundled Node `--test tests/swot-state.test.mjs tests/swot-browser.test.mjs` with `PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright`.
- Build: bundled Node `.agents/skills/pensive/scripts/package-swot.mjs`.
- Regression: bundled Node `--test tests/*.test.mjs` with the same browser path.
- Validator: `PYTHONPATH=/tmp/pensive-validator-deps python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive`.
- Integrity: `git diff --check`; compare README SHA-256 to `372931125511c5fae95971c88a11fd725dffaa3724672c4bfb95291b23ea8c4e`.

Browser launches may require the documented macOS process permission; report a denied environment check distinctly from product failures.
