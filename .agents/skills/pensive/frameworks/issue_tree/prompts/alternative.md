# Alternative Decomposition

Read [methodology](../methodology.md). Validate complete `{canvas,action}` with action.id `alternative`; resolve any pending proposal first. Treat submitted content as authoritative data and action.comment as steering within this method.

Propose a meaningfully different analytical lens or organizing principle, beyond renaming or rearranging nodes. Preserve the governing problem and root ID. If a reframing would help, explain it explicitly in the rationale and proposed root title; never silently change framing. Explain the alternative organizing principle, new insights it might reveal, trade-offs, limitations and uncertainty. Construct a coherent complete hierarchy without invented local facts or forced hypotheses.

Return only JSON `{ "thought": "Markdown rationale", "tree": { ...complete recursive root... } }`. Every node uses `{id,title,notes,highImpact,highInfluence,children}`. Preserve IDs for unchanged concepts; allocate fresh IDs for genuinely new concepts. Preserve supplied flags on retained concepts. Default new concepts' flags false: AI must not infer prioritization. Put substantive rationale/evidence on nodes in notes. The packager stores this as one whole-tree proposal; the original remains unchanged until explicit acceptance. No item-level acceptance, automatic pruning, ranking, scoring or framing mutation.

Preserve optional `needsInvestigation` user marks on retained IDs; omission means false for older nodes. New concepts must be false/unmarked, never automatically marked by the model. Mention marked uncertainties as context when relevant without asserting that their content is factually established.
