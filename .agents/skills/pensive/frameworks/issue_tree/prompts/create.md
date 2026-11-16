# Create an Issue Tree

Read [methodology](../methodology.md) and [framework semantics](../framework.yaml). Honor an explicit empty canvas request immediately. No SCQ or other framework prerequisite applies.

For context-driven creation, identify the governing problem, question or opportunity and put supplied context in the single framing text field. Ask only when a material ambiguity prevents a useful draft; preserve unknowns and label assumptions. Construct a first-cut factor/component hierarchy using only supported content. Do not require hypotheses, fixed depth or branch counts. Check parent–child coherence, sibling dimensions, useful coverage and fit to framing.

Return complete schema-valid `issue_tree` state with schema_version `1.0`, content `{framing,tree}` and cursor `[rootId]`. Every recursive node has `{id,title,notes,highImpact,highInfluence,children}`; use stable unique IDs and default both flags false unless the user explicitly supplied those judgments. Notes hold evidence, rationale and uncertainty. The root remains editable. Package through the established paired-file workflow; do not generate HTML from scratch.

New nodes may include optional `needsInvestigation: false`. It is a user-owned tactical mark: set it true only when explicitly supplied by the user. Omitted legacy values mean unmarked. Empty manual node titles are valid; Enter name is a UI placeholder, never stored analytical content.
