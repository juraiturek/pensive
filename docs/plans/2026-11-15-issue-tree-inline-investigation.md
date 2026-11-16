# Issue Tree inline naming and investigation marker

**Goal:** Implement the user's three requested editing improvements with the approved selected-title click gesture.

**Design:** First title click selects, a further click on the selected title edits inline; new children start inline with empty title and a visual-only Enter name placeholder. Native textarea supports Enter/blur completion, Shift+Enter newline, composition and Escape revert. Keep the detail title in sync. Changes update state while typing so exports cannot miss drafts. Keyboard users can activate the selected title or use F2. Full Tree stays read-only.

Needs investigation is an optional Boolean node property `needsInvestigation`. Absent is unmarked for legacy imports; new nodes default false. A checkbox controls a thin circled question mark at the card's upper-right in editor and Full Tree. It is independent of impact/influence and user-owned: Evaluate preserves it, Alternative preserves marks for retained IDs and cannot mark new IDs. Proposal stale guards include this field. JSON/schema/HTML/save/import/history remain complete.

**Implementation sequence:**
1. Add failing state tests for empty child defaults, optional Boolean validation, schema/persistence, Evaluate/Alternative preservation and stale review. Add browser coverage for click/keyboard/IME/blur/Escape/export, blank placeholders, all flag combinations, badge geometry and read-only Full Tree.
2. Update only Issue Tree core, schema, renderer/template/styles and operational methods. Keep layout and all existing work in progress intact.
3. Rebuild framework HTML; run focused and full offline regressions and skill validator. Inspect desktop/narrow screenshots. Rebuild this chat's canvas preserving saved state without refreshing or claiming to capture unsaved browser work. Record real validation limits in docs/testing.md. No distribution or publication.
