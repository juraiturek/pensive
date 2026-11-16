# Issue Tree Full Tree orientation

Add native Vertical/Horizontal toggle buttons only in the read-only Full Tree header. Vertical is the current top-down layout and initial default. Horizontal lays out the root leftmost and descendants rightwards, with sibling order read top-to-bottom and upright cards. Do not rotate text. Retain fit-to-viewport, priority/investigation styles, resize handling and read-only behavior.

Use an optional deterministic orientation argument to overview geometry; default vertical geometry remains identical. Orientation is transient per open page, retained on close/reopen, reset to vertical on reload, and absent from canvas JSON, history and action requests. Editing layout is always vertical. Native dialog focus containment must allow keyboard access to both toggle buttons and Close; Escape/focus restoration remain intact.

Test both axes, orthogonal edge endpoints, containment, hierarchy/order, no state mutation, invalid orientation, desktop/narrow fit, toggling/reopen, keyboard navigation, export/HTML persistence and unchanged editor geometry. Inspect the user's 80-node saved analysis in both views. Build only framework HTML, validate skill and run focused/regression checks; upgrade the new issue_tree-2 canvas with saved state preserved. No new zoom/pan/collapse feature or distribution/commit is implied.
