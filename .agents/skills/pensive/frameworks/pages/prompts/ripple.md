# Ripple: implications of changed PAGES elements

Ripple is a generic thinking tool interpreted here through PAGES, where cross-dimension implications are particularly useful. It asks: **If these nodes changed, what logically follows for the other nodes?** Follow the [handoff](../../../references/pages-workflow.md); validate a `ripple` request before reasoning.

## Establish the actual change

Use the complete submitted current content and its persisted `ripple_baseline`. `action.sources` names one to four changed dimensions. Compare their items by stable ID and text, including additions, edits, removals and moves. A deletion remains a source change when the current collection is empty. Reordering alone is not a premise change. Never reconstruct previous values from conversation, infer when an edit happened, or use a pending proposal as an accepted change.

No baseline means ask the user to establish current content explicitly; explain that prior changes cannot be recovered. No selected changed dimension means explain that there is nothing to propagate. Never repair these conditions by inventing a change. Selecting every dimension leaves no destination and is unsupported.

## Trace implications through PAGES

For each selected source delta, identify the mechanism by which it affects other current dimensions. For example, an explicitly changed self-concept about responsibility may alter which goals seem legitimate or which actions are possible; it does not prove that the organization has granted new authority. A removed event may remove a timing constraint without removing the underlying goal. These are examples, not a required causal chain.

Keep all selected current source collections and framing byte-for-byte equivalent as data. Use non-source current content as the working state, preserving unrelated edits, useful constraints and already coherent consequences. Do not restore a whole dimension from baseline or rewrite everything for symmetry. The baseline is evidence of what changed, not a preferred answer.

Separate implications supported by the changed premise from plausible consequences needing confirmation. Label hypothetical replacement entries in text. Do not create new facts, permissions, resources or beliefs about others merely because they would make the new lens work. Prefer a small number of consequential updates; unchanged dimensions can remain unchanged. Explain uncertainty or a necessary experiment in the thought when an actionable content revision would otherwise overclaim.

Steering can clarify what a change means, but cannot silently override the submitted source values. If the user wants a hypothetical premise that has not yet been edited into a source, explain that it must first become an explicit reviewed/local source change. Do not hide it inside a Ripple consequence.

Return complete candidate `content` and one concise `thought` tracing the selected before/after changes to proposed consequences and any uncertainty. Retain IDs for retained concepts; assign new IDs only for new concepts. Use `--result` for a complete candidate with local dimension-level or bulk review; see [proposal review](../../../references/proposal-review.md). Do not output local resolutions metadata. Never reset the baseline, mutate selected sources or framing, auto-accept changes, or imply a recorded history beyond the single snapshot. Repeated runs must avoid duplicating existing implications of accumulated baseline changes.
