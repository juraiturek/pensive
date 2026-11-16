# Issue Tree full-screen view implementation plan

**Goal:** Add the approved viewport-filling, read-only tree overlay with automatic fit.

**Architecture:** A native modal dialog contains a read-only rendering of the existing org-chart geometry. Scale and center the visible node bounds within the available viewport on opening and resize. Keep priority styles; Close and Escape restore focus to the opener. No persisted state or dependency changes.

**Tech Stack:** Existing standalone HTML/CSS/JavaScript and offline Playwright/Node tests.

1. Add browser coverage in `tests/issue-tree-browser.test.mjs` for opening, all-node fit at desktop and narrow sizes, wide/deep trees, read-only controls, priority styles, unchanged exported state, focus and Escape/Close. Run it before implementation to observe the missing control.
2. Add dialog and opener in `.agents/skills/pensive/frameworks/issue_tree/canvas.template.html`, fit styling in `canvas.css`, and read-only rendering plus resize handling in `canvas.js`. Reuse the current renderer with a read-only parameter; keep existing editable rendering behavior.
3. Rebuild only framework HTML using `node .agents/skills/pensive/scripts/package-issue-tree.mjs`. Run focused Issue Tree tests, relevant regression suite, skill validator and whitespace check. Visually inspect desktop and narrow screenshots.
4. Record actual checks and limitations in `docs/testing.md` and the new view behavior in `docs/architecture.md`. Preserve README and existing deliverables. No distribution build or publication.
