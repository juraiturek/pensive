# Issue Tree handoff

Read the [manifest](../frameworks/issue_tree/framework.yaml) and relevant [Create](../frameworks/issue_tree/prompts/create.md), [Evaluate](../frameworks/issue_tree/prompts/evaluate.md), [MECE Evaluation](../frameworks/issue_tree/prompts/mece-evaluate.md) or [Alternative](../frameworks/issue_tree/prompts/alternative.md) method. Load the [methodology](../frameworks/issue_tree/methodology.md) for analytical work.

Use the existing [paired-file workflow](working-folder-workflow.md) and framework ID `issue_tree`. Blank creation uses the valid initial state. `node scripts/package-issue-tree.mjs state.json new-output.html` validates and exclusively packages a portable artifact. `node scripts/package-issue-tree.mjs --result request.json response.json new-output.html` composes a result without rewriting the implementation. Pass the host project's output destination explicitly.

State owns `content.framing` text and recursive `content.tree`, plus the persisted selected-node path `cursor`. Nodes contain stable id, title, notes, highImpact, highInfluence and children, plus optional Boolean needsInvestigation. Notes are analytical content. Booleans default false, meaning not marked high; the model must not infer them. Cursor is navigation, never implicit action scope.

Evaluate and MECE Evaluation accept `{thought}` and append feedback only. Alternative accepts `{thought,tree}` and proposes one complete hierarchy; preserve root identity and current framing. Accept/reject the entire proposal. Reject and request anew after analytical content or framing changes; selection alone does not stale review. Export, import and HTML save preserve pending review and notes. No new schema/version or persistence envelope is introduced.

Shared Six Hats, Takeaways, Research and Annotation Mode are not advertised for this MVP. Node notes remain distinct from those capabilities. Existing frameworks retain their behavior.

The toolbar exposes separate Evaluate Decomposition (`evaluate`) and MECE Evaluation (`mece_evaluate`) actions. Both use Optional guidance without scope radios. Legacy `evaluate` requests may still carry `action.evaluation_scope: "full" | "mece"`; omission means full. Dedicated `mece_evaluate` and Alternative reject that legacy field. Full reviews meaning, reasoning and support from supplied evidence as well as decomposition; MECE focuses on overlaps and contextual coverage. Neither performs online research. Route legacy MECE requests to the MECE method without changing their envelope.

Evaluation notes optionally carry `scope: "full" | "mece"`, assigned deterministically by composition, never by the model response. New full evaluations receive full; dedicated/legacy MECE receive mece. Scope is invalid on alternative rationale. Older unscoped evaluations remain general notes; never classify historical text by wording or mutate saved snapshots. General/rationale notes appear above the tree with collapsible latest/history cards; latest MECE appears below with earlier reviews collapsed. Retain all notes. Safe Markdown renders the complete text. No finding objects, tracking, resolved status, automatic rewriting or Takeaways integration. New scoped JSON requires the upgraded renderer; older renderers may reject the additive field. Schema version remains 1.0.

## Inline naming and investigation marks

Click a node title to select, then click its selected title again to edit inline. Keyboard activation or F2 also opens the native textarea. New children have an empty persisted title and begin inline editing; Enter name is a visual placeholder only. Enter/blur finish, Shift+Enter inserts a newline, composition Enter remains with the IME, and Escape restores the previous title. State updates as the user types, including for exports. Full Tree remains read-only.

`needsInvestigation` is a user-owned independent Boolean; omission on older nodes means unmarked. New nodes default false. The detail checkbox controls a thin circled ? at the upper-right of editor and Full Tree cards. Preserve this field through AI actions and packaging. Alternative must preserve its value on retained IDs and leave new IDs false/unmarked. It is not an automatic research action or a verified factual finding. Investigation changes make a pending Alternative stale, like other content changes.

Click empty tree space to clear visible selection and hide Node details, expanding the tree viewport. Clicking a node restores selection/details; the first click after deselection selects without editing. This is transient UI state: the valid saved cursor remains the last navigation path, and no analytical state or schema changes. Inline drafts are preserved on blur.

## Sibling order

Hover over a node's lower control area to reveal ‹ and › around +/×. Keyboard focus within the controls also reveals them; touch the lower area to reveal on touch devices. Each move swaps one adjacent sibling within the same parent's children, carrying the whole subtree. Boundaries, root and only-child cases disable the corresponding arrows and dim them when revealed. No reparenting or automatic ranking. Selection, notes, IDs and all flags are preserved. Full Tree has no movement controls.

Existing children-array order carries movement through requests, JSON import/export and HTML saving; schema remains unchanged. Reordering invalidates a pending Alternative through the existing complete-content stale guard. It never accepts a proposal or infers user priorities.

Full Tree offers Vertical (top-down default) and Horizontal (root left, descendants right) display layouts. Cards and text remain upright; siblings read top-to-bottom in horizontal view. The choice is transient per page, retained on close/reopen but not included in state, requests or saved HTML. Editing remains vertical and Full Tree remains read-only. Both layouts refit on resize and retain priority/investigation markings.

## Display depth and selective folding

Both editor and Full Tree offer Show Level 1 / Level 2 / Level 3 / All. Root is level 0. Level 1 shows root and direct children; Level 2 adds their children; Level 3 adds one further layer. Deeper branching nodes are folded, not removed. All clears folds. A per-parent ◎ button on its outgoing connector collapses descendants; ◉ hangs on a short stem when collapsed and indicates content to expand, with hidden descendant count in its accessible label/title. Leaves have no fold control. Manual folds produce a Custom view. Expanding after a preset reveals one additional layer; deeper folds can be opened selectively.

Display folds are transient and shared between both views in the page. Geometry compacts around visible nodes in either orientation; editor stays vertical. Hidden content remains in complete JSON, requests and HTML. Reload/import/accepted new hierarchy starts All; no view field is added to schema/history. If a selected node becomes hidden, visible selection/details clear while the valid saved cursor remains unchanged. Adding under a folded parent opens it for inline editing. IDs retain folds across sibling moves; deletion still applies to all actual descendants. Full Tree controls remain view-only and never edit analytical content.
