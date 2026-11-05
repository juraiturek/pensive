# Evaluate SWOT and/or TOWS

Use this for `action.id: evaluate`. Read [AI handoff](../../../references/ai-workflow.md). This is diagnosis, not a rewrite. Complete submitted state is authoritative; use no hidden conversation state or external research. Follow `action.scope` (`swot`, `tows`, or `both`) and the steering in `action.comment`. If `use_thoughts` is false, preserve existing thoughts but do not use them as guidance. If true, treat them as prior claims to assess, not established facts.

## SWOT quality

Adapt V2's method-focused, canvas-grounded guidance:

- Is the entity boundary and objective clear enough for a useful decision? Note a consequential missing horizon or context without turning every field into a mandatory questionnaire.
- Are strengths/weaknesses internal characteristics, and opportunities/threats external conditions relative to that entity? Influence is not the same as total control.
- Are factors concrete, single-idea, testable claims? Identify generic assertions, unsupported superlatives, conflated causes/effects, and missing evidence.
- Are actions and wishes misfiled as conditions? Is there duplication, contradiction, or a material blind spot?
- Explain relative significance and uncertainty where supported. Unequal or empty quadrants alone are not defects; do not enforce counts or invent facts to balance the display.

### Comparative and external grounding

For strengths, distinguish useful ordinary capabilities from evidenced differentiators: compared with which competitors, alternatives or relevant benchmarks is the capability distinctive? For weaknesses, ask whether the limitation actually creates a disadvantage against a relevant comparator or objective requirement. Absence of a strength is not automatically a weakness. Check submitted content, explicit current steering and eligible thoughts before asking for an assessment; thoughts remain fallible claims, not independent corroboration. Do not import missing facts from earlier chat or use excluded thoughts.

Supported differentiation strengthens the overall competitive assessment; established parity limits the advantage claimed for an otherwise useful set of strengths. Unknown comparison is uncertainty, not evidence of parity or inferiority. Assess strategic importance, applicability and constraints rather than counting unique items, assigning a score or assuming uniqueness guarantees success. Retain useful ordinary capabilities. When comparative grounding would materially change the diagnosis, ask a focused question in the thought inviting the user's assessment or supporting evidence; do not block evaluation or repeat questions already answered in permitted context.

For opportunities/threats, identify the external condition, its supplied support and the mechanism making it beneficial or harmful to this entity and objective. Distinguish reported facts, assumptions, predictions and speculation. Flag a useful unverified possibility conditionally rather than automatically rejecting it, and identify what needs checking without researching. For clear misclassification, recommend the destination quadrant, including helpful versus harmful significance; do not move the item during Evaluate.

## TOWS quality

For each requested strategy area assess the actual pairing: SO uses S/O, ST S/T, WO W/O, WT W/T. Does the action plausibly use or address supplied factors? Are options distinct, feasible under known constraints, and connected to the objective? Identify unsupported links, vague activity, resource conflicts, adverse trade-offs, and strategies made stale by factor edits. Do not mistake an empty strategy collection for evidence that no strategy is possible.

Can the supporting internal and external factors be recognized from concise strategy wording, and is their causal interaction plausible? Assess material explanatory detail in eligible thoughts as well as strategy text; a prior rationale is a claim to test, not proof. A concise strategy need not repeat a full explanation, print factor IDs or carry a rationale field. For WO, assess how the missing capability would be developed, acquired, borrowed or otherwise overcome; an opportunity alone does not supply that capability. Flag an absent or unsupported remedy without inventing resources or requiring long strategy text.

For `tows` scope, factors remain the evidence needed to assess strategy fit; evaluate strategies rather than conducting an unrelated SWOT rewrite. For `swot`, do not expand into a strategy audit. For `both`, connect defects in factors to their consequences for strategy quality.

## Framing–content fit

Within the requested scope, assess factors or strategies against `focal_entity`, `objective` and relevant `environment`. Distinguish misplaced content from credible evidence that the objective/scope deserves reconsideration, and from ambiguous framing or insufficient evidence. Recommend content adjustment, explicit framing reconsideration or focused investigation accordingly. Do not automatically reject a useful out-of-frame discovery. SWOT internal/external factor categories are not the two fit types; retain the framework-specific TOWS relationship criteria above.

Consider direct and indirect relationships, including interactions among factors. An unclear individual link can be reasonable in an evolving canvas; it is not automatically grounds for removal. Surface substantial portions unrelated to framing, explaining whether content drift, incomplete framing or a strategic objective needing refinement may account for the mismatch. Fit is a two-way inquiry, not a requirement to justify every existing factor against an unquestionable objective.

## Thought output

Return exactly `{ "thought": "..." }`. Default to one compact paragraph of roughly three to five sentences, prioritizing the most consequential observations rather than reciting the full checklist. Use a readable diagnosis with concrete observations, why they matter, and how to proceed. Expand only when the user asks for detail. Cite at least two specific observations when the canvas supports them, not imaginary evidence when sparse. A useful structure is “What I see … Why it matters … Next …”, but headings and fixed lengths are not mandatory. Recognize what is sound as well as weaknesses. Be clear about uncertainty and facts that would need checking.

Do not return replacement content, new factors, or strategies. The deterministic composer adds this thought above the matrix in a new standalone artifact while preserving content and prior thoughts. No transformation acceptance is needed because analytical content is unchanged.
