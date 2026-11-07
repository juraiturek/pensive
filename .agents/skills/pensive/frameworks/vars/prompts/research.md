# Research VARS

Follow the [shared Research method](../../../prompts/research.md), [Research handoff](../../../references/research-workflow.md) and [VARS handoff](../../../references/vars-workflow.md). Resolve the selected canvas/section/item from submitted state. Load the relevant element guide: [V](../methods/v.md), [A](../methods/a.md), [R](../methods/r.md), [S](../methods/s.md). Canvas-target research can examine multiple elements but should still prioritize the user's uncertainty rather than run an indiscriminate business report.

- V: customer needs, alternatives, perceived benefit, cost-to-deliver advantage and willingness-to-pay evidence. Do not equate market size with demand for this offering.
- A: enabling resources/capabilities, access and activity-system evidence. Do not attribute a competitor's resource to the focal enterprise.
- R: pricing/payment mechanisms, adoption, retention, revenue drivers and capture assumptions. Distinguish prices advertised from prices paid and revenue from profit.
- S: customer/product boundaries, partner structures, integration choices and constraints. Comparable arrangements do not prove that a local partner or contract is available.

For `method: "vri"`, the explicit target must be one A item. Load [VRI guidance](../methods/vri.md), scope a relevant competitor set and investigate value, rarity, imitation barriers, durability, relevance and substitutes. Partial evidence and unknown findings are valid. Write any proposed assessment as optional item Markdown, not a new JSON assessment structure or score. Preserve its overview identity and unrelated details.

Return `{report,sources,content?}`. Optional candidate edits stay within the selected target, preserving framing and unsupported claims as hypotheses. Use quadrant/item Markdown for useful supporting evidence and concise summary changes only when justified. Explain implications for other elements in the report, not unauthorized edits; the user can request Improve/Ripple. The entire Research result awaits approval. No automatic acceptance or silent source-based rewriting.
