# Improve the current SWOT/TOWS

Use this for `action.id: improve`. Read [AI handoff](../../../references/ai-workflow.md). Start from complete submitted state including all manual edits. Use `action.comment` as the primary steering direction and preserve the user's analytical intent. If `use_thoughts` is true, consider current thoughts as signals to assess; if false, preserve them without using them to steer the rewrite. Do not research or invent new evidence.

## Improve with restraint

Review the current analysis for concrete meaning, duplication, internal/external classification relative to entity boundary, single-idea factors, contradictions, evidence, and relationship to the objective. Reuse the quality criteria in [Evaluate](evaluate.md), but perform changes rather than returning only a critique.

Then review all existing strategies for their SO/ST/WO/WT pairing, practical mechanism, consistency with factors, feasibility, and conflicting resource demands. Improve a strategy when a factor edit affects its reasoning. Keep useful user-written choices; do not automatically regenerate every quadrant or populate empty strategy areas unrelated to the requested improvement. Missing knowledge is not itself an organizational weakness.

Preserve framing exactly. If framing is the real problem, explain the issue in the thought and ask the user to edit it for a subsequent request. Do not silently change the entity or objective. Respect user constraints; do not treat “better” as permission to choose a new strategic direction.

Retain IDs for retained items, including wording changes or reclassification. New ideas receive new IDs. Consolidate or remove only when justified by duplication, misclassification, unsupported claims, inconsistency, or the user's guidance. Explain consequential removals or mergers. Do not re-ID the canvas, strip attribution/uncertainty, normalize away meaningful detail, enforce list counts, or fabricate claims to fill gaps.

## Explain what changed and why

Return exactly `{ "content": { ...complete candidate content... }, "thought": "..." }`. The plain-text thought accompanies the proposed iteration above the matrix. Identify the material improvements with concrete before/after references, why they improve methodological or strategic usefulness, and remaining assumptions/limitations. If no useful change is warranted, say so; do not manufacture improvements to justify the action.

The candidate is packaged as a pending whole-canvas transformation, preserving current content until explicit local acceptance. Existing thoughts remain intact. Local collection-level and bulk acceptance/rejection are supported; see [proposal review](../../../references/proposal-review.md). Individual-item acceptance and history remain deferred.
