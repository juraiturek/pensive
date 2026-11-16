# Issue Tree sibling order

User-requested design: reveal ‹ and › around the existing +/× row only while hovering the lower control area. Move one position within the same parent's children, carrying the whole subtree. Boundary buttons, both buttons for an only child, and root buttons are disabled and dim when revealed. No reparenting or scoring.

Keep +/× centered and stationary. Reveal arrows on keyboard focus within the controls as well as hover; a touch on the lower area reveals the row. Restore focus after movement and keep it visible. Preserve selected cursor, IDs, notes, flags and all descendants. Root/boundary moves are no-ops; invalid directions fail. Reordering is saved in existing children-array order, so JSON/HTML/requests preserve it and pending whole-tree proposals become stale. Full Tree stays read-only.

1. Add failing core/browser tests for adjacent movement, boundaries/root/single child, subtree/selection preservation, visibility rules, keyboard/touch reveal, inline rename labels, saved HTML/JSON and stale proposal guards.
2. Add a small framework-local moveSibling operation, wire two accessible buttons, and add local CSS reveal/dim rules. Update skill handoff/capabilities. Keep the schema unchanged.
3. Build framework HTML, run focused and regression tests, validator and visual QA. Review the change. Rebuild the existing conversation canvas while preserving saved analysis; do not capture or refresh unsaved browser work. No distribution, commit, merge or publication is implied.
