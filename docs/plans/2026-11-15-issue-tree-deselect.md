# Issue Tree empty-space deselection

Clicking empty space inside the tree viewport clears visible selection, hides Node details immediately, and expands the tree to the available width. Clicking the same or another node restores selection and details; a subsequent selected-title click retains inline editing. Card controls, notes, flags, toolbar and Full Tree do not trigger deselection. Node-body clicks select without editing. Preserve any inline draft on blur.

Use transient UI selection visibility, retaining the valid persisted cursor for compatibility and navigation. No schema/state migration, animation, or analytical mutation is needed. Test deselection/reselection, expanded width, inline draft preservation, control exclusion and unchanged JSON. Rebuild the framework and current canvas while preserving saved state; run focused browser/state tests, validator and visual check. Keep existing uncommitted work.
