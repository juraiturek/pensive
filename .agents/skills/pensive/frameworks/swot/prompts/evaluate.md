# Evaluate SWOT and/or TOWS

Use this for `action.id: evaluate`. Read [AI handoff](../../../references/ai-workflow.md). This is diagnosis, not a rewrite. Complete submitted state is authoritative; use no hidden conversation state or external research. Follow `action.scope` (`swot`, `tows`, or `both`) and the steering in `action.comment`. If `use_thoughts` is false, preserve existing thoughts but do not use them as guidance. If true, treat them as prior claims to assess, not established facts.

## SWOT quality

Adapt V2's method-focused, canvas-grounded guidance:

- Is the entity boundary and objective clear enough for a useful decision? Note a consequential missing horizon or context without turning every field into a mandatory questionnaire.
- Are strengths/weaknesses internal characteristics, and opportunities/threats external conditions relative to that entity? Influence is not the same as total control.
- Are factors concrete, single-idea, testable claims? Identify generic assertions, unsupported superlatives, conflated causes/effects, and missing evidence.
- Are actions and wishes misfiled as conditions? Is there duplication, contradiction, or a material blind spot?
- Explain relative significance and uncertainty where supported. Unequal or empty quadrants alone are not defects; do not enforce counts or invent facts to balance the display.

## TOWS quality

For each requested strategy area assess the actual pairing: SO uses S/O, ST S/T, WO W/O, WT W/T. Does the action plausibly use or address supplied factors? Are options distinct, feasible under known constraints, and connected to the objective? Identify unsupported links, vague activity, resource conflicts, adverse trade-offs, and strategies made stale by factor edits. Do not mistake an empty strategy collection for evidence that no strategy is possible.

For `tows` scope, factors remain the evidence needed to assess strategy fit; evaluate strategies rather than conducting an unrelated SWOT rewrite. For `swot`, do not expand into a strategy audit. For `both`, connect defects in factors to their consequences for strategy quality.

## Thought output

Return exactly `{ "thought": "..." }`. Default to one compact paragraph of roughly three to five sentences, prioritizing the most consequential observations rather than reciting the full checklist. Use a readable diagnosis with concrete observations, why they matter, and how to proceed. Expand only when the user asks for detail. Cite at least two specific observations when the canvas supports them, not imaginary evidence when sparse. A useful structure is “What I see … Why it matters … Next …”, but headings and fixed lengths are not mandatory. Recognize what is sound as well as weaknesses. Be clear about uncertainty and facts that would need checking.

Do not return replacement content, new factors, or strategies. The deterministic composer adds this thought above the matrix in a new standalone artifact while preserving content and prior thoughts. No transformation acceptance is needed because analytical content is unchanged.
