# Issue Tree handoff

Read the [manifest](../frameworks/issue_tree/framework.yaml) and relevant [Create](../frameworks/issue_tree/prompts/create.md), [Evaluate](../frameworks/issue_tree/prompts/evaluate.md) or [Alternative](../frameworks/issue_tree/prompts/alternative.md) method. Load the [methodology](../frameworks/issue_tree/methodology.md) for analytical work.

Use the existing [paired-file workflow](working-folder-workflow.md) and framework ID `issue_tree`. Blank creation uses the valid initial state. `node scripts/package-issue-tree.mjs state.json new-output.html` validates and exclusively packages a portable artifact. `node scripts/package-issue-tree.mjs --result request.json response.json new-output.html` composes a result without rewriting the implementation. Pass the host project's output destination explicitly.

State owns `content.framing` text and recursive `content.tree`, plus the persisted selected-node path `cursor`. Nodes contain stable id, title, notes, highImpact, highInfluence and children. Notes are analytical content. Booleans default false, meaning not marked high; the model must not infer them. Cursor is navigation, never implicit action scope.

Evaluate accepts `{thought}` and appends feedback only. Alternative accepts `{thought,tree}` and proposes one complete hierarchy; preserve root identity and current framing. Accept/reject the entire proposal. Reject and request anew after analytical content or framing changes; selection alone does not stale review. Export, import and HTML save preserve pending review and notes. No new schema/version or persistence envelope is introduced.

Shared Six Hats, Takeaways, Research and Annotation Mode are not advertised for this MVP. Node notes remain distinct from those capabilities. Existing frameworks retain their behavior.
