# Uniform canvas editing implementation plan

Status: implemented and verified 2026-11-04. Full regression: 160 passed, zero failures/skips; independent review found no blocking issue. See `docs/testing.md` for evidence and limits. No commit/push requested.

**Goal:** Enter finishes analytical text editing, Shift+Enter inserts a line break, and collection reordering behaves consistently in SWOT, PAGES and VPC.

**Architecture:** Extract the demonstrated SWOT pointer-ordering behavior into a shared browser helper and stylesheet used by all three collection canvases. Keep framework state validation and proposal/baseline semantics framework-owned. A small shared Enter binding is embedded in all four canvases and applied only to analytical fields; 5 Whys uses its existing commit/cancel form semantics. No schema changes, tree reparenting, keyboard reordering or changes to AI/JSON dialog text boxes.

**Approved scope:** The user requested Enter-to-finish/Shift+Enter-to-newline and uniform global editing behavior. Existing flat-collection drag design carries over unchanged. Text edits stay in the tab until HTML save/export; Enter is not an automatic file download.

## Steps

1. Add failing cross-framework browser tests for analytical fields, IME composition, Shift+Enter, persistence and exclusion of AI/JSON fields. Add PAGES/VPC reorder invariant tests before implementation.
2. Add framework-owned `reorderItem` in PAGES/VPC, preserving identities, proposal guards and PAGES baseline. Pure order changes remain non-semantic for Ripple.
3. Extract shared `CanvasEditing` browser binding and collection-pointer helper; replace SWOT's implementation with equivalent calls. Reuse callbacks for current state, rendering and status so stale-review handling stays consistent.
4. Embed shared assets in the relevant packagers/templates. Apply Enter binding to bullet/framing textareas in SWOT/PAGES/VPC and framing/node/countermeasure editors in 5 Whys. Respect IME composition and native dialog text editing.
5. Rebuild all four standalone canvases. Run focused tests then the complete offline regression suite; visually inspect PAGES/VPC handles, review independent feedback and update guidance/docs with exact checks and limits.

## Files

- Shared browser/CSS: `.agents/skills/pensive/shared/canvas-editing.js`, `collection-ordering.css`.
- Frameworks: SWOT/PAGES/VPC `canvas.js`, PAGES/VPC `state.js`, 5 Whys `canvas.js`, templates and all four packagers.
- Tests: `tests/canvas-editing-browser.test.mjs`, `tests/collection-ordering-state.test.mjs`, existing regressions.
- Documentation: skill usage notes, architecture/roadmap/testing records. Preserve README and unrelated changes.

## Verification

Use the bundled Node and `PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright`. Run new browser/state tests, existing full `node --test tests/*.test.mjs`, skill validator, Markdown-reference/manifest checks, README checksum and `git diff --check`. Browser tests require approved macOS process access; standalone rebuilds require write access to the skill directory. Report simulated-touch/Chromium coverage separately from Safari or physical devices.
