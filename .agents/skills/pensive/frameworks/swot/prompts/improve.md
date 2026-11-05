# Improve the current SWOT/TOWS

Use this for `action.id: improve`. Read [AI handoff](../../../references/ai-workflow.md). Start from complete submitted state including all manual edits. Use `action.comment` as the primary steering direction and preserve the user's analytical intent. If `use_thoughts` is true, consider current thoughts as signals to assess; if false, preserve them without using them to steer the rewrite. Do not research or invent new evidence.

Explicit user direction to incorporate a stated conversational clarification is additional current steering under the handoff's reconciliation guidance. Propose that narrow update transparently; do not mine old chat for unrequested replacements, silently resolve conflicts with local edits, or treat excluded thoughts as evidence.

## Improve with restraint

Review the current analysis for concrete meaning, duplication, internal/external classification relative to entity boundary, single-idea factors, contradictions, evidence, and relationship to the objective. Reuse the quality criteria in [Evaluate](evaluate.md), but perform changes rather than returning only a critique.

Proofread as part of Improve: fix obvious spelling, punctuation and grammar while preserving meaning and retained IDs. Do not guess corrections to proper names, quotations or specialist terminology. Prefer concise single-idea bullets over miniature assessments; keep uncertainty or attribution needed to interpret a claim in its text, and put broader methodological explanation in the thought. Avoid adding repetitive “reported/unverified/not established” caveats that say the same thing without improving interpretation. Preserve meaningful details rather than polishing them away.

Then review all existing strategies for their SO/ST/WO/WT pairing, practical mechanism, consistency with factors, feasibility, and conflicting resource demands. Improve a strategy when a factor edit affects its reasoning. Keep useful user-written choices; do not automatically regenerate every quadrant or populate empty strategy areas unrelated to the requested improvement. Missing knowledge is not itself an organizational weakness.

Retain useful ordinary strengths without asserting unsupported distinctiveness; do not turn unknown comparison into a disadvantage or absence of a capability into a weakness without support. Keep factors and strategies concise. Make supporting factors recognizable in natural wording and explain material causal links, conditional assumptions and WO capability remedies in the existing thought when detail would overburden strategy text. Do not add factor IDs to displayed wording, rationale fields or node-linked notes. Use the thought for a consequential unanswered comparative question rather than fabricating an answer.

Distinguish content drift from ambiguous framing and credible evidence questioning the objective or scope. Correct clear drift when supported; do not remove a credible discovery merely to make the canvas consistent. Where the right boundary is unresolved, retain useful evidence with its uncertainty and explain the framing choice or investigation needed.

Allow indirect relevance and interactions among factors; an unclear individual objective link is not by itself a reason to remove emerging content. Surface widespread mismatch as a possible framing/objective problem as well as a content problem.

Preserve framing exactly. If framing is the real problem, explain the issue in the thought and ask the user to edit it for a subsequent request. Do not silently change the entity or objective. Respect user constraints; do not treat “better” as permission to choose a new strategic direction.

Retain IDs for retained items, including wording changes or reclassification. New ideas receive new IDs. Consolidate or remove only when justified by duplication, misclassification, unsupported claims, inconsistency, or the user's guidance. Explain consequential removals or mergers. Do not re-ID the canvas, strip attribution/uncertainty, normalize away meaningful detail, enforce list counts, or fabricate claims to fill gaps.

## Explain what changed and why

Return exactly `{ "content": { ...complete candidate content... }, "thought": "..." }`. The plain-text thought accompanies the proposed iteration above the matrix. Identify the material improvements with concrete before/after references, why they improve methodological or strategic usefulness, and remaining assumptions/limitations. If no useful change is warranted, say so; do not manufacture improvements to justify the action.

Default to one compact paragraph prioritizing consequential changes and unresolved questions; expand when the user requests detail or the revision genuinely needs it. A minor typo does not need an inventory of every corrected character. Avoid protocol narration and repeated preservation claims in the analytical rationale. Describe unresolved framing issues as current limitations rather than carrying forward task instructions that may become stale; explain any required manual step briefly in delivery text.

The candidate is packaged as a pending whole-canvas transformation, preserving current content until explicit local acceptance. Existing thoughts remain intact. Local collection-level and bulk acceptance/rejection are supported; see [proposal review](../../../references/proposal-review.md). Individual-item acceptance and history remain deferred.
