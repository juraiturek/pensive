# Issue Tree evaluation scopes implementation plan

**Goal:** Offer Full evaluation (default) and MECE evaluation above Optional guidance, as approved in chat.

**Architecture:** Use native radio buttons like the 5 Whys dialog. Requests carry optional `action.evaluation_scope` (`full` or `mece`) only for Evaluate. Missing scope means Full for compatibility. Evaluation remains append-only and uses supplied evidence; research is out of scope.

**Tech Stack:** Existing standalone HTML/CSS/JS, Node state tests and offline Chromium.

1. Add state/request persistence tests and browser tests for default, selection, reset, guidance preservation and Alternative isolation. Observe failure before implementation.
2. Extend Issue Tree request validation and dialog; update Evaluate instructions to distinguish scope and supplied-evidence limits. Preserve existing analytical state schema and renderer selection behavior.
3. Rebuild framework HTML, run focused and regression tests and skill validator, inspect desktop/narrow dialog screenshots. Record actual results. Do not refresh browser-only edits or generate distributions.
