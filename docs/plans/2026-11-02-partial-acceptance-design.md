# Node-level proposal acceptance — proposed design

Status: proposed in response to the user's node-level review request. Implementation has not started. This extends both PAGES and SWOT/TOWS; bullet-level decisions and Six Hats remain deferred. README and legacy sources remain unchanged.

## UX and alternatives

Recommended: combine per-node Accept/Reject controls with a checkbox for batch selection in the existing expanded Current/Proposed review. Checkboxes alone are simpler but make one-node decisions indirect; per-node buttons alone make batch review tedious. The combined design directly supports the user's requested workflow without adding another screen.

Each changed collection is one reviewable node: a PAGES dimension, SWOT factor collection, or TOWS strategy collection. Unchanged nodes are not offered for decisions. Keep New/Updated bullet tags as informational cues only. The checkbox starts unchecked, and each node has Accept and Reject buttons. An individual decision takes effect immediately, with a visible Accepted/Rejected status replacing its controls. Accepted nodes update the editable canvas; rejected nodes retain current content. Keep resolved nodes visible while other nodes are pending so decisions are understandable.

Bottom controls: Accept All, Accept Selected, Reject All. Accept Selected is disabled when nothing is selected; it applies selected pending nodes and leaves unselected nodes pending. It does not interpret unchecked as rejected. Once decisions exist, use Accept All Remaining / Reject All Remaining so the buttons do not imply rollback or reversal. No undo/reopen decision feature in this slice. Selection checkboxes are temporary UI state; actual accept/reject decisions persist in JSON and HTML.

## State and safety

Extend the existing single proposal with an optional collection-resolution map (pending/accepted/rejected for changed collections). Existing whole-canvas proposals without the map are all-pending and remain valid in the current runtime; older exported runtimes cannot render the extension and need repackaging. Do not version or migrate unrelated canvas content.

Keep the original base and candidate intact while a proposal remains pending. Derive the expected current content from the original base plus already accepted collections. Acceptance compares against that expected state, rather than invalidating the remaining proposal because of its own accepted changes. Rejecting nodes does not change content. Save/export/import must retain the resolution map, original proposal and candidate so review can resume.

Continue the conservative concurrency rule: unrelated manual content edits while a proposal is pending make further acceptance stale. Rejection remains available to discard remaining suggestions without losing those edits. PAGES additionally retains its baseline guard; no partial decision advances the Ripple baseline. Framing and Ripple selected source collections are never reviewable changes. Existing action boundaries remain enforced against the original complete proposal, not a partially rewritten base.

Validate the entire resulting canvas before applying any acceptance, atomically. A subset may be invalid when a concept moves between collections: accepting its destination without removing its source could duplicate a stable ID. In that case explain the conflict and ask the user to select the related changes together; never silently include an unselected node. Rejected decisions can make a dependent remaining subset impossible to accept; users can still reject the remainder and request a new transformation. Do not invent a dependency graph or auto-reason after acceptance.

When all changed nodes are resolved, remove the temporary proposal. If anything was accepted, retain the AI explanation once, explicitly labeled with accepted/rejected node names so it cannot imply that all suggested changes were approved. If everything was rejected, add no acceptance thought. Do not rewrite the original AI rationale as though it had assessed the newly mixed canvas; identify it as the original proposal rationale. A no-change proposal remains resolvable without inventing changed nodes.

## Scope and verification

- State tests first for accepting/rejecting one node, batch acceptance, unchecked nodes remaining pending, resolution persistence, full completion, stable IDs, duplicate-ID subset conflicts, stale edits, PAGES baseline/source guards, invalid/tampered metadata and legacy whole-canvas proposals.
- Browser tests for both frameworks: controls appear in the expanded review; status feedback; batch selection; mixed decisions; saved/reopened partial review; New/Updated tag retention; final thought accuracy; mobile layout, keyboard access and atomic failure messages.
- Run all existing framework regressions, deterministic build checks, skill validator and local reference checks. Update operational contracts, manifest capability claims, roadmap and testing record only after the behavior exists.
- No new dependency, service, history, partial bullet operations, Six Hats or legacy extraction is needed.
