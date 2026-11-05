# Annotation Mode Implementation Plan

**Goal** Add portable manual notes to PAGES and 5 Whys.

**Architecture** Share the annotation state and UI source. Framework adapters expose stable targets, mount controls and guard analytical editing. Each packager embeds the shared assets for offline use.

**Stack** Standalone HTML, JavaScript, JSON Schema, Node tests and Playwright.

1. Add failing round-trip and mutation-invariant tests in `tests/annotations-state.test.mjs`. Add the optional collection to both validators and schemas, and embed the shared assets.
2. Add a failing offline browser workflow for both pilots. Wire a shared workspace and contextual preview to PAGES row rendering and 5 Whys strand rendering. Keep navigation active and disable analytical writes in Annotation Mode.
3. Verify deleted targets, proposal resolution, old JSON, keyboard access, touch, and standalone save/reopen. Run focused tests and the full regression suite, validate the skill, and record extraction provenance.
