# SWOT methodology refinement implementation plan

**Status:** Approved and implemented, 2026-11-04. See `tests/methodology/swot-refinement-observed.md` and `docs/testing.md` for checks and limits. The next notes/research feature remains separately scoped.

**Goal:** Strengthen SWOT/TOWS reasoning while keeping factors and strategies concise and treating framing fit as a two-way inquiry.

**Architecture:** Retain all existing state, action, proposal and artifact contracts. Use existing canvas-level thoughts for concise methodological observations and questions. Operational changes are limited to skill Markdown; no YAML, schema, runtime, canvas or dependency changes.

**Tech stack:** Existing Markdown skill methods, skill validator and methodology review procedures.

## Scope and decisions

- Comparative distinctiveness is directional evidence of competitive strength, not a numeric score or a requirement that every useful capability be unique. Demonstrated differentiation strengthens the competitive assessment; established parity limits differentiation. Unknown comparison is uncertainty, not evidence of parity or inferiority. Relevance, execution and constraints still matter; counting unique strengths is not an assessment method.
- Assess material direct and indirect objective relationships without requiring every factor to have an explicit link. Preserve credible emerging insights. Surface substantial mismatch and consider content drift, incomplete framing and a need to refine the objective.
- Keep strategies short. Their action and mechanism must be understandable, but detailed causal explanation may live in the existing thought. Refer to factors through recognizable wording, never mandatory UUIDs or rigid labels.
- Use authoritative submitted content and steering first; consider existing thoughts only when use_thoughts permits, as fallible claims. Existing-state actions do not silently import facts from earlier chat. Additional user context must be supplied explicitly in the current request or incorporated into a new complete request. This preserves existing action boundaries.
- Missing comparative information should produce a focused question in the evaluation thought, not block Evaluate or create an automatic multi-turn wizard. The user can supply an assessment for a subsequent action.
- Node-linked notes, editable comment infrastructure, research actions and stored research prompts require a separate architecture decision. No legacy inspection is authorized or needed for this refinement.

## Task 1: Record behavioral baseline

Review existing guidance and retained observations against these paired cases. Record actual outputs and limits in a Markdown methodology record; do not claim an empirical baseline failure from source inspection alone.

1. Strategically useful ordinary capability; demonstrated differentiator; unknown comparison. Retain all useful factors, distinguish competitive implications, and ask only for information not already available.
2. Many established parity strengths versus several evidenced differentiators. Qualitatively note weaker/stronger competitive positioning without counts, scores or assuming differentiation ensures success.
3. Missing capability with no demonstrated disadvantage versus evidenced limitation against a relevant benchmark. Do not automatically classify absence as weakness.
4. One emerging or indirectly relevant factor versus most of a SWOT unrelated to framing. Preserve reasonable evolution; surface substantial mismatch and possible objective refinement.
5. External demand filed as a strength; proposed expansion filed as an opportunity; speculative demand versus supplied evidence. Recommend appropriate classification and distinguish facts, hypotheses and benefit/harm mechanisms.
6. Concise grounded TOWS strategy versus generic activity; WO with versus without a plausible capability remedy. Permit explanation in thoughts without making every strategy a paragraph.
7. Evidence present in canvas, current steering, eligible thoughts, or excluded thoughts. Avoid repeated questions and preserve use_thoughts=false behavior.

## Task 2: Refine Evaluate

**Modify:** `.agents/skills/pensive/frameworks/swot/prompts/evaluate.md`.

- Add explicit comparison questions for strengths and weaknesses, using relevant competitors, benchmarks or requirements rather than assuming competitor data exists.
- Check available permitted evidence before asking for the user's comparative assessment. Distinguish claimed uniqueness, supported differentiation, parity and unknown status.
- Explain directional implications for the overall competitive assessment while retaining useful ordinary capabilities. Do not equate unknown with weak or turn item counts into a score.
- For opportunities/threats, test external formulation, supplied support, fact/assumption/prediction and entity-specific benefit/harm mechanism. Flag uncertainty without automatically discarding useful hypotheses.
- Recommend destination quadrants for clear misclassification without changing content.
- Assess both direct and indirect framing fit; surface widespread mismatch and possible framing refinement without prescribing removal or silently rewriting framing.
- Assess identifiable TOWS support and causal mechanism across concise strategy text and eligible explanatory thoughts. Prior thoughts remain claims to assess, not proof of feasibility. Flag WO options that omit how to develop, acquire, borrow or otherwise overcome the missing capability.
- Preserve compact output and prioritize consequential findings. Put the highest-value missing-information question in the thought; detailed output remains available when requested.

## Task 3: Align creation and transformations

**Modify:** `.agents/skills/pensive/frameworks/swot/prompts/create.md`, `strategize.md`, and `improve.md`.

- Create: add a brief comparative check without inventing benchmarks, forcing uniqueness or extending the elicitation budget. Preserve indirect relevance and emerging factors with appropriate uncertainty.
- Strategize: retain concise strategies, recognizable supporting factors and clear action. Use the existing thought for material cross-match rationale, assumptions and WO capability remedies that do not fit naturally in short strategy wording. No mandatory IDs or per-item rationale fields. Preserve extend-mode existing strategies unchanged; diagnose defects in the thought.
- Improve: reuse Evaluate's strengthened criteria, preserve useful ordinary capabilities and unresolved discoveries, and keep rewritten content concise. Explain substantive causal and comparative changes in the existing thought. Framing remains unchanged.
- Do not edit the shared cross-framework fit reference unless a demonstrated contradiction requires a separately reviewed scope change; its existing two-way fit guidance already supports this design.

## Task 4: Verify methodology and structural compatibility

**Modify:** `tests/methodology/swot-actions.md` and `tests/methodology/swot-create.md` with the new rubric/cases. Retain actual forward observations in a Markdown record, keeping operational changes Markdown-only.

- Apply the revised guidance to the cases from Task 1. Record inputs, actual outputs, rubric findings and limitations. Include a no-change case, a compact result and an explicitly requested detailed result.
- Check Evaluate remains thought-only; framing and content stay unchanged. Check Strategize preserves factors and extend-mode strategies; Improve remains a reviewable proposal. Existing thoughts do not silently gain node links.
- Run `PYTHONPATH=/tmp/pensive-validator-deps python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive` if that documented temporary dependency path remains available; otherwise use the installed validator setup.
- Resolve skill-local Markdown links; run `git diff --check`; verify README SHA-256 against `372931125511c5fae95971c88a11fd725dffaa3724672c4bfb95291b23ea8c4e`.
- Inspect the changed-file inventory: no YAML, JSON schema, executable source, generated HTML, dependencies or legacy files may change. No browser regression is necessary for unchanged runtime/UI. Any packaging checks establish protocol compatibility, not reasoning quality.
- Report only checks actually run. Synthetic walkthroughs are not statistical model evaluations or live-user evidence.

## Deferred architecture decision

**Sequence:** This is the next SWOT improvement feature after the methodology refinement; see `docs/roadmap.md`. Design approval is required before its implementation. None of Tasks 1–4 depends on it: their acceptance criteria use existing canvas-level thoughts and request steering, without node-linked storage or research execution.

Existing thoughts are canvas-level JSON annotations and persist through export/save. The action comment is request steering, not a persistent node-note collection. This is sufficient for the immediate refinement but may become unwieldy if detailed rationale or research accumulates.

Before adding node-linked/free notes or persisted research requests, decide: annotation attachment and identity; behavior on deletion, merging and reclassification; provenance and evidence status; freshness after edits; proposal/acceptance semantics; compact disclosure UI; export compatibility; and research authorization/ingestion. Design those together rather than embedding a new informal schema in factor text.

A conversational offer to help formulate a research question can be considered later without adding a research action. Automatic search, a saved research-prompt affordance and ingestion of findings are not included here.

## Completion boundary

The user approved implementation of this refinement on 2026-11-04. No remote, publication, README edit or legacy extraction. Report any discovered need to change contracts before proceeding with it.
