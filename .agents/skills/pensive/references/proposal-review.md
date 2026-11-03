# Review and resolve proposed node changes

PAGES and SWOT/TOWS support local collection-level acceptance and rejection, plus bulk controls. A node here is one PAGES dimension, SWOT factor collection, or TOWS strategy collection. Individual bullets remain informational only; their New/Updated tags are not acceptance controls. Creation and thought-only Evaluate do not use this review flow.

## User interaction

Expand “Review proposed changes” to see changed nodes and Current/Proposed content. Each pending node has a checkbox and Accept/Reject buttons. Individual decisions apply immediately. Checkboxes initially are unchecked; Accept Selected accepts the selected pending nodes and leaves others pending. Accept All / Reject All resolve every pending node. After any decision, the labels become Accept All Remaining / Reject All Remaining: they never undo earlier acceptance. Resolved nodes stay visible with Accepted/Rejected status until review completes. Accepted nodes show Original/Proposed columns to retain the comparison.

Actual decisions survive full JSON export/import and HTML save/reopen. Selection checkboxes and expansion state are temporary UI preferences, not saved decisions. No undo/reopen-decision UI exists. Rejected content is never applied. Local edits remain direct operations, but unrelated edits during pending review make further acceptance stale; rejection remains available without losing local edits.

## Deterministic protocol

The optional `resolutions` map on the single pending proposal maps changed collection keys to `pending`, `accepted` or `rejected`. Omitted keys and an omitted map mean pending. Only changed collections can appear in it. Invalid values, unknown/unchanged keys or a fully resolved proposal left pending fail validation. Original `base_content`, complete candidate `content`, and the AI thought stay intact during review. PAGES also retains its original `base_baseline` guard. The map is local decision metadata; AI response contracts are unchanged and models must not generate it.

`state.js` exposes `proposalSections(state)` (changed section/status entries) and `resolveProposal(state, sections, "accept"|"reject")`. `acceptProposal(state)` and `rejectProposal(state)` resolve all remaining nodes; `undefined` sections in `resolveProposal` also means all remaining. Explicit empty/duplicate/invalid/resolved target lists fail atomically. The generic resolver is shared, while framework code still validates framing/source restrictions and content semantics.

Before acceptance, compare current content with the original base plus previously accepted collections. This lets the proposal's own decisions coexist with remaining review without treating them as stale edits. Validate the complete resulting canvas before mutation. PAGES additionally checks the baseline has not changed; no review decision resets it. Keep original full-candidate action boundaries enforced throughout review.

Some subsets are structurally incompatible: a bullet moved between nodes can duplicate its stable ID if its destination is accepted without its removal. Explain the failure and ask the user to select the related nodes together; do not silently accept unselected changes. A rejected dependency may make remaining acceptance impossible; the user can reject the rest and request a new transformation. No automatic semantic re-evaluation or dependency engine exists.

When every changed node is resolved, clear the temporary proposal. If any node was accepted, append the AI thought once with accepted/rejected node names and a label identifying it as the original rationale, not a reassessment of the mixed canvas. Fully rejected or no-change proposals clear without an acceptance thought. Previously accepted nodes and unrelated local edits survive Reject All Remaining.

The version-1.0 schema extension accepts older whole-canvas proposals without `resolutions`; they start all-pending. Older exported HTML embeds its old runtime and cannot use the new metadata. Repackage complete JSON with the current established canvas to upgrade presentation; never regenerate the implementation or silently drop pending decisions. This is not revision history.
